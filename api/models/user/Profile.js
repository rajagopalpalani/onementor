const db = require('../../config/mysql.js');

const saveProfile = async (user_id, skills, interests, resumePath) => {
  const conn = await db.getConnection();
  try {
    // Validate user_id
    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Check if user exists
    const [userCheck] = await conn.query(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );

    if (userCheck.length === 0) {
      throw new Error('User not found');
    }

    // Check if profile exists
    const [existing] = await conn.query(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [user_id]
    );

    let skillsJson = typeof skills === 'string' ? skills : JSON.stringify(skills);
    let interestsJson = typeof interests === 'string' ? interests : JSON.stringify(interests);

    if (existing.length > 0) {
      // Update existing profile
      if (resumePath) {
        await conn.query(
          `UPDATE user_profiles 
           SET skills = ?, interests = ?, resume = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [skillsJson, interestsJson, resumePath, user_id]
        );
      } else {
        // Update without changing resume
        await conn.query(
          `UPDATE user_profiles 
           SET skills = ?, interests = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [skillsJson, interestsJson, user_id]
        );
      }
      return { message: "Profile updated successfully", id: existing[0].id };
    } else {
      // Create new profile (resume is optional for creation too)
      if (resumePath) {
        const [result] = await conn.query(
          `INSERT INTO user_profiles (user_id, skills, interests, resume) 
           VALUES (?, ?, ?, ?)`,
          [user_id, skillsJson, interestsJson, resumePath]
        );
        return { message: "Profile saved successfully", id: result.insertId };
      } else {
        const [result] = await conn.query(
          `INSERT INTO user_profiles (user_id, skills, interests) 
           VALUES (?, ?, ?)`,
          [user_id, skillsJson, interestsJson]
        );
        return { message: "Profile saved successfully", id: result.insertId };
      }
    }
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
};

const getProfile = async (user_id) => {
  const [rows] = await db.query(
    `SELECT 
      u.id as user_id,
      u.name,
      u.email,
      u.phone,
      up.id as profile_id,
      up.skills,
      up.interests,
      up.resume,
      up.created_at,
      up.updated_at
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = ?`,
    [user_id]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  const profile = rows[0];
  
  // Parse JSON fields if they exist
  if (profile.skills) {
    try {
      profile.skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
    } catch (e) {
      // Keep as string if parsing fails
    }
  }
  
  if (profile.interests) {
    try {
      profile.interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests;
    } catch (e) {
      // Keep as string if parsing fails
    }
  }
  
  return profile;
};

module.exports = { saveProfile, getProfile };
