/** 共享 HTTP 工具（P5） */

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function setCors(res, methods = "GET, PUT, POST, OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-BPlant-Api-Key, X-BPlant-User",
  );
}
