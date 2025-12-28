import { handleCors } from "../_lib/auth.js";
import { incrementUsageHandler } from "./_handlers/increment.js";
import { resetUsageHandler } from "./_handlers/reset.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { route } = req.query;
  const parts = Array.isArray(route) ? route : (route ? [route] : []);
  const action = parts[0];

  if (action === 'increment') {
    if (req.method === 'POST') return incrementUsageHandler(req, res);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (action === 'reset') {
    if (req.method === 'POST') return resetUsageHandler(req, res);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  return res.status(404).json({ error: "Endpoint not found: " + action });
}
