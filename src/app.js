const express = require('express');
const readersRouter = require('./routes/reader')
const bookRouter = require('./routes/book')

const app = express();

app.use(express.json());

app.get('/', (req, res) =>{
    res.status(200).json({result: 'Hello World'});
});

app.use('/readers', readersRouter);

app.use('/book', bookRouter);

module.exports = app;
