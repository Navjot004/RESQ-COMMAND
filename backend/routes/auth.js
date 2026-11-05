const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'default-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

  return jwt.sign(
    {
      id: user._id.toString(),
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      callsign: user.callsign || '',
      assigned_team: user.assigned_team || null,
    },
    secret,
    { expiresIn }
  );
};

// POST /api/auth/login — Authenticate user and return JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Authentication successful',
      token,
      access_token: token,
      user: user.serialize(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ detail: 'Internal server error during authentication' });
  }
});

// GET /api/auth/me — Retrieve authenticated profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user.serialize(),
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return res.status(500).json({ detail: 'Failed to retrieve user profile' });
  }
});

// POST /api/auth/register — Register new operator
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, callsign, assigned_team } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ detail: 'Email is already registered' });
    }

    const validRoles = ['COMMANDER', 'COORDINATOR', 'FIELD_LEADER', 'LOGISTICS'];
    const userRole = role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'FIELD_LEADER';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Pre-save hook hashes password
      role: userRole,
      callsign: callsign ? callsign.trim() : '',
      assigned_team: assigned_team || null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      access_token: token,
      user: user.serialize(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ detail: 'Email is already registered' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ detail: 'Failed to register user' });
  }
});

module.exports = router;
