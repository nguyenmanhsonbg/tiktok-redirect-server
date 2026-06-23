const fs = require("fs");
const http = require("http");
const path = require("path");
const { handleApiRequest } = require("./lib/api-router");
const { ensureProductCacheInitialized } = require("./lib/product-cache");

const publicRoot = path.join(__dirname, "public");
const appleAssociationPath = path.join(__dirname, "apple-app-site-association");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function attachResponseHelpers(res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };

  res.json = function json(value) {
    const body = JSON.stringify(value);

    if (!res.hasHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }

    res.setHeader("Content-Length", Buffer.byteLength(body));
    res.end(body);
    return res;
  };

  res.send = function send(value) {
    if (Buffer.isBuffer(value)) {
      res.end(value);
      return res;
    }

    if (typeof value === "object" && value !== null) {
      return res.json(value);
    }

    const body = String(value ?? "");

    if (!res.hasHeader("Content-Type")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }

    res.setHeader("Content-Length", Buffer.byteLength(body));
    res.end(body);
    return res;
  };

  res.redirect = function redirect(statusOrUrl, maybeUrl) {
    const statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
    const location = typeof statusOrUrl === "number" ? maybeUrl : statusOrUrl;
    const body = `Redirecting to ${location}`;

    res.statusCode = statusCode;
    res.setHeader("Location", location);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Length", Buffer.byteLength(body));
    res.end(body);
    return res;
  };
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

function getStaticPath(pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const filePath = path.resolve(publicRoot, `.${decodedPath}`);
  const publicRootWithSeparator = `${publicRoot}${path.sep}`;

  if (filePath !== publicRoot && !filePath.startsWith(publicRootWithSeparator)) {
    return null;
  }

  return filePath;
}

async function sendFile(req, res, filePath, contentType) {
  try {
    const stat = await fs.promises.stat(filePath);

    if (!stat.isFile()) {
      return false;
    }

    const mimeType = contentType || mimeTypes[path.extname(filePath)] || "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", stat.size);

    if (req.method === "HEAD") {
      res.end();
      return true;
    }

    const body = await fs.promises.readFile(filePath);
    res.end(body);
    return true;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return false;
    }

    throw error;
  }
}

async function handleStaticRequest(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  if (
    pathname === "/.well-known/apple-app-site-association" ||
    pathname === "/apple-app-site-association"
  ) {
    const served = await sendFile(
      req,
      res,
      appleAssociationPath,
      "application/json; charset=utf-8"
    );

    if (served) {
      return;
    }
  }

  const staticPath = getStaticPath(pathname);

  if (!staticPath) {
    res.status(400).json({ error: "Invalid file path." });
    return;
  }

  const served = await sendFile(req, res, staticPath);

  if (!served) {
    res.status(404).json({ error: "Not found." });
  }
}

async function handleRequest(req, res) {
  attachResponseHelpers(res);

  let requestUrl;

  try {
    requestUrl = getRequestUrl(req);
  } catch (error) {
    res.status(400).json({ error: "Invalid URL." });
    return;
  }

  req.query = getQuery(requestUrl.searchParams);

  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, requestUrl.pathname);
    return;
  }

  await handleStaticRequest(req, res, requestUrl.pathname);
}

const app = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error("Unhandled request error:", error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Internal server error." }));
    } else {
      res.destroy(error);
    }
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const productCount = await ensureProductCacheInitialized();
    console.log(`Loaded ${productCount} products into cache.`);
  } catch (error) {
    console.error("Failed to load product cache from database:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
