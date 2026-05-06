"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry { id:string; username:string; imageUrl?:string|null; totalDuels:number; wins:number; winRate:number; totalScore:number; }

const topicFilters = ["All","DSA","OS","DBMS","CN","OOPs"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    const url = selectedTopic==="All"?"/api/leaderboard":`/api/leaderboard?topic=${selectedTopic}`;
    fetch(url).then(r=>r.json()).then(data=>{
      if(Array.isArray(data)) setEntries(data);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[selectedTopic]);

  const getRankIcon = (i:number) => {
    if(i===0) return <Trophy className="w-5 h-5 text-amber-400"/>;
    if(i===1) return <Medal className="w-5 h-5 text-gray-300"/>;
    if(i===2) return <Award className="w-5 h-5 text-amber-600"/>;
    return <span className="w-5 h-5 flex items-center justify-center text-xs text-text-muted font-mono">{i+1}</span>;
  };

  return (
    <div className="min-h-screen grid-pattern"><Navbar/>
      <main className="pt-28 pb-12 px-4 max-w-3xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-6">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Leaderboard</span></h1>
          <p className="text-text-secondary text-sm">Top duelists ranked by win rate</p>
        </motion.div>

        {/* Topic Filter */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-text-muted shrink-0"/>
          {topicFilters.map(t=>(
            <button key={t} onClick={()=>setSelectedTopic(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${selectedTopic===t?"bg-primary/10 text-primary border border-primary/20":"glass text-text-secondary hover:text-text-primary"}`}>{t}</button>
          ))}
        </motion.div>

        {/* Table */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-text-muted uppercase tracking-wider border-b border-border-light">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Duels</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-3 text-right">Score</div>
          </div>

          {loading?(
            <div className="py-12 text-center text-text-muted"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"/>Loading...</div>
          ):entries.length===0?(
            <div className="py-12 text-center text-text-muted">No entries yet. Start dueling!</div>
          ):(
            <div>{entries.map((entry,i)=>(
              <motion.div key={entry.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-all hover:bg-surface/50 ${i<3?"border-l-2":""}`} style={{borderLeftColor:i===0?"#f59e0b":i===1?"#9ca3af":i===2?"#b45309":"transparent"}}>
                <div className="col-span-1">{getRankIcon(i)}</div>
                <div className="col-span-4 flex items-center gap-2">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={entry.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white ${i<3?"bg-primary":"bg-surface"}`}>{entry.username?.[0]?.toUpperCase()||"?"}</div>
                  )}
                  <span className="text-sm font-medium truncate">{entry.username}</span>
                </div>
                <div className="col-span-2 text-center text-sm text-text-secondary font-mono">{entry.totalDuels}</div>
                <div className="col-span-2 text-center"><span className={`text-sm font-bold font-mono ${entry.winRate>=70?"text-success":entry.winRate>=50?"text-accent":"text-error"}`}>{entry.winRate}%</span></div>
                <div className="col-span-3 text-right text-sm font-mono text-text-secondary">{entry.totalScore.toLocaleString()}</div>
              </motion.div>
            ))}</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
