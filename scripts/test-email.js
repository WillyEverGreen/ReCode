import dotenv from 'dotenv';
dotenv.config();
import { sendVerificationEmail } from '../api/_lib/email.js';

console.log("--- Email Config Test ---");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Set (Starts with " + process.env.RESEND_API_KEY.slice(0,5) + ")" : "Missing");
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("EMAIL_USER (Fallack):", process.env.EMAIL_USER);

const testEmail = process.argv[2] || process.env.EMAIL_USER;

if (!testEmail) {
  console.error("Please provide an email to send to: node scripts/test-email.js user@example.com");
  process.exit(1);
}

console.log("Sending test email to:", testEmail);
sendVerificationEmail(testEmail, "123456").then(success => {
  if (success) console.log("✅ Success! Check inbox/spam.");
  else console.error("❌ Failed. Check console logs above.");
}).catch(err => console.error("❌ Exception:", err));
