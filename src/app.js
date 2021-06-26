const express = require('express');
const readersRouter = require('./routes/reader')

const app = express();

app.use(express.json());

app.get('/', (req, res) =>{
    res.status(200).json({result: 'Hello World'});
});

app.use('/readers', readersRouter);

module.exports = app;
