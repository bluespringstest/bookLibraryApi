console.log('Test file is being executed');

import { expect } from 'chai';
import sinon from 'sinon';
import { Op } from 'sequelize';
import { Notification, Reader } from '../../../src/models/index.js';
import notificationService from '../../../src/services/notification.service.js';
import { userOne } from '../../fixtures/db.js';
import emailService from '../../../src/services/email.service.js';

// Mock the transaction
const mockTransaction = {
  commit: sinon.stub().resolves(),
  rollback: sinon.stub().resolves(),
};

// Simple test to verify test execution
describe('Test Suite', () => {
  it('should run a simple test', () => {
    console.log('Simple test is running');
    expect(true).to.be.true;
  });
});

describe('Notification Service', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Stub the transaction
    sandbox.stub(Notification.sequelize, 'transaction').resolves(mockTransaction);
  });
  
  afterEach(() => {
    sandbox.restore();
  });

  describe('createNotification', () => {
    it('should create a notification and send it immediately', async () => {
      const notificationData = {
        type: 'account_activity',
        user: { id: userOne.id },
        title: 'Test Notification',
        message: 'This is a test notification',
      };
      
      const expectedNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...notificationData,
        userId: notificationData.user.id,
        isRead: false,
        emailSent: true,
      };
      
      // Stub the notification creation
      sandbox.stub(Notification, 'create').resolves(expectedNotification);
      
      // Stub the sendNotification method
      const sendNotificationStub = sandbox.stub(notificationService, 'sendNotification').resolves({
        success: true,
        message: 'Notification sent successfully',
      });
      
      const result = await notificationService.createNotification(notificationData);
      
      expect(Notification.create.calledOnce).to.be.true;
      expect(sendNotificationStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedNotification);
    });
    
    it('should schedule a notification for future delivery', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const notificationData = {
        type: 'account_activity',
        user: { id: userOne.id },
        title: 'Scheduled Notification',
        message: 'This is a scheduled notification',
        scheduledAt: futureDate,
      };
      
      const expectedNotification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...notificationData,
        userId: notificationData.user.id,
        isRead: false,
        emailSent: false,
        scheduledAt: futureDate,
      };
      
      // Stub the notification creation
      sandbox.stub(Notification, 'create').resolves(expectedNotification);
      
      const result = await notificationService.createNotification(notificationData);
      
      expect(Notification.create.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedNotification);
    });
  });

  describe('sendNotification', () => {
    it('should send an email for an unsent notification', async () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: userOne.id,
        type: 'account_activity',
        title: 'Test Notification',
        message: 'This is a test notification',
        isRead: false,
        emailSent: false,
        update: sandbox.stub().resolves({
          ...notification,
          emailSent: true,
        }),
      };
      
      const user = {
        id: userOne.id,
        email: 'test@example.com',
      };
      
      // Stub the email service
      const emailService = require('../../../src/services/email.service');
      const sendEmailStub = sandbox.stub(emailService, 'sendNotificationEmail').resolves({
        messageId: 'test-message-id',
      });
      
      const result = await notificationService.sendNotification(notification, user);
      
      expect(sendEmailStub.calledOnce).to.be.true;
      expect(notification.update.calledOnce).to.be.true;
      expect(result).to.deep.equal({
        success: true,
        message: 'Notification sent successfully',
      });
    });
    
    it('should skip sending if already sent', async () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        emailSent: true,
      };
      
      const result = await notificationService.sendNotification(notification, {});
      
      expect(result).to.deep.equal({
        success: false,
        message: 'Notification already sent',
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should fetch user notifications with pagination', async () => {
      console.log('Running test: should fetch user notifications with pagination');
      const mockNotifications = [
        { id: '1', userId: userOne.id, title: 'Test 1', isRead: false },
        { id: '2', userId: userOne.id, title: 'Test 2', isRead: true },
      ];
      
      const expectedResult = {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        items: mockNotifications,
      };
      
      // Stub the findAndCountAll method
      sandbox.stub(Notification, 'findAndCountAll').resolves({
        count: mockNotifications.length,
        rows: mockNotifications,
      });
      
      const result = await notificationService.getUserNotifications(userOne.id, {
        page: 1,
        limit: 10,
      });
      
      expect(Notification.findAndCountAll.calledOnce).to.be.true;
      expect(result).to.deep.equal(expectedResult);
    });
    
    it('should filter unread notifications', async () => {
      const mockNotifications = [
        { id: '1', userId: userOne.id, title: 'Test 1', isRead: false },
      ];
      
      // Stub the findAndCountAll method
      sandbox.stub(Notification, 'findAndCountAll').resolves({
        count: mockNotifications.length,
        rows: mockNotifications,
      });
      
      await notificationService.getUserNotifications(userOne.id, {
        page: 1,
        limit: 10,
        unreadOnly: true,
      });
      
      const queryOptions = Notification.findAndCountAll.getCall(0).args[0];
      expect(queryOptions.where.isRead).to.be.false;
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = userOne.id;
      
      const mockNotification = {
        id: notificationId,
        userId,
        isRead: false,
        markAsRead: sandbox.stub().resolves({
          id: notificationId,
          userId,
          isRead: true,
        }),
      };
      
      // Stub the findOne method
      sandbox.stub(Notification, 'findOne').resolves(mockNotification);
      
      const result = await notificationService.markAsRead(notificationId, userId);
      
      expect(Notification.findOne.calledOnce).to.be.true;
      expect(mockNotification.markAsRead.calledOnce).to.be.true;
      expect(result.isRead).to.be.true;
    });
    
    it('should throw error if notification not found', async () => {
      sandbox.stub(Notification, 'findOne').resolves(null);
      
      await expect(
        notificationService.markAsRead('non-existent-id', userOne.id)
      ).to.be.rejectedWith('Notification not found or access denied');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const userId = userOne.id;
      const updateStub = sandbox.stub(Notification, 'update').resolves([2]); // 2 rows updated
      
      const result = await notificationService.markAllAsRead(userId);
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.deep.equal({ isRead: true });
      expect(updateStub.firstCall.args[1].where).to.deep.equal({
        userId,
        isRead: false,
      });
      expect(result).to.equal(2);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = userOne.id;
      
      const destroyStub = sandbox.stub(Notification, 'destroy').resolves(1);
      
      const result = await notificationService.deleteNotification(notificationId, userId);
      
      expect(destroyStub.calledOnce).to.be.true;
      expect(destroyStub.firstCall.args[0].where).to.deep.equal({
        id: notificationId,
        userId,
      });
      expect(result).to.be.true;
    });
    
    it('should throw error if notification not found', async () => {
      sandbox.stub(Notification, 'destroy').resolves(0);
      
      await expect(
        notificationService.deleteNotification('non-existent-id', userOne.id)
      ).to.be.rejectedWith('Notification not found or access denied');
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process scheduled notifications', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: userOne.id,
          type: 'account_activity',
          title: 'Scheduled 1',
          isRead: false,
          emailSent: false,
          update: sandbox.stub().resolves(),
        },
        {
          id: '2',
          userId: userOne.id,
          type: 'account_activity',
          title: 'Scheduled 2',
          isRead: false,
          emailSent: false,
          update: sandbox.stub().resolves(),
        },
      ];
      
      // Stub the notification service methods
      sandbox.stub(Notification, 'findAll').resolves(mockNotifications);
      sandbox.stub(User, 'findByPk').resolves({ id: userOne.id, email: 'test@example.com' });
      sandbox.stub(notificationService, 'sendNotification').resolves({ success: true });
      
      const result = await notificationService.processScheduledNotifications(10);
      
      expect(Notification.findAll.calledOnce).to.be.true;
      expect(notificationService.sendNotification.callCount).to.equal(2);
      expect(result).to.have.lengthOf(2);
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should clean up expired notifications', async () => {
      const destroyStub = sandbox.stub(Notification, 'destroy').resolves(5);
      
      const result = await notificationService.cleanupExpiredNotifications(30);
      
      expect(destroyStub.calledOnce).to.be.true;
      expect(destroyStub.firstCall.args[0].where.expiresAt[Op.lt]).to.be.a('date');
      expect(result).to.equal(5);
    });
  });

  describe('scheduleBookDueNotification', () => {
    it('should schedule a book due soon notification', async () => {
      const borrowing = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: userOne.id,
        bookId: bookOne.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      };
      
      const createStub = sandbox.stub(notificationService, 'createNotification').resolves({
        id: 'notification-id',
        type: 'book_due_soon',
      });
      
      await notificationService.scheduleBookDueNotification(borrowing, 3);
      
      expect(createStub.calledOnce).to.be.true;
      const notificationData = createStub.firstCall.args[0];
      expect(notificationData.type).to.equal('book_due_soon');
      expect(notificationData.user).to.equal(borrowing.userId);
      expect(notificationData.book).to.equal(borrowing.bookId);
      expect(notificationData.metadata.dueDate).to.exist;
    });
  });

  describe('scheduleBookOverdueNotification', () => {
    it('should schedule a book overdue notification', async () => {
      const borrowing = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: userOne.id,
        bookId: bookOne.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      };
      
      const createStub = sandbox.stub(notificationService, 'createNotification').resolves({
        id: 'notification-id',
        type: 'book_overdue',
      });
      
      await notificationService.scheduleBookOverdueNotification(borrowing);
      
      expect(createStub.calledOnce).to.be.true;
      const notificationData = createStub.firstCall.args[0];
      expect(notificationData.type).to.equal('book_overdue');
      expect(notificationData.user).to.equal(borrowing.userId);
      expect(notificationData.book).to.equal(borrowing.bookId);
      expect(notificationData.metadata.daysOverdue).to.be.at.least(1);
    });
  });
});
