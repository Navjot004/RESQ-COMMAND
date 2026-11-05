const express = require('express');
const mongoose = require('mongoose');
const Finding = require('../models/Finding');

const router = express.Router();

// GET /api/findings - List all findings
router.get('/', async (req, res) => {
  try {
    const findings = await Finding.find().sort({ reportedAt: -1 });
    return res.json(findings.map((f) => f.serialize()));
  } catch (error) {
    console.error('Error fetching findings:', error);
    return res.status(500).json({ detail: 'Failed to retrieve findings' });
  }
});

// POST /api/findings - Log a new finding
router.post('/', async (req, res) => {
  try {
    const { type, title, location, zone, team, incident, lat, lng, description, status } = req.body;

    if (!type || !title || !location || lat === undefined || lng === undefined) {
      return res.status(400).json({ detail: 'Type, title, location, and coordinates are required' });
    }

    const count = await Finding.countDocuments();
    const finding_id = req.body.finding_id || `FND-${String(count + 1).padStart(3, '0')}`;

    const finding = await Finding.create({
      finding_id,
      type,
      title: title.trim(),
      location: location.trim(),
      zone: zone || null,
      team: team || null,
      incident: incident || null,
      lat: Number(lat),
      lng: Number(lng),
      description: description || '',
      status: status || 'logged',
      reportedAt: new Date(),
    });

    const serialized = finding.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('finding:created', serialized);
    }

    return res.status(201).json({
      message: 'Finding logged successfully',
      finding: serialized,
    });
  } catch (error) {
    console.error('Error logging finding:', error);
    return res.status(500).json({ detail: 'Failed to log finding' });
  }
});

// PATCH /api/findings/:id - Update finding
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { finding_id: id }] }
      : { finding_id: id };

    const finding = await Finding.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!finding) {
      return res.status(404).json({ detail: 'Finding not found' });
    }

    const serialized = finding.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('finding:updated', serialized);
    }

    return res.json({
      message: 'Finding updated successfully',
      finding: serialized,
    });
  } catch (error) {
    console.error('Error updating finding:', error);
    return res.status(500).json({ detail: 'Failed to update finding' });
  }
});

// DELETE /api/findings/:id - Delete finding
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { finding_id: id }] }
      : { finding_id: id };

    const finding = await Finding.findOneAndDelete(query);
    if (!finding) {
      return res.status(404).json({ detail: 'Finding not found' });
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('finding:deleted', { id });
    }

    return res.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    console.error('Error deleting finding:', error);
    return res.status(500).json({ detail: 'Failed to delete finding' });
  }
});

module.exports = router;

