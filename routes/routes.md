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

### GET `/api/users/:id`
Get a single user by their ID or username (Admin only). The route handles both numeric IDs and string-based usernames.

**Parameters:**
* `id` (string/number): The user's ID or username.

**Headers:**
```
Authorization: Bearer <jwt-token>
```
**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00.000Z"
},
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Javascript Example:**
```js
const getUser = async (identifier) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/users/${identifier}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Example usage:
// getUser(123); //fetches by ID
// getUser('admin'); // Fetches by username
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
  "username": "string (required, min 3 chars, max 32 chars)",
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

### Discord ID Routes

#### GET `/api/v1/verify/:discord_id`
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

**JavaScript Example:**
```javascript
const getVerification = async (discordId) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/v1/verify/${discordId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch verification');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching verification:', error);
    throw error;
  }
};
```

### PUT `/api/v1/verify/:discord_id`
Update existing verification by Discord ID.

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

#### DELETE `/api/v1/verify/:discord_id`
Delete verification by Discord ID (Admin only).

### Ckey Routes

#### GET `/api/v1/verify/ckey/:ckey`
Get specific verification by ckey.

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

**JavaScript Example:**
```javascript
const getVerificationByCkey = async (ckey) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/v1/verify/ckey/${ckey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch verification');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching verification:', error);
    throw error;
  }
};
```

#### PUT `/api/v1/verify/ckey/:ckey`
Update existing verification by ckey.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "discord_id": "string (optional)",
  "verified_flags": "object (optional)",
  "verification_method": "string (optional)"
}
```

#### DELETE `/api/v1/verify/ckey/:ckey`
Delete verification by ckey (Admin only).

### Bulk Routes

#### POST `/api/v1/verify/bulk/discord`
Get multiple verifications by Discord IDs.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "discord_ids": ["123456789012345678", "987654321098765432"]
}
```

**Response (200 OK):**
```json
{
  "verifications": [
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
  ]
}
```

**JavaScript Example:**
```javascript
const getBulkVerificationsByDiscord = async (discordIds) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/v1/verify/bulk/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ discord_ids: discordIds })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bulk verifications');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bulk verifications:', error);
    throw error;
  }
};
```

#### POST `/api/v1/verify/bulk/ckey`
Get multiple verifications by ckeys.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "ckeys": ["player_one", "player_two", "player_three"]
}
```

**Response (200 OK):**
```json
{
  "verifications": [
    {
      "discord_id": "123456789012345678",
      "ckey": "player_one",
      "verified_flags": {
        "byond_verified": true
      },
      "verification_method": "manual",
      "verified_by": "admin",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**JavaScript Example:**
```javascript
const getBulkVerificationsByCkey = async (ckeys) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/v1/verify/bulk/ckey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ckeys })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bulk verifications');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bulk verifications:', error);
    throw error;
  }
};
```

## General Routes

### GET `/api/v1/verify`
Get all verifications with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
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

### POST `/api/v1/verify`
Create or update verification.

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