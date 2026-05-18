const express = require('express');
const router = express.Router();
const trainController = require('../controllers/trainController');

router.post('/search', trainController.searchTrains);
router.get('/:trainId', trainController.getTrainDetails);
router.post('/:trainId/book', trainController.bookTrain);

module.exports = router;
