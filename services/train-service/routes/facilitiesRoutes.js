const express = require('express');
const router = express.Router();
const facilitiesController = require('../controllers/facilitiesController');

router.get('/all', facilitiesController.getAllFacilities);
router.get('/:facilityId', facilitiesController.getFacilityDetails);

module.exports = router;
