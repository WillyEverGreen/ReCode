import { handleCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
}
