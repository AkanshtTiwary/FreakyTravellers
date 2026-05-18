const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travelController');

router.post('/create', travelController.createTrip);
router.get('/:tripId', travelController.getTrip);
router.get('/', travelController.getAllTrips);
router.put('/:tripId', travelController.updateTrip);
router.delete('/:tripId', travelController.deleteTrip);

module.exports = router;
