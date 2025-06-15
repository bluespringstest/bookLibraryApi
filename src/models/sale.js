import { Model, DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default (sequelize) => {
  class Sale extends Model {
    static associate(models) {
      // A sale belongs to a user (staff member who processed the sale)
      Sale.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'staff',
      });

      // A sale has many sale items
      Sale.hasMany(models.SaleItem, {
        foreignKey: 'saleId',
        as: 'items',
        onDelete: 'CASCADE',
      });

      // A sale can have many inventory transactions
      Sale.hasMany(models.InventoryTransaction, {
        foreignKey: 'referenceId',
        constraints: false,
        scope: {
          referenceType: 'sale',
        },
      });
    }

    // Calculate totals based on items
    async calculateTotals() {
      const items = await this.getItems();
      
      this.subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      this.taxAmount = items.reduce((sum, item) => {
        const itemTax = (item.unitPrice * item.quantity - item.discount) * (item.taxRate / 100);
        return sum + parseFloat(itemTax.toFixed(2));
      }, 0);
      
      // Apply any additional discount
      const discount = this.discountAmount || 0;
      
      this.totalAmount = parseFloat((this.subtotal + this.taxAmount - discount).toFixed(2));
      
      return this.save();
    }

    // Mark sale as paid
    async markAsPaid(paymentMethod, paymentDetails = {}) {
      this.paymentStatus = 'paid';
      this.paymentMethod = paymentMethod;
      this.paymentDetails = paymentDetails;
      this.status = 'completed';
      
      // Update inventory for each item
      const items = await this.getItems();
      for (const item of items) {
        const book = await item.getBook();
        
        // Create inventory transaction
        await this.sequelize.models.InventoryTransaction.create({
          bookId: item.bookId,
          quantity: -item.quantity, // Negative for sales (reducing inventory)
          transactionType: 'sale',
          referenceId: this.id,
          referenceType: 'sale',
          notes: `Sold ${item.quantity} ${item.quantity > 1 ? 'copies' : 'copy'} of ${book.title}`,
          createdBy: this.userId,
        });
        
        // Update book inventory
        await book.decrement('inStock', { by: item.quantity });
      }
      
      return this.save();
    }
    
    // Generate a receipt
    async generateReceipt() {
      const items = await this.getItems({
        include: [{
          model: this.sequelize.models.Book,
          as: 'book',
          attributes: ['id', 'title', 'isbn']
        }]
      });
      
      return {
        saleId: this.id,
        date: this.createdAt,
        customerName: this.customerName,
        customerEmail: this.customerEmail,
        items: items.map(item => ({
          title: item.book.title,
          isbn: item.book.isbn,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          totalPrice: item.totalPrice
        })),
        subtotal: this.subtotal,
        taxAmount: this.taxAmount,
        discountAmount: this.discountAmount,
        totalAmount: this.totalAmount,
        paymentStatus: this.paymentStatus,
        paymentMethod: this.paymentMethod
      };
    }
  }

  Sale.init({
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
      onDelete: 'RESTRICT',
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Sale',
    tableName: 'Sales',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeSave: async (sale) => {
        // Ensure total is always calculated before saving
        if (sale.changed('subtotal') || sale.changed('taxAmount') || sale.changed('discountAmount')) {
          sale.totalAmount = parseFloat((sale.subtotal + sale.taxAmount - sale.discountAmount).toFixed(2));
        }
      },
    },
  });

  return Sale;
};
