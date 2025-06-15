'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Sales table
    await queryInterface.createTable('Sales', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      customerEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending',
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentDetails: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('completed', 'pending', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create SaleItems table
    await queryInterface.createTable('SaleItems', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      saleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Sales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bookId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Books',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        }
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0
        }
      },
      taxRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create InventoryTransactions table
    await queryInterface.createTable('InventoryTransactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Books',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      transactionType: {
        type: Sequelize.ENUM('purchase', 'sale', 'return', 'adjustment', 'damaged', 'lost'),
        allowNull: false
      },
      referenceId: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to the related document (sale, purchase order, etc.)'
      },
      referenceType: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Type of the reference (sale, purchase, etc.)'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('Sales', ['userId']);
    await queryInterface.addIndex('Sales', ['paymentStatus']);
    await queryInterface.addIndex('Sales', ['status']);
    await queryInterface.addIndex('Sales', ['createdAt']);
    
    await queryInterface.addIndex('SaleItems', ['saleId']);
    await queryInterface.addIndex('SaleItems', ['bookId']);
    
    await queryInterface.addIndex('InventoryTransactions', ['bookId']);
    await queryInterface.addIndex('InventoryTransactions', ['transactionType']);
    await queryInterface.addIndex('InventoryTransactions', ['referenceId']);
    await queryInterface.addIndex('InventoryTransactions', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InventoryTransactions');
    await queryInterface.dropTable('SaleItems');
    await queryInterface.dropTable('Sales');
  }
};
