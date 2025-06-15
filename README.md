# Library Management System API

A comprehensive RESTful API for managing library operations including book management, user management, borrowing/returning books, and more.

## Features

- User authentication and authorization
- Book management (add, update, delete, search)
- Borrowing and returning books
- User profile management
- Notifications for due dates
- Role-based access control
- API documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Mocha, Chai, Supertest
- **Linting**: ESLint
- **Code Formatting**: Prettier

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (v6 or higher) or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/bluespringstest/bookLibraryApi.git
   cd bookLibraryApi
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. **Database setup**
   - Create a MySQL database
   - Update the database configuration in `.env`
   - Run database migrations:
     ```bash
     npm run migrate
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database with test data

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── tests/            # Test files
│   ├── integration/  # Integration tests
│   └── unit/         # Unit tests
├── utils/            # Utility functions
└── validators/       # Request validators
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
