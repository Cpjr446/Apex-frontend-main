import { LuLogOut } from "react-icons/lu";
import type { UserData, RankInfo } from "~/utils/types";
import { Link } from "react-router";

interface NavbarProps {
  data?: UserData | undefined;
  rank?: RankInfo["rank"];
  handleLogout?: () => void;
}

const Navbar = ({ data, rank, handleLogout }: NavbarProps) => {
  const isLoggedIn = !!data && !!rank && !!handleLogout;

  return (
    <nav className="sticky top-0 z-40 border-b border-[#26304D] bg-[#060B23]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#2979FF] to-[#26C6DA] rounded-lg flex items-center justify-center text-[#060B23] shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white font-heading">
              APEX
            </span>
          </Link>

          {/* Navigation Links - Only show if logged in */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1 ml-8">
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 font-semibold text-sm font-heading"
              >
                Dashboard
              </Link>
              <Link
                to="/leaderboard"
                className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 font-semibold text-sm font-heading"
              >
                Leaderboard
              </Link>
            </div>
          )}
        </div>

        {/* User Handlers or Login Link */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to={`/profile/${data?.user?.name || "player"}`}
                className="flex items-center gap-3 group"
              >
                <div className="hidden md:flex flex-col items-end mr-1">
                  <span className="text-sm font-bold text-white/90 group-hover:text-blue-400 transition-colors">
                    {data?.user?.name || "Player"}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${rank?.color}`}>
                    {rank?.name}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#121936] border border-[#26304D] flex items-center justify-center text-cyan-400 hover:border-cyan-400/50 hover:bg-[#1B2448] transition-all duration-200 shadow-md">
                  {data?.user?.avatar ? (
                    <img
                      src={data.user.avatar}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black text-white font-heading">
                      {data?.user?.name?.[0]?.toUpperCase() || "P"}
                    </span>
                  )}
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all duration-200 ml-1 cursor-pointer"
                title="Logout"
              >
                <LuLogOut size={16} />
              </button>
            </>
          ) : (
            <div className="text-xs text-white/40 font-bold uppercase tracking-widest font-mono">
              Welcome to Apex
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
