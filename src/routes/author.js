import express from 'express';
import { create, read, readById, update, deleteAuthor } from '../controllers/author.js';

const router = express.Router();

router.post('/', create);
router.get('/', read);
router.get('/:id', readById);
router.patch('/:id', update);
router.delete('/:id', deleteAuthor);

export default router;