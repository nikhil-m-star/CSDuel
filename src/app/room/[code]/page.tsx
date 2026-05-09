/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Copy, Check, Users, Loader2, Swords, Timer, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { calculateScore } from "@/lib/utils";
import type { Socket } from "socket.io-client";

interface Question { id:string; questionText:string; options:string[]; correctAnswer:string; orderIndex:number; }
interface Player { userId:string; score:number; user:{id:string; clerkId:string; username:string; imageUrl?:string|null}; }
interface AnswerResult {
  isCorrect:boolean;
  correctAnswer:string;
  score:number;
  totalScore:number;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const code = (params.code as string)?.toUpperCase();
  const isAutoStartMatch = searchParams.get("autoStart") === "1";

  const [roomData, setRoomData] = useState<{id:string;status:string;topic:string;players:Player[];questions:Question[];hostClerkId:string|null}|null>(null);
  const [phase, setPhase] = useState<"loading"|"waiting"|"countdown"|"playing"|"finished">("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string|null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult|null>(null);
  const [isAnswerPending, setIsAnswerPending] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<Socket|null>(null);
  const answerTimeRef = useRef<number>(0);
  const myScoreRef = useRef(0);
  const optimisticScoreRef = useRef<number|null>(null);
  const phaseRef = useRef(phase);
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    myScoreRef.current = myScore;
  }, [myScore]);

  const fetchRoomData = useCallback(async () => {
    if(!code) return;
    try {
      const r = await fetch(`/api/rooms/${code}`);
      const data = await r.json();
      if(data.error){setError(data.error);return;}
      setRoomData(data);
      if(data.status==="COMPLETED"){router.push(`/results/${data.id}`);return;}
      if(data.status==="IN_PROGRESS" && phaseRef.current==="loading") setPhase("playing");
      else if(data.status==="WAITING") setPhase("waiting");
    } catch {
      setError("Failed to load room");
    }
  }, [code, router]);

  useEffect(()=>{
    fetchRoomData();
  },[fetchRoomData]);

  useEffect(() => {
    if (!roomData || !clerkUser?.id) return;

    const me = roomData.players.find((player) => player.user.clerkId === clerkUser.id);
    const opponent = roomData.players.find((player) => player.user.clerkId !== clerkUser.id);
    setMyScore(me?.score ?? 0);
    setOpponentScore(opponent?.score ?? 0);
  }, [roomData, clerkUser?.id]);

  // Socket connection
  useEffect(()=>{
    if(!code) return;
    let socket: Socket;
    const connect = async ()=>{
      const token = await getToken();
      if(!token) return;
      socket = connectSocket(token);
      socketRef.current = socket;

      const joinRoom = ()=>{socket.emit("join-room",code);};

      socket.on("connect",()=>{
        setIsSocketReady(true);
        joinRoom();
      });
      socket.on("disconnect",()=>{
        setIsSocketReady(false);
      });

      if (socket.connected) {
        setIsSocketReady(true);
        joinRoom();
      }

      socket.on("room-update",async (data:{status:string})=>{
        setRoomData(prev=>prev?{...prev,status:data.status}:prev);
        await fetchRoomData();
        if(data.status==="IN_PROGRESS"&&phaseRef.current==="waiting"){setPhase("countdown");}
      });
      socket.on("duel-start",async ()=>{
        setIsGenerating(false);
        await fetchRoomData();
        setPhase("playing");setCurrentQ(0);setTimeLeft(30);answerTimeRef.current=Date.now();
      });
      socket.on("question-timer",(data:{timeRemaining:number;questionIndex:number})=>{
        setTimeLeft(data.timeRemaining);
        if(data.questionIndex!==undefined) setCurrentQ(data.questionIndex);
      });
      socket.on("score-update",(data:{scores:{[userId:string]:number}})=>{
        const myClerkId = clerkUser?.id;
        Object.entries(data.scores).forEach(([uid,score])=>{
          if(uid===myClerkId) setMyScore(score as number);
          else setOpponentScore(score as number);
        });
      });
      socket.on("answer-result",(data:{accepted:boolean;isCorrect:boolean;correctAnswer:string;score:number;totalScore:number})=>{
        setIsAnswerPending(false);
        optimisticScoreRef.current = null;
        if (!data.accepted) {
          if (typeof data.totalScore === "number") {
            setMyScore(data.totalScore);
          }
          return;
        }

        setAnswerResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          score: data.score,
          totalScore: data.totalScore,
        });
        setMyScore(data.totalScore);
      });
      socket.on("answer-error",(data:{message?:string})=>{
        setIsAnswerPending(false);
        if (optimisticScoreRef.current !== null) {
          setMyScore(optimisticScoreRef.current);
          optimisticScoreRef.current = null;
        }
        setSelectedAnswer(null);
        setAnswerResult(null);
        setError(data.message || "Failed to submit answer");
      });
      socket.on("next-question",(data:{questionIndex:number})=>{
        optimisticScoreRef.current = null;
        setCurrentQ(data.questionIndex);setTimeLeft(30);setSelectedAnswer(null);setAnswerResult(null);setIsAnswerPending(false);answerTimeRef.current=Date.now();
      });
      socket.on("duel-end",(data:{roomId:string})=>{setPhase("finished");setTimeout(()=>router.push(`/results/${data.roomId}`),2000);});
      socket.on("room-error",(data:{message?:string})=>{
        setIsGenerating(false);
        setError(data.message || "Failed to start duel");
      });
    };
    connect();
    return ()=>{disconnectSocket();};
  },[code,getToken,router,fetchRoomData,clerkUser?.id]);

  const copyCode = ()=>{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const startDuel = async ()=>{
    if(isGenerating) return;
    setError("");
    setIsGenerating(true);
    try {
      socketRef.current?.emit("start-duel",{roomCode:code,roomId:roomData?.id});
    } catch {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isAutoStartMatch || !roomData || !clerkUser?.id || !isSocketReady) return;
    if (autoStartTriggeredRef.current) return;
    if (isGenerating) return;
    if (roomData.status !== "WAITING" || roomData.players.length < 2) return;
    if (roomData.hostClerkId !== clerkUser.id) return;

    autoStartTriggeredRef.current = true;
    setError("");
    setIsGenerating(true);
    socketRef.current?.emit("start-duel",{roomCode:code,roomId:roomData?.id});
  }, [isAutoStartMatch, roomData, clerkUser?.id, isSocketReady, isGenerating, code]);

  // Countdown
  useEffect(()=>{
    if(phase!=="countdown") return;
    setCountdownNum(3);
    const interval = setInterval(()=>{
      setCountdownNum(prev=>{
        if(prev<=1){clearInterval(interval);setPhase("playing");answerTimeRef.current=Date.now();return 0;}
        return prev-1;
      });
    },1000);
    return ()=>clearInterval(interval);
  },[phase]);

  const submitAnswer = useCallback(async (answer:string)=>{
    if(selectedAnswer||isAnswerPending||!roomData) return;
    setError("");
    const question = roomData.questions[currentQ];
    if(!question) return;
    const timeTaken = Math.min(30,(Date.now()-answerTimeRef.current)/1000);
    const isCorrect = answer !== "TIMEOUT" && answer === question.correctAnswer;
    const score = calculateScore(isCorrect, timeTaken);
    const baseScore = myScoreRef.current;
    const optimisticTotalScore = baseScore + score;
    setSelectedAnswer(answer);
    setAnswerResult({
      isCorrect,
      correctAnswer: question.correctAnswer,
      score,
      totalScore: optimisticTotalScore,
    });
    optimisticScoreRef.current = baseScore;
    setMyScore(optimisticTotalScore);
    setIsAnswerPending(true);
    socketRef.current?.emit("submit-answer",{roomCode:code,roomId:roomData.id,questionId:question.id,selectedAnswer:answer,timeTaken});
  },[selectedAnswer,isAnswerPending,roomData,currentQ,code]);

  // Auto-advance on timeout
  useEffect(()=>{
    if(phase!=="playing"||!roomData) return;
    if(timeLeft<=0&&!selectedAnswer){
      void submitAnswer("TIMEOUT");
    }
  },[timeLeft,phase,selectedAnswer,roomData,submitAnswer]);

  const question = roomData?.questions?.[currentQ];
  const totalQuestions = roomData?.questions?.length||10;

  if(phase==="loading") return (
    <div className="min-h-screen grid-pattern flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin"/>
    </div>
  );

  if(error && !roomData) return (
    <div className="min-h-screen grid-pattern"><Navbar/><main className="pt-24 text-center"><p className="text-error">{error}</p><button onClick={()=>router.push("/dashboard")} className="mt-4 px-6 py-2 rounded-xl bg-primary text-white cursor-pointer">Back to Lobby</button></main></div>
  );

  // Waiting phase
  if(phase==="waiting") return (
    <div className="min-h-screen grid-pattern"><Navbar/>
      <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass rounded-2xl p-8 text-center">
          {error && <div className="mb-6 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</div>}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"><Swords className="w-8 h-8 text-primary"/></div>
          <h1 className="text-2xl font-bold mb-2">{isAutoStartMatch ? "Match Found" : "Duel Room"}</h1>
          <p className="text-text-secondary mb-6">{isAutoStartMatch ? "Preparing your duel..." : "Share this code with your opponent"}</p>
          {!isAutoStartMatch && (
            <button onClick={copyCode} className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface border border-border-light hover:border-primary/30 transition-all cursor-pointer mb-8">
              <span className="font-mono text-3xl tracking-[0.3em] text-primary font-bold">{code}</span>
              {copied?<Check className="w-5 h-5 text-success"/>:<Copy className="w-5 h-5 text-text-muted"/>}
            </button>
          )}
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-text-muted"><span className="px-3 py-1 rounded-lg bg-surface">{roomData?.topic}</span></div>
          <div className="border-t border-border-light pt-6 mt-6">
            <p className="text-sm text-text-muted mb-4"><Users className="w-4 h-4 inline mr-1"/>Players ({roomData?.players?.length||0}/2)</p>
            <div className="flex justify-center gap-4">
              {roomData?.players?.map((p,i)=>(
                <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                  {p.user.imageUrl ? (
                    <Image
                      src={p.user.imageUrl}
                      alt={p.user.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">{p.user.username?.[0]?.toUpperCase()||"?"}</div>
                  )}
                  <span className="text-sm font-medium">{p.user.username}</span>
                </div>
              ))}
              {(roomData?.players?.length||0)<2&&(
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-2 opacity-40"><div className="w-8 h-8 rounded-full bg-surface border border-dashed border-border-light flex items-center justify-center"><Users className="w-4 h-4"/></div><span className="text-sm">Waiting...</span></div>
              )}
            </div>
          </div>
          {!isAutoStartMatch && (roomData?.players?.length || 0) >= 2 && (
            roomData?.hostClerkId === clerkUser?.id ? (
              <button 
                onClick={startDuel} 
                disabled={isGenerating} 
                className="mt-8 px-8 py-4 rounded-3xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2 mx-auto cursor-pointer transition-all shadow-[0_0_30px_rgba(255,46,91,0.2)]"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin"/>Generating Questions...</>
                ) : (
                  <><Zap className="w-5 h-5"/>Start Duel</>
                )}
              </button>
            ) : (
              <div className="mt-8 p-4 rounded-2xl bg-surface/50 border border-border/50 text-text-secondary text-sm font-medium">
                Waiting for host to start the duel...
              </div>
            )
          )}
          {isAutoStartMatch && (roomData?.players?.length || 0) >= 2 && (
            <div className="mt-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              Starting duel automatically...
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );

  // Countdown phase
  if(phase==="countdown") return (
    <div className="min-h-screen grid-pattern flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div key={countdownNum} initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:1.5,opacity:0}} transition={{duration:0.5}} className="text-8xl font-bold gradient-text font-mono">{countdownNum||"GO!"}</motion.div>
      </AnimatePresence>
    </div>
  );

  // Playing phase
  return (
    <div className="min-h-screen grid-pattern">
      <div className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-text-muted">Q {currentQ+1}/{totalQuestions}</span>
            <div className="w-32 h-2 rounded-full bg-surface overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${((currentQ+1)/totalQuestions)*100}%`}}/></div>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft<=5?"text-error animate-pulse":timeLeft<=10?"text-accent":"text-text-primary"}`}>
            <Timer className="w-5 h-5"/>{timeLeft}s
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-primary font-mono font-bold">{myScore}</span>
            <span className="text-text-muted">vs</span>
            <span className="text-error font-mono font-bold">{opponentScore}</span>
          </div>
        </div>
      </div>

      <main className="pt-28 pb-12 px-4 max-w-3xl mx-auto">
        {error && <div className="mb-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</div>}
        {question&&(
          <motion.div key={currentQ} initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <p className="text-lg font-medium leading-relaxed">{question.questionText}</p>
            </div>
            <div className="grid gap-3">
              {question.options.map((opt,i)=>{
                const letter = String.fromCharCode(65+i);
                const isSelected = selectedAnswer===letter;
                const isCorrectAnswer = answerResult?.correctAnswer===letter;
                const showResult = !!answerResult;
                let cls = "glass rounded-xl p-4 text-left transition-all cursor-pointer border-2 ";
                if(showResult){
                  if(isCorrectAnswer) cls+="border-success bg-success/10 glow-success";
                  else if(isSelected&&!answerResult.isCorrect) cls+="border-error bg-error/10 glow-error";
                  else cls+="border-transparent opacity-50";
                } else if(isSelected) cls+="border-primary bg-primary/20 scale-[1.01] shadow-[0_0_0_1px_rgba(255,46,91,0.35)]";
                else if(selectedAnswer) cls+="border-transparent opacity-50";
                else cls+="border-transparent hover:bg-bg-card-hover hover:border-primary/20";

                return (
                  <motion.button key={i} whileHover={!showResult&&!selectedAnswer?{scale:1.01}:{}} whileTap={!showResult&&!selectedAnswer?{scale:0.99}:{}} onClick={()=>!showResult&&!selectedAnswer&&submitAnswer(letter)} disabled={!!showResult || !!selectedAnswer} className={cls}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${showResult&&isCorrectAnswer?"bg-success text-white":showResult&&isSelected?"bg-error text-white":isSelected?"bg-primary text-white":"bg-surface text-text-secondary"}`}>{letter}</span>
                      <span className="text-sm">{opt}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {isAnswerPending&&!answerResult&&<p className="text-xs text-primary text-center animate-pulse">Answer locked in...</p>}
            {answerResult&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`rounded-xl p-4 ${answerResult.isCorrect?"bg-success/10 border border-success/20":"bg-error/10 border border-error/20"}`}>
                <p className="text-sm font-medium mb-1">{answerResult.isCorrect?`Correct! +${answerResult.score} pts`:"Wrong!"}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
