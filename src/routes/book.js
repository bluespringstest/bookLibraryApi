const express = require('express');
const bookController = require('../controllers/book');
const router = express.Router();

const app = express();

app.use(express.json());

router.post('/', bookController.create);
router.get('/', bookController.read);
router.get('/:id', bookController.readById);
router.patch('/:id', bookController.update);
router.delete('/:id', bookController.delete);


module.exports = router;