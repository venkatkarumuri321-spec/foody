/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Star, CheckSquare, Sparkles, MessageSquare, VolumeX, Volume2, ShieldCheck, RefreshCcw, Home, Smile, ArrowRight } from 'lucide-react';
import { Order, Language, OrderStatus, RatingRecord } from '../types';
import { translations } from '../translations';

interface LiveTrackingScreenProps {
  language: Language;
  order: Order;
  onReturnHome: () => void;
}

export default function LiveTrackingScreen({ language, order, onReturnHome }: LiveTrackingScreenProps) {
  const t = translations[language];

  const [activeOrder, setActiveOrder] = useState<Order>(order);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(20);
  
  // Audio state
  const [playAudio, setPlayAudio] = useState<boolean>(true);
  const [notifiedReady, setNotifiedReady] = useState<boolean>(false);

  // Poll the database server to get live order status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check order status from server
      try {
        const response = await fetch(`/api/menu`); // simple test to check connectivity
        if (response.ok) {
          const checkRes = await fetch(`/api/orders`);
          if (checkRes.ok) {
            const allOrders: Order[] = await checkRes.json();
            const currentObj = allOrders.find(o => o.id === activeOrder.id);
            if (currentObj) {
              setActiveOrder(currentObj);
            }
          }
        }
      } catch (err) {
        console.warn("Express polling failed, relying on client simulation", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeOrder.id]);

  // Handle countdown simulation
  useEffect(() => {
    // Basic countdown
    const timer = setInterval(() => {
      setRemainingMinutes(prev => {
        if (prev <= 1) return 1;
        // Fast counter simulation for review ease: reduce every 30 seconds
        return prev - 1;
      });
    }, 45000);

    return () => clearInterval(timer);
  }, []);

  // Set the countdown according to order status
  useEffect(() => {
    if (activeOrder.status === 'ready' || activeOrder.status === 'delivered') {
      setRemainingMinutes(0);
    } else if (activeOrder.status === 'cooking') {
      setRemainingMinutes(10);
    } else if (activeOrder.status === 'preparing') {
      setRemainingMinutes(18);
    }
  }, [activeOrder.status]);

  // Handle notification sound when status upgrades to 'ready'
  useEffect(() => {
    if (activeOrder.status === 'ready' && !notifiedReady) {
      setNotifiedReady(true);
      triggerAudioChime();
    }
  }, [activeOrder.status, notifiedReady]);

  const triggerAudioChime = () => {
    if (!playAudio) return;
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime note 1
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.frequency.setValueAtTime(523.25, context.currentTime); // C5
      gain1.gain.setValueAtTime(0.1, context.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(context.destination);
      osc1.start();
      osc1.stop(context.currentTime + 0.3);

      // Chime note 2 (harmonized third after 150ms)
      setTimeout(() => {
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.frequency.setValueAtTime(659.25, context.currentTime); // E5
        gain2.gain.setValueAtTime(0.1, context.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(context.destination);
        osc2.start();
        osc2.stop(context.currentTime + 0.4);
      }, 150);

    } catch (e) {
      console.warn("Sound play restricted by user interaction guidelines", e);
    }
  };

  const handleSimulateStatusOverride = async (newStatus: OrderStatus) => {
    try {
      // Update local and server order status for easy previewing
      const response = await fetch(`/api/orders/${activeOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updatedObj = await response.json();
        setActiveOrder(updatedObj);
        if (newStatus === 'ready') {
          setNotifiedReady(false); // allow re-trigger
        }
      }
    } catch (e) {
      // Fallback
      setActiveOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars: rating,
          feedback: feedback,
          tableNumber: activeOrder.tableNumber
        })
      });
      if (response.ok) {
        setFeedbackSuccess(true);
      }
    } catch (err) {
      setFeedbackSuccess(true);
    }
  };

  // Helper arrays for status mapping
  const statuses: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'pending', label: "Order Confirmed", icon: "🧾" },
    { key: 'preparing', label: t.statusPreparing, icon: "🔪" },
    { key: 'cooking', label: t.statusCooking, icon: "🔥" },
    { key: 'ready', label: t.statusReady, icon: "🍽️" },
    { key: 'delivered', label: t.statusDelivered, icon: "🎉" },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.key === activeOrder.status);

  return (
    <div id="live_tracking_screen_root" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col items-center relative overflow-hidden">
      
      {/* Floating Animated Confetti elements on final delivered status */}
      {activeOrder.status === 'delivered' && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(22)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: window.innerHeight + 10,
                scale: Math.random() * 0.4 + 0.6,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: -50,
                rotate: 360,
                opacity: [1, 1, 0.8, 0]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2.5,
                ease: "easeOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-3.5 h-3.5 rounded"
              style={{
                backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'][i % 6]
              }}
            />
          ))}
        </div>
      )}

      {/* Main Track Grid container */}
      <div className="w-full max-w-lg z-10">
        
        {/* Top Header Controls with Audio togglers */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl py-2 px-4 mb-6">
          <span className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            LIVE LINK: TABLE-{activeOrder.tableNumber}
          </span>
          <button
            id="toggle_tracking_audio"
            onClick={() => setPlayAudio(!playAudio)}
            className="text-slate-500 hover:text-white transition-all p-1"
            title="Toggle Notification Sounds"
          >
            {playAudio ? (
              <span className="text-xs flex items-center gap-1.5 text-orange-500 font-semibold font-sans">
                <Volume2 className="w-4 h-4" /> Sound ON
              </span>
            ) : (
              <span className="text-xs flex items-center gap-1.5 text-slate-600 font-sans">
                <VolumeX className="w-4 h-4" /> Sound Mute
              </span>
            )}
          </button>
        </div>

        {/* Big Blinking Timer section */}
        <div 
          id="tracking_countdown_container"
          className={`bg-slate-900 border border-slate-800/80 rounded-3xl p-6 text-center transform transition-all duration-300 relative shadow-xl mb-6 ${
            activeOrder.status === 'ready' ? 'ring-2 ring-orange-500/80 animate-pulse outline outline-orange-500/20 shadow-orange-600/10' : ''
          }`}
        >
          {activeOrder.status === 'ready' && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-slate-950 font-black text-[10px] uppercase font-sans tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-orange-400">
              ⚡ Action: Food Served ⚡
            </div>
          )}

          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-widest block mb-2">{t.remainingTime}</span>
          
          <div className="flex items-center justify-center gap-3">
            <Timer className={`w-8 h-8 ${activeOrder.status === 'ready' ? 'text-orange-500 animate-spin' : 'text-slate-400'}`} />
            <h3 id="tracking_countdown_val" className="text-5xl font-extrabold font-mono text-white tracking-tighter">
              {remainingMinutes} <span className="text-xl font-medium text-slate-500">Mins</span>
            </h3>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-950 flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Status:</span>
            <span className="bg-slate-950 border border-slate-800 text-orange-400 font-mono font-bold px-3 py-1 rounded-xl">
              {activeOrder.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Staged Progress Timeline */}
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-6 mb-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6 font-mono">Kitchen Milestone Pipeline</h4>
          
          <div className="relative pl-7 space-y-6">
            {/* Absolute line */}
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-850"></div>

            {statuses.map((item, idx) => {
              const isPast = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              
              return (
                <div key={item.key} className="relative flex items-center justify-between">
                  {/* Styled indicator dot */}
                  <span className={`absolute -left-[27px] w-5 h-5 rounded-full flex items-center justify-center border-2 text-[10px] font-sans ${
                    isPast 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                      : isCurrent 
                        ? 'bg-orange-500 border-orange-500 text-slate-950 ring-4 ring-orange-500/20' 
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {isPast ? "✓" : idx + 1}
                  </span>

                  <div className="flex-1 pl-1 text-left">
                    <p className={`text-xs font-bold leading-normal ${
                      isCurrent ? 'text-white font-black text-sm' : isPast ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {item.icon} {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Ready Highlight Banner */}
        <AnimatePresence>
          {activeOrder.status === 'ready' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-amber-500/20 border border-orange-500/35 rounded-3xl p-5 text-center shadow-lg mb-6"
            >
              <h3 className="text-md font-extrabold text-orange-400 flex items-center justify-center gap-1.5 font-sans leading-relaxed">
                <Sparkles className="w-5 h-5 text-orange-500 animate-bounce" />
                {t.foodReadyPopup}
              </h3>
              <p className="text-[11px] text-slate-300 mt-2">
                Our kitchen assistant has marked your order as dressed and prepared. Enjoy your meal!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Client Rating & Feedback form - unlocked upon Delivered status */}
        {activeOrder.status === 'delivered' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl mb-6"
          >
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              <Smile className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-md font-bold text-white mb-2">{t.howWasFood}</h3>
            <p className="text-xs text-slate-400 mb-5">{t.rateUs}</p>

            <AnimatePresence mode="wait">
              {feedbackSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-950 p-4 border border-emerald-500/15 text-emerald-400 rounded-2xl text-xs font-semibold"
                >
                  {t.ratingsSuccess}
                </motion.div>
              ) : (
                <motion.div key="rating_inputs">
                  {/* Star Rating Selection Bar */}
                  <div className="flex gap-2 justify-center mb-5">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        id={`star_feedback_${starNum}`}
                        onClick={() => setRating(starNum)}
                        className={`text-2xl transition-all duration-300 hover:scale-125 ${
                          rating >= starNum ? 'text-amber-400 drop-shadow-md' : 'text-slate-700'
                        }`}
                      >
                        <Star className="w-7 h-7 fill-current" />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      {/* Optional text area */}
                      <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-2xl">
                        <textarea
                          id="feedback_textarea"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Your optional comment (help us improve!)..."
                          className="w-full bg-transparent border-none text-slate-200 outline-none text-xs placeholder:text-slate-600 min-h-16 resize-none no-scrollbar"
                        />
                      </div>

                      <button
                        id="submit_feedback_btn"
                        onClick={handleSubmitFeedback}
                        className="py-3 px-6 bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-600 text-white font-bold text-xs rounded-xl transition-all w-full flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t.submitFeedback}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Demo overrides control for developers checking the flow */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 mb-4 text-center">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-3">
            Admin Simulation overrides (Quick Testing)
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {(['pending', 'preparing', 'cooking', 'ready', 'delivered'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                id={`override_to_${status}`}
                onClick={() => handleSimulateStatusOverride(status)}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-mono tracking-tighter capitalize border transition-all ${
                  activeOrder.status === status
                    ? 'bg-amber-500 border-amber-600 text-slate-950 font-extrabold'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Return trigger */}
        <div className="text-center mt-6">
          <button
            id="start_new_order_btn"
            onClick={onReturnHome}
            className="px-6 py-3.5 bg-slate-900 border border-slate-800 text-slate-250 hover:text-white rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-1.5 hover:bg-slate-800"
          >
            <Home className="w-4 h-4" />
            {t.returnHome}
          </button>
        </div>

      </div>
    </div>
  );
}
