import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// const ADMIN_SECRET = process.env.ADMIN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email === ADMIN_EMAIL && decoded.role === "admin") {
      // Admin verified, proceed
      req.admin = decoded
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Not an admin' });
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};