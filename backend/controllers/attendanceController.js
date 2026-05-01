const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REGULAR_DAY_HOURS = 8;

const toDateKey = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);

const getDayRange = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateValue);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getAttendanceTitle = (workerId, dateValue) => `attendance-${workerId}-${toDateKey(dateValue)}`;

const getApprovedOvertimeHours = async (workerId, dateValue) => {
  const { start, end } = getDayRange(dateValue);

  const overtimeRequests = await prisma.overtimeRequest.findMany({
    where: {
      workerId: parseInt(workerId),
      date: {
        gte: start,
        lte: end
      },
      status: 'approved'
    },
    select: {
      hours: true
    }
  });

  return overtimeRequests.reduce((total, request) => total + (parseInt(request.hours) || 0), 0);
};

const buildAttendancePayload = async ({ worker, floorManager, status, dateValue, notes }) => {
  const overtimeHours = await getApprovedOvertimeHours(worker.id, dateValue);
  const regularHours = status === 'present' ? REGULAR_DAY_HOURS : 0;
  const totalHours = regularHours + overtimeHours;

  return {
    title: getAttendanceTitle(worker.id, dateValue),
    type: 'attendance',
    period: toDateKey(dateValue),
    unit: 'hours',
    data: {
      workerId: worker.id,
      workerName: worker.name,
      floorId: worker.assignedFloorId,
      floorManagerId: floorManager?.id || null,
      floorManagerName: floorManager?.name || null,
      date: new Date(dateValue).toISOString(),
      status,
      regularHours,
      overtimeHours,
      totalHours,
      notes: notes || null,
      updatedAt: new Date().toISOString()
    }
  };
};

const upsertAttendanceRecord = async ({ worker, floorManager, status, dateValue, notes }) => {
  const payload = await buildAttendancePayload({ worker, floorManager, status, dateValue, notes });

  const existingRecord = await prisma.graphData.findFirst({
    where: { type: 'attendance', title: payload.title }
  });

  if (existingRecord) {
    return prisma.graphData.update({
      where: { id: existingRecord.id },
      data: {
        period: payload.period,
        unit: payload.unit,
        data: payload.data
      }
    });
  }

  return prisma.graphData.create({
    data: payload
  });
};

const markAttendance = async (req, res) => {
  try {
    const { workerId, status, date, notes } = req.body;
    const currentUser = req.user;

    if (!workerId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Worker and status are required'
      });
    }

    const normalizedStatus = String(status).toLowerCase();
    if (!['present', 'absent'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be present or absent'
      });
    }

    const worker = await prisma.user.findUnique({
      where: { id: parseInt(workerId) },
      select: { id: true, name: true, role: true, assignedFloorId: true, department: true }
    });

    if (!worker || worker.role !== 'WORKER') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (currentUser.role === 'FLOOR_MANAGER' && worker.assignedFloorId !== currentUser.assignedFloorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark workers on your floor'
      });
    }

    const floorManager = currentUser.role === 'FLOOR_MANAGER'
      ? await prisma.user.findUnique({
          where: { id: parseInt(currentUser.id) },
          select: { id: true, name: true, assignedFloorId: true, role: true }
        })
      : null;

    const attendance = await upsertAttendanceRecord({
      worker,
      floorManager,
      status: normalizedStatus,
      dateValue: date || new Date(),
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance saved successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save attendance',
      error: error.message
    });
  }
};

const syncOvertimeAttendance = async ({ workerId, date, overtimeHours, floorManagerId }) => {
  const worker = await prisma.user.findUnique({
    where: { id: parseInt(workerId) },
    select: { id: true, name: true, role: true, assignedFloorId: true }
  });

  if (!worker || worker.role !== 'WORKER') {
    return null;
  }

  const floorManager = floorManagerId
    ? await prisma.user.findUnique({
        where: { id: parseInt(floorManagerId) },
        select: { id: true, name: true, assignedFloorId: true, role: true }
      })
    : null;

  const existingAttendance = await prisma.graphData.findFirst({
    where: {
      type: 'attendance',
      title: getAttendanceTitle(worker.id, date)
    }
  });

  const baseData = existingAttendance?.data && typeof existingAttendance.data === 'object'
    ? existingAttendance.data
    : {
        workerId: worker.id,
        workerName: worker.name,
        floorId: worker.assignedFloorId,
        date: new Date(date).toISOString(),
        status: 'present',
        regularHours: REGULAR_DAY_HOURS,
        overtimeHours: 0,
        totalHours: REGULAR_DAY_HOURS
      };

  const updatedData = {
    ...baseData,
    workerId: worker.id,
    workerName: worker.name,
    floorId: worker.assignedFloorId,
    floorManagerId: floorManager?.id || baseData.floorManagerId || null,
    floorManagerName: floorManager?.name || baseData.floorManagerName || null,
    date: new Date(date).toISOString(),
    overtimeHours: parseInt(overtimeHours) || 0,
    totalHours: (parseInt(baseData.regularHours) || 0) + (parseInt(overtimeHours) || 0),
    updatedAt: new Date().toISOString()
  };

  if (existingAttendance) {
    await prisma.graphData.update({
      where: { id: existingAttendance.id },
      data: {
        period: toDateKey(date),
        unit: 'hours',
        data: updatedData
      }
    });
    return updatedData;
  }

  await prisma.graphData.create({
    data: {
      title: getAttendanceTitle(worker.id, date),
      type: 'attendance',
      period: toDateKey(date),
      unit: 'hours',
      data: updatedData
    }
  });

  return updatedData;
};

const getFloorAttendanceSummary = async (req, res) => {
  try {
    const { floorId } = req.params;
    const requestedDate = req.query.date ? new Date(req.query.date) : new Date();
    const dateKey = toDateKey(requestedDate);

    const workers = await prisma.user.findMany({
      where: {
        assignedFloorId: parseInt(floorId),
        role: 'WORKER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        position: true,
        workerId: true,
        assignedFloorId: true
      }
    });

    const attendanceRecords = await prisma.graphData.findMany({
      where: {
        type: 'attendance',
        data: {
          path: ['floorId'],
          equals: parseInt(floorId)
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const recordsByWorker = new Map();
    attendanceRecords.forEach((record) => {
      const recordData = record.data && typeof record.data === 'object' ? record.data : null;
      if (!recordData) return;
      if (toDateKey(recordData.date) !== dateKey) return;
      if (!recordsByWorker.has(recordData.workerId)) {
        recordsByWorker.set(recordData.workerId, recordData);
      }
    });

    const workersWithAttendance = await Promise.all(workers.map(async (worker) => {
      const attendance = recordsByWorker.get(worker.id) || null;
      const weekStart = new Date(requestedDate);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weeklyRecords = await prisma.graphData.findMany({
        where: {
          type: 'attendance',
          data: {
            path: ['workerId'],
            equals: worker.id
          },
          updatedAt: {
            gte: weekStart
          }
        }
      });

      const weekTotalHours = weeklyRecords.reduce((sum, record) => {
        const recordData = record.data && typeof record.data === 'object' ? record.data : null;
        return sum + (parseInt(recordData?.totalHours) || 0);
      }, 0);

      return {
        ...worker,
        attendance: attendance || {
          status: 'absent',
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          date: requestedDate.toISOString()
        },
        todayHours: parseInt(attendance?.totalHours) || 0,
        weekTotalHours
      };
    }));

    const graphStart = new Date(requestedDate);
    graphStart.setDate(graphStart.getDate() - 6);
    graphStart.setHours(0, 0, 0, 0);

    const graphRecords = await prisma.graphData.findMany({
      where: {
        type: 'attendance',
        data: {
          path: ['floorId'],
          equals: parseInt(floorId)
        },
        updatedAt: {
          gte: graphStart
        }
      }
    });

    const totalsByDate = new Map();
    graphRecords.forEach((record) => {
      const recordData = record.data && typeof record.data === 'object' ? record.data : null;
      if (!recordData) return;
      const key = toDateKey(recordData.date);
      totalsByDate.set(key, (totalsByDate.get(key) || 0) + (parseInt(recordData.totalHours) || 0));
    });

    const dailyGraph = [];
    for (let index = 0; index < 7; index += 1) {
      const currentDate = new Date(graphStart);
      currentDate.setDate(graphStart.getDate() + index);
      const key = toDateKey(currentDate);
      dailyGraph.push({
        date: key,
        label: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        totalHours: totalsByDate.get(key) || 0
      });
    }

    return res.json({
      success: true,
      date: dateKey,
      workers: workersWithAttendance,
      dailyGraph,
      totals: {
        present: workersWithAttendance.filter(worker => worker.attendance?.status === 'present').length,
        absent: workersWithAttendance.filter(worker => worker.attendance?.status === 'absent').length,
        totalHours: workersWithAttendance.reduce((sum, worker) => sum + (parseInt(worker.todayHours) || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get floor attendance summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: error.message
    });
  }
};

module.exports = {
  REGULAR_DAY_HOURS,
  markAttendance,
  getFloorAttendanceSummary,
  syncOvertimeAttendance,
  upsertAttendanceRecord
};