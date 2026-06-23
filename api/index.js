const { handleApiRequest } = require("../lib/api-router");

module.exports = async (req, res) => {
  return handleApiRequest(req, res);
};
