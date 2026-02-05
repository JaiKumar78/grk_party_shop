import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Settings from '../models/settingsModel.js';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// const ADMIN_SECRET = process.env.ADMIN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Admin login controller
export const adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create JWT token with role claim
  const token = jwt.sign(
    { email: ADMIN_EMAIL, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      role: 'admin',
    },
    message: 'Admin login successful',
  });
};

// Get current settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if not exist
      settings = new Settings({
        taxEnabled: true,
        taxPercentage: 5,
        shipping: [
          { city: 'Chennai', normal: 50, quick: 100 },
          { city: 'Other', normal: 50 },
        ],
      });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Update settings (admin only)
export const updateSettings = async (req, res) => {
  try {
    const { taxEnabled, taxPercentage, shipping } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ taxEnabled, taxPercentage, shipping });
    } else {
      if (taxEnabled !== undefined) settings.taxEnabled = taxEnabled;
      if (taxPercentage !== undefined) settings.taxPercentage = taxPercentage;
      if (shipping !== undefined) settings.shipping = shipping;
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};