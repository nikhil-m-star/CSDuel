"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Brain, Cpu, Database, Globe, Clock, Users, Zap, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const topics = [
  { id: "DSA", name: "DSA", icon: Brain, color: "#06b6d4", desc: "Arrays, Trees, Graphs, DP" },
  { id: "OS", name: "Operating Systems", icon: Cpu, color: "#8b5cf6", desc: "Process, Memory, Scheduling" },
  { id: "DBMS", name: "DBMS", icon: Database, color: "#10b981", desc: "SQL, Normalization, Txns" },
  { id: "CN", name: "Computer Networks", icon: Globe, color: "#f59e0b", desc: "OSI, TCP/IP, HTTP, DNS" },
];

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [recentRooms, setRecentRooms] = useState<{id:string;code:string;status:string;topic:string;players:{user:{username:string};score:number}[]}[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user").catch(console.error);
    fetch("/api/rooms").then(r=>r.json()).then(d=>{if(Array.isArray(d))setRecentRooms(d)}).catch(console.error);
  }, []);

  const handleCreate = async () => {
    if(!selectedTopic){setError("Select a topic");return;}
    setIsCreating(true);setError("");
    try {
      const res = await fetch("/api/rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:selectedTopic})});
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
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, <span className="gradient-text">{clerkUser?.firstName||clerkUser?.username||"Duelist"}</span></h1>
          <p className="text-text-secondary">Create a new duel or join with a code</p>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="lg:col-span-2 space-y-6">
            {/* Create */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary"/></div>
                <div><h2 className="text-lg font-semibold">Create a Duel</h2><p className="text-sm text-text-muted">Select a topic</p></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {topics.map(t=>(
                  <button key={t.id} onClick={()=>setSelectedTopic(t.id)} className="p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer" style={{borderColor:selectedTopic===t.id?t.color:"transparent",backgroundColor:selectedTopic===t.id?`${t.color}10`:"rgb(30 41 59 / 0.5)"}}>
                    <div className="flex items-center gap-3">
                      <t.icon className="w-8 h-8" style={{color:t.color}}/>
                      <div><div className="font-medium text-sm">{t.name}</div><div className="text-xs text-text-muted mt-0.5">{t.desc}</div></div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={handleCreate} disabled={isCreating||!selectedTopic} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all">
                {isCreating?<Loader2 className="w-5 h-5 animate-spin"/>:<><Zap className="w-5 h-5"/>Create Duel Room</>}
              </button>
            </div>
            {/* Join */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><ArrowRight className="w-5 h-5 text-secondary"/></div>
                <div><h2 className="text-lg font-semibold">Join a Duel</h2><p className="text-sm text-text-muted">Enter a 6-character room code</p></div>
              </div>
              <div className="flex gap-3">
                <input type="text" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,6))} placeholder="ABCDEF" maxLength={6} className="flex-1 px-4 py-3.5 rounded-xl bg-surface border border-border-light text-text-primary font-mono text-lg tracking-widest text-center placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"/>
                <button onClick={handleJoin} disabled={isJoining||joinCode.length<6} className="px-6 py-3.5 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all">
                  {isJoining?<Loader2 className="w-5 h-5 animate-spin"/>:<><Users className="w-5 h-5"/>Join</>}
                </button>
              </div>
            </div>
            <AnimatePresence>{error&&<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">{error}</motion.div>}</AnimatePresence>
          </motion.div>
          {/* Recent */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4"><Clock className="w-5 h-5 text-text-muted"/><h2 className="text-lg font-semibold">Recent Duels</h2></div>
              {recentRooms.length===0?(<div className="text-center py-8"><Zap className="w-10 h-10 text-text-muted/30 mx-auto mb-3"/><p className="text-sm text-text-muted">No duels yet</p></div>):(
                <div className="space-y-3">{recentRooms.map(room=>(
                  <button key={room.id} onClick={()=>router.push(room.status==="COMPLETED"?`/results/${room.id}`:`/room/${room.code}`)} className="w-full p-3 rounded-xl bg-surface/50 hover:bg-surface transition-all text-left cursor-pointer">
                    <div className="flex items-center justify-between mb-1"><span className="font-mono text-xs text-primary">{room.code}</span><span className={`text-xs px-2 py-0.5 rounded-full ${room.status==="COMPLETED"?"bg-success/10 text-success":room.status==="IN_PROGRESS"?"bg-accent/10 text-accent":"bg-primary/10 text-primary"}`}>{room.status==="COMPLETED"?"Done":room.status==="IN_PROGRESS"?"Live":"Waiting"}</span></div>
                    <div className="text-sm font-medium">{room.topic}</div>
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
