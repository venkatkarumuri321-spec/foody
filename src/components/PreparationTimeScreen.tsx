/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, ShoppingCart, Timer, ShieldQuestion, CheckCircle2, ChevronRight, MessageSquareCode } from 'lucide-react';
import { CartItem, Language, Order, TableInfo } from '../types';
import { translations } from '../translations';

interface PreparationTimeScreenProps {
  language: Language;
  tableInfo: TableInfo;
  cart: CartItem[];
  onOrderPlaced: (placedOrder: Order) => void;
}

export default function PreparationTimeScreen({ language, tableInfo, cart, onOrderPlaced }: PreparationTimeScreenProps) {
  const t = translations[language];

  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(20);

  // Dynamically calculate estimated preparation time based on categories present
  useEffect(() => {
    let maxTime = 10; // baseline minutes
    cart.forEach(item => {
      const cat = item.menuItem.category;
      if (cat === 'main' && maxTime < 22) {
        maxTime = 22;
      } else if (cat === 'starters' && maxTime < 15) {
        maxTime = 15;
      } else if (cat === 'desserts' && maxTime < 12) {
        maxTime = 12;
      } else if (cat === 'drinks' && maxTime < 8) {
        maxTime = 8;
      }
    });
    setPrepTimeMinutes(maxTime);
  }, [cart]);

  const subTotal = cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);
  const tax = Math.round(subTotal * 0.05);
  const grandTotal = subTotal + tax;

  const handlePlaceOrder = async () => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: tableInfo.tableNumber,
          items: cart,
          totalAmount: grandTotal,
          notes: notes,
          paymentStatus: 'pending',
        })
      });

      if (res.ok) {
        const orderData: Order = await res.json();
        onOrderPlaced(orderData);
      }
    } catch (e) {
      console.error("Failed to post order to server", e);
      // Fallback fallback setting
      const fallbackOrder: Order = {
        id: "ord_" + Math.floor(1000 + Math.random() * 9000),
        tableNumber: tableInfo.tableNumber,
        items: cart,
        status: 'pending',
        totalAmount: grandTotal,
        createdAt: new Date().toISOString(),
        paymentStatus: 'pending',
        notes: notes
      };
      onOrderPlaced(fallbackOrder);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="prep_time_screen_root" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col justify-between">
      {/* Dynamic Header */}
      <div className="text-center pt-2">
        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
          Step 5 of 7 • Kitchen Wait Estimate
        </span>
        <h2 className="text-xl font-sans font-bold text-white mt-1">{t.prepHeader}</h2>
      </div>

      {/* Preparation Countdown Badge */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-6">
        <div id="countdown_visual_gauge" className="relative w-44 h-44 flex items-center justify-center bg-slate-900 border border-slate-800/80 rounded-full mb-6">
          {/* Pulsing clock border */}
          <div className="absolute inset-2 border border-orange-500 rounded-full animate-pulse opacity-20"></div>
          
          <div className="text-center z-10">
            <Timer className="w-8 h-8 text-orange-500 mx-auto mb-1 animate-bounce" />
            <motion.span 
              id="prep_time_display_val"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl font-extrabold font-mono text-white block"
            >
              ~{prepTimeMinutes}
            </motion.span>
            <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.minutes}</span>
          </div>
        </div>

        {/* Dynamic Status bar */}
        <div className="bg-slate-900/40 border border-slate-900 px-4 py-2.5 rounded-2xl mb-6 text-center w-full">
          <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1.5 justify-center">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {t.prepDesc} {prepTimeMinutes} {t.minutes}.
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">{t.estimatedStatus}</p>
        </div>

        {/* Order Bill Summary Panel Card */}
        <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
            <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
            {t.orderSummary}
          </h3>

          <div className="max-h-24 overflow-y-auto space-y-2 pr-1 select-none no-scrollbar">
            {cart.map(item => (
              <div key={item.menuItem.id} className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="truncate">{item.menuItem.name} <span className="text-slate-600 font-mono">x{item.quantity}</span></span>
                <span className="font-mono text-slate-300">₹{item.menuItem.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 mt-3 pt-2.5 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500 text-[10px]">Grand Estimated Total:</span>
            <span className="text-orange-500 font-extrabold text-sm">₹{grandTotal}</span>
          </div>
        </div>

        {/* Kitchen Notes/Preferences */}
        <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <MessageSquareCode className="w-3.5 h-3.5 text-amber-500" /> Special Cooking Instructions (Optional)
          </label>
          <input
            id="cooking_notes_input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Make it extra spicy / no onions..."
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Footy Actions Footer */}
      <div className="w-full max-w-md mx-auto">
        <button
          id="btn_confirm_place_order"
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-95 text-white py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-orange-600/30"
        >
          {submitting ? (
            <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-pulse" />
          )}
          {t.placeOrderBtn}
        </button>
      </div>
    </div>
  );
}
