/**
 * Facilities Controller
 */

exports.getAllFacilities = async (req, res) => {
  try {
    res.json({ success: true, facilities: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFacilityDetails = async (req, res) => {
  try {
    res.json({ success: true, facility: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
