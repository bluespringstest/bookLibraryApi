const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const { Book, User, Borrowing, sequelize } = require('../../src/models');
const { createTestUser, getAuthToken } = require('../testHelper');
const { v4: uuidv4 } = require('uuid');

describe('Borrowing API', () => {
  let testUser;
  let testBook;
  let testLibrarian;
  let userToken;
  let librarianToken;
  let borrowingId;

  before(async () => {
    // Create test data
    testUser = await createTestUser('member');
    testLibrarian = await createTestUser('librarian');
    
    testBook = await Book.create({
      id: uuidv4(),
      isbn: '9783161484100',
      title: 'Test Book for Borrowing',
      authorId: uuidv4(),
      genreId: uuidv4(),
      totalCopies: 5,
      availableCopies: 5,
      publishedYear: 2023,
      publisher: 'Test Publisher',
      language: 'English',
      pages: 300,
      description: 'A test book for borrowing tests',
      coverImage: 'test-cover.jpg',
      isActive: true,
    });

    // Get auth tokens
    userToken = await getAuthToken(testUser.email, 'password123');
    librarianToken = await getAuthToken(testLibrarian.email, 'password123');
  });

  after(async () => {
    // Clean up test data
    await Borrowing.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /api/v1/borrowings/checkout/:bookId', () => {
    it('should allow a user to check out a book', async () => {
      const res = await request(app)
        .post(`/api/v1/borrowings/checkout/${testBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('borrowing');
      expect(res.body.data.borrowing).to.have.property('bookId', testBook.id);
      expect(res.body.data.borrowing).to.have.property('userId', testUser.id);
      expect(res.body.data.borrowing).to.have.property('status', 'borrowed');

      // Save borrowing ID for later tests
      borrowingId = res.body.data.borrowing.id;

      // Verify book available copies were decremented
      const updatedBook = await Book.findByPk(testBook.id);
      expect(updatedBook.availableCopies).to.equal(testBook.availableCopies - 1);
    });

    it('should not allow checking out the same book twice', async () => {
      await request(app)
        .post(`/api/v1/borrowings/checkout/${testBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(400)
        .then(res => {
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('already borrowed');
        });
    });

    it('should not allow checking out a non-existent book', async () => {
      const nonExistentBookId = uuidv4();
      await request(app)
        .post(`/api/v1/borrowings/checkout/${nonExistentBookId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('POST /api/v1/borrowings/renew/:borrowingId', () => {
    it('should allow a user to renew their borrowed book', async () => {
      const res = await request(app)
        .post(`/api/v1/borrowings/renew/${borrowingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('borrowing');
      expect(res.body.data.borrowing).to.have.property('renewalCount', 1);
    });

    it('should not allow renewing a non-existent borrowing', async () => {
      const nonExistentBorrowingId = uuidv4();
      await request(app)
        .post(`/api/v1/borrowings/renew/${nonExistentBorrowingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('POST /api/v1/borrowings/return/:borrowingId', () => {
    it('should allow a user to return a book', async () => {
      const res = await request(app)
        .post(`/api/v1/borrowings/return/${borrowingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ condition: 'good' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('borrowing');
      expect(res.body.data.borrowing).to.have.property('status', 'returned');

      // Verify book available copies were incremented
      const updatedBook = await Book.findByPk(testBook.id);
      expect(updatedBook.availableCopies).to.equal(testBook.availableCopies);
    });

    it('should apply damage fee for damaged books', async () => {
      // Check out the book again
      const checkoutRes = await request(app)
        .post(`/api/v1/borrowings/checkout/${testBook.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      const newBorrowingId = checkoutRes.body.data.borrowing.id;
      
      // Return as damaged
      const returnRes = await request(app)
        .post(`/api/v1/borrowings/return/${newBorrowingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ condition: 'damaged' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(returnRes.body.data.borrowing.fineAmount).to.be.above(0);
    });
  });

  describe('GET /api/v1/borrowings/user/:userId', () => {
    it('should return a user\'s borrowing history', async () => {
      const res = await request(app)
        .get(`/api/v1/borrowings/user/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data.items.length).to.be.greaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get(`/api/v1/borrowings/user/${testUser.id}?status=returned`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.data.items.every(item => item.status === 'returned')).to.be.true;
    });
  });

  describe('GET /api/v1/borrowings/overdue', () => {
    it('should return overdue books (librarian only)', async () => {
      // Create an overdue borrowing
      const overdueBorrowing = await Borrowing.create({
        id: uuidv4(),
        bookId: testBook.id,
        userId: testUser.id,
        borrowedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        status: 'overdue',
      });

      const res = await request(app)
        .get('/api/v1/borrowings/overdue')
        .set('Authorization', `Bearer ${librarianToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.data.items).to.be.an('array');
      expect(res.body.data.items.some(item => item.id === overdueBorrowing.id)).to.be.true;
    });

    it('should not allow non-librarians to view overdue books', async () => {
      await request(app)
        .get('/api/v1/borrowings/overdue')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
