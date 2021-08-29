const { createItem, readItAll, getItemById, updateItem, deleteItem } = require('../controllers/helper')


exports.create = (req, res) => createItem(res, 'book', req.body);

exports.read = (_, res) => readItAll(res, 'book');

exports.readById = (req, res) => getItemById(res, 'book', req.params.id);

exports.update = (req, res) => updateItem(req.body, res, 'book', req.params.id);

exports.delete = (req, res) => deleteItem(res, 'book', req.params.id);