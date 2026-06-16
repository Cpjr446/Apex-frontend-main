import { useState, useEffect } from "react";
import { LuKeyboard, LuLock, LuBot, LuLoader } from "react-icons/lu";

export function Overlay({ children, onClose }: any) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121936] border border-[#26304D] rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#2979FF] to-[#26C6DA]" />
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export function PublicOverlay({ topic, category, onClose, socket }: any) {
  useEffect(() => {
    if (socket) {
      socket.emit("join_queue", { topic, category, rating: 1000 });
    }
  }, [socket, topic]);

  return (
    <div className="text-center w-full max-w-sm mx-auto">
      <div className="w-16 h-16 bg-[#2979FF]/10 text-[#26C6DA] rounded-full flex items-center justify-center mx-auto mb-6">
        <LuLoader className="animate-spin text-2xl" />
      </div>
      <h2 className="text-xl font-bold font-heading mb-2">Finding Match...</h2>
      <p className="text-white/50 text-sm mb-6">
        Looking for an opponent in{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2979FF] to-[#26C6DA] font-extrabold">{topic}</span>
      </p>
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/5"
      >
        Cancel Matchmaking
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
        <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <LuLock size={24} />
        </div>
        <h2 className="text-xl font-bold font-heading mb-2">Game Created!</h2>
        <p className="text-white/50 text-sm mb-6">
          Topic: <span className="text-white font-bold">{topic}</span>
          <br />
          Share lobby code:
        </p>
        <div className="bg-[#060B23] p-4 rounded-xl border border-[#26304D] mb-6">
          <div className="text-3xl font-mono font-black tracking-[0.2em] text-[#26C6DA] select-all">
            {createdCode}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl btn-premium-primary cursor-pointer text-sm"
        >
          Done (Waiting for opponent...)
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-[#2979FF]/10 text-[#26C6DA] rounded-full flex items-center justify-center mx-auto mb-6">
        <LuLock size={24} />
      </div>
      <h2 className="text-xl font-bold font-heading mb-2">Create Private Room</h2>
      <p className="text-white/50 text-sm mb-8 leading-normal">
        Create a private <span className="text-white font-bold">{topic}</span> duel lobby to challenge your friends.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl btn-premium-secondary cursor-pointer text-sm"
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl btn-premium-primary cursor-pointer text-sm disabled:opacity-50"
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
      <div className="w-16 h-16 bg-[#2979FF]/10 text-[#26C6DA] rounded-full flex items-center justify-center mx-auto mb-6">
        <LuKeyboard size={24} />
      </div>
      <h2 className="text-xl font-bold font-heading mb-2">Join Duel Room</h2>
      <p className="text-white/50 text-sm mb-6">Enter lobby invitation code:</p>
      <input
        type="text"
        placeholder="ENTER CODE"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="w-full bg-[#060B23] border border-[#26304D] rounded-xl px-4 py-4.5 text-center text-2xl font-mono font-black tracking-[0.2em] text-[#26C6DA] placeholder:text-white/10 focus:outline-none focus:border-[#26C6DA] transition-all duration-200 mb-6"
        maxLength={6}
      />
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl btn-premium-secondary cursor-pointer text-sm"
        >
          Cancel
        </button>
        <button
          onClick={join}
          disabled={loading || code.length < 6}
          className="flex-1 py-3.5 rounded-xl btn-premium-primary cursor-pointer text-sm disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Lobby"}
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
      <div className="w-16 h-16 bg-[#2979FF]/10 text-[#26C6DA] rounded-full flex items-center justify-center mx-auto mb-6">
        <LuBot size={24} />
      </div>
      <h2 className="text-xl font-bold font-heading mb-4">Challenge AI Bot</h2>

      {/* Category Selection */}
      <div className="mb-4 text-left">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Category</label>
        <div className="flex gap-2">
          {Object.keys(CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setTopic("RANDOM");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                category === cat
                  ? "btn-premium-primary text-white shadow-sm"
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
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Select Topic</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
          <button
            onClick={() => setTopic("RANDOM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
              topic === "RANDOM"
                ? "bg-[#2979FF]/15 border-[#2979FF] text-[#26C6DA]"
                : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
            }`}
          >
            All (Random)
          </button>
          {currentTopics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
                topic === t
                  ? "bg-[#2979FF]/15 border-[#2979FF] text-[#26C6DA]"
                  : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-6 text-left">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Difficulty</label>
        <div className="space-y-2">
          {difficulties.map((diff) => (
            <button
              key={diff.rating}
              onClick={() => setDifficulty(diff.rating)}
              className={`w-full p-3 rounded-xl border text-left transition-all duration-250 cursor-pointer flex items-center justify-between ${
                difficulty === diff.rating
                  ? "border-[#26C6DA] bg-[#26C6DA]/10 shadow-[0_0_10px_rgba(38,198,218,0.15)]"
                  : "border-[#26304D] bg-[#0d122b] hover:border-white/15"
              }`}
            >
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  {diff.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${diff.color}`}>
                    {diff.rating} ELO
                  </span>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5 leading-normal">{diff.desc}</div>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                difficulty === diff.rating ? "border-[#26C6DA] bg-[#26C6DA]" : "border-white/20"
              }`}>
                {difficulty === diff.rating && <div className="w-1.5 h-1.5 bg-[#060B23] rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-xl btn-premium-secondary cursor-pointer text-sm"
        >
          Cancel
        </button>
        <button
          onClick={startChallenge}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl btn-premium-primary cursor-pointer text-sm disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Challenge"}
        </button>
      </div>
    </div>
  );
}
