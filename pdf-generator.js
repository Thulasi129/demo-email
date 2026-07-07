const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generates an enrollment confirmation and offer letter PDF.
 * @param {Object} enrollment The enrollment details from the database.
 * @returns {Promise<Buffer>} The PDF document binary buffer.
 */
async function generateOfferLetterPdf(enrollment) {
  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();

  // Add a blank page to the document (A4 size: 595.28 x 841.89 points)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Embed standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Color Palette
  const primaryColor = rgb(0.118, 0.227, 0.541); // Cobalt Blue (#1e3a8a)
  const secondaryColor = rgb(0.18, 0.24, 0.35); // Slate Navy
  const textColor = rgb(0.2, 0.2, 0.2); // Charcoal
  const lightBgColor = rgb(0.96, 0.97, 0.98); // Light grey-blue tint
  const accentColor = rgb(0.047, 0.647, 0.392); // Success Green (#0c9d64)

  // 1. Draw elegant outer double-border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: primaryColor,
    borderWidth: 1.5,
  });

  page.drawRectangle({
    x: 25,
    y: 25,
    width: width - 50,
    height: height - 50,
    borderColor: primaryColor,
    borderWidth: 0.5,
  });

  // 2. Decorative Top Banner
  page.drawRectangle({
    x: 25,
    y: height - 70,
    width: width - 50,
    height: 45,
    color: primaryColor,
  });

  // Logo / Institution Text
  page.drawText('AETHER ACADEMY OF TECHNOLOGY', {
    x: 40,
    y: height - 47,
    size: 18,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Online Course & Certification Platform', {
    x: 40,
    y: height - 60,
    size: 9,
    font: fontHelveticaOblique,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Institution Address Block (Right side of banner)
  page.drawText('100 Innovation Way, Tech District', {
    x: width - 210,
    y: height - 40,
    size: 8,
    font: fontHelvetica,
    color: rgb(1, 1, 1),
  });
  page.drawText('Email: registrar@aetheracademy.org', {
    x: width - 210,
    y: height - 50,
    size: 8,
    font: fontHelvetica,
    color: rgb(1, 1, 1),
  });
  page.drawText('Web: www.aetheracademy.org', {
    x: width - 210,
    y: height - 60,
    size: 8,
    font: fontHelvetica,
    color: rgb(1, 1, 1),
  });

  // 3. Document Title
  const titleY = height - 125;
  page.drawText('OFFER OF ADMISSION & ENROLLMENT CONFIRMATION', {
    x: 40,
    y: titleY,
    size: 14,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  // Thin separator line
  page.drawLine({
    start: { x: 40, y: titleY - 10 },
    end: { x: width - 40, y: titleY - 10 },
    color: primaryColor,
    thickness: 1,
  });

  // 4. Enrollment Info Table Box
  const tableY = titleY - 95;
  page.drawRectangle({
    x: 40,
    y: tableY - 10,
    width: width - 80,
    height: 75,
    color: lightBgColor,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const formattedDate = new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Column 1 Info
  page.drawText('Enrollment ID:', { x: 55, y: tableY + 45, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText(enrollment.id, { x: 140, y: tableY + 45, size: 9, font: fontHelvetica, color: textColor });

  page.drawText('Student Name:', { x: 55, y: tableY + 25, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText(enrollment.name, { x: 140, y: tableY + 25, size: 9, font: fontHelvetica, color: textColor });

  page.drawText('Payment Status:', { x: 55, y: tableY + 5, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText(enrollment.paymentStatus.toUpperCase(), { x: 140, y: tableY + 5, size: 9, font: fontHelveticaBold, color: accentColor });

  // Column 2 Info
  page.drawText('Selected Program:', { x: 300, y: tableY + 45, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText(enrollment.courseName, { x: 400, y: tableY + 45, size: 9, font: fontHelvetica, color: textColor });

  page.drawText('Enrollment Date:', { x: 300, y: tableY + 25, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText(formattedDate, { x: 400, y: tableY + 25, size: 9, font: fontHelvetica, color: textColor });

  page.drawText('Platform Domain:', { x: 300, y: tableY + 5, size: 9, font: fontHelveticaBold, color: secondaryColor });
  page.drawText('Aether Academy Portal', { x: 400, y: tableY + 5, size: 9, font: fontHelvetica, color: textColor });

  // 5. Letter Content
  const bodyY = tableY - 45;
  const paragraph1 = `Dear ${enrollment.name},`;
  const paragraph2 = `On behalf of Aether Academy of Technology, it is my absolute privilege to offer you admission to the "${enrollment.courseName}" professional certification program. We are thrilled to welcome you to our learning community.`;
  const paragraph3 = `This letter serves as formal confirmation that your enrollment registration is complete, and your payment was successfully processed under Enrollment ID ${enrollment.id} on ${formattedDate}. You are now officially enrolled as an active student in our system.`;
  const paragraph4 = `As an enrolled student, you will receive full access to our online curriculum, hands-on lab environments, private communication channels with mentors, and industry-grade testing materials. Please keep your Enrollment ID safe as it is required for all academic submissions, support inquiries, and final certification issues.`;
  const paragraph5 = `Your course access and onboarding guide will be sent to your registered email address (${enrollment.email}) in a separate welcome transmission. We are dedicated to providing you with premium resources and guiding you on your educational journey.`;

  // Draw paragraph 1
  page.drawText(paragraph1, { x: 40, y: bodyY, size: 10.5, font: fontHelveticaBold, color: textColor });

  let currentY = bodyY - 25;

  // Simple helper to draw text with automatic wrapping
  function drawWrappedText(text, yPosition, font, size, leading = 15) {
    const words = text.split(' ');
    let line = '';
    const maxWidth = width - 80;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && n > 0) {
        page.drawText(line, { x: 40, y: yPosition, size: size, font: font, color: textColor });
        line = words[n] + ' ';
        yPosition -= leading;
      } else {
        line = testLine;
      }
    }
    page.drawText(line, { x: 40, y: yPosition, size: size, font: font, color: textColor });
    return yPosition - leading;
  }

  currentY = drawWrappedText(paragraph2, currentY, fontHelvetica, 10.5, 15) - 10;
  currentY = drawWrappedText(paragraph3, currentY, fontHelvetica, 10.5, 15) - 10;
  currentY = drawWrappedText(paragraph4, currentY, fontHelvetica, 10.5, 15) - 10;
  currentY = drawWrappedText(paragraph5, currentY, fontHelvetica, 10.5, 15) - 10;

  // 6. Signature Block
  const signatureY = currentY - 30;
  page.drawText('Sincerely,', { x: 40, y: signatureY, size: 10.5, font: fontHelvetica, color: textColor });

  // Styled Cursive Script Signature using TimesRomanItalic
  page.drawText('S. Jenkins', { x: 45, y: signatureY - 30, size: 18, font: fontTimesRomanItalic, color: primaryColor });

  // Signature line
  page.drawLine({
    start: { x: 40, y: signatureY - 35 },
    end: { x: 180, y: signatureY - 35 },
    color: rgb(0.5, 0.5, 0.5),
    thickness: 0.5,
  });

  page.drawText('Sarah Jenkins', { x: 40, y: signatureY - 48, size: 9.5, font: fontHelveticaBold, color: textColor });
  page.drawText('Registrar, Aether Academy', { x: 40, y: signatureY - 58, size: 9, font: fontHelvetica, color: secondaryColor });

  // 7. Footer metadata disclaimer
  page.drawText('This enrollment document is electronically generated and digitally signed. Verification and security credentials can', {
    x: 40,
    y: 45,
    size: 7.5,
    font: fontHelveticaOblique,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText('be audited online at verify.aetheracademy.org. Powered by Aether Academy Automation Services.', {
    x: 40,
    y: 35,
    size: 7.5,
    font: fontHelveticaOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serialize the PDFDocument to a buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = {
  generateOfferLetterPdf
};
