const express = require('express');
const router = express.Router();
const travelPlanController = require('../controllers/travelPlanController');

router.post('/generate', travelPlanController.generatePlan);
router.get('/:planId', travelPlanController.getPlan);
router.post('/:planId/optimize', travelPlanController.optimizePlan);

module.exports = router;
