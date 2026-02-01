import React, { useState } from 'react';
import { X, Sparkles, Zap, FileText, BookOpen, Shield } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const proFeatures = [
    { icon: <Zap className="w-5 h-5" />, text: '10 Get Solution requests/day' },
    {
      icon: <FileText className="w-5 h-5" />,
      text: '10 Add Solution analyses/day',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      text: 'Lifetime solution history',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      text: 'Export to PDF, Markdown & Text',
    },
    { icon: <Shield className="w-5 h-5" />, text: 'Priority support' },
  ];

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
          color: '#EAB308', // Yellow color matching your theme
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
            console.log('[PAYMENT] Payment successful!', verifyData);
            setIsProcessing(false);

            // Call success callback
            if (onSuccess) {
              onSuccess();
            }

            // Close modal and refresh page
            onClose();
            window.location.reload(); // Refresh to update user plan
          } catch (err: any) {
            console.error('[PAYMENT] Verification error:', err);
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
      console.error('[PAYMENT] Error:', err);
      setError(err.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0d0e12] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-b border-yellow-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
          </div>
          <p className="text-gray-400">
            10× more daily analyses for serious interview prep
          </p>
        </div>

        {/* Pricing */}
        <div className="p-8 pb-6 border-b border-gray-800">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-white">₹249</span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-500">
            Cancel anytime. No hidden fees.
          </p>
        </div>

        {/* Features */}
        <div className="p-8 pb-6 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            What&apos;s included
          </h3>
          <div className="space-y-3">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                  {feature.icon}
                </div>
                <span className="text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="p-8 pt-6">
          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all shadow-lg shadow-yellow-900/30 hover:shadow-yellow-900/50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Upgrade to Pro Now
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
