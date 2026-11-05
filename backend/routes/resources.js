const express = require('express');
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/resources - List all resources
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ requestedAt: -1 });
    return res.json(resources.map((r) => r.serialize()));
  } catch (error) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ detail: 'Failed to retrieve resources' });
  }
});

// POST /api/resources - Request new resource (ANY AUTHENTICATED ROLE)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { item, category, qty, unit, team, incident, priority, notes } = req.body;

    if (!item || !category) {
      return res.status(400).json({ detail: 'Item name and category are required' });
    }

    const count = await Resource.countDocuments();
    const resource_id = req.body.resource_id || `RES-${String(count + 1).padStart(3, '0')}`;

    const resource = await Resource.create({
      resource_id,
      item: item.trim(),
      category,
      qty: qty || 1,
      unit: unit || 'units',
      team: team || (req.user.assigned_team || null),
      incident: incident || null,
      priority: priority || 'medium',
      status: 'pending',
      notes: notes || '',
      requestedAt: new Date(),
    });

    const serialized = resource.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('resource:created', serialized);
    }

    return res.status(201).json({
      message: 'Resource requested successfully',
      resource: serialized,
    });
  } catch (error) {
    console.error('Error creating resource request:', error);
    return res.status(500).json({ detail: 'Failed to request resource' });
  }
});

// PATCH /api/resources/:id - Update status (COMMANDER & LOGISTICS ONLY)
router.patch('/:id', verifyToken, authorizeRoles('COMMANDER', 'LOGISTICS'), async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { resource_id: id }] }
      : { resource_id: id };

    const resource = await Resource.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ detail: 'Resource not found' });
    }

    const serialized = resource.serialize();

    if (req.app.get('io')) {
      req.app.get('io').emit('resource:updated', serialized);
    }

    return res.json({
      message: 'Resource updated successfully',
      resource: serialized,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ detail: 'Failed to update resource' });
  }
});

// DELETE /api/resources/:id - Delete resource (COMMANDER & LOGISTICS ONLY)
router.delete('/:id', verifyToken, authorizeRoles('COMMANDER', 'LOGISTICS'), async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { resource_id: id }] }
      : { resource_id: id };

    const resource = await Resource.findOneAndDelete(query);
    if (!resource) {
      return res.status(404).json({ detail: 'Resource not found' });
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('resource:deleted', { id });
    }

    return res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ detail: 'Failed to delete resource' });
  }
});

module.exports = router;
