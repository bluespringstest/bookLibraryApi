const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const { User, Book, Borrowing, sequelize } = require('../../src/models');
const { createTestUser, getAuthToken } = require('../testHelper');
const { v4: uuidv4 } = require('uuid');

describe('User Profile API', () => {
  let testUser;
  let testBook;
  let userToken;

  before(async () => {
    // Create test data
    testUser = await createTestUser('member');
    userToken = await getAuthToken(testUser.email, 'password123');
    
    // Create a test book
    const author = await testUser.sequelize.models.Author.create({
      id: uuidv4(),
      name: 'Test Author',
    });
    
    const genre = await testUser.sequelize.models.Genre.create({
      id: uuidv4(),
      name: 'Test Genre',
    });
    
    testBook = await Book.create({
      id: uuidv4(),
      isbn: '9783161484100',
      title: 'Test Book',
      authorId: author.id,
      genreId: genre.id,
      inStock: 5,
      retailPrice: 29.99,
      publishedYear: 2023,
      publisher: 'Test Publisher',
      language: 'English',
      pages: 200,
      description: 'A test book',
      coverImage: 'test-cover.jpg',
      isActive: true,
    });
    
    // Create some test borrowings
    await Borrowing.create({
      id: uuidv4(),
      userId: testUser.id,
      bookId: testBook.id,
      borrowedAt: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'borrowed',
    });
    
    await Borrowing.create({
      id: uuidv4(),
      userId: testUser.id,
      bookId: testBook.id,
      borrowedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago (overdue)
      returnedAt: null,
      status: 'overdue',
    });
  });

  after(async () => {
    // Clean up test data
    await Borrowing.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('user');
      expect(res.body.data.user.id).to.equal(testUser.id);
      expect(res.body.data.user).to.not.have.property('password');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .expect('Content-Type', /json/)
        .expect(401);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('should update user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
        phone: '1234567890',
        address: '123 Test St',
      };

      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('user');
      expect(res.body.data.user.firstName).to.equal(updates.firstName);
      expect(res.body.data.user.lastName).to.equal(updates.lastName);
      expect(res.body.data.user.email).to.equal(updates.email);
      expect(res.body.data.user.phone).to.equal(updates.phone);
      expect(res.body.data.user.address).to.equal(updates.address);
    });

    it('should not allow duplicate email', async () => {
      const anotherUser = await createTestUser('member');
      
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: anotherUser.email })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Email is already in use');
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    it('should change user password', async () => {
      const newPassword = 'newPassword123';
      
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: newPassword,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.message).to.include('Password updated successfully');
      
      // Verify login with new password works
      const newToken = await getAuthToken(testUser.email, newPassword);
      expect(newToken).to.be.a('string');
    });

    it('should not allow incorrect current password', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Current password is incorrect');
    });
  });

  describe('GET /api/v1/users/borrowing-history', () => {
    it('should get user borrowing history', async () => {
      const res = await request(app)
        .get('/api/v1/users/borrowing-history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data.items.length).to.be.greaterThan(0);
      expect(res.body.data.items[0]).to.have.property('book');
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/users/borrowing-history?status=overdue')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.data.items.every(item => item.status === 'overdue')).to.be.true;
    });
  });

  describe('GET /api/v1/users/reading-stats', () => {
    it('should get user reading statistics', async () => {
      const res = await request(app)
        .get('/api/v1/users/reading-stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('totalBorrowed', 2);
      expect(res.body.data).to.have.property('currentlyBorrowed', 1);
      expect(res.body.data).to.have.property('overdueBooks', 1);
    });
  });
});
