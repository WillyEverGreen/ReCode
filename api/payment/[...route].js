import { handleCors } from "../_lib/auth.js";
import { createOrderHandler } from "./_handlers/createOrder.js";
import { verifyPaymentHandler } from "./_handlers/verifyPayment.js";

export default async function handler(req, res) {
  // CORS check
  if (handleCors(req, res)) return;

  // Get route from query or parse from URL
  let { route } = req.query;
  
  // Fallback: parse from URL path if route is not set
  if (!route || route.length === 0) {
    const urlPath = req.url.split('?')[0]; // Remove query string
    const pathParts = urlPath.split('/').filter(Boolean);
    // URL is like /api/payment/create-order, so we need the part after "payment"
    const paymentIndex = pathParts.indexOf('payment');
    if (paymentIndex !== -1 && paymentIndex < pathParts.length - 1) {
      route = pathParts.slice(paymentIndex + 1);
    }
  }
  
  const action = route?.[0];
  console.log("[PAYMENT DEBUG] URL:", req.url, "| Route:", route, "| Action:", action);

  if (action === 'create-order') {
     return createOrderHandler(req, res);
  }

  if (action === 'verify-payment') {
     return verifyPaymentHandler(req, res);
  }

  return res.status(404).json({ error: "Payment endpoint not found: " + action });
}

