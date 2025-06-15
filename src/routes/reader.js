import express from 'express';
import { create, read, readById, update, deleteReader } from '../controllers/reader.js';

const router = express.Router();

router.post('/', create);
router.get('/', read);
router.get('/:id', readById);
router.patch('/:id', update);
router.delete('/:id', deleteReader);

export default router;