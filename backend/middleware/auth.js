const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'default-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Token has expired or is invalid' });
  }
};

module.exports = { verifyToken };

