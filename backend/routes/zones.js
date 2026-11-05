const express = require('express');
const mongoose = require('mongoose');
const Zone = require('../models/Zone');

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

// POST /api/zones - Create a new search zone (e.g. drawn from map)
router.post('/', async (req, res) => {
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

    if (req.app.get('io')) {
      req.app.get('io').emit('zone:created', serialized);
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

// PATCH /api/zones/:id - Update zone
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { zone_id: id }] }
      : { zone_id: id };

    const zone = await Zone.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(404).json({ detail: 'Zone not found' });
    }

    const serialized = zone.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('zone:updated', serialized);
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

// DELETE /api/zones/:id - Delete zone
router.delete('/:id', async (req, res) => {
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

