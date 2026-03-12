import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import StudentFeedback from '../models/StudentFeedback.js';
import User from '../models/User.js';

export const generatePDFReport = async (req, res) => {
  try {
    const { facultyId, semester } = req.query;

    const faculty = await User.findById(facultyId);
    const feedbacks = await StudentFeedback.find({ 
      facultyId,
      ...(semester && { semester: parseInt(semester) })
    }).populate('courseId', 'courseName');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${facultyId}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Faculty Performance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Faculty: ${faculty.name}`);
    doc.text(`Email: ${faculty.email}`);
    doc.moveDown();

    const avgScore = feedbacks.length > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
      : 0;

    doc.text(`Overall Average Score: ${avgScore.toFixed(2)}`);
    doc.text(`Total Feedbacks: ${feedbacks.length}`);
    doc.moveDown();

    feedbacks.forEach((fb, idx) => {
      doc.text(`${idx + 1}. ${fb.courseId.courseName} - Score: ${fb.averageScore.toFixed(2)}`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateCSVReport = async (req, res) => {
  try {
    const { departmentId } = req.query;

    const faculty = await User.find({ 
      departmentId, 
      role: 'Faculty' 
    });

    const data = await Promise.all(faculty.map(async (f) => {
      const feedbacks = await StudentFeedback.find({ facultyId: f._id });
      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.averageScore, 0) / feedbacks.length
        : 0;

      return {
        name: f.name,
        email: f.email,
        averageScore: avgScore.toFixed(2),
        feedbackCount: feedbacks.length
      };
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=department-report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
