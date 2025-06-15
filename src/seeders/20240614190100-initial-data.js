'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert initial genres
    const genres = await queryInterface.bulkInsert('Genres', [
      {
        name: 'Fiction',
        description: 'Works of fiction including novels, short stories, and novellas.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Science Fiction',
        description: 'Fiction that deals with futuristic concepts, space travel, time travel, etc.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Fantasy',
        description: 'Fiction with magical or supernatural elements that do not exist in the real world.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mystery',
        description: 'Fiction that involves solving a crime or puzzle.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Non-Fiction',
        description: 'Prose writing that is based on facts, real events, and real people.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    // Insert initial authors
    const authors = await queryInterface.bulkInsert('Authors', [
      {
        name: 'J.K. Rowling',
        biography: 'British author best known for the Harry Potter series.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'George R.R. Martin',
        biography: 'American novelist and short-story writer, best known for A Song of Ice and Fire series.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Agatha Christie',
        biography: 'English writer known for her detective novels and short story collections.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Yuval Noah Harari',
        biography: 'Israeli public intellectual, historian, and professor at the Hebrew University of Jerusalem.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    // Insert initial admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const users = await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@library.com',
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Librarian',
        lastName: 'User',
        email: 'librarian@library.com',
        password: adminPassword,
        role: 'librarian',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Member',
        lastName: 'User',
        email: 'member@library.com',
        password: adminPassword,
        role: 'member',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    // Insert sample books
    const books = await queryInterface.bulkInsert('Books', [
      {
        id: uuidv4(),
        isbn: '9780747532743',
        title: 'Harry Potter and the Philosopher\'s Stone',
        description: 'The first novel in the Harry Potter series and J.K. Rowling\'s debut novel.',
        publishedDate: new Date('1997-06-26'),
        publisher: 'Bloomsbury',
        pageCount: 223,
        language: 'English',
        totalCopies: 5,
        availableCopies: 3,
        authorId: authors[0],
        genreId: genres[2], // Fantasy
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        isbn: '9780553103540',
        title: 'A Game of Thrones',
        description: 'The first book in the epic fantasy series A Song of Ice and Fire.',
        publishedDate: new Date('1996-08-06'),
        publisher: 'Bantam Spectra',
        pageCount: 694,
        language: 'English',
        totalCopies: 3,
        availableCopies: 1,
        authorId: authors[1],
        genreId: genres[2], // Fantasy
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        isbn: '9780007113804',
        title: 'Murder on the Orient Express',
        description: 'A detective novel featuring the Belgian detective Hercule Poirot.',
        publishedDate: new Date('1934-01-01'),
        publisher: 'Collins Crime Club',
        pageCount: 256,
        language: 'English',
        totalCopies: 2,
        availableCopies: 2,
        authorId: authors[2],
        genreId: genres[3], // Mystery
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        isbn: '9780099590088',
        title: 'Sapiens: A Brief History of Humankind',
        description: 'A book by Yuval Noah Harari, first published in Hebrew in Israel in 2011.',
        publishedDate: new Date('2011-01-01'),
        publisher: 'Harvill Secker',
        pageCount: 443,
        language: 'English',
        totalCopies: 4,
        availableCopies: 4,
        authorId: authors[3],
        genreId: genres[4], // Non-Fiction
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    // Create some sample borrowings
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    await queryInterface.bulkInsert('Borrowings', [
      {
        id: uuidv4(),
        userId: users[2].id, // Member user
        bookId: books[0].id, // Harry Potter
        borrowedAt: new Date(),
        dueDate: twoWeeksFromNow,
        status: 'borrowed',
        fineAmount: 0,
        finePaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: users[2].id, // Member user
        bookId: books[1].id, // A Game of Thrones
        borrowedAt: new Date(),
        dueDate: twoWeeksFromNow,
        status: 'borrowed',
        fineAmount: 0,
        finePaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all data from tables in reverse order
    await queryInterface.bulkDelete('Borrowings', null, {});
    await queryInterface.bulkDelete('Reviews', null, {});
    await queryInterface.bulkDelete('Books', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Authors', null, {});
    await queryInterface.bulkDelete('Genres', null, {});
  },
};
