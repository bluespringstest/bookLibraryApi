// Simple, editable seed script for development
// Edit the arrays below to change seeded data

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const models = require('../src/models');

// Editable sample data
const SAMPLE_AUTHORS = [
  { name: 'J. R. R. Tolkien' },
  { name: 'Agatha Christie' },
  { name: 'Isaac Asimov' },
];

const SAMPLE_GENRES = [
  { genre: 'Fantasy' },
  { genre: 'Mystery' },
  { genre: 'Science Fiction' },
];

const SAMPLE_BOOKS = [
  // Use author name to find authorId after authors are created
  { title: 'The Hobbit', authorName: 'J. R. R. Tolkien', genre: 'Fantasy', ISBN: '978-0618968633' },
  { title: 'Murder on the Orient Express', authorName: 'Agatha Christie', genre: 'Mystery', ISBN: '978-0062073501' },
  { title: 'Foundation', authorName: 'Isaac Asimov', genre: 'Science Fiction', ISBN: '978-0553293357' },
];

const SAMPLE_READERS = [
  { name: 'Alice', email: 'alice@example.com', password: 'password123' },
  { name: 'Bob', email: 'bob@example.com', password: 'password123' },
];

async function seed() {
  try {
    // Ensure DB connection and models are initialized
    if (typeof models.init === 'function') {
      await models.init();
    }

    const { Author, Genre, Book, Reader } = models;

    // Clear existing data (optional) - comment out if you want to keep data
    await Book.destroy({ where: {} });
    await Reader.destroy({ where: {} });
    await Author.destroy({ where: {} });
    await Genre.destroy({ where: {} });

    console.log('Seeding authors...');
    const createdAuthors = await Promise.all(SAMPLE_AUTHORS.map(a => Author.create(a)));

    console.log('Seeding genres...');
    const createdGenres = await Promise.all(SAMPLE_GENRES.map(g => Genre.create(g)));

    // Helper maps
    const authorByName = {};
    createdAuthors.forEach(a => { authorByName[a.name] = a; });

    const genreByName = {};
    createdGenres.forEach(g => { genreByName[g.genre] = g; });

    console.log('Seeding books...');
    for (const b of SAMPLE_BOOKS) {
      const author = authorByName[b.authorName];
      const genre = genreByName[b.genre];
      await Book.create({
        title: b.title,
        author: author ? author.name : b.authorName,
        genre: genre ? genre.genre : b.genre,
        ISBN: b.ISBN,
      });
    }

    console.log('Seeding readers...');
    await Promise.all(SAMPLE_READERS.map(r => Reader.create(r)));

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  }
}

seed();
