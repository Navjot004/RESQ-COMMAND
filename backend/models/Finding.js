const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    finding_id: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['person-found', 'clue', 'evidence', 'hazard'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      default: null,
    },
    team: {
      type: String,
      default: null,
    },
    incident: {
      type: String,
      default: null,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['logged', 'recovered', 'evacuated', 'awaiting-evac', 'danger-zone'],
      default: 'logged',
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

findingSchema.methods.serialize = function () {
  return {
    id: this.finding_id || this._id.toString(),
    _dbId: this._id.toString(),
    type: this.type,
    title: this.title,
    location: this.location,
    zone: this.zone,
    team: this.team,
    incident: this.incident,
    lat: this.lat,
    lng: this.lng,
    description: this.description,
    status: this.status,
    reportedAt: this.reportedAt,
  };
};

module.exports = mongoose.model('Finding', findingSchema);

