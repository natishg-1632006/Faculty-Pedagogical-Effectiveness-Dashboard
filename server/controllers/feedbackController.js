import StudentFeedback from '../models/StudentFeedback.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';
import Notification from '../models/Notification.js';
import FeedbackForm from '../models/FeedbackForm.js';
import Course from '../models/Course.js';

export const submitFeedback = async (req, res) => {
  try {
    const feedback = await StudentFeedback.create(req.body);

    // Generate suggestions based on scores
    const suggestions = generateSuggestions(feedback.feedbackScores);

    // Update or create performance metrics
    const existingMetric = await PerformanceMetrics.findOne({
      facultyId: feedback.facultyId,
      semester: feedback.semester
    });

    if (existingMetric) {
      existingMetric.overallScore = feedback.averageScore;
      existingMetric.suggestions = suggestions;
      await existingMetric.save();
    } else {
      await PerformanceMetrics.create({
        facultyId: feedback.facultyId,
        semester: feedback.semester,
        overallScore: feedback.averageScore,
        suggestions
      });
    }

    // Notify faculty if score is low
    if (feedback.averageScore < 3.0) {
      await Notification.create({
        userId: feedback.facultyId,
        message: `Your recent feedback score (${feedback.averageScore.toFixed(2)}) needs attention. Please review suggestions.`,
        type: 'warning'
      });
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const { formId, facultyId, semester } = req.query;
    const query = {};

    if (formId) query.formId = formId;
    if (facultyId) query.facultyId = facultyId;
    if (semester) query.semester = semester;

    const feedbacks = await StudentFeedback.find(query)
      .populate('facultyId', 'name email')
      .populate('courseId', 'courseName courseCode')
      .sort('-createdAt');
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublishedForms = async (req, res) => {
  try {
    const forms = await FeedbackForm.find({ isPublished: true })
      .populate('facultyList', 'name email')
      .populate('departmentId', 'name');
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitStudentFeedback = async (req, res) => {
  try {
    const { formId, facultyId, responses, studentName, studentRegNumber, studentEmail } = req.body;
    
    if (!studentName || !studentRegNumber || !studentEmail || !facultyId) {
      return res.status(400).json({ message: 'All student details and faculty selection are required' });
    }

    const form = await FeedbackForm.findById(formId);
    if (!form || !form.isPublished) {
      return res.status(400).json({ message: 'Form not available' });
    }

    const normalizedReg = studentRegNumber.trim().toUpperCase();
    const normalizedEmail = studentEmail.trim().toLowerCase();

    const course = await Course.findOne({ 
      assignedFaculty: facultyId, 
      semester: form.semester 
    });

    // Check for duplicate feedback for this specific form
    const existingFeedback = await StudentFeedback.findOne({
      formId,
      facultyId,
      $or: [
        { studentRegNumber: normalizedReg },
        { studentEmail: normalizedEmail }
      ]
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this faculty on this form.' });
    }

    // Calculate average from rating questions
    const ratingQuestions = form.questions.filter(q => q.type === 'rating');
    const ratingResponses = responses.filter(r => r.type === 'rating');
    const avgScore = ratingResponses.length > 0
      ? ratingResponses.reduce((sum, r) => sum + r.value, 0) / ratingResponses.length
      : 0;

    // Create feedback scores object
    const feedbackScores = {
      contentKnowledge: ratingResponses[0]?.value || 5,
      teachingMethodology: ratingResponses[1]?.value || 5,
      communication: ratingResponses[2]?.value || 5,
      punctuality: ratingResponses[3]?.value || 5,
      studentEngagement: ratingResponses[4]?.value || 5
    };

    const textResponse = responses.find(r => r.type === 'text');

    if (!course) {
      return res.status(400).json({ message: 'No course found for this faculty in this semester.' });
    }

    const feedback = await StudentFeedback.create({
      formId,
      facultyId,
      courseId: course._id,
      semester: form.semester,
      studentName,
      studentRegNumber: normalizedReg,
      studentEmail: normalizedEmail,
      feedbackScores,
      averageScore: avgScore,
      comment: textResponse?.value || ''
    });

    const suggestions = generateSuggestions(feedbackScores);
    await PerformanceMetrics.findOneAndUpdate(
      { facultyId, semester: form.semester },
      { overallScore: avgScore, suggestions },
      { upsert: true }
    );

    if (avgScore < 3.0) {
      await Notification.create({
        userId: facultyId,
        message: `New feedback score (${avgScore.toFixed(2)}) needs attention.`,
        type: 'warning'
      });
    }

    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate feedback detected' });
    }
    res.status(500).json({ message: error.message });
  }
};

const generateSuggestions = (scores) => {
  const suggestions = [];
  if (scores.contentKnowledge < 3) suggestions.push('Enhance subject matter expertise through workshops');
  if (scores.teachingMethodology < 3) suggestions.push('Adopt interactive teaching methods');
  if (scores.communication < 3) suggestions.push('Improve communication and presentation skills');
  if (scores.punctuality < 3) suggestions.push('Maintain consistent class schedules');
  if (scores.studentEngagement < 3) suggestions.push('Increase student participation activities');
  return suggestions;
};
