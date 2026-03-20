/**
 * Train Routes
 * All train-related API endpoints
 */

const express = require('express');
const trainController = require('../controllers/trainController');

const router = express.Router();

/**
 * @route   GET /api/trains/between
 * @desc    Get trains between two stations
 * @example /api/trains/between?from=Delhi&to=Mumbai
 */
router.get('/between', trainController.getTrainsBetweenStations);

/**
 * @route   GET /api/trains/on-date
 * @desc    Get trains on a specific date
 * @example /api/trains/on-date?from=Delhi&to=Mumbai&date=22-03-2026
 */
router.get('/on-date', trainController.getTrainsOnDate);

/**
 * @route   GET /api/trains/info
 * @desc    Get detailed train information
 * @example /api/trains/info?trainNo=12345
 */
router.get('/info', trainController.getTrainInfo);

/**
 * @route   GET /api/trains/route
 * @desc    Get train complete route
 * @example /api/trains/route?trainNo=12345
 */
router.get('/route', trainController.getTrainRoute);

/**
 * @route   GET /api/trains/cheapest
 * @desc    Get cheapest trains (sorted by duration, assuming cheaper for shorter routes)
 * @example /api/trains/cheapest?from=Delhi&to=Mumbai
 */
router.get('/cheapest', trainController.getCheapestTrains);

/**
 * @route   GET /api/trains/fastest
 * @desc    Get fastest trains
 * @example /api/trains/fastest?from=Delhi&to=Mumbai
 */
router.get('/fastest', trainController.getFastestTrains);

/**
 * @route   GET /api/trains/early-morning
 * @desc    Get early morning trains (5 AM - 12 PM)
 * @example /api/trains/early-morning?from=Delhi&to=Mumbai&date=22-03-2026
 */
router.get('/early-morning', trainController.getEarlyMorningTrains);

/**
 * @route   GET /api/trains/evening
 * @desc    Get evening trains (4 PM - 11:59 PM)
 * @example /api/trains/evening?from=Delhi&to=Mumbai&date=22-03-2026
 */
router.get('/evening', trainController.getEveningTrains);

/**
 * @route   GET /api/trains/search
 * @desc    Advanced train search with filters
 * @example /api/trains/search?from=Delhi&to=Mumbai&date=22-03-2026&sort=departure
 */
router.get('/search', trainController.searchTrains);

/**
 * @route   GET /api/trains/stations
 * @desc    Get all available stations
 */
router.get('/stations', trainController.getStations);

module.exports = router;
