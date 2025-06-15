import express from 'express';
import { create, read, readById, update, deleteBook } from '../controllers/book.js';

const router = express.Router();

router.post('/', create);
router.get('/', read);
router.get('/:id', readById);
router.patch('/:id', update);
router.delete('/:id', deleteBook);

export default router;