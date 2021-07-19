const { Reader } = require('../models');


exports.create = async (req, res) => {
    const newReader = await Reader.create(req.body);
    res.status(201).json(newReader);
}

exports.read = async (_, res) => {
    try{
        const readers = await Reader.findAll();
    res.status(200).json(readers);
    } catch(err){
        console.log(err)
    }
};

exports.readById = async(req, res) => {
    const readerId = req.params.id;
    const reader = await Reader.findByPk(readerId);

    if(!reader){
        try {
            throw 'The reader could not be found.'
        } catch (e) {
            res.status(404).send({error: e})
        }
    } else {
        res.status(200).json(reader);
    }

};

exports.update = async(req, res) => {
    const updateData = req.body;
    const readerId = req.params;
    try{
        const [ updatedRows ] = await Reader.update(updateData, { where: {id: readerId} });
        if(!updatedRows){
            res.sendStatus(404).json('The reader could not be found.')
        }
        else {
            res.status(200).send();
        }
    } catch(err){
        res.status(404).json('The reader could not be found.')
    }
};

exports.delete = async(req, res) => {};