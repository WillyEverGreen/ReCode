import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import {
  Code2,
  Sparkles,
  CheckCircle2,
  Star,
  Users,
  Shield,
  ArrowRight,
  Zap,
  BookOpen,
  Terminal,
  Github,
} from "lucide-react";
import AppLogo from "./Logo-With-Name cropped.png";
import DashboardPreview from "./dashboard-preview.png";
import DashboardPreview2 from "./dashboard-preview-2.png";
import MobilePreview1 from "./mobile-preview-1.png";
import MobilePreview2 from "./mobile-preview-2.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} login clicked`);
    // Add your OAuth logic here
  };

  // GSAP Hero Animation
  useLayoutEffect(() => {
    if (!heroRef.current || !h1Ref.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setAnimationComplete(true),
      });

      tl.fromTo(
        heroRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      )
        .fromTo(
          h1Ref.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.3"
        );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#0a0e17] text-gray-100 font-sans overflow-x-hidden">
      {/* Navigation - Original Floating Style */}
      <nav className="fixed top-4 left-0 right-0 mx-auto max-w-7xl w-[95%] bg-[#0b0f19]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 rounded-lg overflow-hidden">
              <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400/80">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How it Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-white transition-colors"
            >
              Stories
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-5 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 text-white text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Original Cool Version */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-yellow-500/10 rounded-[100%] blur-[100px] opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/5 rounded-[100%] blur-[120px] opacity-30"></div>
          <div className="absolute top-1/3 left-10 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <div className="absolute top-2/3 right-20 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-700"></div>
          {/* Subtle Particles/Glow */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full blur-[1px] animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-teal-400 rounded-full blur-[1px] animate-pulse delay-300"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-indigo-400 rounded-full blur-[1px] animate-pulse delay-500"></div>
        </div>

        <div
          ref={heroRef}
          className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center"
          style={{ opacity: 0 }}
        >
          <div className="max-w-4xl mx-auto">
            <h1
              ref={h1Ref}
              className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight w-full max-w-4xl mx-auto"
              style={{ opacity: 0 }}
            >
              Master <br className="block min-[420px]:hidden" /> LeetCode <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-cyan-400">
                Without the <br className="block min-[420px]:hidden" /> Chaos
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={animationComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed px-4"
            >
              Stop manually writing notes. Paste your code, and let our AI architect your revision strategy with structured insights.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={animationComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl font-semibold transition-all shadow-lg shadow-yellow-900/30 text-white flex items-center justify-center gap-2 group text-sm sm:text-base"
              >
                Start Analyzing Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={animationComplete ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-16"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                <span>Free for developers</span>
              </div>
            </motion.div>

            {/* Code snippet mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={animationComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-full max-w-4xl mx-auto relative px-2 sm:px-4"
            >
              {/* Glow effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-yellow-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl opacity-40"></div>
              
              <div className="relative bg-[#0F1420] rounded-2xl overflow-hidden border border-white/10 shadow-2xl text-left">
                {/* Window controls */}
                <div className="flex items-center gap-2 px-3 sm:px-5 py-3 bg-[#0B0F19] border-b border-white/5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-3 text-[10px] sm:text-xs md:text-sm text-gray-500 font-mono truncate">analysis_result.json</span>
                </div>
                
                {/* Code content */}
                <div className="px-4 py-8 md:px-10 md:py-10 font-mono text-sm md:text-base lg:text-lg overflow-x-hidden">
                  <div className="flex flex-col gap-2 w-full">
                    {/* Line 1 */}
                    <div className="flex gap-4">
                      <div className="text-gray-600 select-none w-6 text-right flex-shrink-0">1</div>
                      <div className="text-gray-300 break-words w-full">
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-400">analyzeSolution</span>{" "}
                        <span className="text-gray-400">=</span>{" "}
                        <span className="text-purple-400">async</span>{" "}
                        <span className="text-gray-400">(</span>
                        <span className="text-orange-400">code</span>
                        <span className="text-gray-400">) =&gt; {"{"}</span>
                      </div>
                    </div>

                    {/* Line 2 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">2</div>
                      <div className="text-gray-500 pl-2 sm:pl-4 md:pl-8 break-words w-full">// AI extracting patterns...</div>
                    </div>

                    {/* Line 3 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">3</div>
                      <div className="pl-2 sm:pl-4 md:pl-8 w-full">
                        <span className="text-orange-400">return</span>{" "}
                        <span className="text-gray-400">{"{"}</span>
                      </div>
                    </div>

                    {/* Line 4 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">4</div>
                      <div className="pl-4 sm:pl-8 md:pl-16 w-full break-all sm:break-normal">
                        <span className="text-blue-400">complexity:</span>{" "}
                        <span className="text-green-400">"O(n log n)"</span>
                        <span className="text-gray-400">,</span>
                      </div>
                    </div>

                    {/* Line 5 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">5</div>
                      <div className="pl-4 sm:pl-8 md:pl-16 w-full break-all sm:break-normal">
                        <span className="text-blue-400">pattern:</span>{" "}
                        <span className="text-green-400">"Sliding Window"</span>
                        <span className="text-gray-400">,</span>
                      </div>
                    </div>

                    {/* Line 6 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">6</div>
                      <div className="pl-4 sm:pl-8 md:pl-16 w-full break-words">
                        <span className="text-blue-400">edgeCases:</span>{" "}
                        <span className="text-gray-400">[</span>
                        <span className="text-yellow-400">'Empty'</span>
                        <span className="text-gray-400">,</span>{" "}
                        <span className="text-yellow-400">'Single'</span>
                        <span className="text-gray-400">]</span>
                      </div>
                    </div>

                    {/* Line 7 */}
                    <div className="flex gap-2 md:gap-4">
                      <div className="text-gray-600 select-none w-4 sm:w-6 text-right flex-shrink-0">7</div>
                      <div className="pl-2 sm:pl-4 md:pl-8 w-full">
                        <span className="text-gray-400">{"}"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={animationComplete ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>10,000+ developers</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9/5 rating</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <FeaturesSection />

      {/* How It Works - Clean Steps */}
      <HowItWorksSection />

      {/* Product Preview - ReCode in Action */}
      <ProductPreviewSection />

      {/* Pricing - Clean Comparison */}
      <PricingSection onGetStarted={onGetStarted} />

      {/* Testimonials - Minimal Cards */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTASection onGetStarted={onGetStarted} />

      {/* Footer - Clean & Simple */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#080b12]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8">
                <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
              </div>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600">
            © 2025 ReCode. Built for developers, by developers.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Smart Code Analysis",
      description: "AI breaks down your solution into clear, understandable patterns and approaches.",
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Instant Insights",
      description: "Get time complexity, space complexity, and optimization suggestions in seconds.",
      gradient: "from-yellow-500/10 to-orange-500/10",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Structured Notes",
      description: "Auto-generated revision notes with edge cases, syntax tips, and test cases.",
      gradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Export Anywhere",
      description: "Download as PDF or Markdown. Your notes, your way.",
      gradient: "from-green-500/10 to-emerald-500/10",
    },
  ];

  return (
    <section id="features" ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to ace interviews
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful features that transform how you prepare for coding interviews
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 hover:border-white/10 transition-all`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    { number: "01", title: "Paste Your Code", description: "Copy your LeetCode solution and paste it into ReCode" },
    { number: "02", title: "AI Analyzes", description: "Our AI breaks down your approach, complexity, and patterns" },
    { number: "03", title: "Get Structured Notes", description: "Receive clean, organized notes ready for revision" },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, powerful workflow
          </h2>
          <p className="text-xl text-gray-400">
            From code to revision notes in three easy steps
          </p>
        </motion.div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex gap-8 items-start group"
            >
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 group-hover:from-yellow-400/40 group-hover:to-yellow-600/40 transition-all">
                {step.number}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400">
            Choose the plan that fits your learning journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all"
          >
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">₹0</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">1 Get Solution + 2 Add Solution per day</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">7-day free trial</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">24-hour solution history</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">No credit card required</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full px-6 py-3 border border-white/20 hover:bg-white/5 rounded-xl font-medium transition-all"
            >
              Get Started Free
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 relative overflow-hidden group hover:border-yellow-500/70 transition-all"
          >
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-yellow-500 rounded-full text-xs font-bold text-black">
                POPULAR
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">₹249</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">10 Get Solution + 10 Add Solution per day</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Lifetime solution history</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Export to PDF, Markdown & Text</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Priority support</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl font-semibold transition-all shadow-lg shadow-yellow-900/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Pro
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote: "ReCode transformed how I prepare for interviews. The AI insights are spot-on.",
      author: "Sarah Chen",
      role: "SDE @ Google",
    },
    {
      quote: "Finally, a tool that actually helps me understand my solutions, not just store them.",
      author: "Alex Kumar",
      role: "SDE @ Microsoft",
    },
    {
      quote: "The structured notes feature is a game-changer. I aced my Meta interview!",
      author: "Jordan Lee",
      role: "SDE @ Meta",
    },
  ];

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by developers worldwide
          </h2>
        </motion.div>

        <div ref={ref} className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Product Preview Section
const ProductPreviewSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Instant Analysis",
      description: "Get AI-powered insights in seconds"
    },
    {
      icon: <BookOpen className="w-5 h-5 text-cyan-500" />,
      title: "Structured Notes",
      description: "Auto-generated revision notes with patterns"
    },
    {
      icon: <Terminal className="w-5 h-5 text-green-500" />,
      title: "Code Complexity",
      description: "Time and space complexity at a glance"
    },
  ];

  const screenshots = [
    { 
      desktop: DashboardPreview2, 
      mobile: MobilePreview1,
      label: "Quick Revise" 
    },
    { 
      desktop: DashboardPreview, 
      mobile: MobilePreview2,
      label: "AI Suggestions" 
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6 bg-gradient-to-b from-transparent to-white/[0.02] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See ReCode in action
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your LeetCode solutions into structured, AI-powered revision notes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Features + Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6 lg:space-y-8"
          >
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4">
                Everything you need to master coding interviews
              </h3>
              <p className="text-gray-400 text-base lg:text-lg leading-relaxed">
                ReCode analyzes your code, identifies patterns, and generates comprehensive notes including approach, complexity analysis, edge cases, and test scenarios.
              </p>
            </div>

            <div className="space-y-4 lg:space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex gap-3 lg:gap-4 items-start group"
                >
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-base lg:text-lg mb-1">{feature.title}</h4>
                    <p className="text-gray-400 text-sm lg:text-base">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tabs below features - responsive visibility */}
            <div className="flex gap-2 pt-4 relative z-10">
              {screenshots.map((screenshot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === index
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {screenshot.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right: Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-48 h-48 lg:w-72 lg:h-72 bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute -bottom-4 -left-4 w-40 h-40 lg:w-64 lg:h-64 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
            
            {/* Screenshot container with fixed aspect ratio */}
            <div className="relative">
              {/* Layered shadow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-cyan-500/10 rounded-2xl transform rotate-1 scale-[1.02]"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 rounded-2xl transform -rotate-1 scale-[1.01]"></div>
              
              {/* Main screenshot - responsive height */}
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-sm" style={{ height: window.innerWidth < 1024 ? '400px' : '600px' }}>
                {screenshots.map((screenshot, index) => (
                  <React.Fragment key={index}>
                    {/* Desktop Image */}
                    <motion.img 
                      initial={false}
                      animate={{ 
                        opacity: activeTab === index ? 1 : 0,
                        x: activeTab === index ? 0 : -20
                      }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      src={screenshot.desktop} 
                      alt={`ReCode Dashboard - ${screenshot.label}`}
                      className="hidden lg:block absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                      style={{ 
                        transformOrigin: 'left center'
                      }}
                    />
                    {/* Mobile Image */}
                    <motion.img 
                      initial={false}
                      animate={{ 
                        opacity: activeTab === index ? 1 : 0,
                        x: activeTab === index ? 0 : -20
                      }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      src={screenshot.mobile} 
                      alt={`ReCode Dashboard - ${screenshot.label}`}
                      className="block lg:hidden absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                      style={{ 
                        transformOrigin: 'left center'
                      }}
                    />
                  </React.Fragment>
                ))}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17]/20 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the AI analysis work?",
      answer: "Our AI analyzes your code structure, identifies patterns, calculates complexity, and generates comprehensive notes including approach, tricks, edge cases, and test cases."
    },
    {
      question: "Can I use ReCode for free?",
      answer: "Yes! The free plan includes 1 Get Solution + 2 Add Solution analyses per day for 7 days. No credit card required. Perfect for trying out the platform."
    },
    {
      question: "What programming languages are supported?",
      answer: "ReCode supports all major programming languages including Python, JavaScript, Java, C++, and more. The AI is trained on diverse coding patterns."
    },
    {
      question: "How is this different from just saving code?",
      answer: "ReCode doesn't just store your code – it analyzes it, extracts key insights, identifies patterns, and creates structured revision notes that help you truly understand and remember solutions."
    },
    {
      question: "Can I export my notes?",
      answer: "Pro users can export their notes as PDF or Markdown files, making it easy to review offline or share with others."
    },
  ];

  return (
    <section id="faq" ref={ref} className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently asked questions
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about ReCode
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/20 transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTASection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-cyan-500/10"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to ace your next interview?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are mastering LeetCode with AI-powered insights
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/30 text-white text-lg flex items-center justify-center gap-2 group"
            >
              Start Free Today
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-sm text-gray-500"
          >
            No credit card required • 5 free analyses daily
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingPage;
