"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from './layout';
import { 
  Car, 
  Utensils, 
  ShoppingBag, 
  Lightbulb, 
  Plane, 
  Flame,
  Tv, 
  TrendingDown, 
  Check, 
  X, 
  Clock, 
  Info,
  ChevronRight,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface ActivityLog {
  id: number;
  activity_type: string;
  title: string;
  original_action: string;
  original_carbon: number;
  recommended_alternative: string;
  alternative_carbon: number;
  carbon_saved: number;
  cost_saved: number;
  difficulty: string;
  confidence_score: number;
  chosen: boolean;
  timestamp: string;
}

export default function DecisionFeedPage() {
  const { token, user, apiBase, refreshStats } = useApp();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [latestNudge, setLatestNudge] = useState<ActivityLog | null>(null);
  
  // Custom templates to make demo inputs easy and fun
  const templates: Record<string, { label: string; value: string }[]> = {
    commute: [
      { label: "🚗 Drive 10km to office", value: "Drive 10km to office" },
      { label: "🚗 Call Uber/Taxi for 5km trip", value: "Call a solo Uber for a 5km cross-town meeting" },
      { label: "🚗 Drive solo in traffic (15km)", value: "Drive solo in dense highway traffic for 15km" }
    ],
    food: [
      { label: "🥩 Order double beef cheeseburger", value: "Order a double beef cheeseburger with bacon" },
      { label: "🍗 Chicken breast salad", value: "Chicken breast salad with imported toppings" },
      { label: "🍝 Cheese pasta bowl", value: "Order loaded macaroni and cheese dinner" }
    ],
    grocery: [
      { label: "🛒 Import vegetables in plastic wraps", value: "Buy air-freighted out-of-season berries in plastic clamshells" },
      { label: "🛒 Standard food shopping trip", value: "Buy standard store brand packaged grocery staples" }
    ],
    shopping: [
      { label: "💻 Buy brand new laptop", value: "Purchase a brand new high-end gaming laptop" },
      { label: "👟 Buy new leather sneakers", value: "Buy a new pair of imported leather sneakers online" }
    ],
    energy: [
      { label: "❄️ Turn on AC to 19°C", value: "Run AC at 19°C (66°F) all evening on a hot day" },
      { label: "💡 Leave halogen lights on", value: "Leave 6 halogen ceiling spotlights on for 6 hours" }
    ],
    travel: [
      { label: "✈️ Weekend flight (400km)", value: "Take a regional flight of 400km for a weekend trip" }
    ]
  };

  const activityCards = [
    { type: 'commute', label: 'Commute', icon: Car, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { type: 'food', label: 'Order Food', icon: Utensils, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { type: 'grocery', label: 'Grocery Run', icon: ShoppingBag, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { type: 'shopping', label: 'Online Shopping', icon: ShoppingBag, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { type: 'energy', label: 'Home Energy', icon: Lightbulb, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { type: 'travel', label: 'Travel Planning', icon: Plane, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' }
  ];

  // Fetch activities feed
  const fetchFeed = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    }
  };

  useEffect(() => {
    fetchFeed();
    
    // Listen to profile/persona switches
    const handlePersonaChange = () => {
      fetchFeed();
      setLatestNudge(null);
    };
    window.addEventListener('personaChanged', handlePersonaChange);
    return () => window.removeEventListener('personaChanged', handlePersonaChange);
  }, [token]);

  // Submit decision log
  const handleNudgeRequest = async (inputStr: string) => {
    if (!token || !selectedActivityType || !inputStr.trim()) return;
    setSubmitting(true);
    try {
      const url = `${apiBase}/activities/nudge?activity_type=${selectedActivityType}&current_choice=${encodeURIComponent(inputStr)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLatestNudge(data);
        fetchFeed();
        setCustomInput('');
        setSelectedActivityType(null);
      }
    } catch (err) {
      console.error("Nudge request failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Switch choice state (True = user picked green alt, False = reverted)
  const toggleChoice = async (id: number, currentChosen: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/activities/${id}/choose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chosen: !currentChosen })
      });
      if (res.ok) {
        fetchFeed();
        if (latestNudge && latestNudge.id === id) {
          const updated = await res.json();
          setLatestNudge(updated);
        }
        refreshStats();
      }
    } catch (err) {
      console.error("Failed to toggle choice:", err);
    }
  };

  // Formats time for feed timeline (e.g. 12:15 PM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* 1. What are you about to do? Banner */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            What are you about to do?
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Choose an activity category to nudge your upcoming action toward a lower carbon impact.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {activityCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.type}
                onClick={() => {
                  setSelectedActivityType(card.type);
                  setLatestNudge(null);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 glass-panel hover:scale-105 hover:border-emerald-500/40 select-none ${
                  selectedActivityType === card.type ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20' : ''
                }`}
              >
                <div className={`p-2.5 rounded-xl ${card.color} mb-2.5`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-wide">{card.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Action Prompt Input Box */}
      {selectedActivityType && (
        <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />
              Nudge Decision: {selectedActivityType}
            </h3>
            <button 
              onClick={() => setSelectedActivityType(null)}
              className="text-slate-500 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick-choice Templates */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Quick suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {templates[selectedActivityType]?.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNudgeRequest(t.value)}
                  className="text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl border border-slate-700/50 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Or type custom description (e.g. 'Order hamburger', 'Drive 8km')..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={() => handleNudgeRequest(customInput)}
              disabled={submitting || !customInput.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-darkbg-200 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center"
            >
              {submitting ? 'Calculating...' : 'Evaluate Impact'}
            </button>
          </div>
        </section>
      )}

      {/* 3. Decision Comparison Card (Primary Output UI) */}
      {latestNudge && (
        <section className="glass-panel p-6 rounded-2xl border-2 border-emerald-500/40 relative overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Neon Glow overlay */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-lg text-emerald-400 flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" /> Real-Time Decision Comparison
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              {latestNudge.difficulty} Difficulty
            </span>
          </div>

          {/* Grid Layout of comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Current Planned Choice */}
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/40">
              <span className="text-xs text-slate-400 uppercase font-bold">Planned choice</span>
              <p className="text-slate-200 font-semibold mt-1 text-sm">{latestNudge.original_action}</p>
              <div className="mt-3 flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-rose-400">{latestNudge.original_carbon.toFixed(1)}</span>
                <span className="text-xs text-rose-400/80 font-bold">kg CO₂</span>
              </div>
            </div>

            {/* Recommended Green Alternative */}
            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
              <span className="text-xs text-emerald-400 uppercase font-bold">Recommended alternative</span>
              <p className="text-slate-100 font-bold mt-1 text-sm">{latestNudge.recommended_alternative}</p>
              <div className="mt-3 flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-emerald-400">{latestNudge.alternative_carbon.toFixed(1)}</span>
                <span className="text-xs text-emerald-400/80 font-bold">kg CO₂</span>
              </div>
            </div>
          </div>

          {/* Reasoning Section */}
          <div className="mb-6 p-3.5 bg-slate-800/20 rounded-xl border border-slate-700/30 text-xs text-slate-300 leading-relaxed flex items-start space-x-2.5">
            <Info className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>{latestNudge.reasoning}</p>
          </div>

          {/* Metrics summary banner & CTA Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800 pt-5">
            <div className="flex items-center space-x-5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Carbon Reduction</span>
                <span className="text-lg font-black text-emerald-400">-{latestNudge.carbon_saved.toFixed(1)} kg CO₂ ({Math.round((latestNudge.carbon_saved / latestNudge.original_carbon) * 100)}%)</span>
              </div>
              <div className="border-l border-slate-800 h-8" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gas / Cash Saved</span>
                <span className="text-lg font-black text-teal-400">${latestNudge.cost_saved.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => toggleChoice(latestNudge.id, latestNudge.chosen)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                latestNudge.chosen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-darkbg-200 shadow-lg shadow-emerald-500/10'
              }`}
            >
              {latestNudge.chosen ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Green Choice Applied (+XP)</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Accept Green Nudge</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* 4. Timeline Decision Feed */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-300">
          Proactive Decision Timeline
        </h3>

        {activities.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800">
            <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No decisions logged today. Try evaluating an action above!</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-7 group">
                {/* Timeline node dot */}
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 transition-colors ${
                  act.chosen ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-900 border-slate-700'
                }`} />

                <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: activity info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{act.activity_type}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400 flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" /> {formatTime(act.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-200 text-sm font-semibold">{act.title}</p>
                    
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Planned: <strong className="text-rose-400">{act.original_carbon.toFixed(1)}kg</strong></span>
                      <span>•</span>
                      <span>Alternative: <strong className="text-emerald-400">{act.alternative_carbon.toFixed(1)}kg</strong></span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Saved: -{act.carbon_saved.toFixed(1)}kg CO₂</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Toggle */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {act.cost_saved > 0 && (
                      <span className="text-xs text-teal-400 font-bold flex items-center bg-teal-500/5 border border-teal-500/10 px-2 py-1 rounded-lg">
                        <DollarSign className="h-3 w-3 mr-0.5" /> {act.cost_saved.toFixed(2)} saved
                      </span>
                    )}

                    <button
                      onClick={() => toggleChoice(act.id, act.chosen)}
                      className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                        act.chosen
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {act.chosen ? '✓ Applied' : 'Apply Alt'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
