import { Model, DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default (sequelize) => {
  class SaleItem extends Model {
    static associate(models) {
      // A sale item belongs to a sale
      SaleItem.belongsTo(models.Sale, {
        foreignKey: 'saleId',
        as: 'sale',
      });

      // A sale item belongs to a book
      SaleItem.belongsTo(models.Book, {
        foreignKey: 'bookId',
        as: 'book',
      });
    }

    // Calculate the total price for this item
    calculateTotal() {
      const subtotal = (this.unitPrice * this.quantity) - this.discount;
      const tax = subtotal * (this.taxRate / 100);
      this.totalPrice = parseFloat((subtotal + tax).toFixed(2));
      return this.save();
    }
  }

  SaleItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sales',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  }, {
    sequelize,
    modelName: 'SaleItem',
    tableName: 'SaleItems',
    timestamps: true,
    hooks: {
      beforeSave: async (saleItem) => {
        // Calculate total price before saving
        if (saleItem.changed('unitPrice') || 
            saleItem.changed('quantity') || 
            saleItem.changed('discount') || 
            saleItem.changed('taxRate')) {
          const subtotal = (saleItem.unitPrice * saleItem.quantity) - saleItem.discount;
          const tax = subtotal * (saleItem.taxRate / 100);
          saleItem.totalPrice = parseFloat((subtotal + tax).toFixed(2));
        }
      },
      afterSave: async (saleItem) => {
        // Update sale totals when an item is saved
        if (saleItem.sale) {
          await saleItem.sale.calculateTotals();
        } else {
          const sale = await saleItem.getSale();
          await sale.calculateTotals();
        }
      },
      afterDestroy: async (saleItem) => {
        // Update sale totals when an item is deleted
        const sale = await saleItem.getSale();
        await sale.calculateTotals();
      },
    },
  });

  return SaleItem;
};
