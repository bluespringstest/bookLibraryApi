import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import * as saleController from '../controllers/sale.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales and inventory management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the sale
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The ID of the staff member who processed the sale
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Email of the customer
 *         customerPhone:
 *           type: string
 *           description: Phone number of the customer
 *         subtotal:
 *           type: number
 *           format: float
 *           description: Subtotal amount before tax and discounts
 *         taxAmount:
 *           type: number
 *           format: float
 *           description: Total tax amount
 *         discountAmount:
 *           type: number
 *           format: float
 *           description: Total discount amount
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Total amount after tax and discounts
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Status of the payment
 *         paymentMethod:
 *           type: string
 *           description: Method of payment (e.g., cash, credit card)
 *         status:
 *           type: string
 *           enum: [completed, pending, cancelled]
 *           description: Status of the sale
 *         notes:
 *           type: string
 *           description: Additional notes about the sale
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the sale was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the sale was last updated
 * 
 *     SaleItem:
 *       type: object
 *       required:
 *         - saleId
 *         - bookId
 *         - quantity
 *         - unitPrice
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the sale item
 *         saleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the sale this item belongs to
 *         bookId:
 *           type: string
 *           format: uuid
 *           description: The ID of the book being sold
 *         quantity:
 *           type: integer
 *           description: Number of copies sold
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: Price per unit
 *         discount:
 *           type: number
 *           format: float
 *           description: Discount amount for this item
 *         taxRate:
 *           type: number
 *           format: float
 *           description: Tax rate applied to this item (as a percentage)
 *         totalPrice:
 *           type: number
 *           format: float
 *           description: Total price for this item (including tax and discounts)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the item was added to the sale
 * 
 *     PaymentDetails:
 *       type: object
 *       properties:
 *         paymentMethod:
 *           type: string
 *           enum: [cash, credit_card, debit_card, mobile_money, bank_transfer]
 *           description: Method of payment
 *         cardNumber:
 *           type: string
 *           description: Last 4 digits of the card (for card payments)
 *         cardHolderName:
 *           type: string
 *           description: Name on the card (for card payments)
 *         transactionId:
 *           type: string
 *           description: Transaction ID from the payment processor
 * 
 *     Receipt:
 *       type: object
 *       properties:
 *         saleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the sale
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the sale
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Email of the customer
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the book
 *               isbn:
 *                 type: string
 *                 description: ISBN of the book
 *               quantity:
 *                 type: integer
 *                 description: Number of copies sold
 *               unitPrice:
 *                 type: number
 *                 format: float
 *                 description: Price per unit
 *               discount:
 *                 type: number
 *                 format: float
 *                 description: Discount amount for this item
 *               taxRate:
 *                 type: number
 *                 format: float
 *                 description: Tax rate applied (as a percentage)
 *               totalPrice:
 *                 type: number
 *                 format: float
 *                 description: Total price for this item
 *         subtotal:
 *           type: number
 *           format: float
 *           description: Subtotal before tax and discounts
 *         taxAmount:
 *           type: number
 *           format: float
 *           description: Total tax amount
 *         discountAmount:
 *           type: number
 *           format: float
 *           description: Total discount amount
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Total amount after tax and discounts
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Status of the payment
 *         paymentMethod:
 *           type: string
 *           description: Method of payment
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Name of the customer
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Email of the customer
 *               customerPhone:
 *                 type: string
 *                 description: Phone number of the customer
 *               notes:
 *                 type: string
 *                 description: Additional notes about the sale
 *     responses:
 *       201:
 *         description: Sale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 message:
 *                   type: string
 *                   example: Sale created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  [
    body('customerName').optional().trim().isLength({ min: 2, max: 100 }),
    body('customerEmail').optional().trim().isEmail(),
    body('customerPhone').optional().trim().isLength({ min: 5, max: 20 }),
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  saleController.createSale
);

/**
 * @swagger
 * /api/v1/sales/{saleId}/items:
 *   post:
 *     summary: Add items to a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the sale to add items to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bookId
 *                     - quantity
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       format: uuid
 *                       description: The ID of the book to add to the sale
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Number of copies to add
 *                     discount:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       description: Discount amount for this item
 *     responses:
 *       200:
 *         description: Items added to sale successfully
 *       400:
 *         description: Invalid input or not enough stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale or book not found
 */
router.post(
  '/:saleId/items',
  [
    param('saleId').isUUID().withMessage('Invalid sale ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.bookId').isUUID().withMessage('Invalid book ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
  ],
  validate,
  saleController.addSaleItems
);

/**
 * @swagger
 * /api/v1/sales/{saleId}/process-payment:
 *   post:
 *     summary: Process payment for a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the sale to process payment for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, credit_card, debit_card, mobile_money, bank_transfer]
 *                 description: Method of payment
 *               paymentDetails:
 *                 type: object
 *                 description: Additional payment details
 *                 properties:
 *                   cardNumber:
 *                     type: string
 *                     description: Last 4 digits of the card (for card payments)
 *                   cardHolderName:
 *                     type: string
 *                     description: Name on the card (for card payments)
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid input or payment failed
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Payment declined
 *       404:
 *         description: Sale not found
 */
router.post(
  '/:saleId/process-payment',
  [
    param('saleId').isUUID().withMessage('Invalid sale ID'),
    body('paymentMethod').isIn(['cash', 'credit_card', 'debit_card', 'mobile_money', 'bank_transfer']),
    body('paymentDetails').optional().isObject(),
  ],
  validate,
  saleController.processPayment
);

/**
 * @swagger
 * /api/v1/sales/{saleId}:
 *   get:
 *     summary: Get sale details
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the sale to retrieve
 *     responses:
 *       200:
 *         description: Sale details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view this sale
 *       404:
 *         description: Sale not found
 */
router.get(
  '/:saleId',
  [
    param('saleId').isUUID().withMessage('Invalid sale ID'),
  ],
  validate,
  saleController.getSale
);

/**
 * @swagger
 * /api/v1/sales:
 *   get:
 *     summary: List sales with pagination and filtering
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending, cancelled]
 *         description: Filter by sale status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales created after this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales created before this date (YYYY-MM-DD)
 *       - in: query
 *         name: customerEmail
 *         schema:
 *           type: string
 *         description: Filter by customer email
 *       - in: query
 *         name: customerPhone
 *         schema:
 *           type: string
 *         description: Filter by customer phone number
 *     responses:
 *       200:
 *         description: List of sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       description: Total number of items
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sale'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['completed', 'pending', 'cancelled']),
    query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('customerEmail').optional().trim().isEmail(),
    query('customerPhone').optional().trim().isLength({ min: 5, max: 20 }),
  ],
  validate,
  saleController.listSales
);

/**
 * @swagger
 * /api/v1/sales/{saleId}/receipt:
 *   get:
 *     summary: Generate a receipt for a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the sale to generate a receipt for
 *     responses:
 *       200:
 *         description: Receipt generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     receipt:
 *                       $ref: '#/components/schemas/Receipt'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view this receipt
 *       404:
 *         description: Sale not found
 */
router.get(
  '/:saleId/receipt',
  [
    param('saleId').isUUID().withMessage('Invalid sale ID'),
  ],
  validate,
  saleController.generateReceipt
);

export default router;
