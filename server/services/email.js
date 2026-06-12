import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const EMAIL_LOG_FILE = path.join(DATA_DIR, 'sent_emails.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read sent emails log
function readSentEmails() {
  if (!fs.existsSync(EMAIL_LOG_FILE)) {
    fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(EMAIL_LOG_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading sent emails file:", err);
    return [];
  }
}

// Helper to write sent emails log
function writeSentEmails(emails) {
  try {
    fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(emails, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing sent emails file:", err);
    return false;
  }
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.resend.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER || 'resend';
    const pass = process.env.SMTP_PASS || 're_N31LvYPg_HQpnmirsYo2EFPxPAzgugFXe';

    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }
  return transporter;
}

/**
 * Sends a transactional email by logging it in the console, writing to sent_emails.json, and sending via SMTP.
 */
export function sendTransactionalEmail(to, subject, templateName, templateData) {
  const emailId = `email_${crypto.randomUUID()}`;
  const sentAt = new Date().toISOString();

  // Create human-readable body from templateName and data
  let body;
  if (templateName === 'welcome') {
    body = `Hi ${templateData.displayName},\n\nWelcome to EduBridge Africa! Your account as a ${templateData.role} has been successfully registered. Please verify your email using this link: http://localhost:5173/verify-email?token=${crypto.randomBytes(16).toString('hex')}\n\nBest regards,\nThe EduBridge Support Team`;
  } else if (templateName === 'booking_secured') {
    body = `Hello Parent,\n\nYour session with ${templateData.teacherName} has been booked. A payment of ${templateData.formattedCost} has been safely locked in the EduBridge Timed Escrow Engine for the slot: ${templateData.slot.day} at ${templateData.slot.time}.\n\nEscrow details: https://localhost:5173/dashboard/billing\n\nThanks,\nEduBridge Billing`;
  } else if (templateName === 'assignment_graded') {
    body = `Hi Parent,\n\nAn assignment score card has been posted for ${templateData.studentName}.\n\nAssignment: "${templateData.title}"\nGrade: ${templateData.score}/100\nFeedback: "${templateData.feedback}"\n\nCheck detailed grades: http://localhost:5173/dashboard/progress`;
  } else {
    body = `Subject: ${subject}\nData: ${JSON.stringify(templateData)}`;
  }

  const emailRecord = {
    id: emailId,
    to,
    subject,
    template: templateName,
    body,
    data: templateData,
    sentAt,
    status: 'pending'
  };

  // 1. Write to local sent_emails.json log
  const sentEmails = readSentEmails();
  sentEmails.push(emailRecord);
  writeSentEmails(sentEmails);

  // 2. Print beautiful ASCII card to terminal for local auditing
  console.log(`
┌────────────────────────────────────────────────────────────┐
│                  EDUBRIDGE TRANS-EMAIL LOG                 │
├────────────────────────────────────────────────────────────┤
│ ID:      ${emailId.substring(0, 32)}...
│ TO:      ${to}
│ SUBJECT: ${subject}
│ SENT AT: ${sentAt}
├────────────────────────────────────────────────────────────┤
${body.split('\n').map(line => `│ ${line.padEnd(58).substring(0, 58)}│`).join('\n')}
└────────────────────────────────────────────────────────────┘
  `);

  // 3. Send email via SMTP asynchronously
  const from = process.env.SMTP_FROM || 'EduBridge <onboarding@resend.dev>';
  const client = getTransporter();

  client.sendMail({
    from,
    to,
    subject,
    text: body
  })
  .then(info => {
    console.log(`[SMTP] Email successfully sent to ${to} (Message ID: ${info.messageId})`);
    const currentEmails = readSentEmails();
    const idx = currentEmails.findIndex(e => e.id === emailId);
    if (idx !== -1) {
      currentEmails[idx].status = 'sent';
      currentEmails[idx].messageId = info.messageId;
      writeSentEmails(currentEmails);
    }
  })
  .catch(err => {
    console.error(`[SMTP] Failed to send email to ${to}:`, err);
    const currentEmails = readSentEmails();
    const idx = currentEmails.findIndex(e => e.id === emailId);
    if (idx !== -1) {
      currentEmails[idx].status = 'failed';
      currentEmails[idx].error = err.message;
      writeSentEmails(currentEmails);
    }
  });

  return emailRecord;
}
