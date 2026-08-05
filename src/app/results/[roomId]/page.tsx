"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Medal, ArrowLeft, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import confetti from "canvas-confetti";

interface PlayerResult { userId:string; username:string; imageUrl?:string|null; score:number; }
interface QuestionData { id:string; questionText:string; options:string[]; correctAnswer:string; explanation?:string; }

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [topic, setTopic] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);

  const [analysisText, setAnalysisText] = useState("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const generateAnalysis = async () => {
    if (isAnalysisLoading || analysisText) return;
    setIsAnalysisLoading(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisText(data.analysis);
      } else {
        setAnalysisError(data.error || "Failed to generate AI analysis");
      }
    } catch {
      setAnalysisError("Failed to connect to AI analysis service");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  useEffect(()=>{
    const load = async ()=>{
      try {
        const userRes = await fetch("/api/user");
        const userData = await userRes.json();
        setMyUserId(userData.id);

        const roomRes = await fetch(`/api/results/${roomId}`);
        const fullRoom = await roomRes.json();
        if (fullRoom.error) {
          setLoading(false);
          return;
        }

        setTopic(fullRoom.topic);
        setRoomCode(fullRoom.code);

        setQuestions(fullRoom.questions||[]);
        const playerResults = (fullRoom.players||[]).map((p:{userId:string;score:number;user:{id:string;username:string;imageUrl?:string|null}})=>({
          userId:p.user.id, username:p.user.username, imageUrl:p.user.imageUrl, score:p.score,
        }));
        playerResults.sort((a:PlayerResult,b:PlayerResult)=>b.score-a.score);
        setPlayers(playerResults);

        // Fire confetti if winner
        if(playerResults[0]?.userId===userData.id){
          setTimeout(()=>{
            confetti({particleCount:100,spread:70,origin:{y:0.6}});
            setTimeout(()=>confetti({particleCount:50,spread:100,origin:{y:0.5}}),500);
          },500);
        }
      } catch(e){console.error(e);}
      setLoading(false);
    };
    load();
  },[roomId]);

  if(loading) return <div className="min-h-screen grid-pattern flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  const winner = players[0];
  const loser = players[1];
  const isWinner = winner?.userId===myUserId;
  const isDraw = winner&&loser&&winner.score===loser.score;

  return (
    <div className="min-h-screen grid-pattern"><Navbar/>
      <main className="pt-28 pb-12 px-4 max-w-3xl mx-auto">
        {/* Result Banner */}
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="glass rounded-2xl p-8 text-center mb-6">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.2}}>
            {isDraw?<Medal className="w-16 h-16 text-accent mx-auto mb-4"/>:<Trophy className={`w-16 h-16 mx-auto mb-4 ${isWinner?"text-accent":"text-text-muted"}`}/>}
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">{isDraw?"It's a Draw!":isWinner?"Victory!":"Defeat"}</h1>
          <p className="text-text-secondary mb-6">{isDraw?"Both players tied!":isWinner?"You dominated this duel!":"Better luck next time!"}</p>
          <div className="flex items-center justify-center gap-8">
            {players.map((p,i)=>(
              <div key={p.userId} className="text-center">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.username}
                    width={64}
                    height={64}
                    className={`w-16 h-16 rounded-[24px] object-cover mx-auto mb-2 ${i===0 ? "ring-2 ring-accent" : ""}`}
                    unoptimized
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${i===0?"bg-accent text-bg-dark":"bg-surface"}`}>{p.username?.[0]?.toUpperCase()||"?"}</div>
                )}
                <div className="font-medium text-sm">{p.username}</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${i===0?"text-accent":"text-text-secondary"}`}>{p.score}</div>
                <div className="text-xs text-text-muted">points</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-text-muted">Room: <span className="font-mono text-primary">{roomCode}</span> • Topic: {topic}</div>
        </motion.div>

        {/* AI Analysis Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> AI Match Analysis
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Get an AI breakdown of user answers, speed, and key CS concepts missed</p>
            </div>
            {!analysisText && (
              <button
                onClick={generateAnalysis}
                disabled={isAnalysisLoading}
                className="px-5 py-2.5 rounded-2xl bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs border border-accent/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isAnalysisLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-accent" />Analyzing Match...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Generate AI Analysis</>
                )}
              </button>
            )}
          </div>

          {analysisError && <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error">{analysisError}</div>}

          {analysisText && (
            <div className="p-5 rounded-2xl bg-surface/70 border border-border-light text-sm space-y-4 whitespace-pre-wrap leading-relaxed">
              {analysisText}
            </div>
          )}
        </motion.div>

        {/* Question Breakdown */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Question Breakdown</h2>
          <div className="space-y-3">
            {questions.map((q,i)=>(
              <div key={q.id} className="p-4 rounded-xl bg-surface/50">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-text-muted mt-1">Q{i+1}</span>
                  <div className="flex-1">
                    <p className="text-sm mb-2">{q.questionText}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">Answer: {q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={()=>router.push("/dashboard")} className="flex-1 py-4 rounded-3xl glass hover:bg-bg-card-hover transition-all flex items-center justify-center gap-2 text-sm cursor-pointer font-bold"><ArrowLeft className="w-4 h-4"/>Back to Lobby</button>
          <button onClick={()=>router.push("/dashboard")} className="flex-1 py-4 rounded-3xl bg-primary text-white font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"><RotateCcw className="w-4 h-4"/>Play Again</button>
        </div>
      </main>
    </div>
  );
}
