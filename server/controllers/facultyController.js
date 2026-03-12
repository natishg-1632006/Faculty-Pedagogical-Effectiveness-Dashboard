import StudentFeedback from '../models/StudentFeedback.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

export const getPersonalDashboard = async (req, res) => {
  try {
    const facultyId = req.user._id;

    const courses = await Course.find({ assignedFaculty: facultyId });
    const feedbacks = await StudentFeedback.find({ facultyId })
      .populate('courseId', 'courseName courseCode');
    const metrics = await PerformanceMetrics.find({ facultyId });

    const overallAvg = feedbacks.length > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
      : 0;

    const faculty = await User.findById(facultyId).populate('departmentId');
    const deptFaculty = await User.find({ 
      departmentId: faculty.departmentId, 
      role: 'Faculty' 
    });

    let deptAvg = 0;
    for (const f of deptFaculty) {
      const fbs = await StudentFeedback.find({ facultyId: f._id });
      if (fbs.length > 0) {
        deptAvg += fbs.reduce((sum, fb) => sum + fb.averageScore, 0) / fbs.length;
      }
    }
    deptAvg = deptFaculty.length > 0 ? deptAvg / deptFaculty.length : 0;

    res.json({
      courses,
      feedbacks,
      metrics,
      overallAverage: overallAvg.toFixed(2),
      departmentAverage: deptAvg.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubjectWisePerformance = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const courses = await Course.find({ assignedFaculty: facultyId });

    const performance = await Promise.all(courses.map(async (course) => {
      const feedbacks = await StudentFeedback.find({ 
        facultyId, 
        courseId: course._id 
      });

      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
        : 0;

      return {
        courseId: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        semester: course.semester,
        averageScore: avgScore.toFixed(2),
        feedbackCount: feedbacks.length
      };
    }));

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSemesterTrend = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const feedbacks = await StudentFeedback.find({ facultyId });

    const semesterData = {};
    feedbacks.forEach(fb => {
      if (!semesterData[fb.semester]) {
        semesterData[fb.semester] = { total: 0, count: 0 };
      }
      semesterData[fb.semester].total += fb.averageScore;
      semesterData[fb.semester].count += 1;
    });

    const trend = Object.keys(semesterData).map(sem => ({
      semester: parseInt(sem),
      averageScore: (semesterData[sem].total / semesterData[sem].count).toFixed(2)
    })).sort((a, b) => a.semester - b.semester);

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
