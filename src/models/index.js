import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/config.js';
import ReaderModel from './reader.js';
import BookModel from './book.js';
import AuthorModel from './author.js';
import GenreModel from './genre.js';
import NotificationModel from './notification.js';
import BorrowingModel, { BORROWING_STATUS } from './borrowing.js';
import SaleModel from './sale.js';
import SaleItemModel from './saleItem.js';
import InventoryTransactionModel from './inventoryTransaction.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config.db;

// Initialize Sequelize with config
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: '+00:00', // Use UTC
    define: {
      timestamps: true,
      paranoid: true, // Enable soft deletes
      underscored: true, // Use snake_case for database columns
    },
  }
);

// Initialize models
const Reader = ReaderModel(sequelize, DataTypes);
const Book = BookModel(sequelize, DataTypes);
const Author = AuthorModel(sequelize, DataTypes);
const Genre = GenreModel(sequelize, DataTypes);
const Notification = NotificationModel(sequelize, DataTypes);
const Borrowing = BorrowingModel(sequelize, DataTypes);
const Sale = SaleModel(sequelize, DataTypes);
const SaleItem = SaleItemModel(sequelize, DataTypes);
const InventoryTransaction = InventoryTransactionModel(sequelize, DataTypes);

// Set up associations
if (Reader.associate) Reader.associate({ Reader, Book, Notification, Borrowing });
if (Book.associate) Book.associate({ Book, Author, Genre, Notification, Borrowing });
if (Author.associate) Author.associate({ Author, Book });
if (Genre.associate) Genre.associate({ Genre, Book });
if (Notification.associate) Notification.associate({ Notification, Reader });
if (Borrowing.associate) Borrowing.associate({ Borrowing, Book, User: Reader });
if (Sale.associate) Sale.associate({ Sale, SaleItem, InventoryTransaction, User: Reader, Book });
if (SaleItem.associate) SaleItem.associate({ SaleItem, Sale, Book });
if (InventoryTransaction.associate) InventoryTransaction.associate({ InventoryTransaction, Book, User: Reader });

// Export models and sequelize instance
export {
  sequelize,
  Sequelize,
  Reader,
  Book,
  Author,
  Genre,
  Notification,
  Borrowing,
  Sale,
  SaleItem,
  InventoryTransaction,
  BORROWING_STATUS
};