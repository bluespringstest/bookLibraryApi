const express = require('express');
const genreController = require('../controllers/genre');
const router = express.Router();

const app = express();

app.use(express.json());

router.post('/', genreController.create);
router.get('/', genreController.read);
router.get('/:id', genreController.readById);
router.patch('/:id', genreController.update);
router.delete('/:id', genreController.delete);


module.exports = router;