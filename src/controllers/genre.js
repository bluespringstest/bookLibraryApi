const { createItem, readItAll, getItemById, updateItem, deleteItem } = require('../controllers/helper')


exports.create = (req, res) => createItem(res, 'genre', req.body);

exports.read = (_, res) => readItAll(res, 'genre');

exports.readById = (req, res) => getItemById(res, 'genre', req.params.id);

exports.update = (req, res) => updateItem(req.body, res, 'genre', req.params.id);

exports.delete = (req, res) => deleteItem(res, 'genre', req.params.id);