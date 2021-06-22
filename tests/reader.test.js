const { reader } = require('../src/models')

describe('/reader', () => {
    before(async() => Reader.sequelize.sync());
    beforeEach(async() => {
        await Reader.destroy({ where: {} });
    })
});