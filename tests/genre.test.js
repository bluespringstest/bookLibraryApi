const { expect } = require('chai');
const request = require('supertest');
const { Genre } = require('../src/models');
const app = require('../src/app');

describe('/genres', () => {
  before(async () => Genre.sequelize.sync());

describe('with no records in the database', () => {
    describe('POST /genre', () => {
        it('creates a new genre in the database', async () => {
            const response = await request(app).post('/genre').send({
                genre: 'Fantasy'
            });
            const newGenreRecord = await Genre.findByPk(response.body.id, {
                raw: true,
            });
            expect(response.status).to.equal(201)
            expect(newGenreRecord.genre).to.equal('Fantasy')
        });
    });
});
describe('with records in the database', () => {
    let genres;

    beforeEach(async () => {
        await Genre.destroy({where: {}});
        genres = await Promise.all([
            Genre.create({genre:'Horror'}),
            Genre.create({genre:'Non-Fiction'}),
            Genre.create({genre:'Fiction'})
        ]);
    });
    describe('GET /genre', () => {
        it.only('gets all genre records', async () => {
          const response = await request(app).get('/genre');  
          expect(response.status).to.equal(200);
          response.body.forEach((genre) => {
            const expected = genres.find((a) => a.id === genre.id);
            expect(genre.genre).to.equal(expected.genre);
          });
        });
        it('returns a 404 if the genre does not exist', async () => {
            const response = await request(app).get('/genre/12345');
            expect(response.status).to.equal(404);
          });
          it('returns an error body if the genre does not exist', async () => {
            const response = await request(app).get('/genre/12345');
            expect(response.body.error.error).to.equal('The genre could not be found.');
          });
      });
      describe('PATCH /genres/:id', () => {
        it('updates genre name by id', async () => {
          const response = await request(app).get('/genre');
          const genre = response.body[0];
          const updatedGenreResponse = await request(app)
            .patch(`/genre/${genre.id}`)
            .send({ genre: 'Historical' });
          const updatedGenreRecord = await Genre.findByPk(genre.id, {
            raw: true,
          });
          expect(updatedGenreResponse.status).to.equal(200);
          expect(updatedGenreRecord.genre).to.equal('Historical');
        });
        it('returns a 404 if the genre does not exist', async () => {
          const response = await request(app)
            .patch('/genre/12345')
            .send({ genre: 'Historical' });  
          expect(response.status).to.equal(404);
          expect(response.body.error).to.equal('The genre could not be found.');
        });
      });
      describe('DELETE /genres/:id', () => {
        it('deletes genre record by id', async () => {
          const response = await request(app).get('/genre');
          const genre = response.body[0];
          const updatedGenreResponse = await request(app).delete(`/genre/${genre.id}`);
          const deletedGenre = await Genre.findByPk(genre.id, { raw: true });
          expect(updatedGenreResponse.status).to.equal(204);
          expect(deletedGenre).to.equal(null);
        });  
        it('returns a 404 if the genre does not exist', async () => {
          const response = await request(app).delete('/genre/12345');
          expect(response.status).to.equal(404);
          expect(response.body.error).to.equal('The genre could not be found.');
        });
    });
});
});