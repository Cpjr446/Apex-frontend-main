import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useRouteLoaderData, redirect } from "react-router";
import { LuClock, LuTrophy, LuCheck, LuX, LuAward, LuFlame, LuTarget, LuZap } from "react-icons/lu";
import Navbar from "../../components/navbar";
import { getRankInfo } from "../../utils/rankUtils";
import { useSocket } from "~/context/SocketContext";

function getPlayerId(player: any) {
    if (!player) return "";
    if (!player.userId) return "000000000000000000000000";
    return typeof player.userId === 'object' ? (player.userId._id || player.userId.id || "").toString() : player.userId.toString();
}

export async function clientLoader() {
    const token = localStorage.getItem("token");
    if (!token) return redirect("/login");
    return null;
}

export function meta() {
    return [{ title: "Match - Apex" }];
}

export default function GameRoom() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const data: any = useRouteLoaderData("protected-layout");
    const user = data?.user;
    const { socket } = useSocket();

    const [game, setGame] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [roundStatus, setRoundStatus] = useState<'PLAYING' | 'WAITING' | 'REVIEW'>('PLAYING');
    const [roundData, setRoundData] = useState<any>(null);

    // Keep active question index in ref to avoid closure staleness in socket listeners
    const currentIndexRef = useRef(0);
    const timerRef = useRef<any>(null);

    // Initial Load via REST (Hydration)
    useEffect(() => {
        const fetchGame = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game/${gameId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Game not found");
                const gameData = await res.json();
                console.log("DEBUG: fetchGame response:", gameData);

                if (!user) {
                    console.error("User not found in loader data");
                    navigate("/login");
                    return;
                }

                // Check if user is in this game
                const isPlayer = gameData.players.some((p: any) => {
                    const id = getPlayerId(p);
                    console.log(`Checking player: ${id} vs Me: ${user._id}`);
                    return id && id.toString() === user._id;
                });

                if (!isPlayer) {
                    console.error("Player mismatch!", {
                        myId: user._id,
                        gamePlayers: gameData.players
                    });
                    alert("You are not part of this game");
                    navigate("/dashboard");
                    return;
                }

                if (gameData.status === "FINISHED") {
                    // Show results for finished game
                    const myPlayer = gameData.players.find((p: any) => {
                        const id = getPlayerId(p);
                        return id && id.toString() === user._id;
                    });

                    // Determine winner
                    const p1 = gameData.players[0];
                    const p2 = gameData.players[1];
                    const winnerId = p1.result === "win" ? getPlayerId(p1) :
                        (p2.result === "win" ? getPlayerId(p2) : null);

                    setResults({
                        winner: { userId: winnerId },
                        isDraw: !winnerId,
                        ratingChanges: {
                            [user._id]: {
                                change: myPlayer?.ratingChange || 0,
                                newRating: myPlayer?.newRating || 0
                            }
                        }
                    });
                }

                setGame(gameData);
                setLoading(false);

                // Hydrate progress
                const myPlayer = gameData.players.find((p: any) => {
                    const id = getPlayerId(p);
                    return id && id.toString() === user._id;
                });
                const myProgress = myPlayer?.answers?.length || 0;

                setCurrentQuestionIndex(myProgress);
                currentIndexRef.current = myProgress;

            } catch (error) {
                console.error("Failed to fetch game inside match.tsx:", error);
            }
        };
        fetchGame();
    }, [gameId, user]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket || !user) return;

        const handleGameSync = (data: any) => {
            console.log("SOCKET: Game Synced", data);
            setGame(data);
            if (data.currentQuestionIndex !== undefined) {
                setCurrentQuestionIndex(data.currentQuestionIndex);
                currentIndexRef.current = data.currentQuestionIndex;
            }
            if (data.status === 'IN_PROGRESS') {
                setRoundStatus('PLAYING');
                setLoading(false);
            }
        };

        const handleRoundOver = (data: any) => {
            console.log("SOCKET: Round Over", data);
            setSubmitting(false);
            setRoundStatus('REVIEW');
            setRoundData(data);

            // Update scores and round start time based on payload
            setGame((prevGame: any) => {
                if (!prevGame) return prevGame;
                
                const updatedPlayers = data.results
                    ? prevGame.players.map((p: any) => {
                        const r = data.results.find((res: any) => getPlayerId(p) === res.userId);
                        if (r) {
                            return { ...p, score: r.newScore };
                        }
                        return p;
                    })
                    : prevGame.players;

                return { 
                    ...prevGame, 
                    players: updatedPlayers,
                    currentRoundStartTime: data.nextRoundStartTime // Sync the round start time for the next question
                };
            });

            // Auto-advance after 5 seconds
            setTimeout(() => {
                setRoundStatus('PLAYING');
                setRoundData(null);
                setSelectedAnswer(null);

                setCurrentQuestionIndex((prev) => {
                    const expectedNextIndex = currentIndexRef.current + 1;
                    if (currentIndexRef.current >= expectedNextIndex - 1) {
                        const newIndex = prev + 1;
                        currentIndexRef.current = newIndex;
                        return newIndex;
                    }
                    currentIndexRef.current = prev;
                    return prev;
                });
            }, 5000);
        };

        const handleWaiting = () => {
            console.log("SOCKET: Waiting for opponent");
            setRoundStatus('WAITING');
        };

        const handleOpponentAnswered = () => {
            console.log("Opponent answered");
        };

        const handleGameOver = (data: any) => {
            console.log("SOCKET: Game Over", data);

            setTimeout(() => {
                setLoading(true);
                setTimeout(async () => {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game/${gameId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const finalGame = await res.json();

                    const myPlayer = finalGame.players.find((p: any) => getPlayerId(p) === user._id);
                    setGame(finalGame); // Store full game data
                    setResults({
                        winner: { userId: data.winnerId },
                        isDraw: !data.winnerId,
                        ratingChanges: {
                            [user._id]: {
                                change: myPlayer?.ratingChange || 0,
                                newRating: myPlayer?.newRating || 0
                            }
                        }
                    });
                    setLoading(false);
                }, 1000);
            }, 5000); // Wait for the last round review (5s) before showing Game Over
        };

        const handleError = (data: any) => {
            console.error("SOCKET ERROR:", data);
            alert("Game Error: " + data.message);
            setSubmitting(false);
            setRoundStatus('PLAYING');
        };

        const handleGameAborted = (data: any) => {
            console.log("SOCKET: Game Aborted", data);
            navigate("/dashboard");
        };

        socket.on("game_sync", handleGameSync);
        socket.on("round_over", handleRoundOver);
        socket.on("waiting_for_opponent", handleWaiting);
        socket.on("opponent_answered", handleOpponentAnswered);
        socket.on("game_over", handleGameOver);
        socket.on("error", handleError);
        socket.on("game_aborted", handleGameAborted);

        return () => {
            socket.off("game_sync", handleGameSync);
            socket.off("round_over", handleRoundOver);
            socket.off("waiting_for_opponent", handleWaiting);
            socket.off("opponent_answered", handleOpponentAnswered);
            socket.off("game_over", handleGameOver);
            socket.off("error", handleError);
            socket.off("game_aborted", handleGameAborted);
        };
    }, [socket, gameId, user]);

    // Conditional Join Effect
    const joinedGameRef = useRef<string | null>(null);
    useEffect(() => {
        if (!socket || !game || !gameId) return;

        if (game.status === 'IN_PROGRESS' && joinedGameRef.current !== gameId) {
            console.log("Emitting join_game for active game...");
            socket.emit("join_game", { gameId });
            joinedGameRef.current = gameId;
        }
    }, [socket, game, gameId]);

    // Warn before refresh/close during active game
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (game && game.status === 'IN_PROGRESS' && !results) {
                e.preventDefault();
                e.returnValue = 'Game in progress! Refreshing may cause sync issues. Are you sure?';
                return 'Game in progress! Refreshing may cause sync issues. Are you sure?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [game, results]);

    // Timer Initialization
    useEffect(() => {
        if (roundStatus !== 'PLAYING') return;

        if (game && game.questions && game.questions[currentQuestionIndex]) {
            const currentQ = game.questions[currentQuestionIndex].questionId;
            const limit = game.questions[currentQuestionIndex].timeLimit || currentQ.timeLimit || 30;

            const roundStart = game.currentRoundStartTime ? new Date(game.currentRoundStartTime).getTime() : Date.now();
            const now = Date.now();
            const elapsed = Math.floor((now - roundStart) / 1000);

            let syncedTime = limit;

            if (elapsed >= 0 && elapsed < (limit + 2)) {
                syncedTime = Math.max(1, limit - elapsed);
            }

            setTimeLeft(syncedTime);
        }
    }, [currentQuestionIndex, game, roundStatus]);

    // Timer Countdown
    useEffect(() => {
        if (roundStatus !== 'PLAYING' || submitting || loading || results) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    if (!submitting) {
                        handleNextQuestion(true); // Auto-submit timeout
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [roundStatus, submitting, loading, results]);

    const handleAnswerSelect = (option: string) => {
        if (submitting || roundStatus !== 'PLAYING') return;
        setSelectedAnswer(option);
        handleNextQuestion(false, option);
    };

    const handleNextQuestion = (isTimeout = false, answer?: string) => {
        if (!game || !socket) return;

        if (!game.questions[currentQuestionIndex]) {
            console.warn("No current question - game may be finished");
            return;
        }

        if (submitting && !isTimeout) return;

        setSubmitting(true);

        const currentQ = game.questions[currentQuestionIndex].questionId;
        const limit = currentQ.timeLimit || 60;
        const timeTaken = limit - timeLeft;
        const answerToSend = isTimeout ? "" : (answer || selectedAnswer || "");

        console.log("Submitting Answer:", {
            gameId,
            questionId: currentQ._id,
            answer: answerToSend
        });

        socket.emit("submit_answer", {
            gameId,
            questionId: currentQ._id,
            answer: answerToSend,
            timeTaken
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060B23] text-white flex items-center justify-center">
                <div className="text-xl font-bold uppercase tracking-widest animate-pulse font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    ⚡ Entering Arena...
                </div>
            </div>
        );
    }

    if (results) {
        return <GameResult results={results} currentUser={user} game={game} />;
    }

    if (!game || !game.questions || !game.questions[currentQuestionIndex]) {
        if (results) {
            return <GameResult results={results} currentUser={user} game={game} />;
        }
        return (
            <div className="min-h-screen bg-[#060B23] text-white flex items-center justify-center">
                <div className="text-xl font-bold font-heading animate-pulse text-white/50">
                    Waiting for results...
                </div>
            </div>
        );
    }

    const currentQuestion = game.questions[currentQuestionIndex].questionId;
    const rank = getRankInfo(data?.stats?.overall?.rating || 0).rank;

    const myPlayer = game.players.find((p: any) => getPlayerId(p) === user._id);
    const opponent = game.players.find((p: any) => getPlayerId(p) !== user._id);

    return (
        <div className="min-h-screen pb-12 relative overflow-x-hidden">
            <Navbar data={data} rank={rank} handleLogout={() => { }} />

            {/* ROUND REVIEW OVERLAY */}
            {roundStatus === 'REVIEW' && roundData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#121936] border border-[#26304D] rounded-3xl p-6 md:p-8 max-w-2xl w-full mx-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

                        <h2 className="text-2xl font-black text-center mb-6 uppercase tracking-wider text-white">
                            Round Results
                        </h2>

                        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                            {/* Me */}
                            <div className={`p-5 rounded-2xl border ${roundData.results.find((r: any) => r.userId === user._id)?.isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                <div className="text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">You</div>
                                    <div className="text-lg md:text-xl font-black mb-1 truncate">
                                        {roundData.results.find((r: any) => r.userId === user._id)?.answer || (roundData.results.find((r: any) => r.userId === user._id)?.timeTaken >= 60 ? "Timed Out" : "No Answer")}
                                    </div>
                                    <div className="text-xs font-bold font-mono">
                                        {roundData.results.find((r: any) => r.userId === user._id)?.points > 0 ? `+${roundData.results.find((r: any) => r.userId === user._id)?.points} pts` : "0 pts"}
                                    </div>
                                </div>
                            </div>

                            {/* Opponent */}
                            <div className={`p-5 rounded-2xl border ${roundData.results.find((r: any) => r.userId !== user._id)?.isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                <div className="text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">
                                         {getPlayerId(opponent) === "000000000000000000000000" ? `Apex Bot (${opponent?.newRating || 1200})` : ((opponent?.userId as any)?.name || "Opponent")}
                                    </div>
                                    <div className="text-lg md:text-xl font-black mb-1 truncate">
                                        {roundData.results.find((r: any) => r.userId !== user._id)?.answer || (roundData.results.find((r: any) => r.userId !== user._id)?.timeTaken >= 60 ? "Timed Out" : "No Answer")}
                                    </div>
                                    <div className="text-xs font-bold font-mono">
                                        {roundData.results.find((r: any) => r.userId !== user._id)?.points > 0 ? `+${roundData.results.find((r: any) => r.userId !== user._id)?.points} pts` : "0 pts"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center p-4 bg-[#0d122b] rounded-xl border border-[#26304D]">
                            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Correct Answer</div>
                            <div className="text-lg font-bold text-green-400">
                                {roundData.correctAnswer}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <div className="text-xs animate-pulse text-white/40 font-mono">
                                Next round starting soon...
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 pt-12">
                {/* Match Header */}
                <div className="flex items-center justify-between mb-8">
                    {/* My Score */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">You</div>
                            <div className="text-3xl font-black font-mono text-white">{myPlayer?.score || 0}</div>
                        </div>
                    </div>

                    {/* Progress & Time */}
                    <div className="flex flex-col items-center gap-2">
                        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                            <LuClock size={20} className={timeLeft < 10 ? 'animate-spin' : ''} />
                            {timeLeft}s
                        </div>
                        <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden border border-[#26304D] p-[1px]">
                          <div
                              className="h-full bg-gradient-to-r from-[#2979FF] to-[#26C6DA] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(41,121,255,0.4)]"
                              style={{ width: `${((currentQuestionIndex + 1) / game.questions.length) * 100}%` }}
                          />
                        </div>
                    </div>

                    {/* Opponent Score */}
                    <div className="flex items-center gap-4">
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate max-w-[120px]">
                                {getPlayerId(opponent) === "000000000000000000000000" ? `Apex Bot (${opponent?.newRating || 1200})` : ((opponent?.userId as any)?.name || opponent?.name || "Opponent")}
                            </div>
                            <div className="text-3xl font-black font-mono text-white">{opponent?.score || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-6 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-snug text-white/95 relative font-heading">
                        {currentQuestion.description}
                    </h2>

                    <div className="grid grid-cols-1 gap-3 relative">
                        {currentQuestion.options.map((option: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(option.text)}
                                disabled={submitting || roundStatus !== 'PLAYING'}
                                className={`group flex items-center justify-between p-4 md:p-5 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${selectedAnswer === option.text
                                    ? 'border-[#26C6DA] bg-[#26C6DA]/15 text-white shadow-md'
                                    : 'border-white/5 bg-white/5 hover:border-[#2979FF]/40 hover:bg-white/10 text-white/70'
                                    }`}
                            >
                                <span className="text-base font-semibold">{option.text}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-4 ${selectedAnswer === option.text ? 'border-[#26C6DA] bg-[#26C6DA]' : 'border-white/20'
                                    }`}>
                                    {selectedAnswer === option.text && <LuCheck className="text-[#060B23] text-xs font-black" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-center">
                    {roundStatus === 'WAITING' && (
                        <div className="px-10 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-base flex items-center gap-3 animate-pulse text-white/60">
                            Waiting for opponent...
                        </div>
                    )}
                    {submitting && roundStatus === 'PLAYING' && (
                        <div className="px-10 py-4 rounded-xl bg-cyan-500/10 border border-[#26C6DA]/50 font-bold text-base text-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(38,198,218,0.1)]">
                            Answer Locked <LuCheck />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function GameResult({ results, currentUser, game }: any) {
    const navigate = useNavigate();
    const isWinner = results.winner?.userId === currentUser?._id;
    const isDraw = results.isDraw;

    const ratingChange = results.ratingChanges?.[currentUser?._id]?.change || 0;
    const newRating = results.ratingChanges?.[currentUser?._id]?.newRating || 0;

    const rankInfo = getRankInfo(newRating);

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    // Dynamic Game Results Metrics (Redesign Specifications)
    const myPlayer = game?.players?.find((p: any) => getPlayerId(p) === currentUser?._id);
    const totalQ = game?.questions?.length || 0;
    const correctQ = myPlayer?.answers?.filter((a: any) => a.isCorrect).length || 0;
    const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    const totalTime = myPlayer?.answers?.reduce((acc: number, a: any) => acc + (a.timeTaken || 0), 0) || 0;
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const streak = currentUser?.stats?.overall?.currentStreak || 0;
    const xpChange = isWinner ? 120 : isDraw ? 60 : 40;
    const xpBonus = Math.round(accuracy * 0.8);
    const totalXp = xpChange + xpBonus;

    const fetchAiAnalysis = async () => {
        setLoadingAi(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game/${game._id}/analysis`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAiAnalysis(data.analysis);
        } catch (err) {
            alert("Failed to load AI analysis");
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060B23] text-white flex items-center justify-center p-4 relative overflow-x-hidden">
            {/* Background Ambience Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="max-w-2xl w-full bg-[#121936] border border-[#26304D] rounded-3xl p-6 md:p-10 text-center relative overflow-hidden shadow-2xl z-10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#2979FF] to-[#26C6DA]" />

                <div className="mb-8 relative">
                    {isWinner ? (
                        <div className="inline-block p-5 rounded-full bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 mb-4 animate-bounce">
                            <LuTrophy size={56} />
                        </div>
                    ) : isDraw ? (
                        <div className="text-6xl mb-4">🤝</div>
                    ) : (
                        <div className="text-6xl mb-4">💀</div>
                    )}

                    <h1 className={`text-4xl md:text-5xl font-black mb-1.5 tracking-tight italic font-heading ${isWinner ? 'text-yellow-400' : isDraw ? 'text-white/80' : 'text-red-500'}`}>
                        {isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                    </h1>
                    <p className="text-white/40 uppercase tracking-[0.2em] font-bold text-xs font-mono">
                        Match Results
                    </p>
                </div>

                {/* Main ELO & XP gains */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-2xl p-4 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-mono">Rating Change</span>
                        <span className={`text-3xl font-black font-mono mt-1 ${ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {ratingChange >= 0 ? `+${ratingChange}` : ratingChange}
                        </span>
                    </div>
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-2xl p-4 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-mono">XP Gained</span>
                        <span className="text-3xl font-black font-mono text-cyan-400 mt-1 flex items-baseline gap-1">
                            +{totalXp} <span className="text-xs text-white/40 font-bold">XP</span>
                        </span>
                    </div>
                </div>

                {/* Secondary details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3.5 text-center">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1.5">Accuracy</div>
                        <div className="text-xl font-bold font-mono text-green-400 flex items-center justify-center gap-1">
                            <LuTarget size={14} /> {accuracy}%
                        </div>
                    </div>
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3.5 text-center">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1.5">Time Taken</div>
                        <div className="text-xl font-bold font-mono text-cyan-400 flex items-center justify-center gap-1">
                            <LuClock size={14} /> {formattedTime}
                        </div>
                    </div>
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3.5 text-center">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1.5">Streak</div>
                        <div className="text-xl font-bold font-mono text-orange-400 flex items-center justify-center gap-1">
                            <LuFlame size={14} /> {streak} 🔥
                        </div>
                    </div>
                    <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3.5 text-center">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1.5">New Rank</div>
                        <div className={`text-sm font-black truncate ${rankInfo.rank.color}`}>
                            {rankInfo.rank.name}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="btn-premium-primary flex-1 py-4.5 rounded-xl text-base font-black cursor-pointer shadow-lg"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/leaderboard")}
                        className="btn-premium-secondary flex-1 py-4.5 rounded-xl text-base font-bold cursor-pointer"
                    >
                        View Leaderboard
                    </button>
                </div>

                {/* Gemini AI Match Mentor Section */}
                <div className="mt-8 bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6 text-left relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-black flex items-center gap-2 text-white">
                                <span className="text-purple-400">🤖 Gemini AI</span> Match Mentor
                            </h3>
                            <p className="text-white/50 text-xs mt-0.5">Get personalized post-match breakdown & DSA tips</p>
                        </div>
                        {!aiAnalysis && !loadingAi && (
                            <button
                                onClick={fetchAiAnalysis}
                                className="px-5 py-2.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                ✨ Generate Analysis
                            </button>
                        )}
                    </div>

                    {loadingAi && (
                        <div className="space-y-2.5 animate-pulse py-2">
                            <div className="h-3.5 bg-white/10 rounded w-3/4"></div>
                            <div className="h-3.5 bg-white/10 rounded w-1/2"></div>
                            <div className="h-3.5 bg-white/10 rounded w-5/6"></div>
                        </div>
                    )}

                    {aiAnalysis && (
                        <div className="prose prose-invert max-w-none text-white/80 space-y-4 bg-black/40 p-4 rounded-xl border border-white/5 text-xs leading-relaxed max-h-60 overflow-y-auto scrollbar-thin">
                            <div className="whitespace-pre-line font-mono">{aiAnalysis}</div>
                        </div>
                    )}
                </div>

                {/* Question Review Section */}
                <div className="mt-8 text-left border-t border-white/5 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 text-center">
                        Question Performance Review
                    </h3>
                    <div className="space-y-3">
                        {game?.questions?.map((qObj: any, idx: number) => {
                            const question = qObj.questionId;
                            const myPlayer = game.players.find((p: any) => getPlayerId(p) === currentUser._id);
                            const myAnswerObj = myPlayer?.answers?.find((a: any) => {
                                const answerQId = a.questionId?._id || a.questionId;
                                const questionQId = question._id || question;
                                return answerQId.toString() === questionQId.toString();
                            });

                            const isCorrect = myAnswerObj?.isCorrect;
                            const userAnswer = myAnswerObj?.answer || "No Answer";

                            return (
                                <div key={idx} className={`p-4 rounded-xl border transition-colors ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="text-[10px] text-white/40 font-bold mb-1 uppercase tracking-wide">Question {idx + 1}</div>
                                    <div className="font-semibold text-sm mb-2 text-white/90 leading-tight">{question.description}</div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="opacity-50">Your Answer:</span>
                                        <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                            {userAnswer}
                                        </span>
                                        {isCorrect ? <LuCheck className="text-green-400 text-xs" /> : <LuX className="text-red-400 text-xs" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
