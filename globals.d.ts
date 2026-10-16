interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleErrorResponse {
  type?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void | Promise<void>;
  error_callback?: (error: GoogleErrorResponse) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: GoogleTokenClientConfig) => {
    requestAccessToken: (options?: Record<string, unknown>) => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  handler?: (response: RazorpayPaymentResponse) => void | Promise<void>;
  [key: string]: unknown;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

interface Window {
  google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}
