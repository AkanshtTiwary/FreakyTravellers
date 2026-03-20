/**
 * Train Facilities Routes
 * All endpoints for checking train facilities and amenities
 */

const express = require('express');
const facilitiesController = require('../controllers/facilitiesController');

const router = express.Router();

/**
 * @route   GET /api/facilities/by-class
 * @desc    Get facilities for specific train class
 * @example /api/facilities/by-class?class=2A
 */
router.get('/by-class', facilitiesController.getFacilitiesByClass);

/**
 * @route   GET /api/facilities/by-type
 * @desc    Get facilities for train type
 * @example /api/facilities/by-type?type=RAJDHANI
 */
router.get('/by-type', facilitiesController.getFacilitiesByType);

/**
 * @route   GET /api/facilities/by-comfort
 * @desc    Get facilities by comfort level
 * @example /api/facilities/by-comfort?level=premium
 */
router.get('/by-comfort', facilitiesController.getFacilitiesByComfort);

/**
 * @route   GET /api/facilities/check
 * @desc    Check if train has specific facility
 * @example /api/facilities/check?trainType=RAJDHANI&facility=wifi
 */
router.get('/check', facilitiesController.checkSpecificFacility);

/**
 * @route   GET /api/facilities/best-value
 * @desc    Get best value facilities
 */
router.get('/best-value', facilitiesController.getBestValue);

/**
 * @route   GET /api/facilities/compare
 * @desc    Compare facilities of trains on specific route
 * @example /api/facilities/compare?from=Delhi&to=Mumbai&date=22-03-2026
 */
router.get('/compare', facilitiesController.compareFacilities);

/**
 * @route   GET /api/facilities/amenities
 * @desc    Get list of all amenities
 */
router.get('/amenities', facilitiesController.getAmenitiesList);

/**
 * @route   GET /api/facilities/all
 * @desc    Get all facilities reference data
 */
router.get('/all', facilitiesController.getAllFacilities);

module.exports = router;
