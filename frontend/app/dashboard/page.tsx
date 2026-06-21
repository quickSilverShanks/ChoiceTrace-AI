"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '../layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Flame, 
  Award, 
  Leaf, 
  Check, 
  ChevronRight, 
  Compass, 
  TrendingDown, 
  Trophy, 
  Zap, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface UserOut {
  id: number;
  username: string;
  persona: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  carbon_score: number;
  total_carbon_saved: number;
  trees_saved: number;
}

interface ChallengeOut {
  id: number;
  title: string;
  description: string;
  carbon_savings: number;
  xp_reward: number;
  time_estimate: string;
  completed: boolean;
  completed_at?: string;
}

interface BadgeOut {
  id: number;
  name: string;
  description: string;
  icon: string;
  awarded_at: string;
}

interface DashboardData {
  user: UserOut;
  recent_activities: any[];
  badges: BadgeOut[];
  daily_challenges: ChallengeOut[];
  weekly_missions: any[];
  carbon_savings_by_category: Record<string, number>;
  habit_insights: string[];
  leaderboard: any[];
}

export default function GamifiedDashboardPage() {
  const { token, apiBase, refreshStats } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingChallengeId, setClaimingChallengeId] = useState<number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (err) {
      console.error("Error loading dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    
    const handlePersonaChange = () => {
      setLoading(true);
      fetchDashboardData();
    };
    window.addEventListener('personaChanged', handlePersonaChange);
    return () => window.removeEventListener('personaChanged', handlePersonaChange);
  }, [token]);

  const handleCompleteChallenge = async (challengeId: number) => {
    if (!token) return;
    setClaimingChallengeId(challengeId);
    try {
      const res = await fetch(`${apiBase}/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Reload data & header stats
        await fetchDashboardData();
        refreshStats();
      }
    } catch (err) {
      console.error("Failed to complete challenge:", err);
    } finally {
      setClaimingChallengeId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle className="h-10 w-10 text-emerald-400 animate-pulse" />
        <p className="text-slate-400 text-sm">Aggregating sustainability dashboard analytics...</p>
      </div>
    );
  }

  // Format Recharts data
  const chartData = Object.entries(data.carbon_savings_by_category).map(([key, val]) => ({
    category: key.toUpperCase(),
    savings: val
  }));

  const COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#047857', '#065f46'];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Welcome & Overview Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          Gamification & Analytics Dashboard
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Review your level stats, complete micro-challenges, track your streak, and see your category impacts.
        </p>
      </div>

      {/* Grid: Challenges (Left) & Recharts Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Daily Micro-Actions Checklist & Weekly Missions */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Daily Micro-Actions */}
          <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center">
                <Calendar className="h-4.5 w-4.5 mr-2 text-emerald-400" /> Daily Micro-Actions (Under 15 mins)
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                150+ XP Available
              </span>
            </div>

            <div className="space-y-3">
              {data.daily_challenges.map((c) => (
                <div 
                  key={c.id} 
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    c.completed 
                      ? 'bg-slate-800/20 border-slate-850 opacity-60' 
                      : 'bg-slate-850/40 border-slate-800 hover:border-slate-700/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${c.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {c.title}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                        {c.time_estimate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">{c.description}</p>
                    <div className="flex items-center space-x-3 text-[10px] font-bold text-emerald-400 mt-1">
                      <span>-{c.carbon_savings} kg CO₂</span>
                      <span>•</span>
                      <span>+{c.xp_reward} XP</span>
                    </div>
                  </div>

                  <button
                    disabled={c.completed || claimingChallengeId === c.id}
                    onClick={() => handleCompleteChallenge(c.id)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      c.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-darkbg-200 border-transparent hover:scale-105'
                    }`}
                  >
                    {c.completed ? <Check className="h-4.5 w-4.5" /> : claimingChallengeId === c.id ? '...' : <Zap className="h-4.5 w-4.5" />}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Missions */}
          <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center border-b border-slate-800 pb-3">
              <Trophy className="h-4.5 w-4.5 mr-2 text-teal-400" /> Weekly Missions
            </h3>

            <div className="space-y-3.5">
              {data.weekly_missions.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{m.title}</span>
                    <span className="text-slate-400">{m.progress} / {m.target}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(m.progress / m.target) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{m.description}</span>
                    <span className="font-bold text-teal-400">+{m.xp_reward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Recharts Savings & Habit Insights */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recharts Analytics Bar Chart */}
          <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center border-b border-slate-800 pb-3">
              <TrendingDown className="h-4.5 w-4.5 mr-2 text-emerald-400" /> Impact Reduction by Category
            </h3>
            
            <div className="h-56 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#10b981' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="savings" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Values represent total kg CO₂ prevented
            </div>
          </section>

          {/* AI Habit Insights */}
          <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-gradient-to-br from-slate-900/40 to-emerald-950/10">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center border-b border-slate-800/80 pb-2">
              <Info className="h-4.5 w-4.5 mr-2 text-teal-400" /> AI Habit Coach Insights
            </h3>
            <div className="space-y-2.5">
              {data.habit_insights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* Grid Row 2: Badges & Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Badges Panel */}
        <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center border-b border-slate-800 pb-3">
            <Award className="h-4.5 w-4.5 mr-2 text-yellow-500 animate-pulse" /> Awarded Badges & Trophies
          </h3>

          {data.badges.length === 0 ? (
            <div className="text-center p-8 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
              <Award className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No badges awarded yet. Accumulate streak days or log transit decisions to earn!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {data.badges.map((b) => (
                <div key={b.id} className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-emerald-500/25 transition-colors flex items-center space-x-3 group">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-yellow-500/10 to-amber-500/20 border border-yellow-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{b.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global/Community Leaderboard */}
        <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center border-b border-slate-800 pb-3">
            <Trophy className="h-4.5 w-4.5 mr-2 text-yellow-500" /> Nudge Community Rankings
          </h3>

          <div className="space-y-2">
            {data.leaderboard.map((u) => (
              <div 
                key={u.username}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                  u.is_mock 
                    ? 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-900/50' 
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`font-mono text-sm w-5 text-center ${
                    u.rank === 1 ? 'text-yellow-400 font-black' : u.rank === 2 ? 'text-slate-300' : u.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{u.rank}
                  </span>
                  <div>
                    <span className="text-slate-200">{u.username}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md ml-2 font-mono uppercase tracking-wider">
                      Lvl {u.level}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-slate-400">{u.xp} XP</span>
                  <div className="w-10 text-right font-black text-emerald-400">{u.carbon_score.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  );
}
