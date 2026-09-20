const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.headers['x-auth-token'];

  if (!token) {
    console.log(`[AUTH] 401 Unauthorized - No token provided for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fraud_detection_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    
    // Fetch live user from MongoDB to ensure latest role and freeze status
    const dbUser = await User.findById(decoded.id);
    if (!dbUser) {
      console.log(`[AUTH] 401 Unauthorized - User ID ${decoded.id} not found in DB`);
      return res.status(401).json({ error: 'Invalid token. User no longer exists.' });
    }

    const normalizedRole = (dbUser.role || decoded.role || 'user').toLowerCase();

    req.user = {
      id: dbUser._id.toString(),
      role: normalizedRole,
      email: dbUser.email,
      isFrozen: dbUser.isFrozen || dbUser.status === 'frozen'
    };

    console.log(`[AUTH VERIFIED] User ID: ${req.user.id} | Email: ${req.user.email} | Role: '${req.user.role}' | Path: ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    console.log(`[AUTH ERROR] Token verification failed for ${req.method} ${req.originalUrl}:`, err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.log(`[ADMIN ACCESS DENIED] User ID: ${req.user?.id} | Role: '${req.user?.role}' | Target Path: ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  console.log(`[ADMIN GRANTED] User ID: ${req.user.id} accessed ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = { verifyToken, requireAdmin };
