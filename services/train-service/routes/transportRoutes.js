const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');

router.post('/search', transportController.searchTransport);
router.get('/:transportId', transportController.getTransportDetails);
router.post('/:transportId/book', transportController.bookTransport);

module.exports = router;
