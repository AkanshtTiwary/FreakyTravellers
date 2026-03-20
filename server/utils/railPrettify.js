/**
 * Rail Data Prettify Utility
 * Parses and formats raw railway data from erail.in
 */

class RailPrettify {
  /**
   * Parse trains between two stations
   * @param {string} htmlString - Raw HTML response from erail.in
   * @returns {Object} Parsed train data
   */
  betweenStation(htmlString) {
    try {
      const obj = {};
      const retval = {};
      const arr = [];
      let obj2 = {};
      const data = htmlString.split("~~~~~~~~");
      
      // Check for error messages
      const nore = data[0].split("~");
      const errorCheck = nore[5] ? nore[5].split("<") : [];
      
      if (errorCheck[0] === "No direct trains found") {
        retval.success = false;
        retval.timestamp = Date.now();
        retval.data = "No direct trains found";
        return retval;
      }

      if (
        data[0] === "~~~~~Please try again after some time." ||
        data[0] === "~~~~~From station not found" ||
        data[0] === "~~~~~To station not found"
      ) {
        retval.success = false;
        retval.timestamp = Date.now();
        retval.data = data[0].replaceAll("~", "");
        return retval;
      }

      const filteredData = data.filter((el) => el !== "");

      for (let i = 0; i < filteredData.length; i++) {
        const data1 = filteredData[i].split("~^");
        if (data1.length === 2) {
          const trainData = data1[1].split("~").filter((el) => el !== "");
          
          obj.train_no = trainData[0];
          obj.train_name = trainData[1];
          obj.source_stn_name = trainData[2];
          obj.source_stn_code = trainData[3];
          obj.dest_stn_name = trainData[4];
          obj.dest_stn_code = trainData[5];
          obj.from_stn_name = trainData[6];
          obj.from_stn_code = trainData[7];
          obj.to_stn_name = trainData[8];
          obj.to_stn_code = trainData[9];
          obj.from_time = trainData[10];
          obj.to_time = trainData[11];
          obj.travel_time = trainData[12];
          obj.running_days = trainData[13];

          obj2.train_base = { ...obj };
          arr.push(obj2);
          obj2 = {};
        }
      }

      retval.success = true;
      retval.timestamp = Date.now();
      retval.data = arr;
      return retval;
    } catch (err) {
      console.warn("Error parsing between station data:", err.message);
      return {
        success: false,
        timestamp: Date.now(),
        data: "Error parsing train data",
      };
    }
  }

  /**
   * Get day of week from date (0-6)
   * @param {number} DD - Day
   * @param {number} MM - Month
   * @param {number} YYYY - Year
   * @returns {number} Day of week
   */
  getDayOnDate(DD, MM, YYYY) {
    const date = new Date(YYYY, MM - 1, DD);
    let day =
      date.getDay() >= 0 && date.getDay() <= 2
        ? date.getDay() + 4
        : date.getDay() - 3;
    return day;
  }

  /**
   * Parse train route data
   * @param {string} htmlString - Raw route HTML
   * @returns {Object} Formatted route data
   */
  getRoute(htmlString) {
    try {
      const data = htmlString.split("~^");
      const arr = [];
      let obj = {};
      const retval = {};

      for (let i = 0; i < data.length; i++) {
        const data1 = data[i].split("~").filter((el) => el !== "");
        
        if (data1.length > 9) {
          obj.source_stn_name = data1[2];
          obj.source_stn_code = data1[1];
          obj.arrive = data1[3];
          obj.depart = data1[4];
          obj.distance = data1[6];
          obj.day = data1[7];
          obj.zone = data1[9];
          arr.push(obj);
          obj = {};
        }
      }

      retval.success = true;
      retval.timestamp = Date.now();
      retval.data = arr;
      return retval;
    } catch (err) {
      console.log("Error parsing route:", err.message);
      return {
        success: false,
        timestamp: Date.now(),
        data: "Error parsing route data",
      };
    }
  }

  /**
   * Check train information by train number
   * @param {string} htmlString - Raw HTML response
   * @returns {Object} Train information
   */
  checkTrain(htmlString) {
    try {
      const obj = {};
      const retval = {};
      const data = htmlString.split("~~~~~~~~");

      if (
        data[0] === "~~~~~Please try again after some time." ||
        data[0] === "~~~~~Train not found"
      ) {
        retval.success = false;
        retval.timestamp = Date.now();
        retval.data = data[0].replaceAll("~", "");
        return retval;
      }

      let data1 = data[0].split("~").filter((el) => el !== "");
      
      if (data1[0].length > 6) {
        data1.shift();
      }

      obj.train_no = data1[0].replace("^", "");
      obj.train_name = data1[1];
      obj.from_stn_name = data1[2];
      obj.from_stn_code = data1[3];
      obj.to_stn_name = data1[4];
      obj.to_stn_code = data1[5];
      obj.from_time = data1[10];
      obj.to_time = data1[11];
      obj.travel_time = data1[12];
      obj.running_days = data1[13];

      if (data[1]) {
        data1 = data[1].split("~").filter((el) => el !== "");
        obj.type = data1[10];
        obj.train_id = data1[11];
        obj.distance = data1[17];
        obj.average_speed = data1[18];
      }

      retval.success = true;
      retval.timestamp = Date.now();
      retval.data = obj;
      return retval;
    } catch (err) {
      console.warn("Error checking train:", err.message);
      return {
        success: false,
        timestamp: Date.now(),
        data: "Error checking train information",
      };
    }
  }

  /**
   * Parse live station data
   * @param {Object} $ - Cheerio instance
   * @returns {Object} Formatted live station data
   */
  liveStation($) {
    try {
      const arr = [];
      let obj = {};
      const retval = {};

      $(".name").each((i, el) => {
        const text = $(el).text();
        obj.train_no = text.slice(0, 5);
        obj.train_name = text.slice(5).trim();
        obj.source_stn_name = $(el)
          .next("div")
          .text()
          .split("→")[0]
          .trim();
        obj.dest_stn_name = $(el)
          .next("div")
          .text()
          .split("→")[1]
          .trim();
        obj.time_at = $(el)
          .parent("td")
          .next("td")
          .text()
          .slice(0, 5);
        obj.detail = $(el)
          .parent("td")
          .next("td")
          .text()
          .slice(5);
        arr.push(obj);
        obj = {};
      });

      retval.success = true;
      retval.timestamp = Date.now();
      retval.data = arr;
      return retval;
    } catch (err) {
      console.error("Error parsing live station:", err.message);
      return {
        success: false,
        timestamp: Date.now(),
        data: "Error parsing live station data",
      };
    }
  }

  /**
   * Parse PNR status data
   * @param {string} htmlString - Raw HTML response
   * @returns {Object} PNR status data
   */
  pnrStatus(htmlString) {
    try {
      const retval = {};
      const pattern = /data\s*=\s*({.*?;)/;
      const match = htmlString.match(pattern);

      if (!match) {
        return {
          success: false,
          timestamp: Date.now(),
          data: "Invalid PNR data",
        };
      }

      const matchStr = match[0].slice(7, -1);
      const parsedData = JSON.parse(matchStr);

      retval.success = true;
      retval.timestamp = Date.now();
      retval.data = parsedData;
      return retval;
    } catch (err) {
      console.error("Error parsing PNR status:", err.message);
      return {
        success: false,
        timestamp: Date.now(),
        data: "Error parsing PNR status",
      };
    }
  }
}

module.exports = RailPrettify;
