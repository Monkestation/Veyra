# Routes Information

## Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [Users Routes](#users-routes) 
3. [Verifications Routes](#verifications-routes)
4. [Analytics Routes](#analytics-routes)
5. [Activity Routes](#activity-routes)
6. [General Information](#general-information)

---

## Authentication Routes
Base URL: `/api/auth`

### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `401`: Invalid credentials
- `500`: Database error

**JavaScript Example:**
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
};

// Usage
login('admin', 'password123')
  .then(data => console.log('Logged in:', data.user))
  .catch(error => console.error('Error:', error));
```

### POST `/api/auth/change-password`
Change user password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400`: Missing fields or current password incorrect
- `401`: Unauthorized (invalid token)
- `500`: Database error

**JavaScript Example:**
```javascript
const changePassword = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Password change failed:', error.message);
    throw error;
  }
};
```

---

## Users Routes
Base URL: `/api/users` (All routes require admin authentication)

### GET `/api/users`
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "username": "user1",
      "role": "user", 
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**JavaScript Example:**
```javascript
const getUsers = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
```

### POST `/api/users`
Create new user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, default: 'user', values: 'user'|'admin')"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "id": 3
}
```

**JavaScript Example:**
```javascript
const createUser = async (username, password, role = 'user') => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, role })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('User creation failed:', error.message);
    throw error;
  }
};
```

### PUT `/api/users/:id`
Update user role (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "role": "string (required, values: 'user'|'admin')"
}
```

**Response (200 OK):**
```json
{
  "message": "User updated successfully"
}
```

**JavaScript Example:**
```javascript
const updateUserRole = async (userId, role) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('User update failed:', error.message);
    throw error;
  }
};
```

### DELETE `/api/users/:id`
Delete user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**JavaScript Example:**
```javascript
const deleteUser = async (userId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('User deletion failed:', error.message);
    throw error;
  }
};
```

---

## Verifications Routes
Base URL: `/api/v1/verify`

### GET `/api/v1/verify/:discord_id`
Get specific verification by Discord ID.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "discord_id": "123456789012345678",
  "ckey": "player_name",
  "verified_flags": {
    "byond_verified": true,
    "discord_verified": true
  },
  "verification_method": "manual",
  "verified_by": "admin",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404`: Verification not found
- `500`: Database error

**JavaScript Example:**
```javascript
const getVerification = async (discordId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/v1/verify/${discordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Verification not found
      }
      throw new Error('Failed to fetch verification');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching verification:', error);
    throw error;
  }
};
```

### GET `/api/v1/verify`
Get all verifications with pagination and search.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search term for discord_id or ckey

**Response (200 OK):**
```json
{
  "verifications": [
    {
      "discord_id": "123456789012345678",
      "ckey": "player_name",
      "verified_flags": {
        "byond_verified": true
      },
      "verification_method": "manual",
      "verified_by": "admin",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 50
}
```

**JavaScript Example:**
```javascript
const getVerifications = async (page = 1, limit = 50, search = '') => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({ page, limit });
  
  if (search) {
    params.append('search', search);
  }
  
  try {
    const response = await fetch(`/api/v1/verify?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch verifications');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching verifications:', error);
    throw error;
  }
};
```

### POST `/api/v1/verify`
Create or update verification.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "discord_id": "string (required)",
  "ckey": "string (required)", 
  "verified_flags": "object (optional, default: {})",
  "verification_method": "string (optional, default: 'manual')"
}
```

**Response (201 Created):**
```json
{
  "message": "Verification created/updated successfully",
  "discord_id": "123456789012345678",
  "ckey": "player_name",
  "verified_flags": {
    "byond_verified": true
  }
}
```

**JavaScript Example:**
```javascript
const createVerification = async (discordId, ckey, verifiedFlags = {}, method = 'manual') => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        discord_id: discordId,
        ckey,
        verified_flags: verifiedFlags,
        verification_method: method
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Verification creation failed:', error.message);
    throw error;
  }
};

// Usage
createVerification('123456789012345678', 'player_name', {
  byond_verified: true,
  discord_verified: true
}, 'manual');
```

### PUT `/api/v1/verify/:discord_id`
Update existing verification.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "ckey": "string (optional)",
  "verified_flags": "object (optional)",
  "verification_method": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "message": "Verification updated successfully"
}
```

**JavaScript Example:**
```javascript
const updateVerification = async (discordId, updates) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/v1/verify/${discordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Verification update failed:', error.message);
    throw error;
  }
};

// Usage
updateVerification('123456789012345678', {
  ckey: 'new_player_name',
  verified_flags: { byond_verified: true, discord_verified: false }
});
```

### DELETE `/api/v1/verify/:discord_id`
Delete verification (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "Verification deleted successfully"
}
```

**JavaScript Example:**
```javascript
const deleteVerification = async (discordId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/v1/verify/${discordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Verification deletion failed:', error.message);
    throw error;
  }
};
```

---

## Analytics Routes
Base URL: `/api/analytics`

### GET `/api/analytics`
Get dashboard analytics data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "total_verifications": 150,
  "recent_verifications": 5,
  "weekly_verifications": 25,
  "total_users": 3,
  "verification_methods": [
    {
      "verification_method": "manual",
      "count": 120
    },
    {
      "verification_method": "automatic",
      "count": 30
    }
  ],
  "daily_verifications": [
    {
      "date": "2024-01-01",
      "count": 5
    },
    {
      "date": "2024-01-02", 
      "count": 3
    }
  ]
}
```

**JavaScript Example:**
```javascript
const getAnalytics = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    const data = await response.json();
    
    // Use the analytics data
    console.log(`Total verifications: ${data.total_verifications}`);
    console.log(`Recent verifications (24h): ${data.recent_verifications}`);
    console.log(`Weekly verifications: ${data.weekly_verifications}`);
    
    return data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};
```

---

## Activity Routes
Base URL: `/api/activity`

### GET `/api/activity`
Get activity log (Admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)  
- `limit` (optional): Items per page (default: 50)

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": 1,
      "user_id": 1,
      "activity_type": "login",
      "activity_data": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "username": "admin"
    },
    {
      "id": 2,
      "user_id": 1,
      "activity_type": "create_verification",
      "activity_data": "Discord ID: 123456789012345678, Ckey: player_name",
      "created_at": "2024-01-01T01:00:00.000Z",
      "username": "admin"
    }
  ],
  "page": 1,
  "limit": 50
}
```

**JavaScript Example:**
```javascript
const getActivityLog = async (page = 1, limit = 50) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({ page, limit });
  
  try {
    const response = await fetch(`/api/activity?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity log');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
};

// Usage - Display activity log in a table
getActivityLog().then(data => {
  data.activities.forEach(activity => {
    console.log(`${activity.created_at}: ${activity.username} - ${activity.activity_type}`);
    if (activity.activity_data) {
      console.log(`  Details: ${activity.activity_data}`);
    }
  });
});
```

---

## General Information

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Error Handling
All endpoints return consistent error responses:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created successfully  
- `400`: Bad request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Internal server error

### Rate Limiting
API requests are rate-limited. The rate limiter is applied to all `/api/` routes.

### Utility Functions
Here are some utility functions you can use across your application:

```javascript
// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Logout function
const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Handle API errors globally
const handleApiError = (error) => {
  console.error('API Error:', error.message);
  
  if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
    logout();
  }
  
  // Show user-friendly error message
  alert(`Error: ${error.message}`);
};
```

### Example: Complete Verification Management

```javascript
class VerificationManager {
  constructor() {
    this.baseUrl = '/api/v1/verify';
    this.token = localStorage.getItem('token');
  }

  async getAll(page = 1, search = '') {
    try {
      return await makeAuthenticatedRequest(
        `${this.baseUrl}?page=${page}&search=${encodeURIComponent(search)}`
      );
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async getById(discordId) {
    try {
      return await makeAuthenticatedRequest(`${this.baseUrl}/${discordId}`);
    } catch (error) {
      if (error.message.includes('not found')) {
        return null;
      }
      handleApiError(error);
      throw error;
    }
  }

  async create(verification) {
    try {
      return await makeAuthenticatedRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(verification)
      });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async update(discordId, updates) {
    try {
      return await makeAuthenticatedRequest(`${this.baseUrl}/${discordId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async delete(discordId) {
    try {
      return await makeAuthenticatedRequest(`${this.baseUrl}/${discordId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}

// Usage
const verificationManager = new VerificationManager();

// Get all verifications
verificationManager.getAll(1, 'search_term').then(data => {
  console.log('Verifications:', data.verifications);
});

// Create new verification
verificationManager.create({
  discord_id: '123456789012345678',
  ckey: 'player_name',
  verified_flags: { byond_verified: true }
}).then(result => {
  console.log('Created:', result);
});
```