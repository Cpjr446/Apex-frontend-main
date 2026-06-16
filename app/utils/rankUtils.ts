// Rank system (Codeforces-style)
export const RANKS = [
    { min: 0, max: 799, name: "Newbie", color: "text-[#94A3B8]" },
    { min: 800, max: 999, name: "Pupil", color: "text-[#22C55E]" },
    { min: 1000, max: 1199, name: "Specialist", color: "text-[#26C6DA]" },
    { min: 1200, max: 1399, name: "Expert", color: "text-[#A855F7]" },
    { min: 1400, max: 1599, name: "Candidate Master", color: "text-[#EC4899]" },
    { min: 1600, max: 1899, name: "Master", color: "text-[#F97316]" },
    { min: 1900, max: 2199, name: "Grandmaster", color: "text-[#EAB308]" },
    { min: 2200, max: Infinity, name: "Legend", color: "rank-legend" },
];

export function getRankInfo(rating: number) {
    const rank =
        RANKS.find((r) => rating >= r.min && rating <= r.max) || RANKS[0];
    const nextRank = RANKS.find((r) => r.min > rating);
    const progress = nextRank
        ? Math.min(100, ((rating - rank.min) / (nextRank.min - rank.min)) * 100)
        : 100;
    const pointsToNext = nextRank ? nextRank.min - rating : 0;

    return { rank, nextRank, progress, pointsToNext };
}
