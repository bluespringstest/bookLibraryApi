const { Reader } = require('../models');


exports.create = async (req, res) => {
    const newReader = await Reader.create(req.body);
    res.status(201).json(newReader);
}

exports.read = async (_, res) => {
    const readers = await Reader.create();
};

exports.readById = async(req, res) => {};

exports.update = async(req, res) => {};

exports.delete = async(req, res) => {};