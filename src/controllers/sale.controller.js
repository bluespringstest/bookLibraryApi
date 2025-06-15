import { Op } from 'sequelize';
import { Reader, Sale, SaleItem, Book, InventoryTransaction } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Constants
const TAX_RATE = 0.08; // 8% tax rate
const MAX_ITEMS_PER_SALE = 20;

/**
 * Create a new sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSale = async (req, res) => {
  const transaction = await Sale.sequelize.transaction();
  
  try {
    const { customerName, customerEmail, customerPhone, notes } = req.body;
    const userId = req.user.id;
    
    // Create a new sale
    const sale = await Sale.create({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      status: 'pending',
      paymentStatus: 'pending',
    }, { transaction });
    
    await transaction.commit();
    
    return successResponse(res, { sale }, 'Sale created successfully', 201);
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Add items to a sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSaleItems = async (req, res) => {
  const transaction = await Sale.sequelize.transaction();
  
  try {
    const { saleId } = req.params;
    const { items } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'At least one item is required');
    }
    
    if (items.length > MAX_ITEMS_PER_SALE) {
      throw new ApiError(400, `Maximum ${MAX_ITEMS_PER_SALE} items allowed per sale`);
    }
    
    // Find the sale
    const sale = await Sale.findByPk(saleId, { transaction });
    if (!sale) {
      throw new ApiError(404, 'Sale not found');
    }
    
    // Check if sale is already completed
    if (sale.status === 'completed') {
      throw new ApiError(400, 'Cannot add items to a completed sale');
    }
    
    // Process each item
    const saleItems = [];
    const bookIds = items.map(item => item.bookId);
    
    // Get all books in a single query
    const books = await Book.findAll({
      where: { id: { [Op.in]: bookIds } },
      transaction
    });
    
    const bookMap = new Map(books.map(book => [book.id, book]));
    
    // Validate and prepare sale items
    for (const item of items) {
      const book = bookMap.get(item.bookId);
      
      if (!book) {
        throw new ApiError(404, `Book with ID ${item.bookId} not found`);
      }
      
      if (book.inStock < (item.quantity || 1)) {
        throw new ApiError(400, `Not enough stock for book: ${book.title}. Available: ${book.inStock}`);
      }
      
      // Use book's sale price or default to retail price
      const unitPrice = book.salePrice || book.retailPrice;
      
      if (!unitPrice || unitPrice <= 0) {
        throw new ApiError(400, `Invalid price for book: ${book.title}`);
      }
      
      const saleItem = await SaleItem.create({
        saleId,
        bookId: book.id,
        quantity: item.quantity || 1,
        unitPrice,
        discount: item.discount || 0,
        taxRate: book.taxable ? TAX_RATE * 100 : 0, // Convert to percentage
      }, { transaction });
      
      saleItems.push(saleItem);
    }
    
    // Recalculate sale totals
    await sale.calculateTotals();
    
    await transaction.commit();
    
    return successResponse(res, { items: saleItems }, 'Items added to sale successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Process payment for a sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processPayment = async (req, res) => {
  const transaction = await Sale.sequelize.transaction();
  
  try {
    const { saleId } = req.params;
    const { paymentMethod, paymentDetails = {} } = req.body;
    const userId = req.user.id;
    
    // Find the sale with items
    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Book,
              as: 'book',
            },
          ],
        },
      ],
      transaction,
    });
    
    if (!sale) {
      throw new ApiError(404, 'Sale not found');
    }
    
    // Check if sale is already completed
    if (sale.status === 'completed') {
      throw new ApiError(400, 'Sale is already completed');
    }
    
    // Validate payment method
    const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'mobile_money', 'bank_transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method');
    }
    
    // In a real app, you would integrate with a payment processor here
    // This is a simplified example
    let paymentResult;
    try {
      // Simulate payment processing
      paymentResult = {
        success: true,
        transactionId: `PAY-${Date.now()}`,
        amount: sale.totalAmount,
        currency: 'USD',
        timestamp: new Date().toISOString(),
      };
      
      // Simulate a small chance of payment failure (for testing)
      if (Math.random() < 0.05) { // 5% chance of failure
        throw new Error('Payment declined: Insufficient funds');
      }
    } catch (paymentError) {
      // Log payment failure
      console.error('Payment processing failed:', paymentError);
      
      // Update sale with payment failure
      await sale.update({
        paymentStatus: 'failed',
        paymentMethod,
        paymentDetails: {
          ...paymentDetails,
          error: paymentError.message,
        },
      }, { transaction });
      
      throw new ApiError(402, `Payment failed: ${paymentError.message}`);
    }
    
    // Update sale with payment success
    await sale.update({
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        ...paymentResult,
      },
    }, { transaction });
    
    // Update inventory for each item
    for (const item of sale.items) {
      // Create inventory transaction
      await InventoryTransaction.create({
        bookId: item.bookId,
        quantity: -item.quantity, // Negative for sales (reducing inventory)
        transactionType: 'sale',
        referenceId: sale.id,
        referenceType: 'sale',
        notes: `Sold ${item.quantity} ${item.quantity > 1 ? 'copies' : 'copy'} of ${item.book.title}`,
        createdBy: userId,
      }, { transaction });
      
      // Update book inventory
      await item.book.decrement('inStock', { 
        by: item.quantity,
        transaction 
      });
    }
    
    // Generate receipt
    const receipt = await sale.generateReceipt();
    
    await transaction.commit();
    
    return successResponse(res, { 
      sale: {
        id: sale.id,
        status: sale.status,
        paymentStatus: sale.paymentStatus,
        totalAmount: sale.totalAmount,
        receipt,
      }
    }, 'Payment processed successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get sale details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Find the sale with items and related data
    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Book,
              as: 'book',
              attributes: ['id', 'title', 'isbn', 'coverImage'],
            },
          ],
        },
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
    
    if (!sale) {
      throw new ApiError(404, 'Sale not found');
    }
    
    // Only allow staff or the user who made the sale to view it
    if (userRole !== 'admin' && userRole !== 'librarian' && sale.userId !== userId) {
      throw new ApiError(403, 'Not authorized to view this sale');
    }
    
    return successResponse(res, { sale });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * List sales with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      customerEmail,
      customerPhone,
    } = req.query;
    
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Build where clause
    const where = {};
    
    // Regular users can only see their own sales
    if (userRole !== 'admin' && userRole !== 'librarian') {
      where.userId = userId;
    }
    
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerEmail) where.customerEmail = customerEmail;
    if (customerPhone) where.customerPhone = customerPhone;
    
    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    
    // Get paginated results
    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page, 10),
      items: sales,
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Generate a receipt for a sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateReceipt = async (req, res) => {
  try {
    const { saleId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Find the sale
    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Book,
              as: 'book',
              attributes: ['id', 'title', 'isbn'],
            },
          ],
        },
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
    
    if (!sale) {
      throw new ApiError(404, 'Sale not found');
    }
    
    // Only allow staff or the user who made the sale to view the receipt
    if (userRole !== 'admin' && userRole !== 'librarian' && sale.userId !== userId) {
      throw new ApiError(403, 'Not authorized to view this receipt');
    }
    
    // Generate receipt data
    const receipt = await sale.generateReceipt();
    
    // In a real app, you might want to generate a PDF here
    // For now, we'll return the receipt data as JSON
    
    return successResponse(res, { receipt });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export { createSale, addSaleItems, processPayment, getSale, listSales, generateReceipt };
