const fs = require("node:fs");
const path = require("node:path");

function stripOptionalQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(envPath = path.join(process.cwd(), ".env")) {
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmedLine.slice(0, separatorIndex).trim();
    const value = stripOptionalQuotes(trimmedLine.slice(separatorIndex + 1).trim());

    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  }

  return true;
}

module.exports = {
  loadEnvFile,
};
