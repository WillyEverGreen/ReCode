import React, { useState } from 'react';
import { Crown, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const Pricing: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const features = {
    free: [
      '1 Get Solution + 2 Add Solution per day',
      '7-day free trial',
      '24-hour solution history',
      'AI-powered complexity analysis',
      'Pattern recognition',
      'No credit card required',
    ],
    pro: [
      '10 Get Solution requests per day',
      '10 Add Solution analyses per day',
      'Lifetime solution history',
      'Export to PDF, Markdown & Text',
      'Priority support',
      'Early access to new features',
    ],
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to upgrade');
        setIsProcessing(false);
        return;
      }

      // Create order
      const orderResponse = await fetch(
        `${API_BASE_URL}/api/payment/create-order`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message || orderData.error || 'Failed to create order'
        );
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Open Razorpay payment modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ReCode Pro',
        description: 'Upgrade to Pro Plan - ₹249/month',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.user.name,
          email: orderData.user.email,
        },
        theme: {
          color: '#EAB308',
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/payment/verify-payment`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message || 'Payment verification failed'
              );
            }

            // Success!
            setSuccess(true);
            setIsProcessing(false);

            // Refresh page after short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full text-gray-100">
      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2 mb-10 max-w-4xl mx-auto">
        {/* Free */}
        <div className="rounded-2xl border border-gray-800 bg-[#0f1117] p-6 flex flex-col justify-between shadow-md shadow-black/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/80 border border-gray-700 text-xs font-semibold text-gray-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Free plan
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Stay in control
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Ideal while you are exploring the app and building a small
              personal library.
            </p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-white">₹0</span>
              <span className="text-gray-500 text-xs">forever</span>
            </div>

            <ul className="space-y-2 text-sm">
              {features.free.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-500/15 via-transparent to-transparent p-6 flex flex-col justify-between shadow-xl shadow-yellow-900/30 transform md:scale-[1.02]">
          <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-[10px] font-semibold text-black uppercase tracking-wide shadow-lg">
            Most focused
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-xs font-semibold text-yellow-300 mb-3">
              <Crown className="w-3.5 h-3.5 text-yellow-300" />
              Pro plan
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              When interviews get serious
            </h2>
            <p className="text-xs text-yellow-100/80 mb-4">
              Designed for intensive prep cycles, with more room for daily
              problem solving.
            </p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-white">₹249</span>
              <span className="text-gray-400 text-xs">/month</span>
            </div>

            <ul className="space-y-2 text-sm mb-4">
              {features.pro.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-100">
                  <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled={isProcessing || success}
            onClick={handleUpgrade}
            className="mt-2 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold text-sm py-3 transition-all shadow-lg shadow-yellow-900/30 hover:shadow-yellow-900/50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Upgraded Successfully!
              </>
            ) : (
              <>
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-500 mt-2">
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-[11px] text-red-200">
            {error}
          </div>
        )}

        {/* Small note */}
        <p className="text-[11px] text-gray-500 leading-relaxed">
          You can stay on the Free plan as long as you like. When you upgrade to
          Pro, your existing questions, notes, and progress remain exactly where
          they are — you just get more room to practice each day.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
