function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function attachResponseHelpers(res) {
  if (typeof res.status !== "function") {
    res.status = function status(code) {
      res.statusCode = code;
      return res;
    };
  }

  if (typeof res.json !== "function") {
    res.json = function json(value) {
      const body = JSON.stringify(value);

      if (typeof res.hasHeader !== "function" || !res.hasHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }

      res.setHeader("Content-Length", Buffer.byteLength(body));
      res.end(body);
      return res;
    };
  }

  if (typeof res.send !== "function") {
    res.send = function send(value) {
      if (Buffer.isBuffer(value)) {
        res.end(value);
        return res;
      }

      if (typeof value === "object" && value !== null) {
        return res.json(value);
      }

      const body = String(value ?? "");

      if (typeof res.hasHeader !== "function" || !res.hasHeader("Content-Type")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }

      res.setHeader("Content-Length", Buffer.byteLength(body));
      res.end(body);
      return res;
    };
  }

  if (typeof res.redirect !== "function") {
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

  return res;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

module.exports = {
  attachResponseHelpers,
  readJsonBody,
  setCorsHeaders,
};
