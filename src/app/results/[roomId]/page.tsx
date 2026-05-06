"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Medal, ArrowLeft, RotateCcw, Check, X, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import confetti from "canvas-confetti";

interface PlayerResult { userId:string; username:string; imageUrl?:string|null; score:number; }
interface AnswerData { questionId:string; selectedAnswer:string; isCorrect:boolean; timeTaken:number; score:number; }
interface QuestionData { id:string; questionText:string; options:string[]; correctAnswer:string; explanation?:string; }

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<{[userId:string]:AnswerData[]}>({});
  const [myUserId, setMyUserId] = useState("");
  const [topic, setTopic] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async ()=>{
      try {
        const userRes = await fetch("/api/user");
        const userData = await userRes.json();
        setMyUserId(userData.id);

        // We need to get room data by ID - use a small helper
        const roomsRes = await fetch("/api/rooms");
        const roomsData = await roomsRes.json();
        const room = roomsData.find((r:{id:string})=>r.id===roomId);
        if(!room){setLoading(false);return;}

        setTopic(room.topic);
        setRoomCode(room.code);

        // Get full room with questions
        const roomRes = await fetch(`/api/rooms/${room.code}`);
        const fullRoom = await roomRes.json();

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
      <main className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${i===0?"bg-gradient-to-br from-accent to-amber-600":"bg-surface"}`}>{p.username?.[0]?.toUpperCase()||"?"}</div>
                <div className="font-medium text-sm">{p.username}</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${i===0?"text-accent":"text-text-secondary"}`}>{p.score}</div>
                <div className="text-xs text-text-muted">points</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-text-muted">Room: <span className="font-mono text-primary">{roomCode}</span> • Topic: {topic}</div>
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
          <button onClick={()=>router.push("/dashboard")} className="flex-1 py-3 rounded-xl glass hover:bg-bg-card-hover transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"><ArrowLeft className="w-4 h-4"/>Back to Lobby</button>
          <button onClick={()=>router.push("/dashboard")} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"><RotateCcw className="w-4 h-4"/>Play Again</button>
        </div>
      </main>
    </div>
  );
}
