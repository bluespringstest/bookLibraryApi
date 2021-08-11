const { expect } = require('chai');
const request = require('supertest');
const { Book } = require('../src/models');
const app = require('../src/app');

describe('/books', () => {
  before(async () => Book.sequelize.sync());

describe('with no records in the database', () => {
    describe('POST /book', () => {
      it('creates a new book in the database', async () => {
        const response = await request(app).post('/book').send({
          title: 'History of Sanitation', 
          author: 'John Joseph Cosgrove',
          genre: 'Historical',
          ISBN: '0-8355-0961-3'
        });
        const newBookRecord = await Book.findByPk(response.body.id, {
          raw: true,
        });
        expect(response.status).to.equal(201);
        expect(response.body.title).to.equal('History of Sanitation');
        expect(newBookRecord.author).to.equal('John Joseph Cosgrove');
        expect(newBookRecord.genre).to.equal('Historical');
        expect(newBookRecord.ISBN).to.equal('0-8355-0961-3');
      });
    });
  });

describe('with records in the database', () => {
    let books;

    beforeEach(async () => {
      await Book.destroy({ where: {}});
      books = await Promise.all([
        Book.create({author: 'Joe Abercrombie',title: 'The first Law', genre: 'fantasy', ISBN: '0-2334-8765-2'}),
        Book.create({ author: 'Arya Stark', title: 'Death met me' , genre: 'fantasy', ISBN: '0-2334-2345-3'}),
        Book.create({ author: 'Dr Pragya Agarwal', title: 'Sway, Unravelling unconscious bias', genre: 'Psychology', ISBN: '0-8355-0254-4'}),
      ]);
    });

    describe('GET /books', () => {
      it('gets all books records', async () => {
        const response = await request(app).get('/book');  
        expect(response.status).to.equal(200);
        expect(response.body.length).to.equal(3);
        response.body.forEach((book) => {
          const expected = books.find((a) => a.id === book.id);
  
          expect(book.author).to.equal(expected.author);
          expect(book.title).to.equal(expected.title);
          expect(book.genre).to.equal(expected.genre);
          expect(book.ISBN).to.equal(expected.ISBN);
        });
      });
    });
    describe('GET /books/:id', () => {
      it('gets books record by id', async () => {
        const book = books[0];
        const response = await request(app).get(`/book/${book.id}`);
        expect(response.status).to.equal(200);
        expect(response.body.author).to.equal(book.author);
        expect(response.body.title).to.equal(book.title);
      });
      it('returns a 404 if the book does not exist', async () => {
        const response = await request(app).get('/book/12345');
        expect(response.status).to.equal(404);
      });
      it('returns an error body if the book does not exist', async () => {
        const response = await request(app).get('/book/12345');
        expect(response.body.error).to.equal('The book could not be found.');
      });
    });
    describe('PATCH /books/:id', () => {
      it('updates books title by id', async () => {
        const response = await request(app).get('/book');
        const book = response.body[0];
        const updatedReaderResponse = await request(app)
          .patch(`/book/${book.id}`)
          .send({ title: 'the newest dawn' });
        const updatedReaderRecord = await Book.findByPk(book.id, {
          raw: true,
        });
        expect(updatedReaderResponse.status).to.equal(200);
        expect(updatedReaderRecord.title).to.equal('the newest dawn');
      });
      it('returns a 404 if the book does not exist', async () => {
        const response = await request(app)
          .patch('/book/12345')
          .send({ title: 'some_new_email@gmail.com' });  
        expect(response.status).to.equal(404);
        expect(response.body.error).to.equal('The book could not be found.');
      });
    });
    describe('DELETE /books/:id', () => {
      it('deletes book record by id', async () => {
        const response = await request(app).get('/book');
        const book = response.body[0];
        const updatedReaderResponse = await request(app).delete(`/book/${book.id}`);
        const deletedReader = await Book.findByPk(book.id, { raw: true });
        expect(updatedReaderResponse.status).to.equal(204);
        expect(deletedReader).to.equal(null);
      });  
      it('returns a 404 if the book does not exist', async () => {
        const response = await request(app).delete('/book/12345');
        expect(response.status).to.equal(404);
        expect(response.body.error).to.equal('The book could not be found.');
      });
  });
});
});