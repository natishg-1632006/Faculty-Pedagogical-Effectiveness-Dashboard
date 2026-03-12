import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import StudentFeedback from '../models/StudentFeedback.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await StudentFeedback.deleteMany({});
    await PerformanceMetrics.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@fped.com',
      password: 'Admin@123',
      role: 'Admin',
      isActive: true,
      mustChangePassword: false
    });

    // Create Departments
    const csDept = await Department.create({ name: 'Computer Science' });
    const eeDept = await Department.create({ name: 'Electrical Engineering' });
    const meDept = await Department.create({ name: 'Mechanical Engineering' });

    // Create HODs
    const hodCS = await User.create({
      name: 'Dr. John Smith',
      email: 'hod.cs@fped.com',
      password: 'Welcome@123',
      role: 'HOD',
      departmentId: csDept._id,
      createdBy: admin._id,
      isActive: true
    });

    const hodEE = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'hod.ee@fped.com',
      password: 'Welcome@123',
      role: 'HOD',
      departmentId: eeDept._id,
      createdBy: admin._id,
      isActive: true
    });

    // Update departments with HODs
    csDept.hodId = hodCS._id;
    await csDept.save();
    eeDept.hodId = hodEE._id;
    await eeDept.save();

    // Create Faculty
    const faculty1 = await User.create({
      name: 'Prof. Michael Brown',
      email: 'michael.brown@fped.com',
      password: 'Welcome@123',
      role: 'Faculty',
      departmentId: csDept._id,
      createdBy: admin._id,
      isActive: true
    });

    const faculty2 = await User.create({
      name: 'Prof. Emily Davis',
      email: 'emily.davis@fped.com',
      password: 'Welcome@123',
      role: 'Faculty',
      departmentId: csDept._id,
      createdBy: admin._id,
      isActive: true
    });

    const faculty3 = await User.create({
      name: 'Prof. Robert Wilson',
      email: 'robert.wilson@fped.com',
      password: 'Welcome@123',
      role: 'Faculty',
      departmentId: eeDept._id,
      createdBy: admin._id,
      isActive: true
    });

    // Create Courses
    const course1 = await Course.create({
      courseName: 'Data Structures',
      courseCode: 'CS201',
      semester: 3,
      departmentId: csDept._id,
      assignedFaculty: faculty1._id
    });

    const course2 = await Course.create({
      courseName: 'Database Management',
      courseCode: 'CS301',
      semester: 5,
      departmentId: csDept._id,
      assignedFaculty: faculty2._id
    });

    const course3 = await Course.create({
      courseName: 'Circuit Theory',
      courseCode: 'EE101',
      semester: 2,
      departmentId: eeDept._id,
      assignedFaculty: faculty3._id
    });

    // Create Sample Feedbacks
    await StudentFeedback.create({
      facultyId: faculty1._id,
      courseId: course1._id,
      semester: 3,
      feedbackScores: {
        contentKnowledge: 4.5,
        teachingMethodology: 4.2,
        communication: 4.8,
        punctuality: 4.0,
        studentEngagement: 4.3
      },
      comment: 'Excellent teaching style and clear explanations'
    });

    await StudentFeedback.create({
      facultyId: faculty2._id,
      courseId: course2._id,
      semester: 5,
      feedbackScores: {
        contentKnowledge: 3.8,
        teachingMethodology: 3.5,
        communication: 4.0,
        punctuality: 3.9,
        studentEngagement: 3.7
      },
      comment: 'Good content but could improve engagement'
    });

    await StudentFeedback.create({
      facultyId: faculty3._id,
      courseId: course3._id,
      semester: 2,
      feedbackScores: {
        contentKnowledge: 2.8,
        teachingMethodology: 2.5,
        communication: 3.0,
        punctuality: 2.7,
        studentEngagement: 2.6
      },
      comment: 'Needs improvement in teaching methodology'
    });

    console.log('✅ Seed data created successfully');
    console.log('\n📧 Login Credentials:');
    console.log('Admin: admin@fped.com / Admin@123');
    console.log('HOD CS: hod.cs@fped.com / Welcome@123');
    console.log('HOD EE: hod.ee@fped.com / Welcome@123');
    console.log('Faculty 1: michael.brown@fped.com / Welcome@123');
    console.log('Faculty 2: emily.davis@fped.com / Welcome@123');
    console.log('Faculty 3: robert.wilson@fped.com / Welcome@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
