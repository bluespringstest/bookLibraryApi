const { Book } = require('../models');
const { Reader } = require('../models');

const getModel = (model) => {
    const models = {
        book: Book,
        reader: Reader
    };
    return models[model];
};

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