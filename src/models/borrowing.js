import { Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const BORROWING_STATUS = {
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  LOST: 'lost'
};

export default (sequelize, DataTypes) => {
  class Borrowing extends Model {
    static associate(models) {
      // Define associations here
      Borrowing.belongsTo(models.Book, {
        foreignKey: 'bookId',
        as: 'book',
      });
      
      Borrowing.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }

    // Calculate days overdue
    getDaysOverdue() {
      if (this.status !== 'overdue') return 0;
      const today = new Date();
      const dueDate = new Date(this.dueDate);
      const diffTime = Math.abs(today - dueDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate fine amount
    calculateFine(dailyFineRate = 0.50) {
      if (this.status !== 'overdue') return 0;
      const daysOverdue = this.getDaysOverdue();
      return parseFloat((daysOverdue * dailyFineRate).toFixed(2));
    }

    // Check if book can be renewed
    canRenew(maxRenewals = 1) {
      if (this.status === 'returned') return false;
      if (this.renewalCount >= maxRenewals) return false;
      return true;
    }
  }

  Borrowing.init({
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
    borrowedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('borrowed', 'returned', 'overdue', 'lost'),
      defaultValue: 'borrowed',
      allowNull: false,
    },
    renewalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    fineAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    finePaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Borrowing',
    tableName: 'Borrowings',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['bookId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['dueDate'],
      },
    ],
  });

  // Hooks
  Borrowing.beforeSave(async (borrowing) => {
    // Update status to overdue if due date has passed and not returned
    if (
      borrowing.status === 'borrowed' && 
      new Date(borrowing.dueDate) < new Date() &&
      !borrowing.returnedAt
    ) {
      borrowing.status = 'overdue';
      borrowing.fineAmount = borrowing.calculateFine();
    }
  });

  return Borrowing;
};
