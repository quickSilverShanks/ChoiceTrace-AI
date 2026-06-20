"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, 
  MessageSquare, 
  Award, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Leaf, 
  Zap, 
  Flame, 
  Sparkles,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import './globals.css';

// Context for global state sharing (Token, User Profile, Fetch trigger)
interface UserProfile {
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

interface AppContextType {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  apiBase: string;
  refreshStats: () => void;
  setPersona: (persona: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [switchingPersona, setSwitchingPersona] = useState<boolean>(false);

  const apiBase = "/api";

  const refreshStats = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 1. Auto-login on mount (using seeded demo_user)
  useEffect(() => {
    async function loginAndFetch() {
      try {
        let activeToken = localStorage.getItem('carbonnudge_token');
        
        if (!activeToken) {
          // Log in with seeded user credentials
          const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "demo_user", password: "password123" })
          });
          
          if (res.ok) {
            const data = await res.json();
            activeToken = data.access_token;
            localStorage.setItem('carbonnudge_token', activeToken || '');
          }
        }
        
        if (activeToken) {
          setToken(activeToken);
          // Fetch user details
          const meRes = await fetch(`${apiBase}/auth/me`, {
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(meData);
          }
        }
      } catch (err) {
        console.error("Auto login error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loginAndFetch();
  }, [refreshTrigger]);

  // 2. Change user profile/persona
  const setPersona = async (newPersona: string) => {
    if (!token) return;
    setSwitchingPersona(true);
    try {
      const res = await fetch(`${apiBase}/auth/persona`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ persona: newPersona })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        // Dispatch custom event to let pages know they should reload their dashboard/data
        window.dispatchEvent(new Event('personaChanged'));
      }
    } catch (err) {
      console.error("Failed to update persona:", err);
    } finally {
      setSwitchingPersona(false);
    }
  };

  const navItems = [
    { name: 'Decision Feed', icon: Home, path: '/' },
    { name: 'AI Coach', icon: MessageSquare, path: '/coach' },
    { name: 'Dashboard', icon: Award, path: '/dashboard' },
    { name: 'What-If Simulator', icon: TrendingUp, path: '/simulator' },
    { name: '30-Day Roadmap', icon: Calendar, path: '/roadmap' },
    { name: 'Community Achievements', icon: MapPin, path: '/map' }
  ];

  const personas = [
    { id: 'professional', label: '👔 Professional', color: 'border-blue-500 text-blue-400' },
    { id: 'student', label: '🎓 Student', color: 'border-yellow-500 text-yellow-400' },
    { id: 'commuter', label: '🚇 Commuter', color: 'border-purple-500 text-purple-400' },
    { id: 'family', label: '🏡 Family', color: 'border-orange-500 text-orange-400' },
    { id: 'enthusiast', label: '🌿 Enthusiast', color: 'border-emerald-500 text-emerald-400' },
  ];

  // Calculate XP Percentage for next level
  const xpNeeded = user ? user.level * 100 : 100;
  const xpProgressPercent = user ? Math.min((user.xp / xpNeeded) * 100, 100) : 0;

  return (
    <html lang="en">
      <body className="font-sans antialiased text-white bg-darkbg-200">
        <AppContext.Provider value={{ token, user, loading, apiBase, refreshStats, setPersona }}>
          <div className="flex min-h-screen">
            
            {/* Sidebar Navigation - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-slate-800 p-5 shrink-0 select-none">
              {/* Logo / Header */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Leaf className="h-6 w-6 text-darkbg-200" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                    CarbonNudge
                  </h1>
                  <span className="text-xs font-semibold text-emerald-500 tracking-widest uppercase">AI Coach</span>
                </div>
              </div>

              {/* Persona Switcher Section */}
              <div className="mb-6 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" /> Profile Simulator
                  </span>
                  {switchingPersona && <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />}
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      disabled={switchingPersona || user?.persona === p.id}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        user?.persona === p.id 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold' 
                        : 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                  const isActive = typeof window !== 'undefined' && window.location.pathname === item.path;
                  return (
                    <a
                      key={item.name}
                      href={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-4 border-emerald-500 pl-3 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                    </a>
                  );
                })}
              </nav>

              {/* App Meta Version */}
              <div className="pt-4 border-t border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">v1.0.0 • Cloud Ready</span>
              </div>
            </aside>

            {/* Mobile Navigation Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-darkbg-100 border-b border-slate-800 px-4 py-3">
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-lg">CarbonNudge AI</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-darkbg-200/95 backdrop-blur-md pt-16 flex flex-col p-5">
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-2">
                    <Users className="h-3.5 w-3.5 mr-1" /> Active Persona
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {personas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersona(p.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`text-sm px-3 py-2 rounded-xl border text-center transition-all ${
                          user?.persona === p.id 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold' 
                          : 'bg-slate-800/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        {p.label.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-slate-800/50"
                    >
                      <item.icon className="h-6 w-6 text-emerald-400" />
                      <span className="text-base font-semibold">{item.name}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Main Application Area */}
            <main className="flex-1 flex flex-col pt-14 lg:pt-0 overflow-y-auto">
              
              {/* Top Stats Dashboard Bar */}
              {user && (
                <header className="glass-panel border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                  {/* Left: User Welcome & Level Badge */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-darkbg-200 text-lg shadow-md shadow-emerald-500/15">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 bg-emerald-500 text-darkbg-200 text-[10px] font-black rounded-full border border-darkbg-100 shadow-md">
                        Lvl {user.level}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{user.username}</span>
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-wider">
                          {user.persona}
                        </span>
                      </div>
                      {/* XP Progress Bar */}
                      <div className="mt-1.5 w-44">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>XP Progress</span>
                          <span>{user.xp} / {xpNeeded}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${xpProgressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Gamified Mini-Stats */}
                  <div className="flex items-center flex-wrap gap-4 md:gap-6">
                    {/* Streak */}
                    <div className="flex items-center space-x-2.5 p-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <Flame className="h-5 w-5 text-orange-500 animate-bounce" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Streak</div>
                        <div className="text-sm font-extrabold text-orange-400">{user.streak} Days</div>
                      </div>
                    </div>

                    {/* Carbon Saved */}
                    <div className="flex items-center space-x-2.5 p-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <Leaf className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Carbon Saved</div>
                        <div className="text-sm font-extrabold text-emerald-400">{user.total_carbon_saved.toFixed(1)} kg</div>
                      </div>
                    </div>

                    {/* Trees Equivalent */}
                    <div className="flex items-center space-x-2.5 p-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <Sparkles className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Trees Absorbing</div>
                        <div className="text-sm font-extrabold text-teal-400">{user.trees_saved.toFixed(2)} trees</div>
                      </div>
                    </div>

                    {/* Carbon Score */}
                    <div className="flex items-center space-x-2.5 p-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Eco Score</div>
                        <div className="text-sm font-extrabold text-yellow-400">{user.carbon_score.toFixed(1)}/100</div>
                      </div>
                    </div>
                  </div>
                </header>
              )}

              {/* View Content */}
              <div className="flex-1 p-6 lg:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <RefreshCw className="h-10 w-10 text-emerald-400 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Initializing CarbonNudge sustainability engine...</p>
                  </div>
                ) : (
                  children
                )}
              </div>
            </main>

          </div>
        </AppContext.Provider>
      </body>
    </html>
  );
}
