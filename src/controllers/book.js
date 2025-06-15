import { createItem, readItAll, getItemById, updateItem, deleteItem } from '../controllers/helper.js';

export const create = (req, res) => createItem(res, 'book', req.body);

export const read = (_, res) => readItAll(res, 'book');

export const readById = (req, res) => getItemById(res, 'book', req.params.id);

export const update = (req, res) => updateItem(req.body, res, 'book', req.params.id);

export const deleteBook = (req, res) => deleteItem(res, 'book', req.params.id);