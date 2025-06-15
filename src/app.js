import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import xss from 'xss-clean';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import config from './config/config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';

// Import routes
import readersRouter from './routes/reader.js';
import bookRouter from './routes/book.js';
import authorRouter from './routes/author.js';
import genreRouter from './routes/genre.js';
import borrowingRouter from './routes/borrowing.routes.js';
import saleRouter from './routes/sale.routes.js';
import userRouter from './routes/user.routes.js';
import notificationRouter from './routes/notification.routes.js';

// Initialize express app
const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Initialize scheduler service
import schedulerService from './services/scheduler.service.js';



// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description: 'API documentation for the Library Management System',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.appUrl,
  credentials: true,
}));
app.use(xss()); // Prevent XSS attacks
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Logging in development
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/borrowings', borrowingRouter);
app.use('/api/v1/sales', saleRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/authors', authorRouter);
app.use('/api/v1/genres', genreRouter);
app.use('/api/v1/readers', readersRouter);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
