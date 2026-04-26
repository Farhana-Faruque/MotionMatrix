d# MotionMatrix Backend API

A comprehensive Node.js/Express backend for factory management system with JWT authentication, PostgreSQL database, and Prisma ORM.

## Features

- ✅ JWT Authentication
- ✅ Role-based Authorization (Admin, Owner, Manager, Floor Manager, Worker)
- ✅ User Management
- ✅ Floor Management
- ✅ CCTV Camera Management
- ✅ Messaging System
- ✅ Overtime Request Management
- ✅ Reports & Analytics
- ✅ Graph Data for Visualization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Password Hashing**: bcryptjs

## Installation

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Setup

1. **Clone and navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create/update `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:postgresql@localhost:5432/motion_matrix"
   JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
   JWT_EXPIRE="7d"
   NODE_ENV="development"
   PORT=5000
   ```

4. **Push database schema**
   ```bash
   npx prisma db push
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "WORKER",
    "department": "Sewing",
    "phone": "123456789",
    "nid": "NID123",
    "gender": "Male",
    "joinDate": "2026-04-21",
    "position": "Senior Worker",
    "workerId": "W001"
  }
  ```
- **Response**: User object + JWT token

#### Login
- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object + JWT token

#### Get Current User
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current user profile

---

### User Management Endpoints

#### Get All Users
- **GET** `/api/users`
- **Query Params**: `?role=ADMIN&department=Administration`
- **Auth**: Required (Admin/Owner)

#### Get User by ID
- **GET** `/api/users/:id`
- **Auth**: Required

#### Update User
- **PUT** `/api/users/:id`
- **Body**: Any of these fields
  ```json
  {
    "name": "Updated Name",
    "phone": "987654321",
    "position": "Manager",
    "department": "Operations",
    "gender": "Female"
  }
  ```

#### Change Password
- **PUT** `/api/users/:id/change-password`
- **Body**:
  ```json
  {
    "currentPassword": "oldpass123",
    "newPassword": "newpass123",
    "confirmPassword": "newpass123"
  }
  ```

#### Get Users by Role
- **GET** `/api/users/role/:role`
- **Role Values**: `ADMIN`, `MANAGER`, `OWNER`, `FLOOR_MANAGER`, `WORKER`

#### Get Users by Department
- **GET** `/api/users/department/:department`

#### Delete User
- **DELETE** `/api/users/:id`
- **Auth**: Required (Admin/Owner only)

---

### Floor Management Endpoints

#### Create Floor
- **POST** `/api/floors`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "name": "Ground Floor",
    "level": 0,
    "area": 5000,
    "status": "active"
  }
  ```

#### Get All Floors
- **GET** `/api/floors`
- **Auth**: Required

#### Get Floor by ID
- **GET** `/api/floors/:id`
- **Auth**: Required

#### Update Floor
- **PUT** `/api/floors/:id`
- **Auth**: Required (Admin/Owner)
- **Body**: Any of these fields
  ```json
  {
    "name": "Updated Floor Name",
    "level": 1,
    "area": 6000,
    "status": "inactive"
  }
  ```

#### Delete Floor
- **DELETE** `/api/floors/:id`
- **Auth**: Required (Admin/Owner)

---

### CCTV Management Endpoints

#### Create CCTV
- **POST** `/api/cctvs`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "name": "CCTV-001",
    "location": "Entrance",
    "status": "active",
    "ipAddress": "192.168.1.10",
    "floorId": 1
  }
  ```

#### Get All CCTVs
- **GET** `/api/cctvs`
- **Auth**: Required

#### Get CCTV by ID
- **GET** `/api/cctvs/:id`
- **Auth**: Required

#### Get CCTVs by Floor
- **GET** `/api/cctvs/floor/:floorId`
- **Auth**: Required

#### Update CCTV
- **PUT** `/api/cctvs/:id`
- **Auth**: Required (Admin/Owner)

#### Assign CCTV to Floor
- **POST** `/api/cctvs/assign`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "cctvId": 1,
    "floorId": 2
  }
  ```

#### Unassign CCTV from Floor
- **POST** `/api/cctvs/unassign`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "cctvId": 1
  }
  ```

#### Delete CCTV
- **DELETE** `/api/cctvs/:id`
- **Auth**: Required (Admin/Owner)

---

### Messaging Endpoints

#### Send Message
- **POST** `/api/messages/send`
- **Auth**: Required
- **Body**:
  ```json
  {
    "toId": 5,
    "content": "Hello, how are you?"
  }
  ```

#### Get Messages Between Two Users
- **GET** `/api/messages/between/:userId`
- **Auth**: Required

#### Get All Conversations
- **GET** `/api/messages/conversations`
- **Auth**: Required

#### Get Unread Count
- **GET** `/api/messages/unread/count`
- **Auth**: Required

#### Mark Message as Read
- **PUT** `/api/messages/:messageId/read`
- **Auth**: Required

#### Delete Message
- **DELETE** `/api/messages/:messageId`
- **Auth**: Required

---

### Overtime Request Endpoints

#### Submit Overtime Request
- **POST** `/api/overtime/submit`
- **Auth**: Required (Worker)
- **Body**:
  ```json
  {
    "floorManagerId": 5,
    "date": "2026-04-25",
    "hours": 2,
    "reason": "Production deadline"
  }
  ```

#### Get My Overtime Requests
- **GET** `/api/overtime/my-requests`
- **Auth**: Required (Worker)

#### Get Overtime Requests (as Floor Manager)
- **GET** `/api/overtime/floor-manager/requests`
- **Auth**: Required (Floor Manager)

#### Get All Overtime Requests
- **GET** `/api/overtime?status=pending`
- **Auth**: Required (Admin/Owner)
- **Query Params**: `?status=pending|approved|rejected`

#### Get Overtime Request by ID
- **GET** `/api/overtime/:id`
- **Auth**: Required

#### Approve Overtime Request
- **PUT** `/api/overtime/:id/approve`
- **Auth**: Required (Floor Manager)

#### Reject Overtime Request
- **PUT** `/api/overtime/:id/reject`
- **Auth**: Required (Floor Manager)

#### Delete Overtime Request
- **DELETE** `/api/overtime/:id`
- **Auth**: Required (Admin/Owner)

---

### Reports Endpoints

#### Get All Reports
- **GET** `/api/reports/reports`
- **Auth**: Required
- **Query Params**: `?department=Operations`

#### Get Report by ID
- **GET** `/api/reports/reports/:id`
- **Auth**: Required

#### Create Report
- **POST** `/api/reports/reports`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "title": "Monthly Production Report",
    "department": "Operations",
    "period": "April 1-30, 2026",
    "data": {
      "totalProduced": 15420,
      "qualityRate": 98.5,
      "efficiency": 92.3
    }
  }
  ```

#### Delete Report
- **DELETE** `/api/reports/reports/:id`
- **Auth**: Required (Admin/Owner)

---

### Graph Data Endpoints

#### Get All Graph Data
- **GET** `/api/reports/graphs`
- **Auth**: Required

#### Get Graph Data by ID
- **GET** `/api/reports/graphs/:id`
- **Auth**: Required

#### Get Graph Data by Type
- **GET** `/api/reports/graphs/type/:type`
- **Auth**: Required
- **Type Values**: `production`, `attendance`, `efficiency`

#### Create Graph Data
- **POST** `/api/reports/graphs`
- **Auth**: Required (Admin/Owner)
- **Body**:
  ```json
  {
    "type": "production",
    "title": "Daily Production Output",
    "period": "Last 30 Days",
    "unit": "Units",
    "data": [
      { "date": "2026-04-01", "value": 620 },
      { "date": "2026-04-02", "value": 610 }
    ]
  }
  ```

#### Update Graph Data
- **PUT** `/api/reports/graphs/:id`
- **Auth**: Required (Admin/Owner)

#### Delete Graph Data
- **DELETE** `/api/reports/graphs/:id`
- **Auth**: Required (Admin/Owner)

---

## User Roles

| Role | Permissions |
|------|-------------|
| ADMIN | Full access to all endpoints |
| OWNER | Full access to all endpoints |
| MANAGER | Manage users, view reports |
| FLOOR_MANAGER | Manage workers in floor, approve overtime |
| WORKER | View own data, submit overtime requests |

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Schema

### Users
- id, name, email, password, role, department, phone, nid, gender, joinDate, position, workerId, status, createdAt, updatedAt

### Floors
- id, name, level, area, status, createdAt, updatedAt

### CCTV
- id, name, location, status, ipAddress, floorId, createdAt, updatedAt

### Messages
- id, fromId, toId, content, read, createdAt

### OvertimeRequests
- id, workerId, floorManagerId, date, hours, reason, status, submittedAt, respondedAt, createdAt, updatedAt

### Reports
- id, title, department, date, period, data (JSON), createdAt, updatedAt

### GraphData
- id, type, title, period, unit, data (JSON), createdAt, updatedAt

## Security

- All passwords are hashed using bcryptjs
- JWT tokens expire after 7 days (configurable)
- All sensitive endpoints require authentication
- Role-based authorization enforced
- CORS enabled for cross-origin requests

## Development

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

## License

ISC
