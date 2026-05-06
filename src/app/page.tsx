"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Zap,
  Trophy,
  Brain,
  ArrowRight,
  Users,
  Timer,
  Shield,
} from "lucide-react";
import { SignInButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen grid-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Swords className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">CSDuel</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all duration-300 cursor-pointer font-medium text-sm">
                  Sign In
                </button>
              </SignInButton>
            )}
            {isLoaded && isSignedIn && (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-all duration-300"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-text-secondary">
              <Zap className="w-4 h-4 text-accent" />
              <span>AI-Powered CS Knowledge Battles</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Duel Your Way to{" "}
              <span className="gradient-text">CS Mastery</span>
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              Challenge friends to real-time 1v1 quiz battles on DSA, Operating Systems,
              Databases, and Networks. AI-generated questions. Live scoring. Instant results.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isLoaded && !isSignedIn && (
                <SignInButton mode="modal">
                  <button className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center gap-2 cursor-pointer">
                    Start Dueling
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              )}
              {isLoaded && isSignedIn && (
                <Link
                  href="/dashboard"
                  className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center gap-2"
                >
                  Enter Arena
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                href="#features"
                className="px-8 py-4 rounded-2xl glass text-text-secondary hover:text-text-primary transition-all duration-300 font-medium"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto"
          >
            {[
              { label: "Topics", value: "4+", icon: Brain },
              { label: "Questions/Duel", value: "10", icon: Zap },
              { label: "Max Points", value: "150", icon: Trophy },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold font-mono">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Create or join a duel room, select your topic, and battle it out in real-time
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Create or Join",
                desc: "Get a unique room code or enter one to join an existing duel",
                color: "text-primary",
              },
              {
                icon: Brain,
                title: "AI Questions",
                desc: "10 unique MCQs generated by Llama 3.3-70B, tailored to your topic",
                color: "text-secondary",
              },
              {
                icon: Timer,
                title: "Race the Clock",
                desc: "30 seconds per question. Faster correct answers earn bonus points",
                color: "text-accent",
              },
              {
                icon: Trophy,
                title: "Claim Victory",
                desc: "See detailed results, track your stats, and climb the leaderboard",
                color: "text-success",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:bg-bg-card-hover transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="gradient-text">Battlefield</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { name: "Data Structures & Algorithms", code: "DSA", icon: "🧮", cls: "topic-dsa" },
              { name: "Operating Systems", code: "OS", icon: "⚙️", cls: "topic-os" },
              { name: "Database Management", code: "DBMS", icon: "🗄️", cls: "topic-dbms" },
              { name: "Computer Networks", code: "CN", icon: "🌐", cls: "topic-cn" },
            ].map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${topic.cls} glass rounded-2xl p-6 hover:bg-bg-card-hover transition-all duration-300 cursor-default group`}
                style={{
                  boxShadow: `0 0 30px var(--topic-glow)`,
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{topic.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{topic.name}</h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/5"
                      style={{ color: "var(--topic-color)" }}
                    >
                      {topic.code}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 glow-primary"
          >
            <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Prove Your Knowledge?</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Join the arena and challenge the best. Every duel makes you sharper.
            </p>
            {isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer">
                  Get Started — It&apos;s Free
                </button>
              </SignInButton>
            )}
            {isLoaded && isSignedIn && (
              <Link
                href="/dashboard"
                className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                Go to Dashboard
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            <span>CSDuel</span>
          </div>
          <span>Built with ⚡ Next.js, Socket.io & NVIDIA NIM</span>
        </div>
      </footer>
    </div>
  );
}
