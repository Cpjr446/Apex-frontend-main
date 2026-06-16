import { useState, useEffect } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import {
  LuGamepad,
  LuLock,
  LuKeyboard,
  LuTrophy,
  LuHistory,
  LuCrown,
  LuUsers,
  LuActivity,
  LuFlame,
  LuTarget,
  LuAward,
  LuZap
} from "react-icons/lu";
import Navbar from "~/components/navbar";
import { RANKS, getRankInfo } from "~/utils/rankUtils";
import { useSocket } from "~/context/SocketContext";
import {
  Overlay,
  PublicOverlay,
  PrivateOverlay,
  JoinOverlay,
  BotOverlay,
} from "~/components/overlay";

const CATEGORIES: Record<string, string[]> = {
  CS: ["DSA", "OOPS", "OS", "DBMS", "CN"],
  Electronics: ["Digital", "Analog", "Signals", "COA", "C_Prog"],
};

const TOPIC_STYLES: Record<string, { bg: string, border: string, text: string, shadow: string, hover: string }> = {
  RANDOM: {
    bg: "bg-white/5",
    border: "border-white/10",
    text: "text-white/80",
    shadow: "shadow-white/5",
    hover: "hover:bg-white/10 hover:border-white/20"
  },
  DSA: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    shadow: "shadow-blue-500/10",
    hover: "hover:bg-blue-500/20 hover:border-blue-500/50"
  },
  OS: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    shadow: "shadow-orange-500/10",
    hover: "hover:bg-orange-500/20 hover:border-orange-500/50"
  },
  DBMS: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    shadow: "shadow-green-500/10",
    hover: "hover:bg-green-500/20 hover:border-green-500/50"
  },
  CN: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    shadow: "shadow-purple-500/10",
    hover: "hover:bg-purple-500/20 hover:border-purple-500/50"
  },
  OOPS: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    shadow: "shadow-pink-500/10",
    hover: "hover:bg-pink-500/20 hover:border-pink-500/50"
  },
  Digital: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    shadow: "shadow-blue-500/10",
    hover: "hover:bg-blue-500/20 hover:border-blue-500/50"
  },
  Analog: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    shadow: "shadow-orange-500/10",
    hover: "hover:bg-orange-500/20 hover:border-orange-500/50"
  },
  Signals: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    shadow: "shadow-purple-500/10",
    hover: "hover:bg-purple-500/20 hover:border-purple-500/50"
  },
  COA: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    shadow: "shadow-green-500/10",
    hover: "hover:bg-green-500/20 hover:border-green-500/50"
  },
  C_Prog: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    shadow: "shadow-pink-500/10",
    hover: "hover:bg-pink-500/20 hover:border-pink-500/50"
  }
};

export function meta() {
  return [{ title: "Dashboard - Apex" }];
}

export default function Dashboard() {
  const data: any = useRouteLoaderData("protected-layout");
  const navigate = useNavigate();
  const { socket, isConnected, connect } = useSocket();

  // UI State
  const [overlay, setOverlay] = useState<null | "public" | "private" | "join" | "bot">(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState("CS");
  const [selectedTopic, setSelectedTopic] = useState("RANDOM");

  // Data extraction
  const rating = data?.stats?.overall?.rating || 0;
  const { rank, nextRank, progress, pointsToNext } = getRankInfo(rating);
  const wins = data?.stats?.overall?.wins || 0;
  const losses = data?.stats?.overall?.losses || 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const recentMatches = (data?.matches || []).slice(-3);
  const onlineUsers = data?.onlineUsers || 0;
  const activePlayers = data?.activePlayers || 0;
  const topPlayers = data?.leaderboard || [];

  // Gamification Metrics Calculations
  const streak = data?.stats?.overall?.currentStreak || data?.stats?.currentStreak || 0;
  const xp = (wins * 120) + (losses * 40) + (rating * 10);
  
  // Dynamic Accuracy calculation
  let totalAnswers = 0;
  let correctAnswers = 0;
  if (data?.matches) {
    data.matches.forEach((m: any) => {
      const me = m.players?.find((p: any) => {
        const pid = p.userId?._id || p.userId || "";
        const myId = data?.user?._id || "";
        return pid.toString() === myId.toString();
      });
      if (me?.answers) {
        me.answers.forEach((a: any) => {
          totalAnswers++;
          if (a.isCorrect) correctAnswers++;
        });
      }
    });
  }
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 72;

  // Weekly matches calculation
  const weeklyMatches = (data?.matches || []).filter((m: any) => {
    const matchDate = new Date(m.createdAt || m.date);
    const diffTime = Math.abs(new Date().getTime() - matchDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  const nextReward = rank.name === "Legend" ? "Permanent Hall of Fame" : `${nextRank?.name || "Expert"} Badge & Frame`;

  // Auto-connect socket if disconnected
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleGameStart = ({ gameId }: { gameId: string }) => {
      console.log("Game Started! Navigating to:", gameId);
      navigate(`/game/${gameId}`);
    };

    const handleError = ({ message }: { message: string }) => {
      alert(message);
    };

    socket.on("game_started", handleGameStart);
    socket.on("match_found", ({ gameId }) => {
      console.log("Match Found! Navigating to:", gameId);
      navigate(`/game/${gameId}`);
    });
    socket.on("error", handleError);

    return () => {
      socket.off("game_started", handleGameStart);
      socket.off("match_found");
      socket.off("error", handleError);
    };
  }, [socket, navigate]);

  const currentTopics = CATEGORIES[selectedCategory];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getTopicBtnClass = (topic: string, isSelected: boolean) => {
    const style = TOPIC_STYLES[topic] || TOPIC_STYLES.RANDOM;
    if (isSelected) {
      return `px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${style.bg} ${style.border.replace('/30', '/80')} ${style.text} shadow-md ${style.shadow} scale-[1.03]`;
    }
    return `px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 bg-white/5 border-transparent text-white/40 hover:bg-white/10 ${style.hover}`;
  };

  return (
    <div className="min-h-screen text-white selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Background Ambience Elements */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navbar data={data} rank={rank} handleLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative z-10">

        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="premium-card-small p-4 flex items-center justify-between group">
            <div>
              <div className="text-2xl font-black text-green-400 font-mono tracking-tight">{onlineUsers}</div>
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>
            </div>
            <LuUsers className="text-2xl text-white/20 group-hover:text-green-500/40 transition-colors" />
          </div>
          <div className="premium-card-small p-4 flex items-center justify-between group">
            <div>
              <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">{activePlayers}</div>
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <LuGamepad className="text-[11px]" /> In Game
              </div>
            </div>
            <LuActivity className="text-2xl text-white/20 group-hover:text-blue-500/40 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Stats Card */}
          <div className="col-span-1 lg:col-span-2 bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 relative overflow-hidden group">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Rating and Progress */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xs uppercase font-bold text-white/40 tracking-wider mb-4">
                    Current Rating Status
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-4xl md:text-5xl font-black tracking-tight font-mono text-white">
                          {rating}
                        </span>
                        <span className="text-xs font-bold text-white/40 ml-2 uppercase tracking-widest font-mono">
                          Rating
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Current Rank</div>
                        <div className={`text-base font-bold ${rank.color}`}>
                          {rank.name}
                        </div>
                      </div>
                    </div>

                    {nextRank ? (
                      <div className="w-full">
                        <div className="h-2 bg-[#060B23] rounded-full overflow-hidden border border-[#26304D] p-[1px]">
                          <div
                            className="h-full bg-gradient-to-r from-[#2979FF] to-[#26C6DA] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(41,121,255,0.4)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] mt-2 text-white/50 font-mono">
                          <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${rank.color} inline-block`} />
                            {rank.name} ({rank.min})
                          </span>
                          <span className="font-semibold text-cyan-400">
                            {pointsToNext} PTS TO PROMOTION
                          </span>
                          <span className="flex items-center gap-1">
                            {nextRank.name} ({nextRank.min})
                            <span className={`w-1.5 h-1.5 rounded-full ${nextRank.color} inline-block`} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-green-400 font-bold uppercase tracking-wider font-mono">
                        🏆 Maximum Rank Achieved
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-5 mt-6">
                  <div>
                    <div className="text-xl font-bold text-white font-mono">{totalGames}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                      Matches
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-400 font-mono">{wins}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                      Won
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-cyan-400 font-mono">{winRate}%</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                      Win Rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Gamification Stats replacing trophy */}
              <div className="grid grid-cols-2 gap-3 mt-6 border-t border-white/5 pt-6 lg:border-t-0 lg:pt-0 lg:mt-0 lg:pl-6 lg:border-l lg:border-white/5 flex-shrink-0 lg:w-[280px]">
                <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                    <LuFlame className="text-orange-400" /> Streak
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-orange-400 font-mono leading-none">{streak}</span>
                    <span className="text-[10px] text-white/50 font-bold font-mono">DAYS</span>
                  </div>
                </div>
                
                <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                    <LuZap className="text-cyan-400" /> XP Earned
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-cyan-400 font-mono leading-none">{xp}</span>
                    <span className="text-[9px] text-white/50 font-bold font-mono">PTS</span>
                  </div>
                </div>

                <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                    <LuTarget className="text-green-400" /> Accuracy
                  </span>
                  <div className="flex items-baseline gap-0.5 mt-2">
                    <span className="text-2xl font-black text-green-400 font-mono leading-none">{accuracy}%</span>
                  </div>
                </div>

                <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Weekly target</span>
                  <div className="mt-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-white font-mono">{weeklyMatches}/5</span>
                      <span className="text-[8px] text-white/40 font-mono uppercase font-semibold">Games</span>
                    </div>
                    <div className="h-1 bg-[#060B23] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2979FF] to-[#26C6DA] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (weeklyMatches / 5) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-[#0d122b] border border-[#26304D] rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                    <LuAward className="text-yellow-400" /> Next Milestone Reward
                  </span>
                  <span className="text-xs font-bold text-white/90 mt-1 truncate">
                    {nextReward}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* New Game Setup */}
          <div className="col-span-1 bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
              <LuGamepad className="text-[#2979FF] text-base" /> Game Setup
            </h3>
 
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedTopic("RANDOM");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat
                      ? "btn-premium-primary text-white shadow-md shadow-blue-500/10"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Topic Grid */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 content-start">
                <button
                  onClick={() => setSelectedTopic("RANDOM")}
                  className={getTopicBtnClass("RANDOM", selectedTopic === "RANDOM")}
                >
                  All
                </button>
                {currentTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={getTopicBtnClass(topic, selectedTopic === topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <button
                onClick={() => setOverlay("public")}
                disabled={!isConnected}
                className={`btn-premium-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 group cursor-pointer ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>{isConnected ? "Play Now" : "Connecting..."}</span>
                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  {selectedTopic === "RANDOM"
                    ? `${selectedCategory}`
                    : selectedTopic}
                </span>
              </button>

              <button
                onClick={() => setOverlay("bot")}
                disabled={!isConnected}
                className={`w-full py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.03] duration-250 cursor-pointer ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Challenge AI Bot 🤖</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOverlay("private")}
                  disabled={!isConnected}
                  className="btn-premium-secondary py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LuLock /> Private Room
                </button>
                <button
                  onClick={() => setOverlay("join")}
                  disabled={!isConnected}
                  className="btn-premium-secondary py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LuKeyboard /> Join Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History & Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm uppercase font-bold text-white/40 tracking-wider flex items-center gap-2">
                <LuHistory className="text-cyan-400" /> Recent Matches
              </h3>
              <button
                onClick={() => navigate(`/profile/${data?.user?.name}`)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentMatches.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">
                  No matches played yet. Start competing!
                </div>
              ) : (
                recentMatches.map((match: any) => (
                  <div
                    key={match.id}
                    onClick={() => navigate(`/game/${match.id}`)}
                    className="premium-card-small flex items-center justify-between p-3.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${match.result === "win"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : match.result === "loss"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                      >
                        {match.result === "win"
                          ? "W"
                          : match.result === "loss"
                            ? "L"
                            : "D"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {match.opponent?.name === "Unknown" ? "Apex AI Bot" : match.opponent?.name || match.opponentId || "Apex AI Bot"}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {match.topic}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm ${match.ratingChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                        }`}
                    >
                      {match.ratingChange > 0 ? "+" : ""}
                      {match.ratingChange}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm uppercase font-bold text-white/40 tracking-wider flex items-center gap-2">
                <LuCrown className="text-yellow-400" /> Top Arena Players
              </h3>
              <button
                onClick={() => navigate("/leaderboard")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {topPlayers.map((player: any, index: number) => {
                const playerRank = getRankInfo(player.rating).rank;
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
                return (
                  <div
                    key={player.userId}
                    onClick={() => navigate(`/profile/${player.username}`)}
                    className="premium-card-small flex items-center gap-3 p-3.5 cursor-pointer"
                  >
                    <span className="font-mono text-sm font-bold w-6 text-center text-white/40">
                      {medal || `#${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {player.username}
                      </div>
                      <div className={`text-xs ${playerRank.color} mt-0.5`}>
                        {playerRank.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-cyan-400">
                        {player.rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {overlay && (
        <Overlay onClose={() => setOverlay(null)}>
          {overlay === "public" && (
            <PublicOverlay
              topic={selectedTopic}
              category={selectedCategory}
              onClose={() => setOverlay(null)}
              socket={socket}
            />
          )}
          {overlay === "private" && (
            <PrivateOverlay
              topic={selectedTopic}
              category={selectedCategory}
              onClose={() => setOverlay(null)}
              socket={socket}
            />
          )}
          {overlay === "join" && (
            <JoinOverlay onClose={() => setOverlay(null)} socket={socket} />
          )}
          {overlay === "bot" && (
            <BotOverlay
              topic={selectedTopic}
              category={selectedCategory}
              onClose={() => setOverlay(null)}
              socket={socket}
            />
          )}
        </Overlay>
      )}
    </div>
  );
}
