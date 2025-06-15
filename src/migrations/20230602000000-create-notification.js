'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'book_due_soon',
          'book_overdue',
          'book_available',
          'reservation_ready',
          'account_activity',
          'system_announcement'
        ),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional data related to the notification (e.g., bookId, dueDate)',
      },
      emailSent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the notification should be sent (for scheduled notifications)',
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the notification expires and can be auto-deleted',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('Notifications', ['userId', 'isRead']);
    await queryInterface.addIndex('Notifications', ['type', 'scheduledAt']);
    await queryInterface.addIndex('Notifications', ['expiresAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Notifications');
  },
};
