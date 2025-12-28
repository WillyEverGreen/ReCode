# How to Send Emails from @recode.sbs

To send emails from your domain (`noreply@recode.sbs` or `support@recode.sbs`) instead of Gmail, follow these steps. We recommend **Resend** because it's free (up to 3000 emails/mo), reliable, and very easy to set up with Vercel/Node.js.

## Step 1: Set up Resend (Recommended)

1.  Go to [Resend.com](https://resend.com/) and Sign Up.
2.  Click **"Add Domain"**.
3.  Enter your domain: `recode.sbs`.
4.  Resend will give you a list of **DNS Records** (MX, TXT/SPF, DKIM).
5.  Go to where you bought your domain (Namecheap, GoDaddy, Vercel, etc.) and add these records.
    *   *Note: Verification usually takes 5-10 minutes.*
6.  Once verified, go to **API Keys** in Resend and create a new key (e.g., `re_12345...`).

## Step 2: Configure Environment Variables

Update your `.env` file (locally) and your **Vercel Project Settings** (Environment Variables) with these values:

```ini
# Disable Gmail settings
# EMAIL_SERVICE=gmail 

# Enable SMTP Settings (Resend Example)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_SECURE=true

# Authentication
EMAIL_USER=resend
EMAIL_PASS=re_123456789...  <-- Your API Key here

# Sender Address
EMAIL_FROM=noreply@recode.sbs
```

*Note: For Resend, the USER is always just the string `resend`, and the PASS is your API Key.*

## Step 3: Test It

1.  Restart your local server (`npm run dev`) to load the new `.env` variables.
2.  Try to Sign Up or use "Forgot Password" functionality.
3.  You should receive an email from `noreply@recode.sbs`!

## Alternative: Using Zoho / Private Email

If you have a business email hosting (like `admin@recode.sbs` via Zoho or Namecheap):

1.  Get your **SMTP Host** and **Port** from your email provider documentation.
2.  Update variables:
    ```ini
    EMAIL_HOST=smtp.zoho.com       # Example
    EMAIL_PORT=465
    EMAIL_USER=admin@recode.sbs    # Your actual email setup
    EMAIL_PASS=your-password
    EMAIL_FROM=admin@recode.sbs
    ```
