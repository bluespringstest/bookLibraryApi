# bookLibraryApi
An API that allows users to check in and check out books.

## Database Configuration

This application supports PostgreSQL database connectivity. The database configuration is managed through environment variables.

### Environment Variables

Create a `.env` file in the root directory with the following PostgreSQL configuration:

```env
# PostgreSQL Configuration
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=library_db
POSTGRES_SSL=false
```

For testing, create a `.test.env` file with test database configuration:

```env
# Test PostgreSQL Configuration
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_test_username
POSTGRES_PASSWORD=your_test_password
POSTGRES_DB=library_test_db
POSTGRES_SSL=false
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your PostgreSQL database environment variables (see above)

## Running the Application

### Development Mode
```bash
npm start
```

This will start the server with nodemon, automatically restarting on file changes.

### Database Setup
Before running the application for the first time, create the database:
```bash
npm run prestart
```

## Running Tests

### PostgreSQL Connection Test
Run this test to verify PostgreSQL configuration without requiring an active database:
```bash
npm test -- tests/postgres-connection.test.js
```
This test will skip if PostgreSQL environment variables are not configured.

### Full Test Suite
To run the complete API test suite, you need PostgreSQL running and properly configured:
```bash
npm test
```

This will:
1. Create the test database (if it doesn't exist)
2. Run all tests
3. Drop the test database

**Note**: Full tests require PostgreSQL to be running with the credentials specified in `.test.env`.

### Run Specific Test Files
```bash
# Run PostgreSQL connection tests only (no database required)
npm test -- tests/postgres-connection.test.js

# Run specific API tests (requires PostgreSQL)
npm test -- tests/author.test.js
npm test -- tests/book.test.js
npm test -- tests/genre.test.js
npm test -- tests/reader.test.js
```

### Manual Database Management
```bash
# Create database manually
node scripts/create-database.js

# Drop database manually
node scripts/drop-database.js

# Create test database
node scripts/create-database.js test
```

## API Endpoints

The API provides endpoints for managing books, authors, genres, and readers. All endpoints return JSON responses.

### Books
- `GET /books` - Get all books
- `POST /books` - Create a new book
- `GET /books/:id` - Get a specific book
- `PUT /books/:id` - Update a book
- `DELETE /books/:id` - Delete a book

### Authors
- `GET /authors` - Get all authors
- `POST /authors` - Create a new author
- `GET /authors/:id` - Get a specific author
- `PUT /authors/:id` - Update an author
- `DELETE /authors/:id` - Delete an author

### Genres
- `GET /genres` - Get all genres
- `POST /genres` - Create a new genre
- `GET /genres/:id` - Get a specific genre
- `PUT /genres/:id` - Update a genre
- `DELETE /genres/:id` - Delete a genre

### Readers
- `GET /readers` - Get all readers
- `POST /readers` - Create a new reader
- `GET /readers/:id` - Get a specific reader
- `PUT /readers/:id` - Update a reader
- `DELETE /readers/:id` - Delete a reader

## Database Migration

This project has been migrated from MySQL to PostgreSQL. Key changes:

- **Dependencies**: Now uses `pg` instead of `mysql2`
- **Environment Variables**: Uses `POSTGRES_*` prefixed variables
- **Sequelize Dialect**: Changed from 'mysql' to 'postgres'
- **Database Scripts**: Updated for PostgreSQL syntax

The migration maintains all existing functionality while improving database compatibility.

## Project Structure

```
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Database connection
│   ├── utils/          # Utility functions
│   └── validators/     # Input validation
├── scripts/            # Database management scripts
├── tests/              # Test files
├── .env               # Environment variables
├── .test.env          # Test environment variables
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Development

### Adding New Features
1. Create/update models in `src/models/`
2. Add controllers in `src/controllers/`
3. Define routes in `src/routes/`
4. Add validation in `src/validators/`
5. Write tests in `tests/`

### Testing
- Tests are written using Mocha and Chai
- Database tests require PostgreSQL to be running
- Use `.test.env` for test configuration
- Tests automatically create and drop test databases
- PostgreSQL connection test can run without active database
- Full API tests require PostgreSQL server to be running

### Current Test Status
- ✅ PostgreSQL connection test: Passes (skips gracefully when not configured)
- ⚠️ Full API tests: Require active PostgreSQL server with proper credentials
