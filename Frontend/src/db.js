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

  // Owner Users
  {
    id: 13,
    name: 'Owner Admin',
    email: 'owner@motionmatrix.com',
    password: 'owner123',
    role: 'owner',
    department: 'Executive'
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

// Floors Database
export let floors = [
  {
    id: 1,
    name: 'Ground Floor',
    level: 0,
    area: 5000,
    status: 'active',
    cctvs: [1, 2, 3]
  },
  {
    id: 2,
    name: 'First Floor',
    level: 1,
    area: 4800,
    status: 'active',
    cctvs: [4, 5]
  }
];

// CCTV Cameras Database
export let cctvCameras = [
  {
    id: 1,
    name: 'CCTV-001',
    location: 'Entrance',
    status: 'active',
    floorId: 1,
    ipAddress: '192.168.1.10'
  },
  {
    id: 2,
    name: 'CCTV-002',
    location: 'Production Area A',
    status: 'active',
    floorId: 1,
    ipAddress: '192.168.1.11'
  },
  {
    id: 3,
    name: 'CCTV-003',
    location: 'Warehouse',
    status: 'inactive',
    floorId: 1,
    ipAddress: '192.168.1.12'
  },
  {
    id: 4,
    name: 'CCTV-004',
    location: 'Office Area',
    status: 'active',
    floorId: 2,
    ipAddress: '192.168.1.13'
  },
  {
    id: 5,
    name: 'CCTV-005',
    location: 'Conference Room',
    status: 'active',
    floorId: 2,
    ipAddress: '192.168.1.14'
  }
];

// Function to add a new floor
export const addFloor = (floorData) => {
  const newFloor = {
    id: Math.max(...floors.map(f => f.id), 0) + 1,
    ...floorData,
    cctvs: []
  };
  floors.push(newFloor);
  return newFloor;
};

// Function to get all floors
export const getAllFloors = () => {
  return floors;
};

// Function to get floor by ID
export const getFloorById = (id) => {
  return floors.find(f => f.id === id);
};

// Function to update floor
export const updateFloor = (id, floorData) => {
  const floor = floors.find(f => f.id === id);
  if (floor) {
    Object.assign(floor, floorData);
    return floor;
  }
  return null;
};

// Function to delete floor
export const deleteFloor = (id) => {
  const index = floors.findIndex(f => f.id === id);
  if (index > -1) {
    floors.splice(index, 1);
    return true;
  }
  return false;
};

// Function to add a new CCTV camera
export const addCCTV = (cctvData) => {
  const newCCTV = {
    id: Math.max(...cctvCameras.map(c => c.id), 0) + 1,
    ...cctvData
  };
  cctvCameras.push(newCCTV);
  return newCCTV;
};

// Function to get all CCTV cameras
export const getAllCCTVs = () => {
  return cctvCameras;
};

// Function to get CCTVs by floor
export const getCCTVsByFloor = (floorId) => {
  return cctvCameras.filter(c => c.floorId === floorId);
};

// Function to assign CCTV to floor
export const assignCCTVToFloor = (cctvId, floorId) => {
  const cctv = cctvCameras.find(c => c.id === cctvId);
  const floor = floors.find(f => f.id === floorId);
  
  if (cctv && floor) {
    cctv.floorId = floorId;
    if (!floor.cctvs.includes(cctvId)) {
      floor.cctvs.push(cctvId);
    }
    return true;
  }
  return false;
};

// Function to unassign CCTV from floor
export const unassignCCTVFromFloor = (cctvId, floorId) => {
  const cctv = cctvCameras.find(c => c.id === cctvId);
  const floor = floors.find(f => f.id === floorId);
  
  if (cctv && floor) {
    cctv.floorId = null;
    floor.cctvs = floor.cctvs.filter(id => id !== cctvId);
    return true;
  }
  return false;
};

// Messages Database (Worker to Floor Manager Communication)
export let messages = [
  {
    id: 1,
    fromId: 10,
    toId: 5,
    fromName: 'Ali Worker',
    toName: 'Ahmed Hassan',
    content: 'Hi Ahmed, I need to discuss the production schedule.',
    timestamp: new Date('2026-04-20T09:15:00'),
    read: true
  },
  {
    id: 2,
    fromId: 5,
    toId: 10,
    fromName: 'Ahmed Hassan',
    toName: 'Ali Worker',
    content: 'Sure Ali, I am available now. What is the issue?',
    timestamp: new Date('2026-04-20T09:20:00'),
    read: true
  }
];

// Overtime Requests Database
export let overtimeRequests = [
  {
    id: 1,
    workerId: 10,
    workerName: 'Ali Worker',
    floorManagerId: 5,
    floorManagerName: 'Ahmed Hassan',
    date: '2026-04-21',
    hours: 2,
    reason: 'Production deadline',
    status: 'pending',
    submittedAt: new Date('2026-04-20T08:00:00')
  },
  {
    id: 2,
    workerId: 11,
    workerName: 'Noor Worker',
    floorManagerId: 6,
    floorManagerName: 'Fatima Khan',
    date: '2026-04-22',
    hours: 3,
    reason: 'Machine maintenance catch-up',
    status: 'approved',
    submittedAt: new Date('2026-04-19T08:00:00')
  }
];

// Function to get floor manager by department
export const getFloorManagerByDepartment = (department) => {
  return users.find(u => u.role === 'floor_manager' && u.department === department);
};

// Function to send message
export const sendMessage = (fromId, toId, content) => {
  const newMessage = {
    id: Math.max(...messages.map(m => m.id), 0) + 1,
    fromId,
    toId,
    fromName: users.find(u => u.id === fromId)?.name,
    toName: users.find(u => u.id === toId)?.name,
    content,
    timestamp: new Date(),
    read: false
  };
  messages.push(newMessage);
  return newMessage;
};

// Function to get messages between worker and floor manager
export const getMessagesBetween = (userId1, userId2) => {
  return messages.filter(m => 
    (m.fromId === userId1 && m.toId === userId2) || 
    (m.fromId === userId2 && m.toId === userId1)
  ).sort((a, b) => a.timestamp - b.timestamp);
};

// Function to submit overtime request
export const submitOvertimeRequest = (workerId, floorManagerId, date, hours, reason) => {
  const worker = users.find(u => u.id === workerId);
  const floorManager = users.find(u => u.id === floorManagerId);
  
  if (worker && floorManager) {
    const newRequest = {
      id: Math.max(...overtimeRequests.map(r => r.id), 0) + 1,
      workerId,
      workerName: worker.name,
      floorManagerId,
      floorManagerName: floorManager.name,
      date,
      hours,
      reason,
      status: 'pending',
      submittedAt: new Date()
    };
    overtimeRequests.push(newRequest);
    return newRequest;
  }
  return null;
};

// Function to get overtime requests for a worker
export const getOvertimeRequestsByWorker = (workerId) => {
  return overtimeRequests.filter(r => r.workerId === workerId);
};

// Function to get all overtime requests for floor manager
export const getOvertimeRequestsByFloorManager = (floorManagerId) => {
  return overtimeRequests.filter(r => r.floorManagerId === floorManagerId);
};

// Function to update overtime request status
export const updateOvertimeStatus = (requestId, status) => {
  const request = overtimeRequests.find(r => r.id === requestId);
  if (request) {
    request.status = status;
    return request;
  }
  return null;
};

// Reports Database
export let reports = [
  {
    id: 1,
    title: 'Monthly Production Report - April 2026',
    department: 'Operations',
    date: '2026-04-20',
    period: 'April 1-20, 2026',
    totalProduced: 15420,
    qualityRate: 98.5,
    efficiency: 92.3,
    data: [
      { category: 'Sewing', produced: 5200, target: 5000, efficiency: 94 },
      { category: 'Cutting', produced: 4800, target: 5000, efficiency: 91 },
      { category: 'Finishing', produced: 3520, target: 3800, efficiency: 89 },
      { category: 'Packaging', produced: 1900, target: 2000, efficiency: 92 }
    ]
  },
  {
    id: 2,
    title: 'Workforce Attendance Report - April 2026',
    department: 'HR',
    date: '2026-04-20',
    period: 'April 1-20, 2026',
    totalWorkers: 150,
    presentToday: 142,
    attendanceRate: 94.7,
    data: [
      { department: 'Sewing', present: 45, total: 48, rate: 93.75 },
      { department: 'Cutting', present: 38, total: 40, rate: 95 },
      { department: 'Finishing', present: 35, total: 38, rate: 92.1 },
      { department: 'Packaging', present: 24, total: 24, rate: 100 }
    ]
  },
  {
    id: 3,
    title: 'Equipment Performance Report - April 2026',
    department: 'Maintenance',
    date: '2026-04-20',
    period: 'April 1-20, 2026',
    totalEquipment: 45,
    operationalEquipment: 43,
    uptime: 95.6,
    data: [
      { equipment: 'Sewing Machines', operational: 25, total: 26, uptime: 96.15 },
      { equipment: 'Cutting Tables', operational: 12, total: 12, uptime: 100 },
      { equipment: 'Finishing Tools', operational: 5, total: 6, uptime: 83.33 },
      { equipment: 'Packaging Units', operational: 1, total: 1, uptime: 100 }
    ]
  }
];

// Graph Data (Daily metrics)
export let graphData = [
  {
    id: 1,
    type: 'production',
    title: 'Daily Production Output',
    period: 'Last 30 Days',
    unit: 'Units',
    data: [
      { date: '2026-03-21', value: 450 },
      { date: '2026-03-22', value: 480 },
      { date: '2026-03-23', value: 520 },
      { date: '2026-03-24', value: 490 },
      { date: '2026-03-25', value: 510 },
      { date: '2026-03-26', value: 540 },
      { date: '2026-03-27', value: 530 },
      { date: '2026-03-28', value: 560 },
      { date: '2026-03-29', value: 550 },
      { date: '2026-03-30', value: 580 },
      { date: '2026-03-31', value: 600 },
      { date: '2026-04-01', value: 620 },
      { date: '2026-04-02', value: 610 },
      { date: '2026-04-03', value: 630 },
      { date: '2026-04-04', value: 650 },
      { date: '2026-04-05', value: 670 },
      { date: '2026-04-06', value: 680 },
      { date: '2026-04-07', value: 700 },
      { date: '2026-04-08', value: 720 },
      { date: '2026-04-09', value: 710 },
      { date: '2026-04-10', value: 730 },
      { date: '2026-04-11', value: 750 },
      { date: '2026-04-12', value: 770 },
      { date: '2026-04-13', value: 760 },
      { date: '2026-04-14', value: 780 },
      { date: '2026-04-15', value: 800 },
      { date: '2026-04-16', value: 820 },
      { date: '2026-04-17', value: 840 },
      { date: '2026-04-18', value: 850 },
      { date: '2026-04-19', value: 880 }
    ]
  },
  {
    id: 2,
    type: 'attendance',
    title: 'Daily Attendance Rate',
    period: 'Last 30 Days',
    unit: '%',
    data: [
      { date: '2026-03-21', value: 92 },
      { date: '2026-03-22', value: 93 },
      { date: '2026-03-23', value: 91 },
      { date: '2026-03-24', value: 94 },
      { date: '2026-03-25', value: 95 },
      { date: '2026-03-26', value: 93 },
      { date: '2026-03-27', value: 94 },
      { date: '2026-03-28', value: 96 },
      { date: '2026-03-29', value: 95 },
      { date: '2026-03-30', value: 94 },
      { date: '2026-03-31', value: 93 },
      { date: '2026-04-01', value: 94 },
      { date: '2026-04-02', value: 95 },
      { date: '2026-04-03', value: 96 },
      { date: '2026-04-04', value: 94 },
      { date: '2026-04-05', value: 95 },
      { date: '2026-04-06', value: 97 },
      { date: '2026-04-07', value: 96 },
      { date: '2026-04-08', value: 95 },
      { date: '2026-04-09', value: 94 },
      { date: '2026-04-10', value: 96 },
      { date: '2026-04-11', value: 97 },
      { date: '2026-04-12', value: 95 },
      { date: '2026-04-13', value: 94 },
      { date: '2026-04-14', value: 96 },
      { date: '2026-04-15', value: 97 },
      { date: '2026-04-16', value: 96 },
      { date: '2026-04-17', value: 95 },
      { date: '2026-04-18', value: 94 },
      { date: '2026-04-19', value: 95 }
    ]
  },
  {
    id: 3,
    type: 'efficiency',
    title: 'Equipment Uptime',
    period: 'Last 30 Days',
    unit: '%',
    data: [
      { date: '2026-03-21', value: 94 },
      { date: '2026-03-22', value: 95 },
      { date: '2026-03-23', value: 93 },
      { date: '2026-03-24', value: 96 },
      { date: '2026-03-25', value: 95 },
      { date: '2026-03-26', value: 97 },
      { date: '2026-03-27', value: 96 },
      { date: '2026-03-28', value: 98 },
      { date: '2026-03-29', value: 97 },
      { date: '2026-03-30', value: 96 },
      { date: '2026-03-31', value: 95 },
      { date: '2026-04-01', value: 96 },
      { date: '2026-04-02', value: 97 },
      { date: '2026-04-03', value: 98 },
      { date: '2026-04-04', value: 96 },
      { date: '2026-04-05', value: 97 },
      { date: '2026-04-06', value: 99 },
      { date: '2026-04-07', value: 98 },
      { date: '2026-04-08', value: 97 },
      { date: '2026-04-09', value: 96 },
      { date: '2026-04-10', value: 98 },
      { date: '2026-04-11', value: 99 },
      { date: '2026-04-12', value: 97 },
      { date: '2026-04-13', value: 96 },
      { date: '2026-04-14', value: 98 },
      { date: '2026-04-15', value: 99 },
      { date: '2026-04-16', value: 98 },
      { date: '2026-04-17', value: 97 },
      { date: '2026-04-18', value: 96 },
      { date: '2026-04-19', value: 97 }
    ]
  }
];

// Function to get all reports
export const getAllReports = () => {
  return reports;
};

// Function to get report by ID
export const getReportById = (id) => {
  return reports.find(r => r.id === id);
};

// Function to get graph data by type
export const getGraphDataByType = (type) => {
  return graphData.find(g => g.type === type);
};

// Function to get all graph data
export const getAllGraphData = () => {
  return graphData;
};

// Production Records Database
export let productionRecords = [
  {
    id: 1,
    floorId: 1,
    floorName: 'Ground Floor',
    date: '2026-04-20',
    shift: 'Morning',
    workersCount: 15,
    produced: 450,
    quality: 98.5,
    recordedBy: 'Ahmed Hassan',
    notes: 'Production meeting finished on time'
  },
  {
    id: 2,
    floorId: 1,
    floorName: 'Ground Floor',
    date: '2026-04-19',
    shift: 'Evening',
    workersCount: 14,
    produced: 420,
    quality: 97.8,
    recordedBy: 'Ahmed Hassan',
    notes: 'One machine maintenance required'
  },
  {
    id: 3,
    floorId: 2,
    floorName: 'First Floor',
    date: '2026-04-20',
    shift: 'Morning',
    workersCount: 12,
    produced: 380,
    quality: 99.2,
    recordedBy: 'Fatima Khan',
    notes: 'Excellent performance today'
  }
];

// Worker Activity Database (for floor monitoring)
export let workerActivity = [
  {
    id: 1,
    workerId: 10,
    workerName: 'Ali Worker',
    floorId: 1,
    activity: 'Working on Station 1',
    timestamp: new Date('2026-04-20T14:30:00'),
    status: 'active',
    cctvId: 2
  },
  {
    id: 2,
    workerId: 11,
    workerName: 'Noor Worker',
    floorId: 2,
    activity: 'Quality Check',
    timestamp: new Date('2026-04-20T14:25:00'),
    status: 'active',
    cctvId: 4
  }
];

// Notifications Database
export let notifications = [
  {
    id: 1,
    type: 'overtime',
    title: 'New Overtime Request',
    message: 'Ali Worker requested 2 hours overtime on 2026-04-21',
    timestamp: new Date('2026-04-20T14:00:00'),
    read: false,
    floorManagerId: 5
  },
  {
    id: 2,
    type: 'production',
    title: 'Production Goal Achieved',
    message: 'Ground Floor exceeded daily production target by 12%',
    timestamp: new Date('2026-04-20T13:45:00'),
    read: false,
    floorManagerId: 5
  },
  {
    id: 3,
    type: 'maintenance',
    title: 'Equipment Alert',
    message: 'CCTV-003 in Warehouse - Status: Inactive',
    timestamp: new Date('2026-04-20T13:00:00'),
    read: true,
    floorManagerId: 5
  }
];

// Function to add production record
export const addProductionRecord = (recordData) => {
  const newRecord = {
    id: Math.max(...productionRecords.map(r => r.id), 0) + 1,
    ...recordData,
    date: new Date().toISOString().split('T')[0]
  };
  productionRecords.push(newRecord);
  return newRecord;
};

// Function to get production records by floor
export const getProductionRecordsByFloor = (floorId) => {
  return productionRecords.filter(r => r.floorId === floorId).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Function to get worker activity by floor
export const getWorkerActivityByFloor = (floorId) => {
  return workerActivity.filter(a => a.floorId === floorId);
};

// Function to get notifications for floor manager
export const getNotificationsForFloorManager = (floorManagerId) => {
  return notifications.filter(n => n.floorManagerId === floorManagerId).sort((a, b) => b.timestamp - a.timestamp);
};

// Function to mark notification as read
export const markNotificationAsRead = (notificationId) => {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return notification;
  }
  return null;
};

// Function to get available chat users based on user role
export const getAvailableChatUsers = (currentUser) => {
  const otherUsers = users.filter(u => u.id !== currentUser?.id);
  
  switch(currentUser?.role) {
    case 'owner':
      // Owner can only chat with managers and floor managers
      return otherUsers.filter(u => u.role === 'manager' || u.role === 'floor_manager');
    
    case 'manager':
      // Manager can only chat with owner and floor managers
      return otherUsers.filter(u => u.role === 'owner' || u.role === 'floor_manager');
    
    case 'floor_manager':
      // Floor manager can chat with workers, other floor managers, admin, and managers
      return otherUsers.filter(u => 
        u.role === 'worker' || u.role === 'floor_manager' || u.role === 'admin' || u.role === 'manager'
      );
    
    case 'worker':
      // Worker can chat with floor managers and admin
      return otherUsers.filter(u => u.role === 'floor_manager' || u.role === 'admin');
    
    case 'admin':
      // Admin can chat with everyone
      return otherUsers;
    
    default:
      return otherUsers;
  }
};
