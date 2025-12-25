import React, { useState, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  BrainCircuit,
  Code2,
  Zap,
  BookOpen,
  ArrowRight,
  Github,
  Sparkles,
  CheckCircle2,
  Star,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  Terminal,
  Cpu,
  Globe,
} from "lucide-react";
import AppLogo from "./Logo-With-Name cropped.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const heroEl = heroRef.current;
      const elements = [
        h1Ref.current,
        pRef.current,
        btnRef.current,
        badgesRef.current,
      ];

      gsap.set(heroEl, { autoAlpha: 0 });

      const runAnimation = () => {
        gsap.set(elements, { autoAlpha: 0, y: 32 });

        const tl = gsap.timeline({
          defaults: { duration: 0.8, ease: "power3.out" },
        });

        tl.to(heroEl, { autoAlpha: 1, duration: 0.01 })
          .to(h1Ref.current, { autoAlpha: 1, y: 0 }, 0.05)
          .to(pRef.current, { autoAlpha: 1, y: 0 }, 0.2)
          .to(btnRef.current, { autoAlpha: 1, y: 0 }, 0.35)
          .to(badgesRef.current, { autoAlpha: 1, y: 0 }, 0.5);
      };

      if (document.fonts && "ready" in document.fonts) {
        document.fonts.ready.then(runAnimation).catch(runAnimation);
      } else {
        runAnimation();
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSocialLogin = (provider: string) => {
    // Future: Implement OAuth provider login
    onGetStarted();
  };

  return (
    <div className="bg-[#0b0f19] text-gray-100 font-sans selection:bg-yellow-500/30">
      {/* Navigation */}
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
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 text-white text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
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
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
              style={{ opacity: 0 }}
            >
              Master LeetCode <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-cyan-400">
                Without the Chaos
              </span>
            </h1>

            <p
              ref={pRef}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
              style={{ opacity: 0 }}
            >
              Stop manually writing notes. Paste your code, and let our AI
              architect your revision strategy with structured insights,
              complexity analysis, and spaced repetition patterns.
            </p>

            <div
              ref={btnRef}
              className="flex flex-col sm:flex-row gap-4 mb-10 justify-center"
              style={{ opacity: 0 }}
            >
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 text-white text-lg flex items-center justify-center gap-2 group"
              >
                Get Started{" "}
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div
              ref={badgesRef}
              className="flex items-center justify-center gap-6 text-sm text-gray-500"
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                <span>Free for developers</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative w-full max-w-5xl mt-8 animate-[float_6s_ease-in-out_infinite]">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-blue-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-left">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#0b0f19]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="ml-4 text-xs text-gray-500 font-mono">
                  analysis_result.json
                </div>
              </div>
              <div className="p-6 sm:p-8 font-mono text-sm sm:text-base overflow-x-auto">
                <div className="flex gap-4 mb-4">
                  <div className="text-gray-600 select-none">1</div>
                  <div className="text-purple-400">
                    const <span className="text-blue-400">analyzeSolution</span>{" "}
                    = <span className="text-yellow-500">async</span> (code) =
                    {">"} {"{"}
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="text-gray-600 select-none">2</div>
                  <div className="pl-4 text-gray-300">
                    <span className="text-gray-500">
                      // AI extracting patterns...
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="text-gray-600 select-none">3</div>
                  <div className="pl-4 text-yellow-500">
                    return <span className="text-yellow-500">{"{"}</span>
                  </div>
                </div>
                <div className="flex gap-4 mb-1">
                  <div className="text-gray-600 select-none">4</div>
                  <div className="pl-8 text-blue-300">
                    complexity:{" "}
                    <span className="text-orange-300">"O(n log n)"</span>,
                  </div>
                </div>
                <div className="flex gap-4 mb-1">
                  <div className="text-gray-600 select-none">5</div>
                  <div className="pl-8 text-blue-300">
                    pattern:{" "}
                    <span className="text-orange-300">"Sliding Window"</span>,
                  </div>
                </div>
                <div className="flex gap-4 mb-1">
                  <div className="text-gray-600 select-none">6</div>
                  <div className="pl-8 text-blue-300">
                    edgeCases:{" "}
                    <span className="text-yellow-500">
                      ['Empty Array', 'Single Element']
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-gray-600 select-none">7</div>
                  <div className="pl-4 text-yellow-500">{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-gray-800 bg-[#0f1420]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">AI-Powered</div>
              <div className="text-sm text-gray-500 font-medium">
                Smart Analysis
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">15+</div>
              <div className="text-sm text-gray-500 font-medium">
                Languages Supported
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">Instant</div>
              <div className="text-sm text-gray-500 font-medium">
                Pattern Detection
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-gray-500 font-medium">
                Free to Use
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to master DSA
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We've built the ultimate toolkit for developers preparing for
              technical interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Code2 className="w-6 h-6 text-blue-400" />,
                title: "Smart Code Analysis",
                desc: "Paste any solution. We identify the algorithm, time complexity, and space complexity instantly.",
                color: "blue",
              },
              {
                icon: <BookOpen className="w-6 h-6 text-yellow-500" />,
                title: "Auto-Generated Notes",
                desc: "Get structured revision notes with edge cases and key takeaways without typing a word.",
                color: "yellow",
              },
              {
                icon: <Zap className="w-6 h-6 text-orange-400" />,
                title: "Pattern Recognition",
                desc: "We group your problems by pattern (e.g., Sliding Window, DFS) to help you spot trends.",
                color: "orange",
              },
              {
                icon: <Shield className="w-6 h-6 text-purple-400" />,
                title: "Privacy First",
                desc: "Your code never leaves your browser. All data is stored locally on your device.",
                color: "purple",
              },
              {
                icon: <Terminal className="w-6 h-6 text-pink-400" />,
                title: "Multi-Language Support",
                desc: "Python, Java, C++, JavaScript, Go - we understand and analyze them all.",
                color: "pink",
              },
              {
                icon: <Cpu className="w-6 h-6 text-cyan-400" />,
                title: "Interview Mode",
                desc: "Simulate interview conditions with our distraction-free focused view.",
                color: "cyan",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 bg-gray-900/40 rounded-2xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900/60 transition-all duration-300"
              >
                <div
                  className={`bg-${feature.color}-500/10 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section
        id="how-it-works"
        className="py-24 px-4 bg-[#0f1420]/30 border-y border-gray-800/50"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Stop doing it the hard way
            </h2>
            <p className="text-gray-400">
              See the difference ReCode makes in your prep routine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-red-900/5 border border-red-900/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <span className="text-red-500 font-bold text-xl">✕</span>
                </div>
                <h3 className="text-xl font-bold text-red-200">The Old Way</h3>
              </div>
              <ul className="space-y-4 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-red-500/50">•</span>
                  Manually copy-pasting code to Notion
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500/50">•</span>
                  Writing complexity analysis by hand
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500/50">•</span>
                  Forgetting edge cases immediately
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500/50">•</span>
                  Scattered notes across different apps
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-yellow-900/5 border border-yellow-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-yellow-200">
                  ReCode
                </h3>
              </div>
              <ul className="space-y-4 text-gray-300">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500/50 flex-shrink-0" />
                  One-click import from clipboard
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500/50 flex-shrink-0" />
                  AI-generated complexity & logic breakdown
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500/50 flex-shrink-0" />
                  Automatic edge case detection
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500/50 flex-shrink-0" />
                  Centralized, searchable dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Developers Love ReCode</h2>
            <p className="text-gray-400">
              Built by developers, for developers preparing for technical interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Smart Analysis",
                role: "Core Feature",
                content:
                  "Paste your code and get instant complexity analysis, pattern recognition, and structured revision notes - all powered by AI.",
                avatar: "SA",
              },
              {
                name: "Organized Dashboard",
                role: "Core Feature",
                content:
                  "All your solutions in one place. Search, filter by category, and review your progress with an intuitive dashboard.",
                avatar: "OD",
              },
              {
                name: "Get Solutions",
                role: "Core Feature",
                content:
                  "Stuck on a problem? Get AI-generated solutions with multiple approaches - brute force to optimal - with clear explanations.",
                avatar: "GS",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-6 bg-gray-900/30 rounded-xl border border-gray-800"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((_, starI) => (
                    <Star
                      key={starI}
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 bg-[#0f1420]/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is ReCode really free?",
                a: "Yes! ReCode is completely free to use. Just sign up and start analyzing your LeetCode solutions.",
              },
              {
                q: "Where is my data stored?",
                a: "Your solutions are stored securely in our database, linked to your account. You can access them from any device after logging in.",
              },
              {
                q: "What languages are supported?",
                a: "ReCode supports all major programming languages including Python, JavaScript, Java, C++, Go, Rust, TypeScript, and more.",
              },
              {
                q: "How does the AI analysis work?",
                a: "We use Qubrid AI (powered by Qwen3-Coder 30B) to analyze your code, identify DSA patterns, calculate complexity, and generate structured revision notes.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-800 rounded-lg bg-gray-900/20 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-medium text-gray-200">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === index
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 py-4 text-gray-400 border-t border-gray-800/50 bg-gray-900/40">
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-900/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to ace your next interview?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are studying smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 text-white text-lg flex items-center justify-center gap-2"
            >
              Start Analyzing Now <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 bg-[#080b12]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                 <div className="h-10 rounded-lg overflow-hidden">
                    <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
                 </div>
              </div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                The intelligent companion for your coding interview preparation.
                Built by developers, for developers.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="#"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Changelog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-sm">
            <p>&copy; 2025 ReCode. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Made with ❤️ for coders</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
