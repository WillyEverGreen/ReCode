import React from 'react';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import AppLogo from './Logo-With-Name cropped.png';

type PolicyType = 'privacy' | 'terms' | 'refunds' | 'shipping' | 'contact';

interface PolicyPageProps {
  type: string;
  onHome: () => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type, onHome }) => {
  const getTitle = () => {
    switch (type) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms and Conditions';
      case 'refunds': return 'Cancellation & Refund Policy';
      case 'shipping': return 'Shipping & Delivery Policy';
      case 'contact': return 'Contact Us';
      default: return 'Page';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <div className="space-y-6 text-gray-300">
            <p>Last updated: December 31, 2024</p>
            
            <h3 className="text-xl font-semibold text-white mt-8">1. Introduction</h3>
            <p>Welcome to ReCode.</p>
            <p>ReCode provides tools for code analysis, complexity evaluation, and optimization to help developers write better software.</p>
            <p>We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.</p>

            <h3 className="text-xl font-semibold text-white mt-8">2. Eligibility</h3>
            <p>ReCode is intended for users 13 years of age or older.</p>
            <p>By using our services, you confirm that you meet this age requirement.</p>

            <h3 className="text-xl font-semibold text-white mt-8">3. Information We Collect</h3>
            <p>We collect the following types of information:</p>
            
            <h4 className="text-lg font-medium text-white mt-4">a) Personal Information</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Profile information provided through GitHub or Google authentication</li>
            </ul>

            <h4 className="text-lg font-medium text-white mt-4">b) Code & Usage Data</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Code snippets or solutions you submit for analysis</li>
              <li>Features used, interactions, and general usage patterns</li>
              <li>Diagnostic data such as error logs (non-sensitive)</li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200">
              ⚠️ Please do not submit confidential, sensitive, or proprietary code.
            </div>

            <h3 className="text-xl font-semibold text-white mt-8">4. How We Use Your Information</h3>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and maintain ReCode</li>
              <li>Analyze and display code complexity and insights</li>
              <li>Improve our analysis systems and user experience (using anonymized data)</li>
              <li>Communicate with you regarding updates, support, or important notices</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">5. Code Submissions & Data Retention</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Code submitted to ReCode is processed securely.</li>
              <li>We do not sell or share your code with third parties.</li>
              <li>Code may be temporarily stored to perform analysis and debugging.</li>
              <li>Anonymized code patterns may be used to improve system accuracy.</li>
              <li>You should avoid submitting sensitive or proprietary code.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">6. Cookies & Authentication</h3>
            <p>ReCode uses cookies or similar technologies to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maintain login sessions</li>
              <li>Authenticate users securely</li>
              <li>Improve performance and reliability</li>
            </ul>
            <p>You can control cookies through your browser settings.</p>

            <h3 className="text-xl font-semibold text-white mt-8">7. Third-Party Services</h3>
            <p>We use trusted third-party services to operate ReCode, including:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>GitHub OAuth and Google OAuth for authentication</li>
              <li>Hosting and infrastructure providers</li>
              <li>Analytics or monitoring tools (if enabled)</li>
            </ul>
            <p>These services may collect information in accordance with their own privacy policies.</p>

            <h3 className="text-xl font-semibold text-white mt-8">8. Data Security</h3>
            <p>We implement reasonable technical and organizational safeguards to protect your data.</p>
            <p>However, no system is 100% secure, and we cannot guarantee absolute security.</p>

            <h3 className="text-xl font-semibold text-white mt-8">9. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Delete your account at any time</li>
            </ul>
            <p>To exercise these rights, contact us at the email below.</p>

            <h3 className="text-xl font-semibold text-white mt-8">10. Changes to This Policy</h3>
            <p>We may update this Privacy Policy from time to time.</p>
            <p>Changes will be posted on this page with an updated “Last updated” date.</p>

            <h3 className="text-xl font-semibold text-white mt-8">11. Contact Us</h3>
            <p>If you have any questions or concerns about this Privacy Policy, contact us at:</p>
            <a href="mailto:noreply@recode.app" className="text-yellow-400 hover:text-yellow-300 transition-colors">noreply@recode.app</a>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6 text-gray-300">
            <p>Last updated: December 31, 2024</p>

            <h3 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h3>
            <p>By accessing or using ReCode (“the Service”), you agree to be bound by these Terms and Conditions.</p>
            <p>If you do not agree to these terms, you must not use the Service.</p>

            <h3 className="text-xl font-semibold text-white mt-8">2. Use License</h3>
            <p>ReCode grants you a limited, personal, non-exclusive, non-transferable, and revocable license to use the Service for personal learning, professional development, and educational purposes only, in accordance with these Terms.</p>

            <h3 className="text-xl font-semibold text-white mt-8">3. User Responsibilities</h3>
            <p>You agree that you will:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Be solely responsible for all activities that occur under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">4. Restrictions</h3>
            <p>You may not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reverse engineer, decompile, or attempt to extract source code, algorithms, or AI models</li>
              <li>Use the Service for illegal, harmful, or abusive activities</li>
              <li>Share, sell, or transfer your account credentials</li>
              <li>Attempt to bypass security, rate limits, or access controls</li>
              <li>Use ReCode to generate or submit plagiarized or academic dishonesty content</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">5. AI-Generated Content Disclaimer</h3>
            <p>ReCode uses AI-based analysis and automation.</p>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>AI outputs may be inaccurate, incomplete, or incorrect</li>
              <li>ReCode does not guarantee correctness of explanations, solutions, or complexity analysis</li>
              <li>You are responsible for verifying outputs before relying on them in exams, interviews, or production systems</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">6. Intellectual Property</h3>
            <p>All content, branding, software, and AI systems provided by ReCode are owned by or licensed to ReCode and are protected by intellectual property laws.</p>
            <p>You may not copy, modify, distribute, or commercialize any part of the Service without written permission.</p>

            <h3 className="text-xl font-semibold text-white mt-8">7. Disclaimer of Warranties</h3>
            <p>The Service is provided “as is” and “as available”, without warranties of any kind, express or implied.</p>
            <p>ReCode makes no guarantees regarding:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Accuracy</li>
              <li>Reliability</li>
              <li>Availability</li>
              <li>Fitness for a particular purpose</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">8. Limitation of Liability</h3>
            <p>To the maximum extent permitted by law, ReCode shall not be liable for any indirect, incidental, consequential, or special damages arising from your use of the Service.</p>

            <h3 className="text-xl font-semibold text-white mt-8">9. Termination</h3>
            <p>We reserve the right to suspend or terminate your access to ReCode at any time, without notice, if you violate these Terms.</p>

            <h3 className="text-xl font-semibold text-white mt-8">10. Changes to Terms</h3>
            <p>We may update these Terms from time to time.</p>
            <p>Continued use of the Service after changes means you accept the revised Terms.</p>

            <h3 className="text-xl font-semibold text-white mt-8">11. Contact</h3>
            <p>If you have questions about these Terms, please contact us through the official ReCode support channels.</p>
          </div>
        );

      case 'refunds':
        return (
          <div className="space-y-6 text-gray-300">
            <p>Last updated: December 31, 2024</p>

            <h3 className="text-xl font-semibold text-white mt-8">1. Cancellation Policy</h3>
            <p>You may cancel your subscription at any time via your account settings. Cancellation will take effect at the end of the current billing period.</p>

            <h3 className="text-xl font-semibold text-white mt-8">2. Refund Policy</h3>
            <p>Due to the nature of our digital products (AI analysis services), we generally do not offer refunds once the service has been used.</p>
            <p>However, we may consider refunds in exceptional circumstances, such as:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Billing errors or duplicate charges.</li>
              <li>Service unavailability for an extended period.</li>
            </ul>
            <p>If you believe you are entitled to a refund, please contact us within 7 days of the charge.</p>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-6 text-gray-300">
            <p>Last updated: December 31, 2024</p>

            <h3 className="text-xl font-semibold text-white mt-8">1. Digital Delivery</h3>
            <p>ReCode is a SaaS (Software as a Service) platform. We do not sell physical products.</p>

            <h3 className="text-xl font-semibold text-white mt-8">2. Delivery Timeline</h3>
            <p>Upon successful payment/subscription:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access to Pro features is granted <strong>immediately</strong>.</li>
              <li>Confirmation emails are sent within minutes.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8">3. Issues</h3>
            <p>If you do not receive access immediately after purchase, please log out and log back in, or contact support.</p>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6 text-gray-300">
            <p>We are here to help!</p>

            <div className="space-y-8 mt-8">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-yellow-500 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Email Us</h3>
                  <a href="mailto:noreply@recode.sbs" className="text-gray-400 hover:text-yellow-400 transition-colors">noreply@recode.sbs</a>
                  <p className="text-gray-500 text-sm mt-1">We aim to respond within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Content not found.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0c0c0c]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="h-8 rounded-lg overflow-hidden cursor-pointer" onClick={onHome}>
            <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
          </div>
          <button 
            onClick={onHome}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-gray-800 pb-6">
          {getTitle()}
        </h1>
        <div className="prose prose-invert prose-yellow max-w-none">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ReCode. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-gray-500 hover:text-yellow-500 transition-colors">Privacy</a>
            <a href="/terms" className="text-gray-500 hover:text-yellow-500 transition-colors">Terms</a>
            <a href="/contact" className="text-gray-500 hover:text-yellow-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
