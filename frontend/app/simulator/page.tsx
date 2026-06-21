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
  AreaChart,
  Area
} from 'recharts';
import { 
  Flame, 
  TrendingDown, 
  Save, 
  Sparkles, 
  Clock, 
  Leaf, 
  Check,
  Zap,
  Info,
  DollarSign
} from 'lucide-react';

interface SavedSimulation {
  id: number;
  name: string;
  details: string;
  annual_carbon_savings: number;
  annual_cost_savings: number;
  score_improvement: number;
  created_at: string;
}

export default function SimulatorPage() {
  const { token, apiBase } = useApp();
  
  // Slider states
  const [cycleCommute, setCycleCommute] = useState(0);
  const [meatReduction, setMeatReduction] = useState(0);
  const [acTemp, setAcTemp] = useState(0);
  const [laundryCold, setLaundryCold] = useState(0);
  const [unplugPhantom, setUnplugPhantom] = useState(0);

  // Computed results
  const [results, setResults] = useState({
    weeklyCarbon: 0,
    monthlyCarbon: 0,
    annualCarbon: 0,
    annualCost: 0,
    scoreImprovement: 0
  });

  const [scenarioName, setScenarioName] = useState('');
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recalculate values when sliders change
  useEffect(() => {
    // Local fast estimation (matches backend constants for smooth slider responsiveness)
    const cycleVal = cycleCommute * 2.8;
    const meatVal = meatReduction * 2.6;
    const acVal = acTemp * 0.7 * 7; // assuming daily degree shift
    const laundryVal = laundryCold * 0.6;
    const unplugVal = unplugPhantom * 0.4 * 7;

    const cycleCost = cycleCommute * 1.80;
    const meatCost = meatReduction * 2.00;
    const acCost = acTemp * 0.40 * 7;
    const laundryCost = laundryCold * 0.30;
    const unplugCost = unplugPhantom * 0.20 * 7;

    const weeklyC = cycleVal + meatVal + acVal + laundryVal + unplugVal;
    const annualC = weeklyC * 52;
    const monthlyC = weeklyC * 4.33;
    const annualCostVal = (cycleCost + meatCost + acCost + laundryCost + unplugCost) * 52;
    
    const scoreBoost = Math.min((cycleCommute * 1.2) + (meatReduction * 1.0) + (acTemp * 0.8) + (laundryCold * 0.5) + (unplugPhantom * 0.4), 25.0);

    setResults({
      weeklyCarbon: parseFloat(weeklyC.toFixed(1)),
      monthlyCarbon: parseFloat(monthlyC.toFixed(1)),
      annualCarbon: parseFloat(annualC.toFixed(1)),
      annualCost: parseFloat(annualCostVal.toFixed(1)),
      scoreImprovement: parseFloat(scoreBoost.toFixed(1))
    });
  }, [cycleCommute, meatReduction, acTemp, laundryCold, unplugPhantom]);

  // Fetch saved simulations
  const fetchSavedSims = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/simulator/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedSims(data);
      }
    } catch (err) {
      console.error("Failed to load saved scenarios:", err);
    }
  };

  useEffect(() => {
    fetchSavedSims();
  }, [token]);

  const handleSaveScenario = async () => {
    if (!token || !scenarioName.trim() || saving) return;
    setSaving(true);
    try {
      const details = JSON.stringify({
        cycle_commute: cycleCommute,
        meat_reduction: meatReduction,
        ac_temp: acTemp,
        laundry_cold: laundryCold,
        unplug_phantom: unplugPhantom
      });

      const res = await fetch(`${apiBase}/simulator/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: scenarioName,
          details: details,
          annual_carbon_savings: results.annualCarbon,
          annual_cost_savings: results.annualCost,
          score_improvement: results.scoreImprovement
        })
      });

      if (res.ok) {
        setScenarioName('');
        fetchSavedSims();
      }
    } catch (err) {
      console.error("Failed to save simulation scenario:", err);
    } finally {
      setSaving(false);
    }
  };

  // Recharts Area Chart Data (prevented carbon scale)
  const timelineData = [
    { name: 'Current', emissions: 0 },
    { name: 'Week 1', emissions: results.weeklyCarbon },
    { name: 'Month 1', emissions: results.monthlyCarbon },
    { name: 'Year 1', emissions: results.annualCarbon }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
          What-If Sustainability Simulator
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Adjust sliders to simulate shifts in your weekly habits and instantly project your annual carbon and financial impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive sliders */}
        <section className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center border-b border-slate-800 pb-3">
            <Sparkles className="h-4.5 w-4.5 mr-2 text-emerald-400 animate-pulse" /> Simulate Habit Shifts
          </h3>

          {/* Slider 1: Cycle to Work */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">🚲 Cycle to work (instead of drive)</span>
              <span className="text-emerald-400">{cycleCommute} trips / week</span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              value={cycleCommute}
              onChange={(e) => setCycleCommute(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Replaces 10km driving. Prevent 2.8kg CO₂ per trip.</span>
          </div>

          {/* Slider 2: Meat Reduction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">🥗 Replace beef meals with plant-based</span>
              <span className="text-emerald-400">{meatReduction} meals / week</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              value={meatReduction}
              onChange={(e) => setMeatReduction(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Replaces beef burger or steak. Prevent 2.6kg CO₂ per meal.</span>
          </div>

          {/* Slider 3: AC Temp Adjustment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">❄️ Increase AC thermostat setting</span>
              <span className="text-emerald-400">+{acTemp}°C shift</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={acTemp}
              onChange={(e) => setAcTemp(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Saves ~6% cooling electricity per degree. Prevent 4.9kg CO₂ weekly per °C.</span>
          </div>

          {/* Slider 4: Laundry Cold Wash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">🧺 Wash laundry in cold water</span>
              <span className="text-emerald-400">{laundryCold} loads / week</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={laundryCold}
              onChange={(e) => setLaundryCold(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Avoids heating water. Prevent 0.6kg CO₂ per load.</span>
          </div>

          {/* Slider 5: Unplug electronics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">🔌 Unplug unused standby phantom loads</span>
              <span className="text-emerald-400">{unplugPhantom ? "Active" : "Inactive"}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              value={unplugPhantom}
              onChange={(e) => setUnplugPhantom(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Cuts idle electronics leakage. Prevent 2.8kg CO₂ weekly.</span>
          </div>
        </section>

        {/* Right Column: Visualization Widgets & Save Scenario */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main output indicators */}
          <div className="grid grid-cols-3 gap-3.5">
            {/* Carbon Saved Widget */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Annual Carbon Saved</span>
              <div className="text-xl md:text-2xl font-black text-emerald-400 mt-2">
                -{results.annualCarbon.toLocaleString()} kg
              </div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono">
                {results.weeklyCarbon}kg / week
              </div>
            </div>

            {/* Utility/Fuel Saved Widget */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Annual Cost Saved</span>
              <div className="text-xl md:text-2xl font-black text-teal-400 mt-2 flex items-center justify-center">
                <DollarSign className="h-5 w-5 shrink-0" />
                {results.annualCost.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono">
                USD Cash Prevented
              </div>
            </div>

            {/* Sustainability Score Boost Widget */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Score Improvement</span>
              <div className="text-xl md:text-2xl font-black text-yellow-400 mt-2">
                +{results.scoreImprovement} pts
              </div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono">
                Boosts Score out of 100
              </div>
            </div>
          </div>

          {/* Area Chart: Stacked Savings timeline */}
          <section className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <TrendingDown className="h-4 w-4 mr-1 text-emerald-400" /> Carbon Avoidance Accumulation
            </h4>
            <div className="h-44 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Area type="monotone" dataKey="emissions" stroke="#10b981" fillOpacity={0.25} fill="url(#colorSaved)" />
                    <defs>
                      <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Save Simulation Scenario */}
          <section className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Name this lifestyle scenario (e.g. 'My Commute Switch')..."
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={handleSaveScenario}
              disabled={saving || !scenarioName.trim() || results.annualCarbon === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-darkbg-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
            >
              <Save className="h-4 w-4" />
              <span>Save Scenario</span>
            </button>
          </section>

        </div>

      </div>

      {/* Row 3: Saved Scenarios List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-300">Saved Simulation Scenarios</h3>
        
        {savedSims.length === 0 ? (
          <div className="glass-panel p-6 text-center rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-xs">No saved scenarios found. Try naming and saving your slider values above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedSims.map((sim) => {
              const details = JSON.parse(sim.details);
              return (
                <div key={sim.id} className="glass-panel p-4.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{sim.name}</h4>
                    {/* Compact stats summary */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-1">
                      <span>🚲 Cycle: {details.cycle_commute}x</span>
                      <span>🥗 Meatless: {details.meat_reduction}x</span>
                      <span>❄️ AC: +{details.ac_temp}°C</span>
                      <span>🧺 Cold Wash: {details.laundry_cold}x</span>
                      <span>🔌 Idle: {details.unplug_phantom ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850 pt-2.5 text-xs">
                    <span className="text-emerald-400 font-bold">-{sim.annual_carbon_savings} kg CO₂ / yr</span>
                    <span className="text-teal-400 font-bold">${sim.annual_cost_savings} saved</span>
                    <span className="text-yellow-400 font-bold">+{sim.score_improvement} Score</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
