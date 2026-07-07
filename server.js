const express = require('express');
const path = require('path');
const db = require('./database');
const { generateOfferLetterPdf } = require('./pdf-generator');
const { sendEnrollmentEmail } = require('./mail-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Course Catalog
const COURSES = [
  {
    id: 'fs-web',
    title: 'Full-Stack Software Engineering',
    duration: '6 Months',
    price: '$1,299',
    description: 'Master HTML/CSS, JavaScript, Node.js, relational databases, cloud deployment, and system architecture.'
  },
  {
    id: 'ai-ml',
    title: 'Artificial Intelligence & Deep Learning',
    duration: '4 Months',
    price: '$1,499',
    description: 'Deep dive into neural networks, computer vision, natural language processing, PyTorch, and NLP models.'
  },
  {
    id: 'ds-quant',
    title: 'Data Science & Quantitative Analytics',
    duration: '4 Months',
    price: '$1,199',
    description: 'Explore statistical computation, visual storytelling, predictive regression analysis, and modern data pipelines.'
  },
  {
    id: 'cloud-devops',
    title: 'Cloud Architecture & DevOps',
    duration: '3 Months',
    price: '$999',
    description: 'Deploy auto-scaling, resilient architectures using Docker, Kubernetes, CI/CD pipelines, and AWS.'
  }
];

// Endpoint: Retrieve available courses
app.get('/api/courses', (req, res) => {
  res.json(COURSES);
});

// Helper for basic email format validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Endpoint: Enroll a student and process workflow
app.post('/api/enroll', async (req, res) => {
  const { name, email, phone, courseId, paymentStatus } = req.body;

  // 1. Validation Rules
  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'Email address is required to receive your offer letter.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address to continue.' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  const selectedCourse = COURSES.find(c => c.id === courseId);
  if (!selectedCourse) {
    return res.status(400).json({ error: 'Selected course is invalid.' });
  }

  // 2. Generate Unique Enrollment ID (e.g., AE-2026-84392)
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const enrollmentId = `AE-2026-${randomDigits}`;

  const enrollment = {
    id: enrollmentId,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    courseId,
    courseName: selectedCourse.title,
    enrollmentDate: new Date().toISOString(),
    paymentStatus: paymentStatus || 'Success',
    offerLetterStatus: 'Not Generated'
  };

  // 3. Automated Workflow execution based on Payment Status
  if (enrollment.paymentStatus === 'Success') {
    try {
      enrollment.offerLetterStatus = 'Generated';
      
      // Save primary enrollment record
      db.addEnrollment(enrollment);

      // Generate the PDF Binary Buffer
      const pdfBuffer = await generateOfferLetterPdf(enrollment);

      // Dispatch simulated email with PDF attachment
      await sendEnrollmentEmail(enrollment, pdfBuffer);

      return res.status(200).json({
        success: true,
        message: 'Congratulations! Your enrollment has been completed successfully. Your offer letter has been generated and sent to your registered email address.',
        enrollment
      });
    } catch (err) {
      console.error('Error in enrollment PDF/Email generation:', err);
      enrollment.offerLetterStatus = 'Generation Failed';
      db.addEnrollment(enrollment);
      
      return res.status(500).json({
        error: 'Enrollment recorded, but there was an error automatically generating your offer letter PDF.',
        enrollment
      });
    }
  } else if (enrollment.paymentStatus === 'Failed') {
    // Save failed enrollment details, but do not generate offer letter
    enrollment.offerLetterStatus = 'Not Generated';
    db.addEnrollment(enrollment);
    return res.status(400).json({
      error: 'Payment unsuccessful. Please try again.',
      enrollment
    });
  } else {
    // Pending payment status
    enrollment.offerLetterStatus = 'Pending Payment';
    db.addEnrollment(enrollment);
    return res.status(200).json({
      success: true,
      message: 'Enrollment registry recorded. Access credentials and offer letters will be dispatched upon payment completion.',
      enrollment
    });
  }
});

// Endpoint: Fetch all enrolled student records for Admin Dashboard
app.get('/api/enrollments', (req, res) => {
  try {
    res.json(db.getEnrollments());
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve enrollments.' });
  }
});

// Endpoint: Fetch sandbox email history for Sandbox Email inbox
app.get('/api/emails', (req, res) => {
  try {
    res.json(db.getEmails());
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve simulated inbox.' });
  }
});

// Endpoint: Manually trigger email resend from Admin Dashboard
app.post('/api/resend-email', async (req, res) => {
  const { enrollmentId } = req.body;
  
  try {
    const enrollments = db.getEnrollments();
    const enrollment = enrollments.find(e => e.id === enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment record not found.' });
    }

    if (enrollment.paymentStatus !== 'Success') {
      return res.status(400).json({ error: 'Offer letters can only be issued for fully processed successful payments.' });
    }

    // Generate PDF and send simulated email again
    const pdfBuffer = await generateOfferLetterPdf(enrollment);
    await sendEnrollmentEmail(enrollment, pdfBuffer);

    res.json({ success: true, message: 'Offer letter email resent successfully.' });
  } catch (err) {
    console.error('Error manual resending email:', err);
    res.status(500).json({ error: 'Failed to regenerate and dispatch email.' });
  }
});

// Endpoint: Generate and download the PDF on-demand
app.get('/api/download-pdf/:id', async (req, res) => {
  const enrollmentId = req.params.id;
  
  try {
    const enrollments = db.getEnrollments();
    const enrollment = enrollments.find(e => e.id === enrollmentId);

    if (!enrollment) {
      return res.status(404).send('Enrollment record not found.');
    }

    const pdfBuffer = await generateOfferLetterPdf(enrollment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${enrollment.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error serving PDF download:', err);
    res.status(500).send('Error generating PDF download.');
  }
});

// Endpoint: Retrieve SMTP settings (masking password for security)
app.get('/api/config', (req, res) => {
  try {
    const config = db.getConfig();
    const safeConfig = { ...config };
    if (safeConfig.smtpPass) {
      safeConfig.smtpPass = '••••••••••••••••';
    }
    res.json(safeConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve configuration.' });
  }
});

// Endpoint: Update SMTP settings
app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  
  if (newConfig.smtpPort) newConfig.smtpPort = Number(newConfig.smtpPort);
  newConfig.smtpSecure = newConfig.smtpSecure === true || newConfig.smtpSecure === 'true';
  newConfig.smtpEnabled = newConfig.smtpEnabled === true || newConfig.smtpEnabled === 'true';

  try {
    const currentConfig = db.getConfig();
    
    // If the masked dummy is sent, preserve the existing password
    if (newConfig.smtpPass === '••••••••••••••••') {
      newConfig.smtpPass = currentConfig.smtpPass;
    }

    const updated = db.saveConfig(newConfig);
    const safeConfig = { ...updated };
    if (safeConfig.smtpPass) {
      safeConfig.smtpPass = '••••••••••••••••';
    }
    res.json({ success: true, config: safeConfig });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update configuration.' });
  }
});

// Endpoint: Dispatch a diagnostics SMTP test email
app.post('/api/config/test', async (req, res) => {
  const { config, targetEmail } = req.body;

  if (!targetEmail || targetEmail.trim() === '') {
    return res.status(400).json({ error: 'Test recipient email address is required.' });
  }

  // Preserve existing password if dummy mask is provided
  const currentConfig = db.getConfig();
  if (config.smtpPass === '••••••••••••••••') {
    config.smtpPass = currentConfig.smtpPass;
  }

  const { sendTestEmail } = require('./mail-service');

  try {
    const previewUrl = await sendTestEmail(config, targetEmail.trim());
    res.json({ 
      success: true, 
      message: 'Diagnostics test email successfully dispatched!',
      etherealPreviewUrl: previewUrl
    });
  } catch (err) {
    console.error('SMTP diagnostics test email failure:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch test email.' });
  }
});

// Endpoint: Auto-generate Ethereal Mail Testing Credentials
app.post('/api/config/auto-generate', (req, res) => {
  const nodemailer = require('nodemailer');
  
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Failed to create Ethereal test account:', err);
      return res.status(500).json({ error: 'Failed to generate test credentials.' });
    }

    const testConfig = {
      smtpEnabled: true,
      smtpHost: account.smtp.host,
      smtpPort: account.smtp.port,
      smtpSecure: account.smtp.secure,
      smtpUser: account.user,
      smtpPass: account.pass,
      senderName: 'Aether Academy Registrar',
      senderEmail: account.user
    };

    try {
      db.saveConfig(testConfig);
      // Mask password for returning
      const safeConfig = { ...testConfig };
      safeConfig.smtpPass = '••••••••••••••••';
      res.json({ success: true, config: safeConfig });
    } catch (dbErr) {
      res.status(500).json({ error: 'Failed to save auto-generated config.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`[AETHER SERVER] Active and listening on port ${PORT}`);
});
