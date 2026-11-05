const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    resource_id: {
      type: String,
      required: true,
      unique: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['vehicles', 'medical', 'equipment', 'communication', 'food', 'aviation'],
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: 'units',
    },
    team: {
      type: String,
      default: null,
    },
    incident: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'dispatched', 'delivered'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

resourceSchema.methods.serialize = function () {
  return {
    id: this.resource_id || this._id.toString(),
    _dbId: this._id.toString(),
    item: this.item,
    category: this.category,
    qty: this.qty,
    unit: this.unit,
    team: this.team,
    incident: this.incident,
    priority: this.priority,
    status: this.status,
    requestedAt: this.requestedAt,
    notes: this.notes,
  };
};

module.exports = mongoose.model('Resource', resourceSchema);

