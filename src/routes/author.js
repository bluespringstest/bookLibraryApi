const express = require('express');
const authorController = require('../controllers/author');
const router = express.Router();

const app = express();

app.use(express.json());

router.post('/', authorController.create);
router.get('/', authorController.read);
router.get('/:id', authorController.readById);
router.patch('/:id', authorController.update);
router.delete('/:id', authorController.delete);


module.exports = router;