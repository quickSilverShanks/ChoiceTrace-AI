"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '../layout';
import { 
  Calendar, 
  CheckCircle, 
  Compass, 
  Leaf, 
  Lock, 
  Sparkles, 
  HelpCircle,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
  Flame
} from 'lucide-react';

interface RoadmapItem {
  id: number;
  day_number: number;
  title: string;
  description: string;
  category: string;
  carbon_savings: number;
  difficulty: string;
  completed: boolean;
  completed_at?: string;
}

export default function RoadmapPage() {
  const { token, apiBase, refreshStats } = useApp();
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const fetchRoadmap = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/roadmap/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      }
    } catch (err) {
      console.error("Failed to load roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
    
    const handlePersonaChange = () => {
      setLoading(true);
      fetchRoadmap();
    };
    window.addEventListener('personaChanged', handlePersonaChange);
    return () => window.removeEventListener('personaChanged', handlePersonaChange);
  }, [token]);

  const handleCompleteStep = async (id: number) => {
    if (!token || completingId === id) return;
    setCompletingId(id);
    try {
      const res = await fetch(`${apiBase}/roadmap/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchRoadmap();
        refreshStats();
      }
    } catch (err) {
      console.error("Error completing roadmap step:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'transport': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'food': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'energy': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'shopping': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const completedCount = roadmap.filter(item => item.completed).length;
  const potentialSavings = roadmap.reduce((sum, item) => sum + item.carbon_savings, 0);
  const currentSavings = roadmap.filter(item => item.completed).reduce((sum, item) => sum + item.carbon_savings, 0);
  const progressPercent = roadmap.length > 0 ? (completedCount / roadmap.length) * 100 : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          Personalized 30-Day Roadmap
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          A step-by-step habit reformation plan designed to build high-impact, long-term environmental lifestyle habits.
        </p>
      </div>

      {/* Progress Card Summary */}
      {roadmap.length > 0 && (
        <section className="glass-panel p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-5 items-center relative overflow-hidden">
          {/* Progress Circle & Text */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-350">Roadmap Progress</span>
              <span className="text-emerald-400 font-bold">{completedCount} of 30 Days Completed</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block">Complete each day's step to unlock levels and build your streak.</span>
          </div>

          {/* Potential Impact statistics */}
          <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40 text-center shrink-0">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Carbon Reduction Realized</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {currentSavings.toFixed(1)} / {potentialSavings.toFixed(1)} kg
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">CO₂ saved so far</span>
          </div>
        </section>
      )}

      {/* 30-Day Timeline Checklist */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Synthesizing personalized 30-day timeline...</p>
        </div>
      ) : (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-300">Your Action Steps</h3>

          <div className="space-y-3.5">
            {roadmap.map((item) => (
              <div 
                key={item.id}
                className={`glass-panel p-4.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.completed 
                    ? 'border-emerald-500/30 bg-slate-800/10 opacity-70' 
                    : 'border-slate-800/80 hover:border-slate-750'
                }`}
              >
                {/* Left side info */}
                <div className="flex items-start space-x-4">
                  {/* Day Indicator Badge */}
                  <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono select-none ${
                    item.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-900 border-slate-750 text-slate-300'
                  }`}>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold -mb-0.5">Day</span>
                    <span className="text-sm font-black">{item.day_number}</span>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className={`text-sm font-bold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {item.title}
                      </h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[9px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {item.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal">{item.description}</p>
                  </div>
                </div>

                {/* Right side checkoff & impact indicator */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 border-slate-850 pt-2.5 sm:pt-0">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Estimated Savings</span>
                    <span className="text-xs font-bold text-emerald-400">-{item.carbon_savings} kg CO₂</span>
                  </div>

                  <button
                    disabled={item.completed || completingId === item.id}
                    onClick={() => handleCompleteStep(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1 ${
                      item.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-darkbg-200 border-transparent hover:scale-105'
                    }`}
                  >
                    {item.completed ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed (+75 XP)</span>
                      </>
                    ) : completingId === item.id ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <span>Mark Done</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
