require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const classes = [
  { code: '1A', name: 'First AC', comfort: 'premium', facilities: ['AC', 'Personal Berth', 'Bedding', 'Meals', 'WiFi', 'Charging', 'Toilet', 'Pantry'], capacity: 18, price_factor: 1 },
  { code: '2A', name: 'Second AC', comfort: 'high', facilities: ['AC', 'Shared Berth', 'Bedding', 'Meals', 'WiFi', 'Charging', 'Toilet', 'Pantry'], capacity: 48, price_factor: 0.5 },
  { code: '3A', name: 'Third AC', comfort: 'medium', facilities: ['AC', 'Shared Berth', 'Basic Bedding', 'WiFi', 'Charging (Limited)', 'Toilet', 'Pantry'], capacity: 72, price_factor: 0.27 },
  { code: 'SL', name: 'Sleeper', comfort: 'budget', facilities: ['Open Berth', 'Toilet', 'Pantry', 'Basic WiFi'], capacity: 96, price_factor: 0.13 },
  { code: 'UR', name: 'General/Unreserved', comfort: 'basic', facilities: ['Unreserved Seat', 'Toilet', 'Basic Amenities'], capacity: 200, price_factor: 0.05 }
];
const types = {
  RAJDHANI: { type: 'Express', speed: 'High Speed', typical_classes: ['1A', '2A'], amenities: { food: 'Complimentary Meals', wifi: 'Yes', charging: 'Multiple Points', bedding: 'Complimentary' } },
  SHATABDI: { type: 'Express', speed: 'High Speed Day Train', typical_classes: ['AC 1', 'AC 2', 'Chair Car'], amenities: { food: 'Complimentary Meals', wifi: 'Yes', charging: 'Available', bedding: 'N/A' } },
  EXPRESS: { type: 'Regular', speed: 'Normal', typical_classes: ['1A', '2A', '3A', 'SL', 'UR'], amenities: { food: 'Paid Food Service', wifi: 'Limited', charging: 'Limited', bedding: 'Paid Bedding' } },
  LOCAL: { type: 'Commuter', speed: 'Regular Stops', typical_classes: ['UR', 'SL'], amenities: { food: 'No Service', wifi: 'No', charging: 'No', bedding: 'N/A' } }
};
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
const typeFor = value => { const key = String(value || 'EXPRESS').toUpperCase(); return types[key] || (key.includes('RAJDHANI') ? types.RAJDHANI : key.includes('SHATABDI') ? types.SHATABDI : key.includes('LOCAL') ? types.LOCAL : types.EXPRESS); };
app.get('/', (req, res) => res.json({ success: true, service: 'facilities-service', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ success: true, service: 'facilities-service', timestamp: new Date().toISOString() }));
app.get('/api/facilities/all', (req, res) => res.json({ success: true, data: classes }));
app.get('/api/facilities/class', (req, res) => { const item = classes.find(value => value.code === String(req.query.class || '').toUpperCase()); if (!item) return res.status(404).json({ success: false, message: 'Unknown train class' }); res.json({ success: true, data: item }); });
app.get('/api/facilities/type', (req, res) => { if (!req.query.type) return res.status(400).json({ success: false, message: 'type is required' }); res.json({ success: true, data: typeFor(req.query.type) }); });
app.get('/api/facilities/check', (req, res) => { if (!req.query.trainType || !req.query.facility) return res.status(400).json({ success: false, message: 'trainType and facility are required' }); const amenities = typeFor(req.query.trainType).amenities; const key = Object.keys(amenities).find(name => name.includes(String(req.query.facility).toLowerCase())); const value = key ? amenities[key] : 'No'; res.json({ success: true, train_type: req.query.trainType, facility: req.query.facility, has_facility: value !== 'No' && value !== 'N/A' }); });
app.get('/api/facilities/:facilityId', (req, res) => { const item = classes.find(value => value.code === req.params.facilityId.toUpperCase()); if (!item) return res.status(404).json({ success: false, message: 'Facility not found' }); res.json({ success: true, data: item }); });
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.listen(process.env.PORT || 5006, () => console.log(`Facilities Service running on port ${process.env.PORT || 5006}`));
