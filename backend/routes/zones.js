const express = require('express');
const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/zones - List all search zones
router.get('/', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ zone_id: 1 });
    return res.json(zones.map((z) => z.serialize()));
  } catch (error) {
    console.error('Error fetching zones:', error);
    return res.status(500).json({ detail: 'Failed to retrieve zones' });
  }
});

// POST /api/zones - Create a new search zone (COMMANDER & COORDINATOR ONLY)
router.post('/', verifyToken, authorizeRoles('COMMANDER', 'COORDINATOR'), async (req, res) => {
  try {
    const { name, incident, team, status, progress, lat, lng, coords } = req.body;

    if (!name || !incident || lat === undefined || lng === undefined) {
      return res.status(400).json({ detail: 'Zone name, incident ID, and coordinates are required' });
    }

    const count = await Zone.countDocuments();
    const zone_id = req.body.zone_id || `Z-${String(count + 1).padStart(2, '0')}`;

    const zone = await Zone.create({
      zone_id,
      name: name.trim(),
      incident,
      team: team || null,
      status: status || (team ? 'assigned' : 'pending'),
      progress: progress || 0,
      lat: Number(lat),
      lng: Number(lng),
      coords: Array.isArray(coords) ? coords : [],
    });

    const serialized = zone.serialize();

    const actorTag = `[${req.user.role} | ${req.user.callsign || 'HQ'}]`;
    if (req.app.get('io')) {
      req.app.get('io').emit('zone:created', { ...serialized, actor: req.user.serialize() });
      req.app.get('io').emit('activity:log', {
        id: 'act-' + Date.now(),
        actor: req.user.serialize(),
        tag: actorTag,
        text: `<strong>${actorTag}</strong> Designated search sector: <strong>${serialized.name}</strong> (${serialized.id})`,
        time: 'just now',
        createdAt: new Date(),
        color: '#0284c7',
      });
    }

    return res.status(201).json({
      message: 'Zone created successfully',
      zone: serialized,
    });
  } catch (error) {
    console.error('Error creating zone:', error);
    return res.status(500).json({ detail: 'Failed to create zone' });
  }
});

// PATCH /api/zones/:id - Update zone (COMMANDER/COORDINATOR: all fields; FIELD_LEADER: progress & status only)
router.patch('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user?.role || '').toUpperCase();

  const allowedRoles = ['COMMANDER', 'COORDINATOR', 'FIELD_LEADER'];
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      detail: `Access forbidden: Role '${req.user?.role}' is not authorized to update zones`,
    });
  }

  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  // FIELD_LEADER can only update search progress and status
  if (userRole === 'FIELD_LEADER') {
    const keys = Object.keys(updates);
    const forbiddenKeys = keys.filter((k) => k !== 'progress' && k !== 'status');

    if (forbiddenKeys.length > 0) {
      return res.status(403).json({
        detail: `Access forbidden: Field Leaders can only update 'progress' and 'status'. Restricted fields: ${forbiddenKeys.join(', ')}`,
      });
    }
  }

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { zone_id: id }] }
      : { zone_id: id };

    const zone = await Zone.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(404).json({ detail: 'Zone not found' });
    }

    const serialized = zone.serialize();

    const actorTag = `[${req.user.role} | ${req.user.callsign || 'HQ'}]`;
    const actionDesc = updates.progress !== undefined
      ? `Updated sector <strong>${serialized.name}</strong> progress to <strong>${serialized.progress}%</strong> [${serialized.status.toUpperCase()}]`
      : `Updated sector <strong>${serialized.name}</strong> (${serialized.id})`;

    if (req.app.get('io')) {
      req.app.get('io').emit('zone:updated', { ...serialized, actor: req.user.serialize() });
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
      message: 'Zone updated successfully',
      zone: serialized,
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    return res.status(500).json({ detail: 'Failed to update zone' });
  }
});

// DELETE /api/zones/:id - Delete zone (COMMANDER ONLY)
router.delete('/:id', verifyToken, authorizeRoles('COMMANDER'), async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { zone_id: id }] }
      : { zone_id: id };

    const zone = await Zone.findOneAndDelete(query);
    if (!zone) {
      return res.status(404).json({ detail: 'Zone not found' });
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('zone:deleted', { id });
    }

    return res.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return res.status(500).json({ detail: 'Failed to delete zone' });
  }
});

module.exports = router;
