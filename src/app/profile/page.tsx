"use client";
import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Target, TrendingUp, TrendingDown, Swords, Clock, BarChart3, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Stats { totalDuels:number; wins:number; losses:number; winRate:number; totalScore:number; strongestTopic:string; weakestTopic:string; }
interface DuelHistory { id:string; code:string; topic:string; status:string; result:"WIN"|"LOSS"|"DRAW"; players:{score:number;user:{id:string;username:string}}[]; createdAt:string; }

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({totalDuels:0,wins:0,losses:0,winRate:0,totalScore:0,strongestTopic:"N/A",weakestTopic:"N/A"});
  const [history, setHistory] = useState<DuelHistory[]>([]);
  const [myUserId, setMyUserId] = useState("");

  useEffect(()=>{
    const load = async ()=>{
      try {
        const userRes = await fetch("/api/user");
        const user = await userRes.json();
        setMyUserId(user.id);

        const profileRes = await fetch("/api/profile");
        const profile = await profileRes.json();
        if(profile?.stats) setStats(profile.stats);
        if(Array.isArray(profile?.history)) setHistory(profile.history);
      } catch(e){console.error(e);}
    };
    load();
  },[]);

  const statCards = [
    {label:"Total Duels",value:stats.totalDuels,icon:Swords,color:"text-primary"},
    {label:"Wins",value:stats.wins,icon:Trophy,color:"text-success"},
    {label:"Win Rate",value:`${stats.winRate}%`,icon:Target,color:"text-accent"},
    {label:"Total Score",value:stats.totalScore,icon:BarChart3,color:"text-secondary"},
  ];

  return (
    <div className="min-h-screen grid-pattern"><Navbar/>
      <main className="pt-28 pb-12 px-4 max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-8 mb-6 flex items-center gap-6">
          {clerkUser?.imageUrl ? (
            <Image src={clerkUser.imageUrl} alt="Profile" width={80} height={80} className="w-20 h-20 rounded-[32px] object-cover shrink-0" unoptimized />
          ) : (
            <div className="w-20 h-20 rounded-[32px] bg-primary flex items-center justify-center text-3xl font-bold text-white shrink-0">{clerkUser?.firstName?.[0]||clerkUser?.username?.[0]||"?"}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{clerkUser?.firstName||clerkUser?.username||"Duelist"}</h1>
            <p className="text-text-secondary text-sm">{clerkUser?.emailAddresses?.[0]?.emailAddress}</p>
            <div className="flex gap-3 mt-2">
              <span className="text-xs px-2 py-1 rounded-lg bg-surface flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success"/>{stats.strongestTopic}</span>
              <span className="text-xs px-2 py-1 rounded-lg bg-surface flex items-center gap-1"><TrendingDown className="w-3 h-3 text-error"/>{stats.weakestTopic}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((s,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="glass rounded-xl p-4 text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`}/>
              <div className="text-2xl font-bold font-mono">{s.value}</div>
              <div className="text-xs text-text-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* History */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-text-muted"/>Duel History</h2>
          {history.length===0?<p className="text-center text-text-muted py-8">No duels yet</p>:(
            <div className="space-y-3">{history.map(room=>{
              const myPlayer = room.players.find(p=>p.user.id===myUserId);
              const opponent = room.players.find(p=>p.user.id!==myUserId);
              return (
                <button key={room.id} onClick={()=>router.push(`/results/${room.id}`)} className="w-full p-4 rounded-xl bg-surface/50 hover:bg-surface transition-all text-left cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="font-mono text-xs text-primary">{room.code}</span><span className="text-xs px-2 py-0.5 rounded-full bg-surface">{room.topic}</span></div>
                      <div className="text-sm">vs <span className="font-medium">{opponent?.user.username||"Unknown"}</span></div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${room.result==="WIN"?"text-success":room.result==="LOSS"?"text-error":"text-accent"}`}>{room.result}</div>
                      <div className="text-xs text-text-muted font-mono">{myPlayer?.score||0} - {opponent?.score||0}</div>
                    </div>
                  </div>
                </button>
              );
            })}</div>
          )}
        </motion.div>
        {/* Logout Section */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="mt-8 flex justify-center">
          <SignOutButton>
            <button className="flex items-center gap-2 px-8 py-4 rounded-[24px] bg-[#111111] border border-[#1A1A1A] text-error font-bold hover:bg-error/10 transition-all cursor-pointer">
              <LogOut className="w-5 h-5"/>
              Sign Out
            </button>
          </SignOutButton>
        </motion.div>
      </main>
    </div>
  );
}
