// app/components/DashboardOverlays.tsx
import { useState, useEffect } from "react";
import { FaKeyboard, FaLock, FaRobot } from "react-icons/fa";

export function Overlay({ children, onClose }: any) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#12162e] border border-white/10 rounded-3xl p-1 w-full max-w-md shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export function PublicOverlay({ topic, category, onClose, socket }: any) {
  useEffect(() => {
    if (socket) {
      socket.emit("join_queue", { topic, category, rating: 1000 }); // Pass rating from props ideally
    }
  }, [socket, topic]);

  return (
    <div className="text-center w-full max-w-sm mx-auto">
      <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
      </div>
      <h2 className="text-xl font-bold mb-2">Finding Match...</h2>
      <p className="text-white/50 text-sm mb-6">
        Looking for an opponent in{" "}
        <span className="text-white font-bold">{topic}</span>
      </p>
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

export function PrivateOverlay({ topic, category, onClose, socket }: any) {
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleCreated = ({ code }: { code: string }) => {
      setCreatedCode(code);
      setLoading(false);
    };
    socket.on("private_created", handleCreated);
    return () => {
      socket.off("private_created", handleCreated);
    };
  }, [socket]);

  const create = () => {
    setLoading(true);
    socket?.emit("create_private", { topic, category });
  };

  if (createdCode) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaLock size={28} />
        </div>
        <h2 className="text-xl font-bold mb-2">Game Created!</h2>
        <p className="text-white/50 text-sm mb-6">
          Topic: <span className="text-white font-bold">{topic}</span>
          <br />
          Share:
        </p>
        <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-8">
          <div className="text-3xl font-mono font-bold tracking-[0.2em] text-cyan-400 select-all">
            {createdCode}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Done (Waiting...)
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaLock size={28} />
      </div>
      <h2 className="text-xl font-bold mb-2">Create Private Room</h2>
      <p className="text-white/50 text-sm mb-8">
        Create a private <span className="text-white font-bold">{topic}</span>{" "}
        room.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>
    </div>
  );
}

export function JoinOverlay({ onClose, socket }: any) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const join = () => {
    if (!code) return;
    setLoading(true);
    socket?.emit("join_private", { code });
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaKeyboard size={28} />
      </div>
      <h2 className="text-xl font-bold mb-2">Join Game</h2>
      <p className="text-white/50 text-sm mb-8">Enter code:</p>
      <input
        type="text"
        placeholder="ENTER CODE"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono font-bold tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 transition-colors mb-8"
        maxLength={6}
      />
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={join}
          disabled={loading || code.length < 6}
          className="flex-1 py-3.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Game"}
        </button>
      </div>
    </div>
  );
}

export function BotOverlay({ topic: initialTopic, category: initialCategory, onClose, socket }: any) {
  const [category, setCategory] = useState<string>(initialCategory || "CS");
  const [topic, setTopic] = useState<string>(initialTopic || "RANDOM");
  const [difficulty, setDifficulty] = useState<number>(1200); // default medium
  const [loading, setLoading] = useState(false);

  const CATEGORIES: Record<string, string[]> = {
    CS: ["DSA", "OOPS", "OS", "DBMS", "CN"],
    Electronics: ["Digital", "Analog", "Signals", "COA", "C_Prog"],
  };

  const startChallenge = () => {
    setLoading(true);
    socket?.emit("challenge_bot", {
      topic,
      category,
      botRating: difficulty,
    });
  };

  const difficulties = [
    { label: "Easy", rating: 800, desc: "Slower response, makes occasional errors", color: "text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20" },
    { label: "Medium", rating: 1200, desc: "Balanced performance, standard challenge", color: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20" },
    { label: "Hard", rating: 1600, desc: "Fast response, rarely makes mistakes", color: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20" },
    { label: "Expert", rating: 2000, desc: "Extremely fast, near-perfect accuracy", color: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20" },
  ];

  const currentTopics = CATEGORIES[category] || [];

  return (
    <div className="text-center w-full max-w-sm mx-auto">
      <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaRobot size={28} />
      </div>
      <h2 className="text-xl font-bold mb-4">Challenge AI Bot</h2>

      {/* Category Selection */}
      <div className="mb-4 text-left">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Category</label>
        <div className="flex gap-2">
          {Object.keys(CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setTopic("RANDOM");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                category === cat
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Selection */}
      <div className="mb-6 text-left">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Select Topic</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTopic("RANDOM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              topic === "RANDOM"
                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
            }`}
          >
            All (Random)
          </button>
          {currentTopics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                topic === t
                  ? "bg-blue-500/20 border-blue-500 text-blue-400"
                  : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8 text-left">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Difficulty</label>
        <div className="space-y-2.5">
          {difficulties.map((diff) => (
            <button
              key={diff.rating}
              onClick={() => setDifficulty(diff.rating)}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                difficulty === diff.rating
                  ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                  : "border-white/5 bg-black/20 hover:border-white/10"
              }`}
            >
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  {diff.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${diff.color}`}>
                    {diff.rating} ELO
                  </span>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">{diff.desc}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                difficulty === diff.rating ? "border-purple-400 bg-purple-500 text-white" : "border-white/20"
              }`}>
                {difficulty === diff.rating && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={startChallenge}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Challenge"}
        </button>
      </div>
    </div>
  );
}
