const express = require('express');
const mongoose = require('mongoose');
const Team = require('../models/Team');

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

// POST /api/teams - Create a new team
router.post('/', async (req, res) => {
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

    if (req.app.get('io')) {
      req.app.get('io').emit('team:created', serialized);
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

// PATCH /api/teams/:id - Update team
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { team_id: id }] }
      : { team_id: id };

    const team = await Team.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    const serialized = team.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('team:updated', serialized);
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

// DELETE /api/teams/:id - Delete team
router.delete('/:id', async (req, res) => {
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

