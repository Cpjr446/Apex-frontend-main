import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams, useRouteLoaderData } from "react-router";
import { LuTrophy, LuSearch, LuCrown } from "react-icons/lu";
import { getRankInfo } from "~/utils/rankUtils";
import Navbar from "~/components/navbar";

export function meta() {
    return [{ title: "Leaderboard - Apex" }];
}

export default function Leaderboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [userPosition, setUserPosition] = useState<any>(null);

    const [filters, setFilters] = useState({
        timeframe: searchParams.get("timeframe") || "all-time",
        filter: "global",
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // Get user data from protected layout
    const userData = useRouteLoaderData("protected-layout");

    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({
                limit: "50",
                timeframe: filters.timeframe,
                filter: filters.filter,
                search: search,
            });

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/leaderboard?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();

            setLeaderboard(data.leaderboard || []);
            setUserPosition(data.userPosition || null);
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch leaderboard on mount and filter changes
    useEffect(() => {
        fetchLeaderboard();
    }, [filters]);

    const handleFilterChange = (timeframe: string) => {
        setFilters({ ...filters, timeframe });
        setSearchParams({ timeframe });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLeaderboard();
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const userRank = userData?.stats?.overall?.rating
        ? getRankInfo(userData.stats.overall.rating).rank
        : { name: "Newbie", color: "text-gray-400", min: 0, max: 799 };

    return (
        <div className="min-h-screen text-white relative">
            {/* Background Ambience */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Navbar */}
            <Navbar data={userData} rank={userRank} handleLogout={handleLogout} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="mb-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
                        <LuTrophy className="text-yellow-400 text-3xl" />
                        <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
                    </div>
                    <p className="text-white/40 text-sm">
                        Global ranked players · Updated after every match
                    </p>
                </div>

                {/* Top 3 Arena Podium */}
                {!loading && leaderboard.length >= 3 && !search && (
                    <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12 items-end max-w-3xl mx-auto pt-4">
                        {/* 2nd Place */}
                        <div 
                            onClick={() => navigate(`/profile/${leaderboard[1].username}`)}
                            className="bg-[#121936] border border-[#26304D] rounded-2xl p-4 md:p-6 flex flex-col items-center relative cursor-pointer hover:-translate-y-1 transition-all duration-300 group shadow-lg"
                        >
                            <div className="absolute top-2.5 left-3 text-white/20 font-mono font-bold text-xs">#2</div>
                            <div className="text-4xl mb-2.5">🥈</div>
                            <div className="font-bold text-sm md:text-base text-white truncate max-w-full text-center group-hover:text-blue-400 transition-colors">
                                {leaderboard[1].username}
                            </div>
                            <div className={`text-[11px] font-bold ${getRankInfo(leaderboard[1].rating).rank.color} mb-3`}>
                                {getRankInfo(leaderboard[1].rating).rank.name}
                            </div>
                            <div className="font-mono text-2xl font-black text-cyan-400 group-hover:scale-105 transition-transform">
                                {leaderboard[1].rating}
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div 
                            onClick={() => navigate(`/profile/${leaderboard[0].username}`)}
                            className="bg-[#121936] border-2 border-yellow-500/40 rounded-2xl p-5 md:p-8 flex flex-col items-center relative cursor-pointer hover:-translate-y-2 transition-all duration-300 -translate-y-2 group shadow-[0_12px_30px_rgba(234,179,8,0.1)]"
                        >
                            <div className="absolute top-2.5 left-3 text-yellow-500/40 font-mono font-bold text-sm">#1</div>
                            <div className="text-5xl mb-3 animate-bounce">🥇</div>
                            <div className="font-bold text-base md:text-lg text-white truncate max-w-full text-center group-hover:text-blue-400 transition-colors">
                                {leaderboard[0].username}
                            </div>
                            <div className={`text-xs font-bold ${getRankInfo(leaderboard[0].rating).rank.color} mb-4`}>
                                {getRankInfo(leaderboard[0].rating).rank.name}
                            </div>
                            <div className="font-mono text-3xl font-black text-yellow-400 group-hover:scale-105 transition-transform">
                                {leaderboard[0].rating}
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div 
                            onClick={() => navigate(`/profile/${leaderboard[2].username}`)}
                            className="bg-[#121936] border border-[#26304D] rounded-2xl p-4 md:p-6 flex flex-col items-center relative cursor-pointer hover:-translate-y-1 transition-all duration-300 group shadow-lg"
                        >
                            <div className="absolute top-2.5 left-3 text-white/20 font-mono font-bold text-xs">#3</div>
                            <div className="text-4xl mb-2.5">🥉</div>
                            <div className="font-bold text-sm md:text-base text-white truncate max-w-full text-center group-hover:text-blue-400 transition-colors">
                                {leaderboard[2].username}
                            </div>
                            <div className={`text-[11px] font-bold ${getRankInfo(leaderboard[2].rating).rank.color} mb-3`}>
                                {getRankInfo(leaderboard[2].rating).rank.name}
                            </div>
                            <div className="font-mono text-2xl font-black text-orange-400 group-hover:scale-105 transition-transform">
                                {leaderboard[2].rating}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-[#121936] border border-[#26304D] rounded-2xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Time Filters */}
                        <div className="flex gap-2 flex-wrap">
                          {["all-time", "monthly", "weekly"].map((tf) => (
                              <button
                                  key={tf}
                                  onClick={() => handleFilterChange(tf)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                                      filters.timeframe === tf
                                          ? "btn-premium-primary text-white shadow-md shadow-blue-500/15"
                                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                  }`}
                              >
                                  {tf.charAt(0).toUpperCase() + tf.slice(1).replace("-", " ")}
                              </button>
                          ))}
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg transition-colors cursor-pointer"
                            >
                                <LuSearch size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* User Position Card (if not in top 50) */}
                {userPosition && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-black text-purple-400 font-mono">#{userPosition.rank}</div>
                                <div>
                                    <div className="font-bold text-white">{userPosition.username}</div>
                                    <div className={`text-xs font-bold ${getRankInfo(userPosition.rating).rank.color}`}>
                                        {getRankInfo(userPosition.rating).rank.name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black font-mono text-cyan-400">{userPosition.rating}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Your Rank</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trust Signal */}
                <div className="bg-[#0d122b] border border-[#26304D] rounded-xl p-3 mb-6 text-center text-xs text-white/40 uppercase tracking-wider font-bold">
                  ✓ All ranked games affect leaderboard · Rating updates are transparent
                </div>

                {/* Leaderboard Table Wrapper */}
                <div className="bg-[#121936] border border-[#26304D] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-[#26304D]">
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider font-mono">#</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Rank Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">ELO Rating</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Matches</th>
                                    <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                                            No players found
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((entry) => {
                                        const rankInfo = getRankInfo(entry.rating);
                                        const isTop3 = entry.rank <= 3;
                                        const rankSymbol = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
                                        
                                        return (
                                            <tr
                                                key={entry.userId}
                                                className={`border-b border-white/5 transition-colors ${entry.isCurrentUser
                                                    ? "bg-blue-500/10 hover:bg-blue-500/15"
                                                    : "hover:bg-white/5"
                                                    }`}
                                            >
                                                <td className="px-6 py-4 font-mono text-sm font-black">
                                                    <span className={isTop3 ? "text-lg" : "text-white/40"}>
                                                        {rankSymbol}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/profile/${entry.username}`}
                                                        className="font-bold text-white/95 hover:text-blue-400 transition-colors text-sm"
                                                    >
                                                        {entry.username}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/40 border border-[#26304D] ${rankInfo.rank.color}`}>
                                                        <span className="w-1.2 h-1.2 rounded-full bg-current animate-pulse" />
                                                        {rankInfo.rank.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-black text-base text-cyan-400">
                                                    {entry.rating}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-white/70 text-sm">{entry.games}</td>
                                                <td className="px-6 py-4 text-right text-green-400 font-semibold font-mono text-sm">
                                                    {entry.winRate}%
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
