const express = require('express');
const mongoose = require('mongoose');
const Team = require('../models/Team');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/teams - List all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ team_id: 1 });
    return res.json(teams.map((t) => t.serialize()));
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ detail: 'Failed to retrieve teams' });
  }
});

// POST /api/teams - Create a new team (COMMANDER & COORDINATOR ONLY)
router.post('/', verifyToken, authorizeRoles('COMMANDER', 'COORDINATOR'), async (req, res) => {
  try {
    const { name, leader, members, specialization, contact, zone, color, equipment, lat, lng } = req.body;

    if (!name || !leader) {
      return res.status(400).json({ detail: 'Team name and leader are required' });
    }

    // Generate next team ID (e.g., T-09)
    const count = await Team.countDocuments();
    const team_id = req.body.team_id || `T-${String(count + 1).padStart(2, '0')}`;

    const team = await Team.create({
      team_id,
      name: name.trim(),
      leader: leader.trim(),
      members: members || 6,
      status: zone ? 'deployed' : 'standby',
      zone: zone || null,
      color: color || '#0284C7',
      specialization: specialization || 'Mountain Rescue',
      contact: contact || '',
      equipment: equipment || [],
      lat: lat || 32.24 + (Math.random() * 0.2 - 0.1),
      lng: lng || 77.18 + (Math.random() * 0.2 - 0.1),
    });

    const serialized = team.serialize();

    const actorTag = `[${req.user.role} | ${req.user.callsign || 'HQ'}]`;
    if (req.app.get('io')) {
      req.app.get('io').emit('team:created', { ...serialized, actor: req.user.serialize() });
      req.app.get('io').emit('activity:log', {
        id: 'act-' + Date.now(),
        actor: req.user.serialize(),
        tag: actorTag,
        text: `<strong>${actorTag}</strong> Commissioned squad: <strong>${serialized.name}</strong> (${serialized.id})`,
        time: 'just now',
        createdAt: new Date(),
        color: '#2563eb',
      });
    }

    return res.status(201).json({
      message: 'Team created successfully',
      team: serialized,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ detail: 'Failed to create team' });
  }
});

// PATCH /api/teams/:id - Update team (COMMANDER/COORDINATOR: all; FIELD_LEADER: own squad status & telemetry only)
router.patch('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user?.role || '').toUpperCase();

  const allowedRoles = ['COMMANDER', 'COORDINATOR', 'FIELD_LEADER'];
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      detail: `Access forbidden: Role '${req.user?.role}' is not authorized to update squads`,
    });
  }

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { team_id: id }] }
    : { team_id: id };

  const existingTeam = await Team.findOne(query);
  if (!existingTeam) {
    return res.status(404).json({ detail: 'Team not found' });
  }

  // FIELD_LEADER role restriction check
  if (userRole === 'FIELD_LEADER') {
    const userTeam = (req.user.assigned_team || '').trim().toUpperCase();
    const targetTeamId = (existingTeam.team_id || '').toUpperCase();

    if (!userTeam || userTeam !== targetTeamId) {
      return res.status(403).json({
        detail: `Access forbidden: Field Leaders can only update their own assigned squad (${userTeam || 'None assigned'}). Target: ${targetTeamId}`,
      });
    }

    // Only allow updating status, contact/radio, lat, lng
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;
    const allowedKeys = ['status', 'contact', 'lat', 'lng', 'equipment'];
    const invalidKeys = Object.keys(updates).filter((k) => !allowedKeys.includes(k));

    if (invalidKeys.length > 0) {
      return res.status(403).json({
        detail: `Access forbidden: Field Leaders cannot modify administrative fields: ${invalidKeys.join(', ')}`,
      });
    }
  }

  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    const team = await Team.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const serialized = team.serialize();

    const actorTag = `[${req.user.role} | ${req.user.callsign || 'HQ'}]`;
    const actionDesc = req.user.role === 'FIELD_LEADER'
      ? `Broadcasted VHF radio check-in for <strong>${serialized.name}</strong> [${serialized.status.toUpperCase()}]`
      : `Updated squad <strong>${serialized.name}</strong> (${serialized.id}) status → <strong>${serialized.status.toUpperCase()}</strong>`;

    if (req.app.get('io')) {
      req.app.get('io').emit('team:updated', { ...serialized, actor: req.user.serialize() });
      req.app.get('io').emit('activity:log', {
        id: 'act-' + Date.now(),
        actor: req.user.serialize(),
        tag: actorTag,
        text: `<strong>${actorTag}</strong> ${actionDesc}`,
        time: 'just now',
        createdAt: new Date(),
        color: '#10b981',
      });
    }

    return res.json({
      message: 'Team updated successfully',
      team: serialized,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return res.status(500).json({ detail: 'Failed to update team' });
  }
});

// DELETE /api/teams/:id - Delete team (COMMANDER ONLY)
router.delete('/:id', verifyToken, authorizeRoles('COMMANDER'), async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { team_id: id }] }
      : { team_id: id };

    const team = await Team.findOneAndDelete(query);
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('team:deleted', { id });
    }

    return res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ detail: 'Failed to delete team' });
  }
});

module.exports = router;
