const { subscribe } = require("../../lib/sse");
const { setCors } = require("../../lib/response");

export default function events(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }
  subscribe(req, res, req.query.room);
};

export const config = {
  api: {
    bodyParser: false
  }
};

