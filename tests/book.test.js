const { expect } = require('chai');
const request = require('supertest');
const { Book } = require('../src/models');
const app = require('../src/app');

describe('/readers', () => {
  before(async () => Book.sequelize.sync());

describe('with no records in the database', () => {
    describe('POST /book', () => {
      it.only('creates a new book in the database', async () => {
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

// describe('with records in the database', () => {
//     let readers;

//     beforeEach(async () => {
//       await Reader.destroy({ where: {}});
//       readers = await Promise.all([
//         Reader.create({name: 'Joe Abercrombie',email: 'firstlaw@trilogies.com', lassword: 'password'}),
//         Reader.create({ name: 'Arya Stark', email: 'vmorgul@me.com' , password: 'lassword'}),
//         Reader.create({ name: 'Lyra Belacqua', email: 'northbear@lights.org', password: 'lassword'}),
//       ]);
//     });

//     describe('GET /readers', () => {
//       it('gets all readers records', async () => {
//         const response = await request(app).get('/readers');  
//         expect(response.status).to.equal(200);
//         expect(response.body.length).to.equal(3);
  
//         response.body.forEach((reader) => {
//           const expected = readers.find((a) => a.id === reader.id);
  
//           expect(reader.name).to.equal(expected.name);
//           expect(reader.email).to.equal(expected.email);
//         });
//       });
//     });
//     describe('GET /readers/:id', () => {
//       it('gets readers record by id', async () => {
//         const reader = readers[0];
//         const response = await request(app).get(`/readers/${reader.id}`);
//         expect(response.status).to.equal(200);
//         expect(response.body.name).to.equal(reader.name);
//         expect(response.body.email).to.equal(reader.email);
//       });

//       it('returns a 404 if the reader does not exist', async () => {
//         const response = await request(app).get('/readers/12345');
//         expect(response.status).to.equal(404);
//       });
//       it('returns an error body if the reader does not exist', async () => {
//         const response = await request(app).get('/readers/12345');
//         expect(response.body.error).to.equal('The reader could not be found.');
//       });
//     });
//     describe('PATCH /readers/:id', () => {
//       it('updates readers email by id', async () => {
//         const response = await request(app).get('/readers');
//         const reader = response.body[0];
//         const updatedReaderResponse = await request(app)
//           .patch(`/readers/${reader.id}`)
//           .send({ email: 'miss_e_bennet@gmail.com' });
//         const updatedReaderRecord = await Reader.findByPk(reader.id, {
//           raw: true,
//         });
//         expect(updatedReaderResponse.status).to.equal(200);
//         expect(updatedReaderRecord.email).to.equal('miss_e_bennet@gmail.com');
//       });
//       it('returns a 404 if the reader does not exist', async () => {
//         const response = await request(app)
//           .patch('/readers/12345')
//           .send({ email: 'some_new_email@gmail.com' });
//           console.log(response.params)
  
//         expect(response.status).to.equal(404);
//         expect(response.body.error).to.equal('The reader could not be found.');
//       });
//     });
//     describe('DELETE /readers/:id', () => {
//       it('deletes reader record by id', async () => {
//         const response = await request(app).get('/readers');
//         const reader = response.body[0];
//         const updatedReaderResponse = await request(app).delete(`/readers/${reader.id}`);
//         const deletedReader = await Reader.findByPk(reader.id, { raw: true });
//         expect(updatedReaderResponse.status).to.equal(204);
//         expect(deletedReader).to.equal(null);
//       });  
//       it('returns a 404 if the reader does not exist', async () => {
//         const response = await request(app).delete('/readers/12345');
//         expect(response.status).to.equal(404);
//         expect(response.body.error).to.equal('The reader could not be found.');
//       });
//   });
// });
});