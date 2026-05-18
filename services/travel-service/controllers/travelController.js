/**
 * Travel Controller
 */

exports.createTrip = async (req, res) => {
  try {
    res.json({ success: true, message: 'Trip created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrip = async (req, res) => {
  try {
    res.json({ success: true, message: 'Trip retrieved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    res.json({ success: true, trips: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    res.json({ success: true, message: 'Trip updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
