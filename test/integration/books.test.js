const { expect } = require('chai');
const { app, setupTestDatabase, loginTestUser, testBook, testAuthor, testGenre } = require('../testHelper');
const { Book, Author, Genre } = require('../../src/models');

describe('Book Management', () => {
  let token;
  let testBookId;
  let testAuthorId;
  let testGenreId;

  before(async () => {
    // Setup test database and get test data
    const { user, book, author, genre } = await setupTestDatabase();
    testBookId = book.id;
    testAuthorId = author.id;
    testGenreId = genre.id;
    
    // Login and get JWT token
    token = await loginTestUser();
  });

  describe('GET /api/v1/books', () => {
    it('should get all books with pagination', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/books')
        .query({ page: 1, limit: 10 });
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('items').that.is.an('array');
      expect(res.body).to.have.property('totalItems');
      expect(res.body).to.have.property('totalPages');
      expect(res.body).to.have.property('currentPage', 1);
    });

    it('should search books by title', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/books')
        .query({ search: 'Test Book' });
      
      expect(res).to.have.status(200);
      expect(res.body.items).to.have.lengthOf(1);
      expect(res.body.items[0]).to.include({
        title: 'Test Book',
      });
    });

    it('should filter books by author', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/books')
        .query({ author: testAuthorId });
      
      expect(res).to.have.status(200);
      expect(res.body.items).to.have.lengthOf(1);
      expect(res.body.items[0].author.id).to.equal(testAuthorId);
    });
  });

  describe('GET /api/v1/books/:id', () => {
    it('should get a single book by ID', async () => {
      const res = await chai
        .request(app)
        .get(`/api/v1/books/${testBookId}`);
      
      expect(res).to.have.status(200);
      expect(res.body.book).to.include({
        id: testBookId,
        title: 'Test Book',
      });
    });

    it('should return 404 for non-existent book', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await chai
        .request(app)
        .get(`/api/v1/books/${nonExistentId}`);
      
      expect(res).to.have.status(404);
    });
  });

  describe('POST /api/v1/books', () => {
    const newBook = {
      isbn: '9781234567890',
      title: 'New Test Book',
      description: 'A new test book',
      publishedDate: '2023-02-01',
      publisher: 'New Test Publisher',
      pageCount: 150,
      language: 'English',
      coverImage: 'https://example.com/new-cover.jpg',
      totalCopies: 3,
      authorId: testAuthorId,
      genreId: testGenreId,
    };

    it('should create a new book', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${token}`)
        .send(newBook);
      
      expect(res).to.have.status(201);
      expect(res.body.data).to.include({
        title: 'New Test Book',
        isbn: '9781234567890',
        totalCopies: 3,
        availableCopies: 3,
      });
    });

    it('should return 400 for duplicate ISBN', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...newBook, isbn: testBook.isbn });
      
      expect(res).to.have.status(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/books')
        .send(newBook);
      
      expect(res).to.have.status(401);
    });
  });

  describe('PUT /api/v1/books/:id', () => {
    const updatedData = {
      title: 'Updated Test Book',
      description: 'An updated test book',
      totalCopies: 10,
    };

    it('should update a book', async () => {
      const res = await chai
        .request(app)
        .put(`/api/v1/books/${testBookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);
      
      expect(res).to.have.status(200);
      expect(res.body.data).to.include({
        title: 'Updated Test Book',
        description: 'An updated test book',
        totalCopies: 10,
      });
    });

    it('should not allow reducing total copies below borrowed count', async () => {
      // First, create a borrowing record
      await Book.update(
        { availableCopies: 4, totalCopies: 5 },
        { where: { id: testBookId } }
      );

      const res = await chai
        .request(app)
        .put(`/api/v1/books/${testBookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ totalCopies: 3 });
      
      expect(res).to.have.status(400);
    });
  });

  describe('DELETE /api/v1/books/:id', () => {
    let bookToDelete;

    beforeEach(async () => {
      // Create a new book to delete in each test
      bookToDelete = await Book.create({
        ...testBook,
        isbn: `978${Date.now()}`,
        authorId: testAuthorId,
        genreId: testGenreId,
      });
    });

    it('should delete a book', async () => {
      const res = await chai
        .request(app)
        .delete(`/api/v1/books/${bookToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      
      // Verify the book is deleted
      const deletedBook = await Book.findByPk(bookToDelete.id);
      expect(deletedBook).to.be.null;
    });

    it('should not delete a book with active borrowings', async () => {
      // Create a borrowing record
      await Borrowing.create({
        bookId: bookToDelete.id,
        userId: 1, // Assuming user with ID 1 exists
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'borrowed',
      });

      const res = await chai
        .request(app)
        .delete(`/api/v1/books/${bookToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(400);
    });
  });

  describe('POST /api/v1/books/scan', () => {
    it('should scan a book by ISBN', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/books/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({ isbn: '9783161484100' });
      
      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('isbn', '9783161484100');
    });

    it('should return 400 for missing ISBN', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/books/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      expect(res).to.have.status(400);
    });
  });
});
