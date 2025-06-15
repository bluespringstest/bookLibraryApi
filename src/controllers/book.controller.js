import { Op } from 'sequelize';
import { Book, Author, Genre, Borrowing } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get all books with pagination, search, and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    const { search, author, genre, available } = req.query;
    
    // Build where clause for search and filters
    const where = {};
    
    // Search by title or ISBN
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { isbn: { [Op.like]: `%${search}%` } },
      ];
    }
    
    // Filter by author
    if (author) {
      where['$author.id$'] = author;
    }
    
    // Filter by genre
    if (genre) {
      where['$genre.id$'] = genre;
    }
    
    // Filter by availability
    if (available === 'true') {
      where.availableCopies = { [Op.gt]: 0 };
    } else if (available === 'false') {
      where.availableCopies = { [Op.eq]: 0 };
    }
    
    const { count, rows: books } = await Book.findAndCountAll({
      where,
      include: [
        { model: Author, as: 'author', attributes: ['id', 'name'] },
        { model: Genre, as: 'genre', attributes: ['id', 'name'] },
      ],
      attributes: {
        exclude: ['authorId', 'genreId', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      limit,
      offset,
      order: [['title', 'ASC']],
    });
    
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, {
      totalItems: count,
      totalPages,
      currentPage: page,
      items: books,
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get a single book by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id, {
      include: [
        { model: Author, as: 'author' },
        { model: Genre, as: 'genre' },
        {
          model: Borrowing,
          as: 'borrowings',
          where: { status: 'borrowed' },
          required: false,
          attributes: ['dueDate'],
        },
      ],
    });
    
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    
    return successResponse(res, { book });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Create a new book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBook = async (req, res) => {
  try {
    const {
      isbn,
      title,
      description,
      publishedDate,
      publisher,
      pageCount,
      language,
      coverImage,
      totalCopies = 1,
      authorId,
      genreId,
    } = req.body;
    
    // Check if book with ISBN already exists
    const existingBook = await Book.findOne({ where: { isbn } });
    if (existingBook) {
      throw new ApiError(400, 'Book with this ISBN already exists');
    }
    
    // Check if author exists
    const author = await Author.findByPk(authorId);
    if (!author) {
      throw new ApiError(400, 'Author not found');
    }
    
    // Check if genre exists
    const genre = await Genre.findByPk(genreId);
    if (!genre) {
      throw new ApiError(400, 'Genre not found');
    }
    
    const book = await Book.create({
      isbn,
      title,
      description,
      publishedDate,
      publisher,
      pageCount,
      language,
      coverImage,
      totalCopies,
      availableCopies: totalCopies, // Initially all copies are available
      authorId,
      genreId,
    });
    
    return successResponse(res, { book }, 'Book created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Update a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const book = await Book.findByPk(id);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    
    // If updating totalCopies, adjust availableCopies accordingly
    if (updateData.totalCopies !== undefined) {
      const borrowedCopies = book.totalCopies - book.availableCopies;
      if (updateData.totalCopies < borrowedCopies) {
        throw new ApiError(400, `Cannot reduce total copies below ${borrowedCopies} (currently borrowed)`);
      }
      updateData.availableCopies = updateData.totalCopies - borrowedCopies;
    }
    
    // Check if author exists if being updated
    if (updateData.authorId) {
      const author = await Author.findByPk(updateData.authorId);
      if (!author) {
        throw new ApiError(400, 'Author not found');
      }
    }
    
    // Check if genre exists if being updated
    if (updateData.genreId) {
      const genre = await Genre.findByPk(updateData.genreId);
      if (!genre) {
        throw new ApiError(400, 'Genre not found');
      }
    }
    
    await book.update(updateData);
    
    return successResponse(res, { book }, 'Book updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Delete a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id);
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    
    // Check if there are any active borrowings
    const activeBorrowings = await Borrowing.count({
      where: {
        bookId: id,
        status: 'borrowed',
      },
    });
    
    if (activeBorrowings > 0) {
      throw new ApiError(400, 'Cannot delete book with active borrowings');
    }
    
    await book.destroy();
    
    return successResponse(res, null, 'Book deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Scan a book (add by ISBN)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const scanBook = async (req, res) => {
  try {
    const { isbn } = req.body;
    
    // In a real application, you would call an external API (like Google Books or Open Library)
    // to fetch book details by ISBN. For now, we'll just return a success message.
    // Example: const bookData = await fetchBookByISBN(isbn);
    
    // For now, we'll just return the ISBN as a placeholder
    return successResponse(
      res,
      { isbn, message: 'Book scanned successfully. Please enter the book details.' },
      'Book scanned successfully',
      200
    );
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export { getBooks, getBookById, createBook, updateBook, deleteBook, scanBook };
