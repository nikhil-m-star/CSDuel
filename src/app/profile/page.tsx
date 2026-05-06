"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, TrendingDown, Swords, Brain, Clock, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Stats { totalDuels:number; wins:number; losses:number; winRate:number; totalScore:number; strongestTopic:string; weakestTopic:string; }
interface DuelHistory { id:string; code:string; topic:string; status:string; players:{score:number;user:{id:string;username:string}}[]; createdAt:string; }

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

        const roomsRes = await fetch("/api/rooms");
        const rooms = await roomsRes.json();
        if(!Array.isArray(rooms)) return;

        setHistory(rooms);
        const completed = rooms.filter((r:DuelHistory)=>r.status==="COMPLETED");
        let wins=0; const topicScores:{[t:string]:{correct:number;total:number}}={};

        completed.forEach((r:DuelHistory)=>{
          const sorted = [...r.players].sort((a,b)=>b.score-a.score);
          if(sorted[0]?.user.id===user.id && r.players.length>1) wins++;
          // topic tracking
          if(!topicScores[r.topic]) topicScores[r.topic]={correct:0,total:0};
          const myPlayer = r.players.find(p=>p.user.id===user.id);
          if(myPlayer){topicScores[r.topic].correct+=myPlayer.score; topicScores[r.topic].total+=150;}
        });

        let strongest="N/A",weakest="N/A",maxRate=0,minRate=Infinity;
        Object.entries(topicScores).forEach(([topic,{correct,total}])=>{
          const rate = total>0?correct/total:0;
          if(rate>maxRate){maxRate=rate;strongest=topic;}
          if(rate<minRate){minRate=rate;weakest=topic;}
        });

        setStats({totalDuels:completed.length,wins,losses:completed.length-wins,winRate:completed.length>0?Math.round((wins/completed.length)*1000)/10:0,totalScore:completed.reduce((sum:number,r:DuelHistory)=>{const p=r.players.find(p=>p.user.id===user.id);return sum+(p?.score||0);},0),strongestTopic:strongest,weakestTopic:weakest});
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
            <img src={clerkUser.imageUrl} alt="Profile" className="w-20 h-20 rounded-[32px] object-cover shrink-0" />
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
            <div className="space-y-3">{history.filter(r=>r.status==="COMPLETED").map(room=>{
              const myPlayer = room.players.find(p=>p.user.id===myUserId);
              const opponent = room.players.find(p=>p.user.id!==myUserId);
              const won = myPlayer&&opponent?myPlayer.score>opponent.score:false;
              return (
                <button key={room.id} onClick={()=>router.push(`/results/${room.id}`)} className="w-full p-4 rounded-xl bg-surface/50 hover:bg-surface transition-all text-left cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="font-mono text-xs text-primary">{room.code}</span><span className="text-xs px-2 py-0.5 rounded-full bg-surface">{room.topic}</span></div>
                      <div className="text-sm">vs <span className="font-medium">{opponent?.user.username||"Unknown"}</span></div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${won?"text-success":"text-error"}`}>{won?"WIN":"LOSS"}</div>
                      <div className="text-xs text-text-muted font-mono">{myPlayer?.score||0} - {opponent?.score||0}</div>
                    </div>
                  </div>
                </button>
              );
            })}</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
