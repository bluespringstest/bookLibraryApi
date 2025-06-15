import { Model, DataTypes, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default (sequelize) => {
  class InventoryTransaction extends Model {
    static associate(models) {
      // An inventory transaction is for a specific book
      InventoryTransaction.belongsTo(models.Book, {
        foreignKey: 'bookId',
        as: 'book',
      });

      // An inventory transaction can be created by a user
      InventoryTransaction.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser',
      });
    }

    // Get the current inventory level for a book
    static async getCurrentInventory(bookId) {
      const result = await this.sum('quantity', {
        where: { bookId }
      });
      return result || 0;
    }

    // Check if a book is in stock
    static async isInStock(bookId, quantity = 1) {
      const currentStock = await this.getCurrentInventory(bookId);
      return currentStock >= quantity;
    }

    // Get inventory history for a book
    static async getInventoryHistory(bookId, { startDate, endDate, limit = 100, offset = 0 } = {}) {
      const where = { bookId };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      return this.findAndCountAll({
        where,
        include: [
          {
            model: this.sequelize.models.User,
            as: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    }
  }

  InventoryTransaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Books',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero(value) {
          if (value === 0) {
            throw new Error('Quantity cannot be zero');
          }
        }
      },
    },
    transactionType: {
      type: DataTypes.ENUM('purchase', 'sale', 'return', 'adjustment', 'damaged', 'lost'),
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to the related document (sale, purchase order, etc.)',
    },
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of the reference (sale, purchase, etc.)',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  }, {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'InventoryTransactions',
    timestamps: true,
    hooks: {
      beforeCreate: async (transaction) => {
        // Update the book's inStock count when a transaction is created
        if (transaction.quantity !== 0) {
          const book = await transaction.getBook();
          if (book) {
            await book.increment('inStock', { by: transaction.quantity });
          }
        }
      },
      beforeUpdate: async (transaction) => {
        // If quantity changes, update the book's inStock count
        if (transaction.changed('quantity')) {
          const book = await transaction.getBook();
          if (book) {
            const oldQuantity = transaction.previous('quantity') || 0;
            const quantityDiff = transaction.quantity - oldQuantity;
            await book.increment('inStock', { by: quantityDiff });
          }
        }
      },
      beforeDestroy: async (transaction) => {
        // When a transaction is deleted, reverse its effect on inventory
        const book = await transaction.getBook();
        if (book) {
          await book.decrement('inStock', { by: transaction.quantity });
        }
      },
    },
  });

  return InventoryTransaction;
};
