const { Book } = require('../models');


exports.create = async (req, res) => {
    const newBook = await Book.create(req.body);
    res.status(201).json(newBook);
}

exports.read = async (_, res) => {
    try{
        const look = await Book.findAll();
    res.status(200).json(look);
    } catch(err){
        console.log(err)
    }
};

exports.readById = async(req, res) => {
    const bookId = req.params.id;
    const Book = await Book.findByPk(bookId);

    if(!Book){
        try {
            throw 'The Book could not be found.'
        } catch (e) {
            res.status(404).send({error: e})
        }
    } else {
        res.status(200).json(Book);
    }

};

exports.update = async(req, res) => {
    const updateData = req.body;
    const bookId = req.params.id;
    try {
        const Book = await Book.findByPk(bookId);
        const updatedRows = await Book.update(updateData, {where: {id: bookId} });
        console.log(Book)
         if (!Book)
         try {
            throw 'The Book could not be found.'
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
    const bookId = req.params.id;
    try {
        const Book = await Book.findByPk(bookId);
        const deletedRows = await Book.destroy({where: {id: bookId}});
        if (!Book)
        try {
           throw 'The Book could not be found.'
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