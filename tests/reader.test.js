const { expect } = require('chai');
const request = require('supertest');
const { Reader } = require('../src/models');
const app = require('../src/app');

describe('/reader', () => {
    before(async() => Reader.sequelize.sync());
    beforeEach(async() => {
        await Reader.destroy({ where: {} });
    })
    describe('with no records in the database', () => {
        describe('POST /readers', () => {
            it('creates a new reader in the database', async () => {
                const response = await request(app).post('/readers').send({
                    name: 'Yamazaki Suntory',
                    email: 'southside@sharklazers.com'
                });
                console.log(response)
                const newReaderRecord = await Reader.findByPk(response.body.id, { raw: true });
                console.log(newReaderRecord)
                expect(response.status).to.equal(201)
                expect(response.body.name).to.equal('Yamazaki Suntory');
                expect(newReaderRecord.name).to.equal('Yamazaki Suntory');
                expect(newReaderRecord.email).to.equal('southside@sharklazers.com');
            });
        });
    });
});