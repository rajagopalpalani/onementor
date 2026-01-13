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

// Get all users (for admin dashboard) - using backend API
export async function getAllUsers() {
  try {
    console.log('🔍 Fetching all users from backend API...');

    const res = await fetch(`${API_URL}users/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Backend API error:', errorText);
      return { error: `Failed to fetch users: ${res.status}` };
    }

    const response = await res.json();
    console.log('✅ Backend API response:', response);

    // Handle the response structure from your backend
    if (response.success && response.data) {
      console.log('📊 Returning all users from backend:', response.data.length, 'users');
      return response.data;
    } else if (Array.isArray(response)) {
      console.log('📊 Returning user array from backend:', response.length, 'users');
      return response;
    } else {
      console.log('📊 Unexpected response structure');
      return { error: 'Unexpected response format' };
    }
  } catch (err) {
    console.error('❌ getAllUsers error', err);
    return { error: 'Network error while fetching users' };
  }
}

// Get mentors (users with role 'mentor') - using backend API
export async function getMentors() {
  try {
    console.log('🔍 Fetching mentors from backend API...');

    const res = await fetch(`${API_URL}users/role/mentor`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Backend API error:', errorText);
      return { error: `Failed to fetch mentors: ${res.status}` };
    }

    const response = await res.json();
    console.log('✅ Backend API response:', response);

    // Handle the response structure from your backend
    if (response.success && response.data) {
      console.log('📊 Returning mentor data from backend:', response.data.length, 'mentors');
      return response.data;
    } else if (Array.isArray(response)) {
      console.log('📊 Returning mentor array from backend:', response.length, 'mentors');
      return response;
    } else {
      console.log('📊 Unexpected response structure');
      return { error: 'Unexpected response format' };
    }
  } catch (err) {
    console.error('❌ getMentors error', err);
    return { error: 'Network error while fetching mentors' };
  }
}

// Get mentees (users with role 'user') - using backend API
export async function getMentees() {
  try {
    console.log('🔍 Fetching mentees from backend API...');

    const res = await fetch(`${API_URL}users/role/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Backend API error:', errorText);
      return { error: `Failed to fetch mentees: ${res.status}` };
    }

    const response = await res.json();
    console.log('✅ Backend API response:', response);

    // Handle the response structure from your backend
    if (response.success && response.data) {
      console.log('📊 Returning mentee data from backend:', response.data.length, 'mentees');
      return response.data;
    } else if (Array.isArray(response)) {
      console.log('📊 Returning mentee array from backend:', response.length, 'mentees');
      return response;
    } else {
      console.log('📊 Unexpected response structure');
      return { error: 'Unexpected response format' };
    }
  } catch (err) {
    console.error('❌ getMentees error', err);
    return { error: 'Network error while fetching mentees' };
  }
}
