const { Book } = require('../models');
const { Reader } = require('../models');
const { Author } = require('../models');
const { Genre } = require('../models')

const get404Error = (model) => ({ error: `The ${model} could not be found.` });

const getModel = (model) => {
    const models = {
        book: Book,
        reader: Reader,
        author: Author,
        genre: Genre
    };
    return models[model];
};

//removes the password for users so that they don't get sent in the responses.
const removePassword = (obj) => {
    if (obj.hasOwnProperty('password')){
        delete obj.password;
    }
    return obj;
}

exports.createItem = async (res, model, item) => {
    const Model = getModel(model);
    try{
        const newItem = await Model.create(item);
        const itemWithoutPassword = removePassword(newItem.get());
        res.status(201).json(itemWithoutPassword);
    }
    catch(error){
        const errorMessages = error.errors.map((e) => e.message);
        res.status(400).json({ errors: errorMessages });
    }
}

exports.readItAll = async (res, model) => {
    const Model = getModel(model)
    try{
        const items = await Model.findAll();
        const itemsWithoutPassword = items.map((item) => {
            return removePassword(item.get());
        });
    res.status(200).json(itemsWithoutPassword);
    } catch(err){
        console.log(err)
    }
};

exports.getItemById = async(res, model, id) => {
    const Model = getModel(model);
    const items = await Model.findByPk(id);
    if(!items){
        try {
            throw get404Error(model)
        } catch (e) {
            res.status(404).send({error: e})
        }
    } else {
        const itemsWithoutPassword = removePassword(items.dataValues);
        res.status(200).json(itemsWithoutPassword);
    }
};

exports.updateItem = async(body, res, model, id) => {
    const Model = getModel(model)
        const items = await Model.findByPk(id);
        const [ updatedRows ] = await Model.update(body, {where: {id} });
         if (!updatedRows)
         {
             res.status(404).json(get404Error(model))
         }
         else {
            const itemsWithoutPassword = removePassword(items.get());
             res.sendStatus(200).json(itemsWithoutPassword);
         }
}

exports.deleteItem = async(res, model, id) => {
    const Model = getModel(model);
        const items = await Model.findByPk(id);
        const deletedRows = await Model.destroy({where: {id} });
        if (!items)
        {
            res.status(404).json(get404Error(model))
        }
        else {
            res.sendStatus(204).send(deletedRows);
        }

};