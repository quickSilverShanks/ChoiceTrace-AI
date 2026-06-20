"use client";

import React, { useState } from 'react';
import { useApp } from '../layout';
import { 
  Map, 
  Leaf, 
  Users, 
  Sparkles, 
  Compass, 
  TrendingDown, 
  Trophy, 
  TreePine,
  Shield,
  Milestone,
  Heart
} from 'lucide-react';

export default function EcoMapPage() {
  const { user } = useApp();
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);

  // Mock community milestones
  const milestones = [
    { id: 1, title: "10,000 kg CO₂ Saved", desc: "Planted the Seedling Meadow", achieved: true, progress: 100 },
    { id: 2, title: "100,000 kg CO₂ Saved", desc: "Grew the Community Orchard", achieved: true, progress: 100 },
    { id: 3, title: "500,000 kg CO₂ Saved", desc: "Sprouted the Redwood Canopy", achieved: false, progress: 90 },
    { id: 4, title: "1,000,000 kg CO₂ Saved", desc: "Establish the Carbon Reserve", achieved: false, progress: 45 }
  ];

  // Grid plots representing trees in the community eco-forest
  const plots = Array.from({ length: 24 }, (_, idx) => {
    const creators = ["EcoNudgeQueen", "SolarParent", "You", "MetroCommuter", "BikeToClass", "ZeroWaster"];
    const treeTypes = ["Oak", "Pine", "Elm", "Birch", "Maple", "Cedar"];
    
    const creator = creators[idx % creators.length];
    const treeType = treeTypes[idx % treeTypes.length];
    const height = 4 + (idx % 3) * 2; // simulated height in meters
    const co2Absorbed = height * 22; // approx absorption rate
    const isUserTree = creator === "You" || (user && creator === "You");

    return {
      id: idx + 1,
      creator: creator === "You" && user ? user.username : creator,
      treeType,
      height: `${height}m`,
      co2Absorbed: `${co2Absorbed.toFixed(0)}kg/yr`,
      isUserTree,
      status: idx % 5 === 0 ? "Sprout" : idx % 3 === 0 ? "Sapling" : "Fully Grown"
    };
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          Community Eco-Forest & Milestones
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Track collective carbon reductions and plant virtual trees together in the community eco-grid.
        </p>
      </div>

      {/* Grid: Stats & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Collective Carbon Reduced */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Collective Carbon Reduced</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">452,800 kg CO₂</div>
            <span className="text-[10px] text-slate-500">Prevented across all users</span>
          </div>
        </div>

        {/* Collective Trees Planted */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <TreePine className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Community Trees Planted</span>
            <div className="text-xl font-extrabold text-teal-400 mt-0.5">20,580 Trees</div>
            <span className="text-[10px] text-slate-500">Virtual seedlings sprouted</span>
          </div>
        </div>

        {/* Community Members */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Eco Advocates</span>
            <div className="text-xl font-extrabold text-blue-400 mt-0.5">12,480 Active</div>
            <span className="text-[10px] text-slate-500">Sharing nudges globally</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Forest Grid Mapping */}
        <section className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 select-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center">
              <Map className="h-4.5 w-4.5 mr-2 text-emerald-400 animate-pulse" /> Community Forest Grid
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Click a plot to inspect planter details</span>
          </div>

          {/* Interactive Forest Grid plots */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-2 bg-slate-950/40 rounded-2xl border border-slate-900/60">
            {plots.map((plot) => (
              <button
                key={plot.id}
                onClick={() => setSelectedPlot(plot.id)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300 hover:scale-110 ${
                  selectedPlot === plot.id
                    ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-500/20'
                    : plot.isUserTree 
                      ? 'border-teal-500/40 bg-teal-500/5 hover:border-teal-400'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {/* Tree Icon with dynamic scaling based on growth status */}
                <TreePine className={`text-emerald-400 transition-transform duration-300 ${
                  plot.status === 'Sprout' 
                    ? 'h-4 w-4 text-emerald-500/60' 
                    : plot.status === 'Sapling' 
                      ? 'h-6 w-6 text-emerald-400/80' 
                      : 'h-8 w-8 text-emerald-300'
                }`} />
                <span className="text-[8px] text-slate-500 mt-1 font-mono">{plot.creator.substring(0, 5)}</span>

                {/* Micro User Node badge */}
                {plot.isUserTree && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-400 pulse-glow" />
                )}
              </button>
            ))}
          </div>

          {/* Plot Inspector Detail Box */}
          {selectedPlot && (() => {
            const plotInfo = plots.find(p => p.id === selectedPlot);
            if (!plotInfo) return null;
            return (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-350">Plot #{plotInfo.id}: {plotInfo.treeType} Tree</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                      plotInfo.status === 'Fully Grown' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {plotInfo.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Planted by <strong className="text-emerald-400 font-semibold">{plotInfo.creator}</strong>. Est height: {plotInfo.height}.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Absorption Rate</span>
                  <span className="text-xs font-bold text-emerald-400">{plotInfo.co2Absorbed} / yr</span>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Right Column: Milestones */}
        <section className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center border-b border-slate-800 pb-3">
            <Milestone className="h-4.5 w-4.5 mr-2 text-teal-400" /> Community Milestones
          </h3>

          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={m.achieved ? "text-slate-200" : "text-slate-400"}>{m.title}</span>
                  <span className={m.achieved ? "text-emerald-400" : "text-slate-500"}>
                    {m.achieved ? "✓ Unlocked" : `${m.progress}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      m.achieved ? 'bg-emerald-400' : 'bg-slate-700'
                    }`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{m.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-slate-400 leading-relaxed flex items-center space-x-2.5">
            <Heart className="h-5 w-5 text-emerald-400 shrink-0" />
            <p>Every time you accept a green alternative or check a roadmap item, your metrics help unlock community achievements and grow our forest.</p>
          </div>
        </section>

      </div>

    </div>
  );
}
