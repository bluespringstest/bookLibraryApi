const express = require('express');
const readersController = require('../controllers/reader');
const router = express.Router();

const app = express();

app.use(express.json());

router.post('/', readersController.create);
router.get('/', readersController.read);
router.get('/:id', readersController.readById);
router.patch('/:id', readersController.update);
router.delete('/:id', readersController.delete);


module.exports = router;