import express from 'express';
import { create, read, readById, update, deleteGenre } from '../controllers/genre.js';

const router = express.Router();

router.post('/', create);
router.get('/', read);
router.get('/:id', readById);
router.patch('/:id', update);
router.delete('/:id', deleteGenre);

export default router;