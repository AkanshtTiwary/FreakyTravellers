/**
 * Transport Controller
 */

exports.searchTransport = async (req, res) => {
  try {
    res.json({ success: true, transport: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransportDetails = async (req, res) => {
  try {
    res.json({ success: true, transport: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookTransport = async (req, res) => {
  try {
    res.json({ success: true, booking: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
