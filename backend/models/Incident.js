const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incident_id: {
      type: String,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    status: {
      type: String,
      default: 'ACTIVE',
      uppercase: true,
      enum: ['ACTIVE', 'CONTAINED', 'RESOLVED'],
    },
    reported_by: {
      type: String,
      default: 'Operations HQ',
    },
    teams: {
      type: [String],
      default: [],
    },
    zones: {
      type: [String],
      default: [],
    },
    findings: {
      type: Number,
      default: 0,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

incidentSchema.methods.serialize = function () {
  return {
    id: this.incident_id || this._id.toString(),
    _dbId: this._id.toString(),
    title: this.title,
    description: this.description,
    location: this.location,
    latitude: this.latitude,
    longitude: this.longitude,
    priority: this.priority,
    status: this.status,
    reported_by: this.reported_by,
    teams: this.teams,
    zones: this.zones,
    findings: this.findings,
    created_at: this.created_at,
  };
};

module.exports = mongoose.model('Incident', incidentSchema);

