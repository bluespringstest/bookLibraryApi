import { createItem, readItAll, getItemById, updateItem, deleteItem } from '../controllers/helper.js';

export const create = (req, res) => createItem(res, 'author', req.body);

export const read = (_, res) => readItAll(res, 'author');

export const readById = (req, res) => getItemById(res, 'author', req.params.id);

export const update = (req, res) => updateItem(req.body, res, 'author', req.params.id);

export const deleteAuthor = (req, res) => deleteItem(res, 'author', req.params.id);