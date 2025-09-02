# Veyra API

Veyra is a lightweight verification management API designed specifically for SS13 servers.

---

## Installation

### Clone the repository
```bash
gh repo clone Monkestation/Veyra
cd Veyra
```

### Install dependencies
```bash
npm install
```

### Run the server
```bash
npm start
```

### Development mode (with auto-reload)
```bash
npm run dev
```

The system will be available at:  
**http://localhost:3000**

---

## Default Credentials

**HOLY FUCK Important:** Change these before deploying to production.

- Username: `admin`  
- Password: `admin123`  

---

## API Endpoints

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

---

### Verification Management

**Get single verification**
```http
GET /api/v1/verify/:discord_id
Authorization: Bearer <token>
```

**List verifications (with pagination & search)**
```http
GET /api/v1/verify?page=1&limit=50&search=searchterm
Authorization: Bearer <token>
```

**Create/Update verification**
```http
POST /api/v1/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "discord_id": "123456789",
  "ckey": "username",
  "verified_flags": {"verified": true, "role": "player"},
  "verification_method": "discord"
}
```

**Update verification**
```http
PUT /api/v1/verify/:discord_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "ckey": "new_username",
  "verified_flags": {"verified": true, "role": "admin"}
}
```

**Delete verification (admin only)**
```http
DELETE /api/v1/verify/:discord_id
Authorization: Bearer <token>
```

---

## Configuration

Create a `.env` file or set environment variables:

```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

---

## Database Schema

The system automatically creates the following tables:

### `users`
- `id` – Auto-increment primary key  
- `username` – Unique username  
- `password_hash` – Bcrypt hashed password  
- `role` – User role (`admin` or `user`)  
- `created_at` – Creation timestamp  

### `verifications`
- `id` – Auto-increment primary key  
- `discord_id` – Discord user ID (unique)  
- `ckey` – Character key/username  
- `verified_flags` – JSON object with verification data  
- `verification_method` – How verification was performed  
- `verified_by` – Admin who verified the user  
- `created_at` – Creation timestamp  
- `updated_at` – Last update timestamp  

---

## Security Features
- JWT-based authentication  
- Password hashing with bcrypt  
- Rate limiting (100 requests per 15 minutes)  
- Role-based access control  
- Input validation  
- SQL injection protection  

---

## Dashboard Features
- Statistics overview  
- Search and filter verifications  
- Add new verifications  
- Edit existing records  
- Delete records (admin only)  
- Pagination for large datasets  

---

## Examples

### Check Verification
```javascript
async function checkVerification(discordId) {
  const response = await fetch(`/api/v1/verify/${discordId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.ok) {
    const data = await response.json();
    return data.verified_flags;
  }

  return null;
}
```

### Bulk Verification Import
```javascript
async function importVerifications(verifications) {
  const results = [];

  for (const verification of verifications) {
    const response = await fetch('/api/v1/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verification)
    });

    results.push({
      discord_id: verification.discord_id,
      success: response.ok,
      error: response.ok ? null : await response.text()
    });
  }

  return results;
}
```

---

## Production Deployment

### Security Checklist
- Change default admin credentials  
- Set a strong JWT secret  
- Configure HTTPS  
- Enable proper logging  
- Set up database backups  
- Configure monitoring  
- Review rate limits  
- Configure CORS if needed  

---

## Docker Deployment

**Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

---

## Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Extending the System

### Adding New Verification Methods
1. Update the database schema if necessary  
2. Add the new method to the dashboard dropdown  
3. Implement verification logic in the backend  

### Custom Verification Flags
The `verified_flags` field accepts arbitrary JSON data:
```json
{
  "verified": true,
  "role": "admin",
  "permissions": ["ban", "kick", "mute"],
  "verified_date": "2024-01-01",
  "notes": "Verified through Discord authentication"
}
```

---

## Troubleshooting

**Database locked error**  
- Ensure only one instance is running  
- Check file permissions on `verification.db`  

**Token expired errors**  
- Tokens expire after 24 hours  
- Re-login to get a new token  

**Permission denied**  
- Verify the user role (admin vs user)  
- Ensure token is valid  

Logs currently output to the console.  

---

## License

MIT License – see the `LICENSE` file for details.  
