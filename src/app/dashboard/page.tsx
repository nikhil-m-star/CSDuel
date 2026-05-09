"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Clock, Users, Zap, Loader2, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [recentRooms, setRecentRooms] = useState<{id:string;code:string;status:string;topic:string;players:{user:{username:string};score:number}[]}[]>([]);
  const [error, setError] = useState("");
  const [showFriendMode, setShowFriendMode] = useState(false);

  useEffect(() => {
    fetch("/api/user").catch(console.error);
    fetch("/api/rooms").then(r=>r.json()).then(d=>{if(Array.isArray(d))setRecentRooms(d)}).catch(console.error);
    
    // Cleanup socket if we leave dashboard while queueing
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleFindMatch = async () => {
    setIsQueuing(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const s = connectSocket(token);

      const handleMatchFound = ({ roomCode }: { roomCode: string }) => {
        setIsQueuing(false);
        s.off("match-error", handleMatchError);
        disconnectSocket();
        router.push(`/room/${roomCode}`);
      };

      const handleMatchError = ({ message }: { message?: string }) => {
        setError(message || "Matchmaking failed. Please try again.");
        setIsQueuing(false);
        s.off("match-found", handleMatchFound);
        disconnectSocket();
      };

      s.off("match-found");
      s.off("match-error");
      s.on("match-found", handleMatchFound);
      s.on("match-error", handleMatchError);
      
      s.emit("find-match");
    } catch(e) {
      setError(e instanceof Error ? e.message : "Failed to enter matchmaking");
      setIsQueuing(false);
    }
  };

  const cancelMatch = () => {
    setIsQueuing(false);
    disconnectSocket();
  };

  const handleCreate = async () => {
    setIsCreating(true);setError("");
    try {
      const res = await fetch("/api/rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:"Mixed"})});
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      router.push(`/room/${data.code}`);
    } catch(e){setError(e instanceof Error?e.message:"Failed");setIsCreating(false);}
  };

  const handleJoin = async () => {
    if(!joinCode.trim()){setError("Enter a room code");return;}
    setIsJoining(true);setError("");
    try {
      const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}`,{method:"POST"});
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch(e){setError(e instanceof Error?e.message:"Failed");setIsJoining(false);}
  };

  return (
    <div className="min-h-screen grid-pattern">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, <span className="text-primary">{clerkUser?.firstName||clerkUser?.username||"Duelist"}</span></h1>
          <p className="text-text-secondary">Ready for your next battle?</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="lg:col-span-2 space-y-6">
            
            <AnimatePresence>
              {error && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="p-4 rounded-3xl bg-error/10 border border-error/20 text-error font-bold">{error}</motion.div>}
            </AnimatePresence>

            {/* Matchmaking Section */}
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
                      Finding opponent...
                    </div>
                    <button onClick={cancelMatch} className="text-sm font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                      Cancel Search
                    </button>
                  </div>
                ) : (
                  <button onClick={handleFindMatch} className="w-full sm:w-auto px-12 py-4 rounded-3xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2">
                    <Zap className="w-6 h-6" /> Find Match
                  </button>
                )}
              </div>
            </div>

            {/* Friend Mode Toggle */}
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

            {/* Friend Mode Expanded */}
            <AnimatePresence>
              {showFriendMode && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} exit={{opacity:0, height:0}} className="overflow-hidden">
                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div className="glass rounded-3xl p-6">
                      <h4 className="font-bold mb-2">Create Room</h4>
                      <p className="text-sm text-text-muted mb-6">Generate a 6-letter code to share.</p>
                      <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 rounded-full bg-surface hover:bg-surface-light font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Plus className="w-5 h-5"/>Create</>}
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
                          {isJoining ? <Loader2 className="w-5 h-5 animate-spin"/> : "Join"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <div className="glass rounded-[32px] p-6 h-full">
              <div className="flex items-center gap-3 mb-6"><Clock className="w-5 h-5 text-text-muted"/><h2 className="text-xl font-bold">Recent Duels</h2></div>
              {recentRooms.length===0?(<div className="text-center py-12"><Zap className="w-12 h-12 text-surface-light mx-auto mb-4"/><p className="text-text-muted font-medium">No duels yet</p></div>):(
                <div className="space-y-3">{recentRooms.map(room=>(
                  <button key={room.id} onClick={()=>router.push(room.status==="COMPLETED"?`/results/${room.id}`:`/room/${room.code}`)} className="w-full p-4 rounded-2xl bg-surface/30 hover:bg-surface transition-all text-left cursor-pointer border border-transparent hover:border-border">
                    <div className="flex items-center justify-between mb-2"><span className="font-mono text-sm font-bold text-primary">{room.code}</span><span className={`text-xs font-bold px-3 py-1 rounded-full ${room.status==="COMPLETED"?"bg-success/20 text-success":room.status==="IN_PROGRESS"?"bg-accent/20 text-accent":"bg-primary/20 text-primary"}`}>{room.status==="COMPLETED"?"Done":room.status==="IN_PROGRESS"?"Live":"Waiting"}</span></div>
                    <div className="text-sm font-bold text-text-secondary">{room.topic}</div>
                    <div className="text-xs text-text-muted mt-1">{room.players.length} player{room.players.length!==1?"s":""}</div>
                  </button>
                ))}</div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
