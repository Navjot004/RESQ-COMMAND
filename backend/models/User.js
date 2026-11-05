const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['COMMANDER', 'COORDINATOR', 'FIELD_LEADER', 'LOGISTICS'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ROLES,
      default: 'FIELD_LEADER',
      uppercase: true,
    },
    callsign: {
      type: String,
      trim: true,
      default: '',
    },
    assigned_team: {
      type: String,
      trim: true,
      default: null, // References team_id (e.g. 'T-01')
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe serialization (strip password)
userSchema.methods.serialize = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    callsign: this.callsign || '',
    assigned_team: this.assigned_team || null,
    created_at: this.created_at,
  };
};

module.exports = mongoose.model('User', userSchema);
