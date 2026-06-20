"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../layout';
import { 
  Send, 
  Leaf, 
  User, 
  HelpCircle, 
  Sparkles, 
  TrendingDown, 
  Info, 
  CheckCircle,
  Clock,
  Compass
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  impact?: string;
  reasoning?: string;
  alternatives?: string[];
  savings?: string;
}

export default function AICoachPage() {
  const { token, user, apiBase } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your AI Sustainability Coach. Ask me anything about your daily actions, shopping items, or food decisions, and I will help you find the greenest alternatives!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const suggestionChips = [
    "Should I drive or take public transport?",
    "What is the greener lunch option today?",
    "Is buying a refurbished laptop environmentally responsible?",
    "What can I do today to reduce emissions?"
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!token || !text.trim() || loading) return;
    
    // Add user message
    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build request history
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${apiBase}/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, history })
      });

      if (res.ok) {
        const data = await res.json();
        const responseMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          impact: data.estimated_carbon_impact,
          reasoning: data.reasoning,
          alternatives: data.alternatives,
          savings: data.potential_savings
        };
        setMessages(prev => [...prev, responseMessage]);
      } else {
        throw new Error("Coach response error");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I ran into a connection glitch. Please check your credentials or try asking again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-4">
      {/* Header banner */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
            Conversational AI Coach
          </h2>
          <p className="text-xs text-slate-400">Ask the coach for instant, proactive advice on emissions and micro-actions.</p>
        </div>
        <div className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full font-semibold">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>Powered by Gemini</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[300px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`p-2 rounded-xl shrink-0 ${
                m.role === 'user' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {m.role === 'user' ? <User className="h-4.5 w-4.5" /> : <Leaf className="h-4.5 w-4.5" />}
              </div>

              {/* Message Content Bubble */}
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 rounded-tr-none' 
                    : 'glass-panel text-slate-200 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                </div>

                {/* Assistant Carbon Metric Widget */}
                {m.role === 'assistant' && (m.impact || m.alternatives) && (
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3.5 text-xs">
                    {m.impact && (
                      <div className="flex items-start space-x-2">
                        <TrendingDown className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300">Carbon Footprint:</span>
                          <p className="text-rose-400 font-semibold mt-0.5">{m.impact}</p>
                        </div>
                      </div>
                    )}

                    {m.reasoning && (
                      <div className="flex items-start space-x-2 border-t border-slate-800/80 pt-2.5">
                        <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300">Reasoning:</span>
                          <p className="text-slate-400 mt-0.5 leading-relaxed">{m.reasoning}</p>
                        </div>
                      </div>
                    )}

                    {m.alternatives && m.alternatives.length > 0 && (
                      <div className="flex items-start space-x-2 border-t border-slate-800/80 pt-2.5">
                        <Compass className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300">Better Alternatives:</span>
                          <ul className="list-disc list-inside text-emerald-400/90 font-medium space-y-1 mt-1">
                            {m.alternatives.map((alt, idx) => (
                              <li key={idx}>{alt}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {m.savings && (
                      <div className="flex items-start space-x-2 border-t border-slate-800/80 pt-2.5">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300">Potential Savings:</span>
                          <p className="text-emerald-400 font-bold mt-0.5">{m.savings}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Leaf className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div className="glass-panel p-4 rounded-2xl rounded-tl-none text-sm text-slate-400 flex items-center space-x-2">
                <span className="animate-pulse">Analyzing carbon pathways...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Section */}
      {messages.length === 1 && !loading && (
        <div className="shrink-0 space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center">
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> Suggestion topics to ask:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-left text-xs bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/20 transition-all font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-2.5 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask a sustainability coach..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage(inputMessage);
          }}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 px-3 py-2.5 focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage(inputMessage)}
          disabled={loading || !inputMessage.trim()}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-darkbg-200 rounded-xl transition-colors"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
}
