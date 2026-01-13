const { Sequelize } = require('sequelize');
const ReaderModel = require('./reader');
const BookModel = require('./book');
const AuthorModel = require('./author');
const GenreModel = require('./genre');

const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_SSL } = process.env;

const setupDatabase = () => {
    const connection = new Sequelize(POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, {
        host: POSTGRES_SERVER,
        port: POSTGRES_PORT,
        dialect: 'postgres',
        logging: false,
        ssl: POSTGRES_SSL === 'true' ? true : false,
    });
    const Reader = ReaderModel(connection, Sequelize);
    const Book = BookModel(connection, Sequelize);
    const Author = AuthorModel(connection, Sequelize);
    const Genre = GenreModel(connection, Sequelize);

    // Ensure the connection is authenticated before syncing
    const init = async () => {
        try {
            await connection.authenticate();
            await connection.sync({ alter: true });
            console.log('Database connection authenticated and models synced');
        } catch (err) {
            console.error('Unable to connect or sync the database:', err.message || err);
            throw err;
        }
        return { Reader, Book, Author, Genre, connection };
    };

    return { Reader, Book, Author, Genre, init };
};

module.exports = setupDatabase();
