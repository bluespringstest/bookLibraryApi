const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { Notification } = require('../../src/models');
const { userOne, setupDatabase } = require('../../test/fixtures/db');
const { getAuthToken } = require('../../test/helpers/test-utils');

describe('Notification API', () => {
  beforeEach(setupDatabase);

  describe('GET /api/v1/notifications', () => {
    it('should fetch user notifications', async () => {
    const token = await getAuthToken(userOne);
    
    // Create test notifications
    const notifications = [
      {
        userId: userOne.id,
        type: 'account_activity',
        title: 'Welcome to Library',
        message: 'Your account has been created successfully',
        isRead: false,
      },
      {
        userId: userOne.id,
        type: 'system_announcement',
        title: 'System Maintenance',
        message: 'Scheduled maintenance this weekend',
        isRead: true,
      },
    ];

    await Notification.bulkCreate(notifications);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('items');
      expect(res.body.data.items).to.be.an('array').with.lengthOf(2);
      expect(res.body.data.items[0]).to.have.property('title', 'Welcome to Library');
    });

    it('should filter unread notifications', async () => {
      const token = await getAuthToken(userOne);
      
      const res = await request(app)
        .get('/api/v1/notifications?unread=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should only return unread notifications
      const allUnread = res.body.data.items.every(notif => !notif.isRead);
      expect(allUnread).to.be.true;
    });
  });

  describe('GET /api/v1/notifications/stats', () => {
    it('should return notification statistics', async () => {
      const token = await getAuthToken(userOne);
      
      // Create test notifications
      const notifications = [
        {
          userId: userOne.id,
          type: 'account_activity',
          title: 'Test 1',
          message: 'Message 1',
          isRead: false,
        },
        {
          userId: userOne.id,
          type: 'account_activity',
          title: 'Test 2',
          message: 'Message 2',
          isRead: false,
        },
        {
          userId: userOne.id,
          type: 'system_announcement',
          title: 'Test 3',
          message: 'Message 3',
          isRead: true,
        },
      ];

      await Notification.bulkCreate(notifications);

      const res = await request(app)
        .get('/api/v1/notifications/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.total).to.equal(3);
      expect(res.body.data.unread).to.equal(2);
      expect(res.body.data.recent).to.be.a('number');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const token = await getAuthToken(userOne);
      
      // Create a test notification
      const notification = await Notification.create({
        userId: userOne.id,
        type: 'account_activity',
        title: 'Test Notification',
        message: 'This is a test notification',
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.notification.isRead).to.be.true;
      
      // Verify in database
      const updatedNotification = await Notification.findByPk(notification.id);
      expect(updatedNotification.isRead).to.be.true;
    });

    it('should return 404 for non-existent notification', async () => {
      const token = await getAuthToken(userOne);
      
      await request(app)
        .patch('/api/v1/notifications/123e4567-e89b-12d3-a456-426614174000/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const token = await getAuthToken(userOne);
      
      // Create test notifications
      await Notification.bulkCreate([
        { userId: userOne.id, type: 'account_activity', title: 'Test 1', message: 'Message 1', isRead: false },
        { userId: userOne.id, type: 'account_activity', title: 'Test 2', message: 'Message 2', isRead: false },
        { userId: userOne.id, type: 'system_announcement', title: 'Test 3', message: 'Message 3', isRead: false },
      ]);

      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.updatedCount).to.equal(3);
      
      // Verify in database
      const unreadCount = await Notification.count({
        where: { userId: userOne.id, isRead: false }
      });
      expect(unreadCount).to.equal(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete a notification', async () => {
      const token = await getAuthToken(userOne);
      
      // Create a test notification
      const notification = await Notification.create({
        userId: userOne.id,
        type: 'account_activity',
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify in database
      const deletedNotification = await Notification.findByPk(notification.id);
      expect(deletedNotification).to.be.null;
    });

    it('should not allow deleting other users notifications', async () => {
      const token = await getAuthToken(userOne);
      
      // Create a test notification for userTwo
      const notification = await Notification.create({
        userId: userTwo.id,
        type: 'account_activity',
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('Admin endpoints', () => {
    let adminToken;
    
    beforeEach(async () => {
      adminToken = await getAuthToken(admin);
    });

    describe('POST /api/v1/notifications/process-scheduled', () => {
      it('should process scheduled notifications (admin only)', async () => {
        // Create a scheduled notification
        await Notification.create({
          userId: userOne.id,
          type: 'system_announcement',
          title: 'Scheduled Announcement',
          message: 'This is a scheduled announcement',
          scheduledAt: new Date(Date.now() - 1000), // In the past
          emailSent: false,
        });

        const res = await request(app)
          .post('/api/v1/notifications/process-scheduled')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.processed).to.be.at.least(1);
        
        // Verify the notification was processed
        const notification = await Notification.findOne({
          where: { title: 'Scheduled Announcement' }
        });
        expect(notification.emailSent).to.be.true;
      });
    });

    describe('POST /api/v1/notifications/cleanup-expired', () => {
      it('should clean up expired notifications (admin only)', async () => {
        // Create an expired notification
        await Notification.create({
          userId: userOne.id,
          type: 'system_announcement',
          title: 'Expired Notification',
          message: 'This notification has expired',
          expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31), // 31 days ago
        });

        const res = await request(app)
          .post('/api/v1/notifications/cleanup-expired')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ daysToKeep: 30 }) // Keep only last 30 days
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.deletedCount).to.be.at.least(1);
        
        // Verify the notification was deleted
        const notification = await Notification.findOne({
          where: { title: 'Expired Notification' }
        });
        expect(notification).to.be.null;
      });
    });
  });
});
