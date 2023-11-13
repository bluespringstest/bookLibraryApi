const { createItem, readItAll, getItemById, updateItem, deleteItem } = require('../controllers/helper');


exports.create = async (req, res) => createItem(res, 'reader', req.body);

exports.read = (_, res) => readItAll(res, 'reader')

exports.readById = (req, res) => getItemById(res, 'reader', req.params.id);

exports.update = (req, res) => updateItem(req.body, res, 'reader', req.params.id);

exports.delete = (req, res) => deleteItem(res, 'reader', req.params.id);