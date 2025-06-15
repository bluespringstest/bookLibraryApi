import { createItem, readItAll, getItemById, updateItem, deleteItem } from '../controllers/helper.js';

export const create = (req, res) => createItem(res, 'genre', req.body);

export const read = (_, res) => readItAll(res, 'genre');

export const readById = (req, res) => getItemById(res, 'genre', req.params.id);

export const update = (req, res) => updateItem(req.body, res, 'genre', req.params.id);

export const deleteGenre = (req, res) => deleteItem(res, 'genre', req.params.id);