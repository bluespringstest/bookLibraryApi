const { createItem, readItAll, getItemById, updateItem, deleteItem } = require('../controllers/helper')


exports.create = (req, res) => createItem(res, 'author', req.body);

exports.read = (_, res) => readItAll(res, 'author');

exports.readById = (req, res) => getItemById(res, 'author', req.params.id);

exports.update = (req, res) => updateItem(req.body, res, 'author', req.params.id);

exports.delete = (req, res) => deleteItem(res, 'author', req.params.id);