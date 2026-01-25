const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { saveProfile, getProfile } = require('../../models/user/Profile');
const db = require('../../config/mysql');

const router = express.Router();

/**
 * Format phone number: if 10 digits, prepend 91 (India country code)
 * @param {string} phone - Phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If empty after cleaning, return null
  if (!digitsOnly) return null;
  
  // If 10 digits, prepend 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  
  // If already starts with 91 and has 12 digits total, return as is
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return digitsOnly;
  }
  
  // If 11 digits and starts with 0, remove 0 and prepend 91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.substring(1)}`;
  }
  
  // Return cleaned digits (for other formats)
  return digitsOnly;
}

// Ensure uploads folder exists
const uploadFolder = 'uploads/';
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Profile submission route
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    // Get user_id from body or session
    let user_id = req.body.user_id;

    // If not in body, try to get from session
    if (!user_id && req.session && req.session.user) {
      user_id = req.session.user.id;
    }

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required. Please provide user_id in request body or ensure you are logged in.' });
    }

    const { skills, interests, name, email, phone } = req.body;
    const file = req.file;

    // Make resume optional for updates
    // Allow updating user info (name, email, phone) even without skills/interests
    if (!file && !skills && !interests && !name && !email && !phone) {
      return res.status(400).json({ error: 'At least one field is required.' });
    }

    // Start transaction to update both users and user_profiles tables
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update users table if name, email, or phone is provided
      if (name || email || phone) {
        const updateFields = [];
        const updateValues = [];
        
        if (name) {
          updateFields.push("name = ?");
          updateValues.push(name);
        }
        
        if (email) {
          updateFields.push("email = ?");
          updateValues.push(email);
        }
        
        if (phone) {
          const formattedPhone = formatPhoneNumber(phone);
          if (!formattedPhone) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Invalid phone number format' });
          }
          updateFields.push("phone = ?");
          updateValues.push(formattedPhone);
        }
        
        if (updateFields.length > 0) {
          updateValues.push(user_id);
          await connection.query(
            `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
            updateValues
          );
        }
      }

      // Update user_profiles table if skills, interests, or resume are provided
      if (skills || interests || file) {
        // Check if profile exists
        const [existing] = await connection.query(
          "SELECT id FROM user_profiles WHERE user_id = ?",
          [user_id]
        );

        const resumePath = file ? file.path : null;

        if (skills || interests) {
          if (!skills || !interests) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Both skills and interests are required when updating profile.' });
          }

          let skillsArray, interestsArray;
          try {
            skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
            interestsArray = typeof interests === 'string' ? JSON.parse(interests) : interests;
          } catch (err) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Skills and interests must be valid JSON arrays.' });
          }

          const skillsJson = typeof skillsArray === 'string' ? skillsArray : JSON.stringify(skillsArray);
          const interestsJson = typeof interestsArray === 'string' ? interestsArray : JSON.stringify(interestsArray);

          if (existing.length > 0) {
            // Update existing profile
            if (resumePath) {
              await connection.query(
                `UPDATE user_profiles 
                 SET skills = ?, interests = ?, resume = ?, updated_at = NOW()
                 WHERE user_id = ?`,
                [skillsJson, interestsJson, resumePath, user_id]
              );
            } else {
              await connection.query(
                `UPDATE user_profiles 
                 SET skills = ?, interests = ?, updated_at = NOW()
                 WHERE user_id = ?`,
                [skillsJson, interestsJson, user_id]
              );
            }
          } else {
            // Create new profile
            if (resumePath) {
              await connection.query(
                `INSERT INTO user_profiles (user_id, skills, interests, resume) 
                 VALUES (?, ?, ?, ?)`,
                [user_id, skillsJson, interestsJson, resumePath]
              );
            } else {
              await connection.query(
                `INSERT INTO user_profiles (user_id, skills, interests) 
                 VALUES (?, ?, ?)`,
                [user_id, skillsJson, interestsJson]
              );
            }
          }
        } else if (file) {
          // If only resume is provided, update just the resume
          const resumePath = file.path;
          if (existing.length > 0) {
            await connection.query(
              `UPDATE user_profiles SET resume = ?, updated_at = NOW() WHERE user_id = ?`,
              [resumePath, user_id]
            );
          } else {
            await connection.query(
              `INSERT INTO user_profiles (user_id, resume) VALUES (?, ?)`,
              [user_id, resumePath]
            );
          }
        }
      }

      await connection.commit();
      connection.release();
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Server error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user profile
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const profile = await getProfile(user_id);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
