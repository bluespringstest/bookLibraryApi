const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const { Book, User, Sale, SaleItem, sequelize } = require('../../src/models');
const { createTestUser, getAuthToken } = require('../testHelper');
const { v4: uuidv4 } = require('uuid');

describe('Sales API', () => {
  let testUser;
  let testBook1;
  let testBook2;
  let adminToken;
  let saleId;

  before(async () => {
    // Create test data
    testUser = await createTestUser('member');
    const adminUser = await createTestUser('admin');
    
    // Create test books
    testBook1 = await Book.create({
      id: uuidv4(),
      isbn: '9783161484100',
      title: 'Test Book 1 for Sale',
      authorId: uuidv4(),
      genreId: uuidv4(),
      inStock: 10,
      retailPrice: 19.99,
      salePrice: 14.99,
      publishedYear: 2023,
      publisher: 'Test Publisher',
      language: 'English',
      pages: 300,
      description: 'A test book for sales tests',
      coverImage: 'test-cover1.jpg',
      isActive: true,
      taxable: true,
    });

    testBook2 = await Book.create({
      id: uuidv4(),
      isbn: '9783161484117',
      title: 'Test Book 2 for Sale',
      authorId: uuidv4(),
      genreId: uuidv4(),
      inStock: 5,
      retailPrice: 29.99,
      publishedYear: 2023,
      publisher: 'Test Publisher',
      language: 'English',
      pages: 250,
      description: 'Another test book for sales tests',
      coverImage: 'test-cover2.jpg',
      isActive: true,
      taxable: false,
    });

    // Get auth token for admin
    adminToken = await getAuthToken(adminUser.email, 'password123');
  });

  after(async () => {
    // Clean up test data
    await SaleItem.destroy({ where: {} });
    await Sale.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /api/v1/sales', () => {
    it('should create a new sale', async () => {
      const res = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'Test Customer',
          customerEmail: 'customer@example.com',
          customerPhone: '1234567890',
          notes: 'Test sale',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('sale');
      expect(res.body.data.sale).to.have.property('id');
      expect(res.body.data.sale.status).to.equal('pending');
      expect(res.body.data.sale.paymentStatus).to.equal('pending');
      
      // Save sale ID for later tests
      saleId = res.body.data.sale.id;
    });
  });

  describe('POST /api/v1/sales/:saleId/items', () => {
    it('should add items to a sale', async () => {
      const res = await request(app)
        .post(`/api/v1/sales/${saleId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              bookId: testBook1.id,
              quantity: 2,
              discount: 5.00,
            },
            {
              bookId: testBook2.id,
              quantity: 1,
            },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data.items).to.have.lengthOf(2);
      
      // Verify sale totals were updated
      const sale = await Sale.findByPk(saleId);
      expect(sale.subtotal).to.be.greaterThan(0);
      expect(sale.totalAmount).to.be.greaterThan(0);
    });

    it('should not add items if not enough stock', async () => {
      await request(app)
        .post(`/api/v1/sales/${saleId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              bookId: testBook1.id,
              quantity: 100, // More than available stock
            },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .then((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('Not enough stock');
        });
    });
  });

  describe('POST /api/v1/sales/:saleId/process-payment', () => {
    it('should process payment for a sale', async () => {
      const res = await request(app)
        .post(`/api/v1/sales/${saleId}/process-payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'credit_card',
          paymentDetails: {
            cardNumber: '4242',
            cardHolderName: 'Test Customer',
          },
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data.sale).to.have.property('status', 'completed');
      expect(res.body.data.sale).to.have.property('paymentStatus', 'paid');
      
      // Verify inventory was updated
      const updatedBook1 = await Book.findByPk(testBook1.id);
      expect(updatedBook1.inStock).to.equal(testBook1.inStock - 2); // 2 copies sold
      
      const updatedBook2 = await Book.findByPk(testBook2.id);
      expect(updatedBook2.inStock).to.equal(testBook2.inStock - 1); // 1 copy sold
    });

    it('should handle payment failure', async () => {
      // Create a new sale for testing payment failure
      const newSale = await Sale.create({
        userId: testUser.id,
        customerName: 'Test Customer 2',
        status: 'pending',
        paymentStatus: 'pending',
      });
      
      // Add an item to the sale
      await SaleItem.create({
        saleId: newSale.id,
        bookId: testBook1.id,
        quantity: 1,
        unitPrice: testBook1.salePrice,
        discount: 0,
        taxRate: 8.00,
        totalPrice: testBook1.salePrice * 1.08,
      });
      
      // Force payment failure
      await request(app)
        .post(`/api/v1/sales/${newSale.id}/process-payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'credit_card',
          paymentDetails: {
            cardNumber: '4000000000000002', // Test card that will be declined
            cardHolderName: 'Test Customer',
          },
        })
        .expect('Content-Type', /json/)
        .expect(402)
        .then((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('Payment failed');
        });
      
      // Verify sale status was updated to failed
      const failedSale = await Sale.findByPk(newSale.id);
      expect(failedSale.paymentStatus).to.equal('failed');
    });
  });

  describe('GET /api/v1/sales', () => {
    it('should list sales with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data.items.length).to.be.greaterThan(0);
      
      // Verify the sale we created is in the list
      const saleInList = res.body.data.items.find(sale => sale.id === saleId);
      expect(saleInList).to.exist;
    });

    it('should filter sales by status', async () => {
      const res = await request(app)
        .get('/api/v1/sales?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.data.items.every(sale => sale.status === 'completed')).to.be.true;
    });
  });

  describe('GET /api/v1/sales/:saleId', () => {
    it('should get sale details', async () => {
      const res = await request(app)
        .get(`/api/v1/sales/${saleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('sale');
      expect(res.body.data.sale.id).to.equal(saleId);
      expect(res.body.data.sale).to.have.property('items').that.is.an('array');
      expect(res.body.data.sale.items.length).to.equal(2);
    });

    it('should not allow unauthorized access', async () => {
      const regularUser = await createTestUser('member');
      const userToken = await getAuthToken(regularUser.email, 'password123');
      
      await request(app)
        .get(`/api/v1/sales/${saleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/sales/:saleId/receipt', () => {
    it('should generate a receipt for a sale', async () => {
      const res = await request(app)
        .get(`/api/v1/sales/${saleId}/receipt`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('receipt');
      expect(res.body.data.receipt.saleId).to.equal(saleId);
      expect(res.body.data.receipt).to.have.property('items').that.is.an('array');
      expect(res.body.data.receipt.items.length).to.equal(2);
      expect(res.body.data.receipt).to.have.property('totalAmount').that.is.a('number');
    });
  });
});
