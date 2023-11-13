const { expect } = require('chai');
const request = require('supertest');
const { Author } = require('../src/models');
const app = require('../src/app');

describe('/authors', () => {
  before(async () => Author.sequelize.sync());

describe('with no records in the database', () => {
    describe('POST /author', () => {
        it('creates a new author in the database', async () => {
            const response = await request(app).post('/author').send({
                name: 'Laurell K. Hamilton'
            });
            const newAuthorRecord = await Author.findByPk(response.body.id, {
                raw: true,
            });
            expect(response.status).to.equal(201)
            expect(newAuthorRecord.name).to.equal('Laurell K. Hamilton')
        });
    });
});

describe('with records in the database', () => {
    let authors;

    beforeEach(async () => {
        await Author.destroy({where: {}});
        authors = await Promise.all([
            Author.create({name:'Stephen R. Covey'}),
            Author.create({name:'Adrian Wilkinson'}),
            Author.create({name:'Joe Abercrombie'})
        ]);
    });
    describe('GET /author', () => {
        it('gets all author records', async () => {
          const response = await request(app).get('/author');  
          expect(response.status).to.equal(200);
          response.body.forEach((author) => {
            const expected = authors.find((a) => a.id === author.id);
            expect(author.name).to.equal(expected.name);
          });
        });
        it('returns a 404 if the author does not exist', async () => {
            const response = await request(app).get('/author/12345');
            expect(response.status).to.equal(404);
          });
          it('returns an error body if the author does not exist', async () => {
            const response = await request(app).get('/author/12345');
            expect(response.body.error.error).to.equal('The author could not be found.');
          });
      });
      describe('PATCH /authors/:id', () => {
        it('updates author name by id', async () => {
          const response = await request(app).get('/author');
          const author = response.body[0];
          const updatedReaderResponse = await request(app)
            .patch(`/author/${author.id}`)
            .send({ name: 'Bob Builder' });
          const updatedReaderRecord = await Author.findByPk(author.id, {
            raw: true,
          });
          expect(updatedReaderResponse.status).to.equal(200);
          expect(updatedReaderRecord.name).to.equal('Bob Builder');
        });
        it('returns a 404 if the author does not exist', async () => {
          const response = await request(app)
            .patch('/author/12345')
            .send({ name: 'some_new_email@gmail.com' });  
          expect(response.status).to.equal(404);
          expect(response.body.error).to.equal('The author could not be found.');
        });
      });
      describe('DELETE /authors/:id', () => {
        it('deletes author record by id', async () => {
          const response = await request(app).get('/author');
          const author = response.body[0];
          const updatedAuthorResponse = await request(app).delete(`/author/${author.id}`);
          const deletedAuthor = await Author.findByPk(author.id, { raw: true });
          expect(updatedAuthorResponse.status).to.equal(204);
          expect(deletedAuthor).to.equal(null);
        });  
        it('returns a 404 if the author does not exist', async () => {
          const response = await request(app).delete('/author/12345');
          expect(response.status).to.equal(404);
          expect(response.body.error).to.equal('The author could not be found.');
        });
    });
});
});

