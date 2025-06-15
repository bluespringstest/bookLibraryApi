import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { sequelize, User, Book, Author, Genre, Sale, SaleItem } from '../src/models/index.js';
import config from '../src/config/config.js';

const { expect } = chai;

chai.use(chaiHttp);

// Test data
const testAdmin = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
};

const testLibrarian = {
  firstName: 'Librarian',
  lastName: 'User',
  email: 'librarian@example.com',
  password: 'password123',
  role: 'librarian',
};

const testMember = {
  firstName: 'Member',
  lastName: 'User',
  email: 'member@example.com',
  password: 'password123',
  role: 'member',
};

const testBook1 = {
  isbn: '9783161484100',
  title: 'Test Book 1',
  description: 'A test book',
  publishedYear: 2023,
  publisher: 'Test Publisher',
  pages: 200,
  language: 'English',
  coverImage: 'https://example.com/cover1.jpg',
  inStock: 10,
  retailPrice: 29.99,
  salePrice: 24.99,
  isActive: true,
  taxable: true,
};

const testBook2 = {
  isbn: '9783161484117',
  title: 'Test Book 2',
  description: 'Another test book',
  publishedYear: 2023,
  publisher: 'Test Publisher',
  pages: 150,
  language: 'English',
  coverImage: 'https://example.com/cover2.jpg',
  inStock: 5,
  retailPrice: 19.99,
  isActive: true,
  taxable: false,
};

const testAuthor = {
  name: 'Test Author',
  biography: 'A test author',
  birthDate: '1980-01-01',
};

const testGenre = {
  name: 'Test Genre',
  description: 'A test genre',
};

// Helper functions
const createTestUser = async (role = 'member') => {
  const userData = {
    firstName: `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
    lastName: 'User',
    email: `${role}@example.com`,
    password: 'password123',
    role,
  };
  
  const user = await User.create({
    ...userData,
    password: await User.hashPassword(userData.password),
  });
  
  return user;
};

const getAuthToken = async (email, password) => {
  const res = await chai
    .request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
    
  return res.body.token;
};

const setupTestDatabase = async () => {
  // Sync all models that aren't already in the database
  await sequelize.sync({ force: true });
  
  // Create test data
  const author = await Author.create(testAuthor);
  const genre = await Genre.create(testGenre);
  
  // Create test users
  const admin = await createTestUser('admin');
  const librarian = await createTestUser('librarian');
  const member = await createTestUser('member');
  
  // Create test books
  const book1 = await Book.create({
    ...testBook1,
    authorId: author.id,
    genreId: genre.id,
  });
  
  const book2 = await Book.create({
    ...testBook2,
    authorId: author.id,
    genreId: genre.id,
  });
  
  return { 
    admin, 
    librarian, 
    member, 
    book1, 
    book2, 
    author, 
    genre 
  };
};

const createTestSale = async (userId, status = 'pending', paymentStatus = 'pending') => {
  const sale = await Sale.create({
    userId,
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '1234567890',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    status,
    paymentStatus,
    paymentMethod: null,
    paymentDetails: {},
  });
  
  return sale;
};

const createTestSaleItem = async (saleId, bookId, quantity = 1, unitPrice = 24.99, discount = 0) => {
  const taxRate = 8.00; // 8%
  const subtotal = unitPrice * quantity;
  const taxAmount = subtotal * (taxRate / 100);
  const totalPrice = subtotal + taxAmount - discount;
  
  const saleItem = await SaleItem.create({
    saleId,
    bookId,
    quantity,
    unitPrice,
    discount,
    taxRate,
    totalPrice,
  });
  
  // Update sale totals
  const sale = await Sale.findByPk(saleId);
  await sale.update({
    subtotal: (sale.subtotal || 0) + subtotal,
    taxAmount: (sale.taxAmount || 0) + taxAmount,
    discountAmount: (sale.discountAmount || 0) + discount,
    totalAmount: (sale.totalAmount || 0) + totalPrice,
  });
  
  return saleItem;
};

export {
  chai,
  expect,
  app,
  testAdmin,
  testLibrarian,
  testMember,
  testBook1,
  testBook2,
  testAuthor,
  testGenre,
  setupTestDatabase,
  createTestUser,
  getAuthToken,
  createTestSale,
  createTestSaleItem,
};
