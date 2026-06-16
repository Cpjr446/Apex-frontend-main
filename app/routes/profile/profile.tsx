import {
  LuUser,
  LuTrophy,
  LuActivity,
  LuHistory,
  LuGamepad,
  LuFlame,
  LuShield,
  LuAward,
  LuCode,
  LuLogOut,
} from "react-icons/lu";
import { useParams, useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import Navbar from "~/components/navbar";
import { RANKS, getRankInfo } from "~/utils/rankUtils";

export function meta({ params }: any) {
  return [{ title: params.username ? `${params.username} - Apex` : "Profile - Apex" }];
}

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<"ALL" | "24H" | "1H">("ALL");

  // Fetch profile data by username
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/profile/${username}`
        );
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Fetch current logged-in user data (for navbar)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCurrentUserData(data))
        .catch(() => { });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060B23] text-white flex items-center justify-center">
        <div className="text-xl font-bold font-heading animate-pulse text-white/50">Loading profile...</div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#060B23] text-white flex items-center justify-center p-4">
        <div className="text-center bg-[#121936] border border-[#26304D] p-10 rounded-2xl max-w-sm mx-auto shadow-2xl">
          <div className="text-5xl mb-4">😕</div>
          <div className="text-2xl font-bold mb-2 font-heading">User Not Found</div>
          <div className="text-white/50 text-sm mb-6">@{username} doesn't exist</div>
          <Link
            to="/leaderboard"
            className="btn-premium-primary px-6 py-3 rounded-lg text-sm block cursor-pointer"
          >
            Browse Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const user = profileData.user;
  const stats = profileData.stats?.overall || {};
  const topics = profileData.stats?.topics || {};
  const matches = profileData.matches || [];
  const ratingHistory = profileData.ratingHistory || [];

  const rating = stats.rating || 0;
  const { rank, nextRank, progress, pointsToNext } = getRankInfo(rating);
  const totalGames = (stats.wins || 0) + (stats.losses || 0);
  const winRate =
    totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  // Transform Topics for Radar Chart
  const topicData = Object.keys(topics).map((key) => ({
    subject: key,
    A: topics[key]?.rating || 1000,
    fullMark: 2000,
  }));

  const currentUserRank = currentUserData?.stats?.overall?.rating
    ? getRankInfo(currentUserData.stats.overall.rating).rank
    : { name: "Newbie", color: "text-[#94A3B8]", min: 0, max: 799 };

  // Check if current user is viewing their own profile
  const isOwner = currentUserData?.user?.name?.toLowerCase() === user?.name?.toLowerCase();

  // Filter History based on Time Range
  const filteredHistory = ratingHistory.filter((h: any) => {
    if (timeRange === "ALL") return true;
    const date = new Date(h.date);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (timeRange === "24H") return diffHours <= 24;
    if (timeRange === "1H") return diffHours <= 1;
    return true;
  });

  // Prepare Graph Data
  const graphData =
    filteredHistory.length > 0
      ? filteredHistory.map((h: any) => ({
        ...h,
        displayDate: new Date(h.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        displayTime: new Date(h.date).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fullDate: new Date(h.date).toLocaleString(),
      }))
      : [];

  const formatXAxis = (tickItem: any, index: number) => {
    if (timeRange === "1H" || timeRange === "24H") {
      const item = graphData[index];
      return item ? item.displayTime : "";
    }
    const item = graphData[index];
    return item ? item.displayDate : "";
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative pb-12">
      {/* Background Ambience Elements */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navbar data={currentUserData} rank={currentUserRank} handleLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-6 md:space-y-8">
        
        {/* Profile Header Card */}
        <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative overflow-hidden shadow-2xl">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#2979FF] to-[#26C6DA] p-1 shadow-lg shadow-blue-500/10">
              <div className="w-full h-full rounded-full bg-[#060B23] flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black font-heading text-white/25">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {/* Rank Badge absolute */}
            <div className="absolute -bottom-1 -right-1 bg-[#121936] border border-[#26304D] p-1.5 rounded-full shadow-md text-cyan-400">
              <LuAward className={`w-6 h-6 ${rank.color}`} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left z-10 flex flex-col justify-between self-stretch">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-1.5 tracking-tight font-heading text-white">
                {user?.name || "Player"}
              </h1>
              <div className={`text-lg font-bold mb-6 ${rank.color}`}>
                {rank.name}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="shrink-0">
                <div className="text-[10px] text-white/40 mb-1 uppercase tracking-widest font-bold">
                  Arena Rating
                </div>
                <div className="text-4xl font-black text-white font-mono leading-none">{rating}</div>
              </div>

              {nextRank && (
                <div className="flex-1 w-full max-w-md pb-1">
                  <div className="flex justify-between text-[10px] mb-2 text-white/50 uppercase tracking-widest font-semibold font-mono">
                    <span>Rank Progress</span>
                    <span className="text-cyan-400">
                      {pointsToNext} PTS TO {nextRank.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="h-2 bg-[#060B23] rounded-full overflow-hidden border border-[#26304D] p-[1px]">
                    <div
                      className="h-full bg-gradient-to-r from-[#2979FF] to-[#26C6DA] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(41,121,255,0.4)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<LuGamepad />}
            label="Total Games"
            value={totalGames}
            color="text-[#2979FF]"
          />
          <StatCard
            icon={<LuTrophy />}
            label="Wins"
            value={stats.wins || 0}
            color="text-green-400"
          />
          <StatCard
            icon={<LuActivity />}
            label="Win Rate"
            value={`${winRate}%`}
            color="text-cyan-400"
          />
          <StatCard
            icon={<LuFlame />}
            label="Current Streak"
            value={stats.currentStreak || 0}
            color="text-orange-400"
          />
        </div>

        {/* Streak Rewards Section */}
        <StreakRewardsSection
          currentStreak={stats.currentStreak || 0}
          highestStreak={stats.highestStreak || 0}
        />

        {/* Rating Graph */}
        <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 relative shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <LuActivity className="text-cyan-400" /> ELO Rating History
            </h3>
            {/* Time Range Toggles */}
            <div className="flex bg-[#060B23] border border-[#26304D] p-1 rounded-lg">
              {(["ALL", "24H", "1H"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer ${timeRange === r
                    ? "bg-gradient-to-r from-[#2979FF] to-[#26C6DA] text-white shadow"
                    : "text-white/40 hover:text-white"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full pr-4">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#26C6DA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2979FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26304D" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(_, i) => formatXAxis(null, i)}
                    stroke="#ffffff40"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke="#ffffff40"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121936",
                      borderColor: "#26304D",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(6,11,35,0.7)"
                    }}
                    itemStyle={{ color: "#fff", fontWeight: "bold" }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontFamily: "JetBrains Mono", marginBottom: "4px" }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullDate;
                      }
                      return label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="url(#colorRating)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRating)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 text-xs font-mono">
                No match data for this period
              </div>
            )}
          </div>
        </div>

        {/* Split Row: Topic Analysis + Match History */}
        <div className={`grid grid-cols-1 ${isOwner ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
          {/* Topic Analysis */}
          <div className={`${isOwner ? 'md:col-span-1 lg:col-span-1' : ''} bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col items-center shadow-2xl`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2 w-full">
              <LuCode className="text-purple-400" /> Topic Analysis
            </h3>
            <div className="h-[280px] w-full flex items-center justify-center">
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicData}>
                    <PolarGrid stroke="#26304D" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: "Sora" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 2000]} tick={false} axisLine={false} />
                    <Radar
                      name="Rating"
                      dataKey="A"
                      stroke="#A855F7"
                      strokeWidth={2}
                      fill="#A855F7"
                      fillOpacity={0.2}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121936', borderColor: '#26304D', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: "bold" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-white/20 font-mono">No topic stats computed</div>
              )}
            </div>
          </div>

          {/* Match History - Owner Only */}
          {isOwner && (
            <div className="md:col-span-1 lg:col-span-2 bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-5 flex items-center gap-2">
                <LuHistory className="text-white/40" /> Match History
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {matches.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-sm">
                    No matches played yet. Start competing to see history!
                  </div>
                ) : (
                  matches.map((match: any) => (
                    <div
                      key={match.id}
                      onClick={() => navigate(`/game/${match.id}`)}
                      className="premium-card-small flex items-center justify-between p-3.5 border border-white/5 hover:border-[#26304D] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${match.result === 'win' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          match.result === 'loss' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                          {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{match.opponent.name}</div>
                          <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5 font-mono">
                            <span>{match.topic}</span>
                            <span>•</span>
                            <span>{new Date(match.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`font-mono font-bold text-sm ${match.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </main >
    </div >
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="premium-card-small p-5 flex flex-col justify-center gap-1 group">
      <div className={`${color} mb-2 opacity-80 group-hover:scale-110 transition-transform origin-left text-lg`}>
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-black font-mono text-white leading-none mb-1.5">{value}</div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-sans">{label}</div>
    </div>
  );
}

function StreakRewardsSection({ currentStreak, highestStreak }: { currentStreak: number, highestStreak: number }) {
  const BADGES = [
    { title: "First Blood", desc: "Win 1 match", req: 1, icon: "🎯" },
    { title: "On Fire", desc: "3 match win streak", req: 3, icon: "🔥" },
    { title: "Unstoppable", desc: "5 match win streak", req: 5, icon: "⚡" },
    { title: "Apex Predator", desc: "10 match win streak", req: 10, icon: "👑" },
  ];

  return (
    <div className="bg-[#121936] border border-[#26304D] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-6 flex items-center gap-2">
        <LuFlame className="text-orange-400 text-base" /> Streak Milestones & Rewards
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BADGES.map((badge, idx) => {
          const isUnlocked = highestStreak >= badge.req;
          const isCurrent = currentStreak >= badge.req;

          return (
            <div 
              key={idx} 
              className={`p-5 rounded-xl border transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden ${
                isCurrent ? "bg-orange-500/15 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]" :
                isUnlocked ? "bg-[#0d122b] border-[#26304D]" : "bg-black/35 border-white/5 opacity-40"
              }`}
            >
              <div className="text-4xl mb-3">{badge.icon}</div>
              <div className="font-bold text-base text-white mb-1.5">{badge.title}</div>
              <div className="text-xs text-white/50 mb-4 leading-normal">{badge.desc}</div>
              
              <div className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                isCurrent ? "bg-orange-500 text-black font-black" :
                isUnlocked ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-white/40"
              }`}>
                {isCurrent ? "ACTIVE STREAK" : isUnlocked ? "UNLOCKED" : `LOCKED (${highestStreak}/${badge.req})`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
