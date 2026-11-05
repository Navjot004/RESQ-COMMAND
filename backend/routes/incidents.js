const express = require('express');
const mongoose = require('mongoose');
const Incident = require('../models/Incident');

const router = express.Router();

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES = ['ACTIVE', 'CONTAINED', 'RESOLVED'];

// GET /api/incidents/ - Get all incidents
router.get('/', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ created_at: -1 });
    return res.json(incidents.map((inc) => inc.serialize()));
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({ detail: 'Failed to retrieve incidents' });
  }
});

// GET /api/incidents/:id - Get single incident
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ detail: 'Invalid incident ID' });
  }

  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ detail: 'Incident not found' });
    }
    return res.json(incident.serialize());
  } catch (error) {
    console.error('Error fetching incident:', error);
    return res.status(500).json({ detail: 'Failed to retrieve incident' });
  }
});

// POST /api/incidents/ - Create new incident
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      latitude,
      longitude,
      priority,
      reported_by,
      teams,
      zones,
    } = req.body;

    if (!title || !location || latitude === undefined || longitude === undefined || !priority) {
      return res.status(400).json({ detail: 'Missing required incident fields' });
    }

    const upperPriority = priority.toUpperCase();
    if (!VALID_PRIORITIES.includes(upperPriority)) {
      return res.status(400).json({ detail: 'Invalid priority. Must be LOW, MEDIUM, HIGH, or CRITICAL' });
    }

    const count = await Incident.countDocuments();
    const incId = req.body.incident_id || `INC-${String(count + 1).padStart(3, '0')}`;

    const incident = await Incident.create({
      incident_id: incId,
      title: title.trim(),
      description: description || '',
      location: location.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      priority: upperPriority,
      status: 'ACTIVE',
      reported_by: reported_by || 'Operations HQ',
      teams: Array.isArray(teams) ? teams : [],
      zones: Array.isArray(zones) ? zones : [],
      created_at: new Date(),
    });

    const serialized = incident.serialize();

    // Broadcast real-time event if socket.io is available
    if (req.app.get('io')) {
      req.app.get('io').emit('incident:created', serialized);
    }

    return res.status(201).json({
      message: 'Incident created successfully',
      incident: serialized,
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    return res.status(500).json({ detail: 'Failed to create incident' });
  }
});

// PATCH /api/incidents/:id - Update incident
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ detail: 'Invalid incident ID' });
  }

  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ detail: 'No update data provided' });
  }

  if (updates.priority) {
    updates.priority = updates.priority.toUpperCase();
    if (!VALID_PRIORITIES.includes(updates.priority)) {
      return res.status(400).json({ detail: 'Invalid priority. Must be LOW, MEDIUM, HIGH, or CRITICAL' });
    }
  }

  if (updates.status) {
    updates.status = updates.status.toUpperCase();
    if (!VALID_STATUSES.includes(updates.status)) {
      return res.status(400).json({ detail: 'Invalid status. Must be ACTIVE, CONTAINED, or RESOLVED' });
    }
  }

  try {
    const incident = await Incident.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ detail: 'Incident not found' });
    }

    const serialized = incident.serialize();

    // Broadcast real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('incident:updated', serialized);
    }

    return res.json({
      message: 'Incident updated successfully',
      incident: serialized,
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    return res.status(500).json({ detail: 'Failed to update incident' });
  }
});

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ detail: 'Invalid incident ID' });
  }

  try {
    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return res.status(404).json({ detail: 'Incident not found' });
    }

    // Broadcast real-time deletion
    if (req.app.get('io')) {
      req.app.get('io').emit('incident:deleted', { id });
    }

    return res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return res.status(500).json({ detail: 'Failed to delete incident' });
  }
});

module.exports = router;

