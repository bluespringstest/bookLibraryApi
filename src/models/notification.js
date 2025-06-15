import { Model, DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      // A notification belongs to a reader (previously User)
      Notification.belongsTo(models.Reader, {
        foreignKey: 'userId',
        as: 'user',
      });
    }

    /**
     * Mark notification as read
     */
    async markAsRead() {
      if (!this.isRead) {
        this.isRead = true;
        await this.save();
      }
      return this;
    }

    /**
     * Mark notification as sent (for email notifications)
     */
    async markAsSent() {
      if (!this.emailSent) {
        this.emailSent = true;
        await this.save();
      }
      return this;
    }

    /**
     * Get notifications for a reader with pagination
     * @param {string} userId - The ID of the reader (previously user)
     * @param {Object} options - Query options (page, limit, unreadOnly)
     * @returns {Promise<Object>} Paginated notifications
     */
    static async getForUser(userId, { page = 1, limit = 10, unreadOnly = false } = {}) {
      const offset = (page - 1) * limit;
      const where = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });

      return {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        items: rows,
      };
    }

    /**
     * Create a new notification
     * @param {Object} data - Notification data
     * @param {string} data.userId - The ID of the reader to notify (previously user)
     * @param {string} data.type - Type of notification
     * @param {string} data.title - Notification title
     * @param {string} data.message - Notification message
     * @param {Object} [data.metadata] - Additional metadata
     * @param {Date} [data.scheduledAt] - When to send the notification
     * @param {Date} [data.expiresAt] - When the notification expires
     * @returns {Promise<Notification>} The created notification
     */
    static async createNotification({
      userId,
      type,
      title,
      message,
      metadata = null,
      scheduledAt = null,
      expiresAt = null,
    }) {
      return Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        scheduledAt,
        expiresAt,
      });
    }

    /**
     * Get due notifications (scheduled notifications that are ready to be sent)
     * @param {number} limit - Maximum number of notifications to return
     * @returns {Promise<Array<Notification>>} Array of due notifications
     */
    static async getDueNotifications(limit = 100) {
      return Notification.findAll({
        where: {
          scheduledAt: {
            [sequelize.Sequelize.Op.lte]: new Date(),
            [sequelize.Sequelize.Op.ne]: null,
          },
          emailSent: false,
        },
        limit: parseInt(limit, 10),
        order: [['scheduledAt', 'ASC']],
      });
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      emailSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'Notifications',
      paranoid: true,
      timestamps: true,
      hooks: {
        beforeCreate: notification => {
          // Set default expiration if not provided (30 days from now)
          if (!notification.expiresAt) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            notification.expiresAt = expiresAt;
          }
        },
      },
      scopes: {
        unread: {
          where: {
            isRead: false,
          },
        },
        due: {
          where: {
            scheduledAt: {
              [sequelize.Sequelize.Op.lte]: new Date(),
              [sequelize.Sequelize.Op.ne]: null,
            },
            emailSent: false,
          },
          order: [['scheduledAt', 'ASC']],
        },
      },
    }
  );

  return Notification;
};
