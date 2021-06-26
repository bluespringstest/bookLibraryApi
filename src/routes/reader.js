const express = require('express');
const readersController = require('../controllers/reader');
const router = express.Router();

const app = express();

app.use(express.json());

router.post('/', readersController.create);

module.exports = router;