import config from '../config/config.js';

/**
 * Notification templates for different notification types
 */
const templates = {
  // Book due soon notification (sent 3 days before due date)
  book_due_soon: {
    title: 'Book Due Soon',
    getMessage: (bookTitle, dueDate) => 
      `The book "${bookTitle}" is due on ${dueDate}. Please return it on time to avoid late fees.`,
    getEmailSubject: (bookTitle) => `Reminder: "${bookTitle}" Due Soon`,
    getEmailHtml: (bookTitle, dueDate, userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Book Due Soon: ${bookTitle}</h2>
        <p>Hello ${userName},</p>
        <p>This is a friendly reminder that the book <strong>${bookTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p>Please return it on time to avoid any late fees.</p>
        <p>Thank you for using ${config.app.name}!</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
  
  // Book overdue notification
  book_overdue: {
    title: 'Book Overdue',
    getMessage: (bookTitle, daysOverdue) => 
      `The book "${bookTitle}" is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue. Please return it as soon as possible.`,
    getEmailSubject: (bookTitle) => `Urgent: "${bookTitle}" is Overdue`,
    getEmailHtml: (bookTitle, daysOverdue, userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Book Overdue: ${bookTitle}</h2>
        <p>Hello ${userName},</p>
        <p>This is to inform you that the book <strong>${bookTitle}</strong> is currently <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'}</strong> overdue.</p>
        <p>Please return it as soon as possible to avoid additional fees.</p>
        <p>If you've already returned the book, please ignore this message.</p>
        <p>Thank you for your prompt attention to this matter.</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
  
  // Book available notification (when a reserved book becomes available)
  book_available: {
    title: 'Book Available',
    getMessage: (bookTitle) => 
      `The book "${bookTitle}" you reserved is now available. Please pick it up within 3 days.`,
    getEmailSubject: (bookTitle) => `"${bookTitle}" is Now Available`,
    getEmailHtml: (bookTitle, _, userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Book Available: ${bookTitle}</h2>
        <p>Hello ${userName},</p>
        <p>We're happy to inform you that the book <strong>${bookTitle}</strong> you reserved is now available for pickup!</p>
        <p>Please visit the library within the next 3 days to check it out.</p>
        <p>Thank you for using ${config.app.name}!</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
  
  // Reservation ready notification
  reservation_ready: {
    title: 'Reservation Ready',
    getMessage: (bookTitle) => 
      `Your reservation for "${bookTitle}" is ready for pickup.`,
    getEmailSubject: (bookTitle) => `Your Reservation is Ready: "${bookTitle}"`,
    getEmailHtml: (bookTitle, _, userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reservation Ready: ${bookTitle}</h2>
        <p>Hello ${userName},</p>
        <p>Your reservation for <strong>${bookTitle}</strong> is now ready for pickup at your local library.</p>
        <p>Please bring your library card or ID when you come to check out the book.</p>
        <p>Thank you for using ${config.app.name}!</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
  
  // Account activity notification (e.g., password change, profile update)
  account_activity: {
    title: 'Account Activity',
    getMessage: (activity, timestamp) => 
      `Account activity: ${activity} at ${new Date(timestamp).toLocaleString()}.`,
    getEmailSubject: (activity) => `Account Activity: ${activity}`,
    getEmailHtml: (activity, timestamp, userName) => {
      const formattedTime = new Date(timestamp).toLocaleString();
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Activity Notification</h2>
          <p>Hello ${userName},</p>
          <p>We noticed the following activity on your account:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Activity:</strong> ${activity}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
          </div>
          <p>If you didn't perform this action, please contact our support team immediately.</p>
          <p>Thank you for using ${config.app.name}!</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `;
    },
  },
  
  // System announcement notification
  system_announcement: {
    title: 'System Announcement',
    getMessage: (title) => title,
    getEmailSubject: (title) => `System Announcement: ${title}`,
    getEmailHtml: (title, message, userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>System Announcement: ${title}</h2>
        <p>Hello ${userName},</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${message}
        </div>
        <p>Thank you for using ${config.app.name}!</p>
        <hr>
        <p style="color: #666; font-size: 0.9em;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
};

/**
 * Get a notification template by type
 * @param {string} type - Notification type
 * @returns {Object} Template object
 */
const getTemplate = (type) => {
  if (!templates[type]) {
    throw new Error(`No template found for notification type: ${type}`);
  }
  return templates[type];
};

/**
 * Create a notification object with the appropriate template
 * @param {Object} options - Notification options
 * @param {string} options.type - Notification type
 * @param {Object} options.user - User object
 * @param {Object} [options.book] - Book object (if applicable)
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Object} Notification object
 */
const createNotification = ({
  type,
  user,
  book = null,
  metadata = null,
  scheduledAt = null,
  expiresAt = null,
}) => {
  const template = getTemplate(type);
  let message = '';
  let title = template.title;
  
  // Generate message based on notification type
  switch (type) {
    case 'book_due_soon':
      message = template.getMessage(book.title, metadata.dueDate);
      break;
    case 'book_overdue':
      message = template.getMessage(book.title, metadata.daysOverdue);
      break;
    case 'book_available':
    case 'reservation_ready':
      message = template.getMessage(book.title);
      break;
    case 'account_activity':
      message = template.getMessage(metadata.activity, new Date().toISOString());
      break;
    case 'system_announcement':
      message = template.getMessage(metadata.title);
      title = metadata.title || title;
      break;
    default:
      message = 'You have a new notification.';
  }
  
  // Create notification object
  const notification = {
    userId: user.id,
    type,
    title,
    message,
    isRead: false,
    emailSent: false,
    metadata: {
      ...metadata,
      bookId: book?.id,
    },
    scheduledAt,
    expiresAt,
  };
  
  return notification;
};

/**
 * Get email subject and HTML for a notification
 * @param {Object} notification - Notification object
 * @param {Object} user - User object
 * @param {Object} [book] - Book object (if applicable)
 * @returns {Object} Email subject and HTML
 */
const getEmailContent = (notification, user, book = null) => {
  const template = getTemplate(notification.type);
  let subject = '';
  let html = '';
  
  // Generate email content based on notification type
  switch (notification.type) {
    case 'book_due_soon':
      subject = template.getEmailSubject(book.title);
      html = template.getEmailHtml(
        book.title,
        notification.metadata.dueDate,
        user.firstName
      );
      break;
    case 'book_overdue':
      subject = template.getEmailSubject(book.title);
      html = template.getEmailHtml(
        book.title,
        notification.metadata.daysOverdue,
        user.firstName
      );
      break;
    case 'book_available':
    case 'reservation_ready':
      subject = template.getEmailSubject(book.title);
      html = template.getEmailHtml(book.title, null, user.firstName);
      break;
    case 'account_activity':
      subject = template.getEmailSubject(notification.metadata.activity);
      html = template.getEmailHtml(
        notification.metadata.activity,
        new Date().toISOString(),
        user.firstName
      );
      break;
    case 'system_announcement':
      subject = template.getEmailSubject(notification.metadata.title || 'System Announcement');
      html = template.getEmailHtml(
        notification.metadata.title,
        notification.metadata.message,
        user.firstName
      );
      break;
    default:
      subject = 'Notification from ' + config.app.name;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You have a new notification</h2>
          <p>Hello ${user.firstName},</p>
          <p>${notification.message}</p>
          <p>Thank you for using ${config.app.name}!</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `;
  }
  
  return { subject, html };
};

export {
  getTemplate,
  createNotification,
  getEmailContent,
};
