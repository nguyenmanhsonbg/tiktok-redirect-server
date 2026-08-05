const { handleApiRequest } = require("../lib/api-router");
const { attachResponseHelpers } = require("../lib/http");

module.exports = async (req, res) => {
  attachResponseHelpers(res);

  try {
    return await handleApiRequest(req, res);
  } catch (error) {
    console.error("Unhandled API request error:", error);

    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error." });
    }

    if (typeof res.destroy === "function") {
      res.destroy(error);
      return undefined;
    }

    throw error;
  }
};
