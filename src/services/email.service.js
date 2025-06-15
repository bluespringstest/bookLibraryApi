import nodemailer from 'nodemailer';
import config from '../config/config.js';
import { getEmailContent } from '../utils/notificationTemplates.js';
import { Notification } from '../models/index.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      const isVerified = await this.transporter.verify();
      if (isVerified) {
        logger.info('SMTP connection verified successfully');
      }
      return isVerified;
    } catch (error) {
      logger.error('SMTP connection error:', error);
      throw new Error('Failed to connect to SMTP server');
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail({ to, subject, html }) {
    try {
      if (!to || !subject || !html) {
        throw new Error('Missing required email fields');
      }

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject,
        html,
      };

      // In development, log the email instead of sending it
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email would be sent:', {
          to,
          subject,
          preview: html.substring(0, 100) + '...',
        });
        return { message: 'Email logged (development mode)', preview: html.substring(0, 100) + '...' };
      }

      // In production, send the actual email
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent:', info.messageId);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send a notification email
   * @param {Object} notification - Notification object
   * @param {Object} user - User object
   * @param {Object} [book] - Book object (if applicable)
   * @returns {Promise<Object>} Email send result
   */
  async sendNotificationEmail(notification, user, book = null) {
    try {
      if (!user.email) {
        throw new Error('User email is required');
      }

      // Get email content from template
      const { subject, html } = getEmailContent(notification, user, book);

      // Send the email
      const result = await this.sendEmail({
        to: user.email,
        subject,
        html,
      });

      // Update notification to mark email as sent
      await notification.update({ emailSent: true });

      return result;
    } catch (error) {
      logger.error('Error sending notification email:', error);
      throw error;
    }
  }

  /**
   * Send a test email
   * @param {string} to - Recipient email address
   * @returns {Promise<Object>} Email send result
   */
  async sendTestEmail(to) {
    const subject = 'Test Email from Library Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email from the Library Management System.</p>
        <p>If you're seeing this, email service is working correctly!</p>
        <p>Current time: ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated test message. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;
