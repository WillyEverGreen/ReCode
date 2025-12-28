import { handleCors } from "../_lib/auth.js";
import { createOrderHandler } from "./_handlers/createOrder.js";
import { verifyPaymentHandler } from "./_handlers/verifyPayment.js";

export default async function handler(req, res) {
  // CORS check
  if (handleCors(req, res)) return;

  const { route } = req.query;
  const parts = Array.isArray(route) ? route : (route ? [route] : []);
  const action = parts[0];

  if (action === 'create-order') {
     return createOrderHandler(req, res);
  }

  if (action === 'verify-payment') {
     return verifyPaymentHandler(req, res);
  }

  return res.status(404).json({ error: "Endpoint not found: " + action });
}
