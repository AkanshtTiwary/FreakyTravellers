/**
 * Train Controller
 */

exports.searchTrains = async (req, res) => {
  try {
    res.json({ success: true, trains: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrainDetails = async (req, res) => {
  try {
    res.json({ success: true, train: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookTrain = async (req, res) => {
  try {
    res.json({ success: true, booking: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
