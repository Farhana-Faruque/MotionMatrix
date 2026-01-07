// Fake Database with User Credentials
export const users = [
  // Admin Users
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@motionmatrix.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration'
  },
  {
    id: 2,
    name: 'Sarah Admin',
    email: 'sarah.admin@company.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration'
  },
  
  // Manager Users
  {
    id: 3,
    name: 'John Manager',
    email: 'john.manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: 'Operations'
  },
  {
    id: 4,
    name: 'Maria Manager',
    email: 'maria.manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: 'Production'
  },
  
  // Floor Manager Users
  {
    id: 5,
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@company.com',
    password: 'floor123',
    role: 'floor_manager',
    department: 'Sewing'
  },
  {
    id: 6,
    name: 'Fatima Khan',
    email: 'fatima.khan@company.com',
    password: 'floor123',
    role: 'floor_manager',
    department: 'Cutting'
  },
  {
    id: 7,
    name: 'Karim Ahmed',
    email: 'karim.ahmed@company.com',
    password: 'floor123',
    role: 'floor_manager',
    department: 'Finishing'
  },
  
  // Supervisor Users
  {
    id: 8,
    name: 'Hassan Supervisor',
    email: 'hassan.supervisor@company.com',
    password: 'supervisor123',
    role: 'supervisor',
    department: 'Sewing'
  },
  {
    id: 9,
    name: 'Layla Supervisor',
    email: 'layla.supervisor@company.com',
    password: 'supervisor123',
    role: 'supervisor',
    department: 'Cutting'
  },
  
  // Worker Users
  {
    id: 10,
    name: 'Ali Worker',
    email: 'ali.worker@company.com',
    password: 'worker123',
    role: 'worker',
    department: 'Sewing'
  },
  {
    id: 11,
    name: 'Noor Worker',
    email: 'noor.worker@company.com',
    password: 'worker123',
    role: 'worker',
    department: 'Cutting'
  },
  {
    id: 12,
    name: 'Youssef Worker',
    email: 'youssef.worker@company.com',
    password: 'worker123',
    role: 'worker',
    department: 'Packaging'
  }
];

// Function to authenticate user
export const authenticateUser = (email, password) => {
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    };
  }
  return {
    success: false,
    user: null,
    error: 'Invalid email or password'
  };
};

// Function to find user by email (for password recovery)
export const findUserByEmail = (email) => {
  return users.find(u => u.email === email);
};

// Function to get all users by role
export const getUsersByRole = (role) => {
  return users.filter(u => u.role === role);
};
