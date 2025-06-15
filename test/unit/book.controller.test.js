const { expect } = require('chai');
const sinon = require('sinon');
const { Book, Author, Genre, Borrowing } = require('../../src/models');
const bookController = require('../../src/controllers/book.controller');
const { ApiError } = require('../../src/utils/ApiError');

// Mock the response object
const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Book Controller - Unit Tests', () => {
  let sandbox;
  let req, res;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {};
    res = mockResponse();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getBooks', () => {
    it('should return a list of books with pagination', async () => {
      // Mock request
      req.query = { page: '1', limit: '10' };
      
      // Mock database response
      const mockBooks = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ];
      
      sandbox.stub(Book, 'findAndCountAll').resolves({
        count: 2,
        rows: mockBooks,
      });

      await bookController.getBooks(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].items).to.have.lengthOf(2);
      expect(res.json.firstCall.args[0]).to.have.property('totalItems', 2);
    });

    it('should filter books by search query', async () => {
      req.query = { search: 'test' };
      
      const mockBooks = [{ id: 1, title: 'Test Book' }];
      
      sandbox.stub(Book, 'findAndCountAll').resolves({
        count: 1,
        rows: mockBooks,
      });

      await bookController.getBooks(req, res);

      expect(Book.findAndCountAll.calledOnce).to.be.true;
      const queryOptions = Book.findAndCountAll.firstCall.args[0];
      expect(queryOptions.where[Op.or]).to.exist;
    });
  });

  describe('getBookById', () => {
    it('should return a book by ID', async () => {
      req.params = { id: '1' };
      const mockBook = { id: 1, title: 'Test Book' };
      
      sandbox.stub(Book, 'findByPk').resolves(mockBook);

      await bookController.getBookById(req, res);

      expect(Book.findByPk.calledOnceWith('1', sinon.match.object)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ book: mockBook })).to.be.true;
    });

    it('should return 404 if book not found', async () => {
      req.params = { id: '999' };
      sandbox.stub(Book, 'findByPk').resolves(null);

      let error;
      try {
        await bookController.getBookById(req, res);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an.instanceOf(ApiError);
      expect(error.statusCode).to.equal(404);
    });
  });

  describe('createBook', () => {
    beforeEach(() => {
      req.body = {
        isbn: '1234567890123',
        title: 'New Book',
        authorId: 1,
        genreId: 1,
        totalCopies: 5,
      };
    });

    it('should create a new book', async () => {
      const mockBook = { id: 1, ...req.body, availableCopies: req.body.totalCopies };
      
      sandbox.stub(Book, 'findOne').resolves(null);
      sandbox.stub(Author, 'findByPk').resolves({ id: 1 });
      sandbox.stub(Genre, 'findByPk').resolves({ id: 1 });
      sandbox.stub(Book, 'create').resolves(mockBook);

      await bookController.createBook(req, res);

      expect(Book.create.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(
        sinon.match({
          data: sinon.match({
            title: 'New Book',
            availableCopies: 5
          })
        })
      )).to.be.true;
    });

    it('should return 400 for duplicate ISBN', async () => {
      sandbox.stub(Book, 'findOne').resolves({ id: 1 });

      let error;
      try {
        await bookController.createBook(req, res);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an.instanceOf(ApiError);
      expect(error.statusCode).to.equal(400);
    });
  });

  describe('updateBook', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      req.body = { title: 'Updated Book' };
    });

    it('should update an existing book', async () => {
      const mockBook = {
        id: 1,
        title: 'Old Title',
        update: sandbox.stub().resolves({ id: 1, title: 'Updated Book' })
      };
      
      sandbox.stub(Book, 'findByPk').resolves(mockBook);

      await bookController.updateBook(req, res);

      expect(mockBook.update.calledOnceWith({ title: 'Updated Book' })).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should not allow reducing total copies below borrowed count', async () => {
      const mockBook = {
        id: 1,
        totalCopies: 5,
        availableCopies: 3,
        update: sandbox.stub()
      };
      
      sandbox.stub(Book, 'findByPk').resolves(mockBook);
      req.body.totalCopies = 2; // Trying to set below borrowed count (5-3=2 borrowed)

      let error;
      try {
        await bookController.updateBook(req, res);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an.instanceOf(ApiError);
      expect(error.statusCode).to.equal(400);
    });
  });

  describe('deleteBook', () => {
    it('should delete a book', async () => {
      req.params = { id: '1' };
      const mockBook = {
        id: 1,
        destroy: sandbox.stub().resolves()
      };
      
      sandbox.stub(Book, 'findByPk').resolves(mockBook);
      sandbox.stub(Borrowing, 'count').resolves(0);

      await bookController.deleteBook(req, res);

      expect(mockBook.destroy.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should not delete a book with active borrowings', async () => {
      req.params = { id: '1' };
      const mockBook = { id: 1 };
      
      sandbox.stub(Book, 'findByPk').resolves(mockBook);
      sandbox.stub(Borrowing, 'count').resolves(1);

      let error;
      try {
        await bookController.deleteBook(req, res);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an.instanceOf(ApiError);
      expect(error.statusCode).to.equal(400);
    });
  });

  describe('scanBook', () => {
    it('should return book data for a valid ISBN', async () => {
      req.body = { isbn: '1234567890123' };
      
      await bookController.scanBook(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(
        sinon.match({
          data: sinon.match({
            isbn: '1234567890123',
            message: sinon.match.string
          })
        })
      )).to.be.true;
    });

    it('should return 400 for missing ISBN', async () => {
      req.body = {};

      let error;
      try {
        await bookController.scanBook(req, res);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an.instanceOf(ApiError);
      expect(error.statusCode).to.equal(400);
    });
  });
});
