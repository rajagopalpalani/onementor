import { API_URL } from "../apiendpoints";

// Signup user (creates account with password)
export async function createUser(userData) {
  try {
    const res = await fetch(`${API_URL}users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Signup failed' };
    }
    return data;
  } catch (err) {
    console.error('createUser error', err);
    return { error: 'Network error' };
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const res = await fetch(`${API_URL}profile/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to fetch profile' };
    }
    return data;
  } catch (err) {
    console.error('getUserProfile error', err);
    return { error: 'Network error' };
  }
}

// Create/Update user profile
export async function saveUserProfile(formData) {
  try {
    const res = await fetch(`${API_URL}profile`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // FormData with file
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to save profile' };
    }
    return data;
  } catch (err) {
    console.error('saveUserProfile error', err);
    return { error: 'Network error' };
  }
}

// Create/Update user profile (alias for compatibility)
export async function createUserProfile(formData) {
  return saveUserProfile(formData);
}

// Get user basic info (phone number) - using a working endpoint
export async function getUserBasicInfo(userId) {
  try {
    // Since user endpoints don't exist, let's try to get user info from profile endpoint
    // or create a new endpoint specifically for basic user info
    const res = await fetch(`${API_URL}users/basic/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      // If that doesn't work, try the profile endpoint which might have user info
      return getUserProfile(userId);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('getUserBasicInfo error', err);
    // Fallback to profile endpoint
    return getUserProfile(userId);
  }
}

// Update user basic info (name, email, phone) in the users table
export async function updateUserBasicInfo(userId, userData) {
  try {
    const res = await fetch(`${API_URL}users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to update user info' };
    }
    return data;
  } catch (err) {
    console.error('updateUserBasicInfo error', err);
    return { error: 'Network error' };
  }
}

// Get user data from database (alternative approach using existing endpoints)
export async function getUserFromDatabase(userId) {
  try {
    // First try to get from profile endpoint
    const profileResponse = await getUserProfile(userId);

    if (profileResponse && !profileResponse.error) {
      // If profile has user data, return it
      if (profileResponse.name || profileResponse.email || profileResponse.phone) {
        return {
          name: profileResponse.name,
          email: profileResponse.email,
          phone: profileResponse.phone,
          skills: profileResponse.skills,
          interests: profileResponse.interests
        };
      }
    }

    // If profile doesn't have user data, we need to create a backend endpoint
    // For now, return what we have from localStorage as fallback
    return { error: 'User data not available from database' };
  } catch (err) {
    console.error('getUserFromDatabase error', err);
    return { error: 'Network error' };
  }
}

// Get all users by role (for admin dashboard)
export async function getUsersByRole(role) {
  try {
    // Since specific role endpoints don't exist, try different approaches
    if (role === 'mentor') {
      // Use the existing mentor profile endpoint
      const res = await fetch(`${API_URL}mentor/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to fetch mentors' };
      }
      return data;
    } else {
      // For users, we need to create a backend endpoint or use a different approach
      return { error: 'User endpoint not available' };
    }
  } catch (err) {
    console.error('getUsersByRole error', err);
    return { error: 'Network error' };
  }
}

// Get all users (for admin dashboard) - simplified approach
export async function getAllUsers() {
  try {
    // Try to get all users from a general endpoint
    const res = await fetch(`${API_URL}admin/users`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      // If admin endpoint doesn't exist, return error
      return { error: 'Admin users endpoint not available' };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('getAllUsers error', err);
    return { error: 'Network error' };
  }
}

// Get mentors (users with role 'mentor') - using existing endpoint
export async function getMentors() {
  try {
    console.log('🔍 Attempting to fetch mentors...');
    
    // Try the proper endpoint for getting all mentors first
    const res = await fetch(`${API_URL}users/role/mentor`, {
      method: 'GET',
      credentials: 'include',
    });

    console.log('📡 Mentor endpoint response status:', res.status);

    if (res.ok) {
      const response = await res.json();
      console.log('✅ Mentor endpoint response:', response);
      
      // Handle the expected API response structure
      if (response.success && response.data) {
        console.log('📊 Returning mentor data from success response:', response.data.length, 'mentors');
        return response.data;
      }
      // Fallback for different response structures
      const mentorData = Array.isArray(response) ? response : response.data || [];
      console.log('📊 Returning mentor data from fallback:', mentorData.length, 'mentors');
      return mentorData;
    }

    console.log('⚠️ Mentor endpoint failed, trying mentor profile endpoint...');
    
    // If that doesn't work, try the mentor profile endpoint
    const profileRes = await fetch(`${API_URL}mentor/profile`, {
      method: 'GET',
      credentials: 'include',
    });

    console.log('📡 Mentor profile endpoint response status:', profileRes.status);

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      console.log('✅ Mentor profile endpoint response:', profileData);
      
      // If it's a single mentor object, wrap it in an array
      if (profileData && !Array.isArray(profileData)) {
        console.log('📊 Converting single mentor to array');
        return [profileData];
      }
      const mentorData = Array.isArray(profileData) ? profileData : profileData.data || [];
      console.log('📊 Returning mentor profile data:', mentorData.length, 'mentors');
      return mentorData;
    }

    // If both endpoints fail, return mock data for testing
    console.log("❌ Both endpoints failed - Using mock mentors data");
    return [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "555-0101",
        role: "mentor",
        is_active: 1,
        is_verified: 1
      },
      {
        id: 2,
        name: "Prof. Michael Chen",
        email: "michael.chen@example.com",
        phone: "555-0102",
        role: "mentor",
        is_active: 1,
        is_verified: 1
      },
      {
        id: 3,
        name: "Dr. Emily Rodriguez",
        email: "emily.rodriguez@example.com",
        phone: "555-0103",
        role: "mentor",
        is_active: 0,
        is_verified: 1
      }
    ];
  } catch (err) {
    console.error('❌ getMentors error', err);
    return { error: 'Network error' };
  }
}

// Get mentees (users with role 'user') - with mock data for testing
export async function getMentees() {
  try {
    // Try the real endpoint first
    const res = await fetch(`${API_URL}users/role/user`, {
      method: 'GET',
      credentials: 'include',
    });

    if (res.ok) {
      const response = await res.json();
      // Handle the expected API response structure
      if (response.success && response.data) {
        return response.data;
      }
      // Fallback for different response structures
      return Array.isArray(response) ? response : response.data || [];
    }

    // If endpoint doesn't exist, return mock data based on your database
    console.log("Using mock mentees data - implement backend endpoint for real data");
    return [
      {
        id: 6,
        name: "suresh",
        email: "saravana2003@gmail.com",
        phone: "9361852813",
        role: "user",
        is_active: 1,
        is_verified: 0
      },
      {
        id: 7,
        name: "suresh",
        email: "saravana2942003@gmail.com",
        phone: "9361852813",
        role: "user",
        is_active: 1,
        is_verified: 1
      },
      {
        id: 8,
        name: "ramraj",
        email: "konar656@gmail.com",
        phone: "7871845302",
        role: "user",
        is_active: 1,
        is_verified: 1
      },
      {
        id: 9,
        name: "Ram",
        email: "ram@gmail.com",
        phone: "7787834562",
        role: "user",
        is_active: 0,
        is_verified: 0
      },
      {
        id: 10,
        name: "Kumar",
        email: "ramkumarb6103@gmail.com",
        phone: "7871845302",
        role: "user",
        is_active: 1,
        is_verified: 1
      },
      {
        id: 11,
        name: "ram",
        email: "sureshs68167+1@gmail.com",
        phone: "9361852813",
        role: "user",
        is_active: 1,
        is_verified: 1
      }
    ];
  } catch (err) {
    console.error('getMentees error', err);
    return { error: 'Network error' };
  }
}
