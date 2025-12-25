import { handleCors, generateAdminToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (password === ADMIN_PASSWORD) {
    const token = generateAdminToken();
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ error: "Invalid password" });
  }
}
