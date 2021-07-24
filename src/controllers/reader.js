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
    const readerId = req.params.id;
    try {
        // const reader = await Reader.findByPk(readerId)
        // reader.email = updateData.email
        // const updatedReader = await reader.save();
        // console.log(updatedReader)
        const reader = await Reader.findByPk(readerId);
        const updatedRows = await Reader.update(updateData, {where: {id: readerId} });
        console.log(reader)
         if (!reader)
         try {
            throw 'The reader could not be found.'
        } catch (e) {
            res.status(404).send({error: e})
        }
         else {
             res.sendStatus(200).send(updatedRows);
         }
    } catch (err) {
        res.sendStatus(err);
    }
}

exports.delete = async(req, res) => {
    const readerId = req.params.id;
    console.log(readerId)
    try {
        const reader = await Reader.findByPk(readerId);
        const deletedRows = await Reader.destroy({where: {id: readerId}});
        if (!reader)
        try {
           throw 'The reader could not be found.'
       } catch (e) {
           res.status(404).send({error: e})
       }
        else {
            res.sendStatus(204).send(deletedRows);
        }
   } catch (err) {
       res.sendStatus(err);
   }

};