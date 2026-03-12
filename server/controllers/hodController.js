import User from '../models/User.js';
import StudentFeedback from '../models/StudentFeedback.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';
import Course from '../models/Course.js';
import FeedbackForm from '../models/FeedbackForm.js';
import Notification from '../models/Notification.js';

export const getDepartmentPerformance = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id).populate('departmentId');
    if (!hod.departmentId) {
      return res.status(400).json({ message: 'No department assigned' });
    }

    const faculty = await User.find({ 
      departmentId: hod.departmentId._id, 
      role: 'Faculty' 
    });

    const facultyIds = faculty.map(f => f._id);
    const feedbacks = await StudentFeedback.find({ facultyId: { $in: facultyIds } })
      .populate('facultyId', 'name')
      .populate('courseId', 'courseName');

    const metrics = await PerformanceMetrics.find({ facultyId: { $in: facultyIds } })
      .populate('facultyId', 'name');

    res.json({ faculty, feedbacks, metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFacultyRanking = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);
    const { semester } = req.query;

    const faculty = await User.find({ 
      departmentId: hod.departmentId, 
      role: 'Faculty' 
    });

    const rankings = await Promise.all(faculty.map(async (f) => {
      const feedbacks = await StudentFeedback.find({ 
        facultyId: f._id,
        ...(semester && { semester: parseInt(semester) })
      });

      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
        : 0;

      return {
        facultyId: f._id,
        name: f.name,
        email: f.email,
        averageScore: avgScore.toFixed(2),
        feedbackCount: feedbacks.length
      };
    }));

    rankings.sort((a, b) => b.averageScore - a.averageScore);

    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLowPerformers = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);
    const threshold = 3.0;

    const faculty = await User.find({ 
      departmentId: hod.departmentId, 
      role: 'Faculty' 
    });

    const lowPerformers = [];

    for (const f of faculty) {
      const feedbacks = await StudentFeedback.find({ facultyId: f._id });
      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
        : 0;

      if (avgScore < threshold && feedbacks.length > 0) {
        lowPerformers.push({
          facultyId: f._id,
          name: f.name,
          averageScore: avgScore.toFixed(2),
          feedbackCount: feedbacks.length
        });
      }
    }

    res.json(lowPerformers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFeedbackForm = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id).populate('departmentId');
    const { title, semester, facultyList, questions, expiresAt } = req.body;

    const form = await FeedbackForm.create({
      title,
      departmentId: hod.departmentId._id,
      semester,
      facultyList,
      questions: questions || [
        { question: 'Content Knowledge', type: 'rating' },
        { question: 'Teaching Methodology', type: 'rating' },
        { question: 'Communication Skills', type: 'rating' },
        { question: 'Punctuality', type: 'rating' },
        { question: 'Student Engagement', type: 'rating' }
      ],
      createdBy: req.user._id,
      expiresAt
    });

    res.status(201).json({ message: 'Feedback form created', form });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishFeedbackForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await FeedbackForm.findByIdAndUpdate(id, { isPublished: true }, { new: true })
      .populate('facultyList', 'name email');
    
    // Notify all faculty in the form
    for (const faculty of form.facultyList) {
      await Notification.create({
        userId: faculty._id,
        message: `New feedback form "${form.title}" has been published for Semester ${form.semester}`,
        type: 'info'
      });
    }
    
    res.json({ message: 'Form published', form });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFeedbackForm = async (req, res) => {
  try {
    const { id } = req.params;
    await FeedbackForm.findByIdAndDelete(id);
    res.json({ message: 'Form deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackForms = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);
    const forms = await FeedbackForm.find({ departmentId: hod.departmentId })
      .populate('facultyList', 'name email')
      .sort('-createdAt');
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentFaculty = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);
    const faculty = await User.find({ 
      departmentId: hod.departmentId, 
      role: 'Faculty' 
    }).select('name email');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
