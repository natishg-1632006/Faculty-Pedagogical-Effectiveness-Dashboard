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

export const getFacultyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await User.findById(id).select('name email');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const feedbacks = await StudentFeedback.find({ facultyId: id }).sort({ submittedAt: -1 });

    const parameterScores = {
      contentKnowledge: 0,
      teachingMethodology: 0,
      communication: 0,
      punctuality: 0,
      studentEngagement: 0,
    };
    const paramCounts = { ...parameterScores };

    feedbacks.forEach(fb => {
      for (const key in parameterScores) {
        if (fb.feedbackScores && typeof fb.feedbackScores[key] === 'number') {
          parameterScores[key] += fb.feedbackScores[key];
          paramCounts[key]++;
        }
      }
    });

    const radarData = Object.keys(parameterScores).map(key => {
        let readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (readableKey === "Content Knowledge") readableKey = "Knowledge";
        if (readableKey === "Teaching Methodology") readableKey = "Methodology";
        if (readableKey === "Student Engagement") readableKey = "Engagement";
        if (readableKey === "Communication") readableKey = "Comm.";
        return {
            parameter: readableKey,
            score: paramCounts[key] > 0 ? parseFloat((parameterScores[key] / paramCounts[key]).toFixed(2)) : 0,
        }
    });

    const recentComments = feedbacks.filter(fb => fb.comment && fb.comment.trim() !== '').slice(0, 3).map(fb => ({ comment: fb.comment, submittedAt: fb.submittedAt }));

    res.json({ faculty, radarData, recentComments });
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

export const getFormAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const feedbacks = await StudentFeedback.find({ formId: id })
      .populate('facultyId', 'name email')
      .sort('-createdAt');
    res.json(feedbacks);
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

export const sendNotificationToFaculty = async (req, res) => {
  try {
    const { recipientType, facultyIds, message } = req.body;
    const hod = await User.findById(req.user._id);
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let targetUserIds = [];

    if (recipientType === 'all') {
      const faculty = await User.find({ departmentId: hod.departmentId, role: 'Faculty' });
      targetUserIds = faculty.map(f => f._id);
    } else if (recipientType === 'specific' && Array.isArray(facultyIds)) {
      // Ensure selected faculty belong to the HOD's department
      const faculty = await User.find({ _id: { $in: facultyIds }, departmentId: hod.departmentId, role: 'Faculty' });
      targetUserIds = faculty.map(f => f._id);
    }

    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map(userId => ({ userId, message, type: 'info', createdAt: new Date() }));
      await Notification.insertMany(notifications);
    }

    res.json({ message: `Notification sent to ${targetUserIds.length} faculty members` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
