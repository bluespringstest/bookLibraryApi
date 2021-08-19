const { Book } = require('../models');
const { createItem } = require('../controllers/helper')


exports.create = async (req, res) => createItem(res, 'book', req.body);

exports.read = async (_, res) => {
    try{
        const book = await Book.findAll();
    res.status(200).json(book);
    } catch(err){
        console.log(err)
    }
};

exports.readById = async(req, res) => {
    const bookId = req.params.id;
    const book = await Book.findByPk(bookId);

    if(!book){
        try {
            throw 'The book could not be found.'
        } catch (e) {
            res.status(404).send({error: e})
        }
    } else {
        res.status(200).json(book);
    }

};

exports.update = async(req, res) => {
    const updateData = req.body;
    const bookId = req.params.id;
    try {
        const book = await Book.findByPk(bookId);
        const updatedRows = await Book.update(updateData, {where: {id: bookId} });
         if (!book)
         try {
            throw 'The book could not be found.'
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
        const book = await Book.findByPk(bookId);
        const deletedRows = await Book.destroy({where: {id: bookId}});
        if (!book)
        try {
           throw 'The book could not be found.'
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