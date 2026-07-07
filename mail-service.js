const db = require('./database');
const nodemailer = require('nodemailer');

/**
 * Dispatches an enrollment email, using SMTP if enabled, otherwise falling back purely to the sandbox.
 * @param {Object} enrollment The enrollment details.
 * @param {Buffer} pdfBuffer The generated PDF file buffer.
 * @returns {Promise<Object>} The email record logged in the sandbox.
 */
async function sendEnrollmentEmail(enrollment, pdfBuffer) {
  const attachmentBase64 = pdfBuffer.toString('base64');
  const attachmentName = `Offer_Letter_${enrollment.id}.pdf`;

  const emailRecord = {
    id: `msg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    from: 'registrar@aetheracademy.org',
    to: enrollment.email,
    subject: 'Course Enrollment Confirmation & Offer Letter',
    sentAt: new Date().toISOString(),
    body: `Dear ${enrollment.name},

Thank you for choosing Aether Academy of Technology for your professional advancement.

We are delighted to confirm that your enrollment for "${enrollment.courseName}" has been successfully completed, and your payment was successfully processed.

Here is a summary of your enrollment parameters:
--------------------------------------------------
Student Name:     ${enrollment.name}
Selected Program: ${enrollment.courseName}
Enrollment ID:    ${enrollment.id}
Date of Registry: ${new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
Payment Status:   ${enrollment.paymentStatus.toUpperCase()}
--------------------------------------------------

We have attached your official "Offer of Admission & Enrollment Confirmation" PDF to this email. Please download and retain a copy for your records, as it contains important academic credentials and policy terms.

In a separate email, our student success team will transmit your login credentials and a link to the student dashboard so you can access your learning materials.

If you have any questions or require immediate support, please reply to this email or contact support@aetheracademy.org.

Welcome aboard! We are excited to support you on your learning and certification path.

Warm regards,

Office of the Registrar
Aether Academy of Technology
100 Innovation Way, Tech District
www.aetheracademy.org`,
    attachment: {
      name: attachmentName,
      data: attachmentBase64,
      mimeType: 'application/pdf'
    }
  };

  // Attempt real email dispatch if SMTP settings are active
  const config = db.getConfig();
  if (config.smtpEnabled && config.smtpHost && config.smtpUser) {
    try {
      const port = Number(config.smtpPort) || 587;
      const secure = port === 465; // Force direct SSL/TLS for 465, STARTTLS for 587/others
      
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: port,
        secure: secure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"${config.senderName || 'Aether Academy Admissions'}" <${config.senderEmail || config.smtpUser}>`,
        to: enrollment.email,
        subject: emailRecord.subject,
        text: emailRecord.body,
        attachments: [
          {
            filename: attachmentName,
            content: pdfBuffer
          }
        ]
      });
      console.log(`[SMTP Live Dispatch] Sent offer letter PDF to ${enrollment.email} via ${config.smtpHost}`);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        emailRecord.etherealPreviewUrl = previewUrl;
        console.log(`[Ethereal Preview URL] ${previewUrl}`);
      }

      // Update enrollment dispatch status in database
      db.updateEnrollment(enrollment.id, {
        offerLetterStatus: 'Sent'
      });
    } catch (smtpErr) {
      console.error(`[SMTP Live Dispatch FAIL] to ${enrollment.email}:`, smtpErr);
      
      // Update enrollment status to reflect the email delivery error but save PDF status
      db.updateEnrollment(enrollment.id, {
        offerLetterStatus: 'Sandbox Only (SMTP Failed)'
      });
    }
  } else {
    // Standard simulated sandbox delivery status update
    db.updateEnrollment(enrollment.id, {
      offerLetterStatus: 'Sent'
    });
  }

  // Add the email record to our local JSON database for the sandbox view
  db.addEmail(emailRecord);

  return emailRecord;
}

/**
 * Transmits a test connection email to verify SMTP login credentials.
 * @param {Object} config The SMTP configuration parameters.
 * @param {string} targetEmail The recipient email address.
 * @returns {Promise<string|boolean>} Ethereal preview link if it exists, otherwise true.
 */
async function sendTestEmail(config, targetEmail) {
  const port = Number(config.smtpPort) || 587;
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: port,
    secure: secure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  const mailOptions = {
    from: `"${config.senderName || 'Aether Academy Diagnostics'}" <${config.senderEmail || config.smtpUser}>`,
    to: targetEmail,
    subject: 'Aether Academy SMTP Connection Test',
    text: `Hello!

This diagnostics email confirms that your Aether Academy Online Course & Onboarding prototype platform has successfully established an SMTP handshake with your mail server.

Real email sending is now fully active! Student registrations will automatically generate and attach enrollment offer letter PDFs to their respective registered addresses.

Sincerely,
System Diagnostics Team
Aether Academy of Technology`
  };

  const info = await transporter.sendMail(mailOptions);
  return nodemailer.getTestMessageUrl(info);
}

module.exports = {
  sendEnrollmentEmail,
  sendTestEmail
};
