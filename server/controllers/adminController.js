import User from '../models/User.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import StudentFeedback from '../models/StudentFeedback.js';

// User Management
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if ((role === 'HOD' || role === 'Faculty') && !departmentId) {
      return res.status(400).json({ message: 'Department is required for HOD and Faculty roles' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) {
        return res.status(400).json({ message: 'Department not found' });
      }

      if (role === 'HOD') {
        const existingHOD = await User.findOne({ departmentId, role: 'HOD', _id: { $ne: req.body._id } });
        if (existingHOD) {
          return res.status(400).json({ message: 'This department already has a HOD assigned' });
        }
        await Department.findByIdAndUpdate(departmentId, { hodId: null });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      departmentId,
      createdBy: req.user._id,
      mustChangePassword: false
    });

    if (role === 'HOD' && departmentId) {
      await Department.findByIdAndUpdate(departmentId, { hodId: user._id });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_CREATED',
      details: { createdUserId: user._id, role }
    });

    await Notification.create({
      userId: user._id,
      message: `Welcome! Your account has been created by the administrator.`,
      type: 'info'
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('departmentId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) {
      const existing = await User.findOne({ email: updates.email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const oldUser = await User.findById(id);
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (updates.role === 'HOD' && updates.departmentId) {
      if (oldUser.departmentId?.toString() !== updates.departmentId) {
        if (oldUser.role === 'HOD' && oldUser.departmentId) {
          await Department.findByIdAndUpdate(oldUser.departmentId, { hodId: null });
        }
        await Department.findByIdAndUpdate(updates.departmentId, { hodId: id });
      }
    } else if (oldUser.role === 'HOD' && updates.role !== 'HOD' && oldUser.departmentId) {
      await Department.findByIdAndUpdate(oldUser.departmentId, { hodId: null });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_UPDATED',
      details: { updatedUserId: id }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin account' });
      }
    }

    if (user.role === 'HOD' && user.departmentId) {
      await Department.findByIdAndUpdate(user.departmentId, { hodId: null });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_DELETED',
      details: { deletedUserId: id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'Admin' && user.isActive) {
      const adminCount = await User.countDocuments({ role: 'Admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the last admin account' });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      details: { targetUserId: id }
    });

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'PASSWORD_RESET',
      details: { targetUserId: id }
    });

    await Notification.create({
      userId: id,
      message: 'Your password has been reset by the administrator.',
      type: 'warning'
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Department Management
export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const department = await Department.create({ name });

    await AuditLog.create({
      userId: req.user._id,
      action: 'DEPARTMENT_CREATED',
      details: { departmentId: department._id }
    });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('hodId', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Course Management
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    await AuditLog.create({
      userId: req.user._id,
      action: 'COURSE_CREATED',
      details: { courseId: course._id }
    });
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('departmentId', 'name')
      .populate('assignedFaculty', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// System Monitoring
export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'Admin' });
    const hodCount = await User.countDocuments({ role: 'HOD' });
    const facultyCount = await User.countDocuments({ role: 'Faculty' });
    const departmentCount = await Department.countDocuments();
    const courseCount = await Course.countDocuments();

    res.json({
      totalUsers,
      adminCount,
      hodCount,
      facultyCount,
      departmentCount,
      courseCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort('-timestamp')
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const departments = await Department.find().populate('hodId', 'name');
    const analytics = await Promise.all(departments.map(async (dept) => {
      const faculty = await User.find({ departmentId: dept._id, role: 'Faculty' });
      const courses = await Course.countDocuments({ departmentId: dept._id });
      const feedbacks = await StudentFeedback.find({ facultyId: { $in: faculty.map(f => f._id) } });
      const avgScore = feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.averageScore, 0) / feedbacks.length).toFixed(2) : 0;
      return {
        departmentId: dept._id,
        departmentName: dept.name,
        hodName: dept.hodId?.name || 'Not Assigned',
        facultyCount: faculty.length,
        courseCount: courses,
        feedbackCount: feedbacks.length,
        averageScore: parseFloat(avgScore)
      };
    }));
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
