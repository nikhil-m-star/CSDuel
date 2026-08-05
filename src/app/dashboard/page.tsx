"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Users, Zap, Loader2, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [error, setError] = useState("");
  const [showFriendMode, setShowFriendMode] = useState(false);

  const ensureUserSynced = async () => {
    const res = await fetch("/api/user");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to sync user");
    return data;
  };

  useEffect(() => {
    ensureUserSynced().catch(console.error);
    return () => { disconnectSocket(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindMatch = async () => {
    setIsQueuing(true);
    setError("");

    try {
      await ensureUserSynced();
      const res = await fetch("/api/matchmaking/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enter matchmaking");

      router.push(`/room/${data.roomCode}?autoStart=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enter matchmaking");
      setIsQueuing(false);
    }
  };

  const cancelMatch = () => {
    setIsQueuing(false);
  };

  const handleCreate = async () => {
    setIsCreating(true); setError("");
    try {
      await ensureUserSynced();
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Mixed" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/room/${data.code}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); setIsCreating(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError("Enter a room code"); return; }
    setIsJoining(true); setError("");
    try {
      await ensureUserSynced();
      const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); setIsJoining(false); }
  };

  return (
    <div className="min-h-screen grid-pattern">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, <span className="text-primary">{clerkUser?.firstName || clerkUser?.username || "Duelist"}</span></h1>
          <p className="text-text-secondary">Ready for your next battle?</p>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-3xl bg-error/10 border border-error/20 text-error font-bold">{error}</motion.div>}
          </AnimatePresence>

          {/* Matchmaking */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass p-8 rounded-[32px] text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <Globe className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Play Online</h2>
                <p className="text-text-secondary mb-8 max-w-sm mx-auto">
                  Match instantly with another player online for a mixed 10-question CS duel.
                </p>

                {isQueuing ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 text-primary font-bold bg-primary/10 px-6 py-4 rounded-full">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching for an opponent...
                    </div>
                    <p className="text-xs text-text-muted">Waiting for another player to join the queue</p>
                    <button onClick={cancelMatch} className="text-sm font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                      Cancel Search
                    </button>
                  </div>
                ) : (
                  <button onClick={handleFindMatch} className="w-full sm:w-auto px-12 py-4 rounded-3xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Zap className="w-6 h-6" /> Find Match
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Friend Mode */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => setShowFriendMode(!showFriendMode)}
              className="w-full glass p-6 rounded-3xl flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center">
                  <Users className="w-6 h-6 text-text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Play with a Friend</h3>
                  <p className="text-sm text-text-secondary">Create or join a private room</p>
                </div>
              </div>
              <ArrowRight className={`w-6 h-6 text-text-muted transition-transform ${showFriendMode ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence>
              {showFriendMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div className="glass rounded-3xl p-6">
                      <h4 className="font-bold mb-2">Create Room</h4>
                      <p className="text-sm text-text-muted mb-6">Generate a 6-letter code to share.</p>
                      <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 rounded-full bg-surface hover:bg-surface-light font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" />Create</>}
                      </button>
                    </div>
                    <div className="glass rounded-3xl p-6">
                      <h4 className="font-bold mb-2">Join Room</h4>
                      <p className="text-sm text-text-muted mb-4">Enter a code from a friend.</p>
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="ABCDEF"
                          maxLength={6}
                          className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-center font-mono text-lg tracking-widest focus:outline-none focus:border-primary transition-colors"
                        />
                        <button onClick={handleJoin} disabled={isJoining || joinCode.length < 6} className="w-full py-3 rounded-full bg-surface hover:bg-surface-light font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer">
                          {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
