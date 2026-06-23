const addProduct = require("./api-routes/add-product");
const deleteProduct = require("./api-routes/delete-product");
const getProducts = require("./api-routes/get-products");
const redirect = require("./api-routes/redirect");

const routes = {
  "/api/add-product": addProduct,
  "/api/delete-product": deleteProduct,
  "/api/get-products": getProducts,
  "/api/redirect": redirect,
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getRequestUrl(req) {
  return new URL(req.url || "/", "http://localhost");
}

function getQuery(searchParams) {
  const query = {};

  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  return query;
}

function normalizeRoutePath(route) {
  const value = firstValue(route);

  if (!value) {
    return undefined;
  }

  const cleanRoute = String(value).replace(/^\/+/, "").replace(/\/+$/, "");

  if (!cleanRoute) {
    return undefined;
  }

  if (cleanRoute.startsWith("api/")) {
    return `/${cleanRoute}`;
  }

  return `/api/${cleanRoute}`;
}

async function handleApiRequest(req, res, routePath) {
  let requestUrl;

  try {
    requestUrl = getRequestUrl(req);
  } catch (error) {
    return res.status(400).json({ error: "Invalid URL." });
  }

  req.query = {
    ...getQuery(requestUrl.searchParams),
    ...(req.query || {}),
  };

  const normalizedRoutePath =
    routePath ||
    normalizeRoutePath(req.query.route) ||
    normalizeRoutePath(req.query.path) ||
    requestUrl.pathname;
  const routeHandler = routes[normalizedRoutePath];

  if (!routeHandler) {
    return res.status(404).json({ error: "API route not found." });
  }

  return routeHandler(req, res);
}

module.exports = {
  handleApiRequest,
};
