const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    zone_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    incident: {
      type: String,
      required: true,
    },
    team: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'completed'],
      default: 'pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    coords: {
      type: [[Number]],
      required: true,
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

zoneSchema.methods.serialize = function () {
  return {
    id: this.zone_id || this._id.toString(),
    _dbId: this._id.toString(),
    name: this.name,
    incident: this.incident,
    team: this.team,
    status: this.status,
    progress: this.progress,
    lat: this.lat,
    lng: this.lng,
    coords: this.coords,
  };
};

module.exports = mongoose.model('Zone', zoneSchema);

