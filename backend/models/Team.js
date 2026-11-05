const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    team_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    leader: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: Number,
      required: true,
      default: 6,
    },
    status: {
      type: String,
      enum: ['deployed', 'standby', 'returning', 'off-duty'],
      default: 'standby',
    },
    zone: {
      type: String,
      default: null,
    },
    color: {
      type: String,
      default: '#0284C7',
    },
    specialization: {
      type: String,
      required: true,
      default: 'Mountain Rescue',
    },
    contact: {
      type: String,
      default: '',
    },
    equipment: {
      type: [String],
      default: [],
    },
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

teamSchema.methods.serialize = function () {
  return {
    id: this.team_id || this._id.toString(),
    _dbId: this._id.toString(),
    name: this.name,
    leader: this.leader,
    members: this.members,
    status: this.status,
    zone: this.zone,
    color: this.color,
    specialization: this.specialization,
    contact: this.contact,
    equipment: this.equipment,
    lat: this.lat,
    lng: this.lng,
  };
};

module.exports = mongoose.model('Team', teamSchema);

