/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingBag, Plus, Minus, Flame, Heart, Info, 
  ArrowRight, ShieldCheck, HelpCircle, Star, Sparkles, 
  Smile, Waves, HeartHandshake, Clock 
} from 'lucide-react';
import { MenuItem, CartItem, Language, Category } from '../types';
import { translations } from '../translations';

interface MenuScreenProps {
  language: Language;
  cart: CartItem[];
  onUpdateCart: (updatedCart: CartItem[]) => void;
  onContinue: () => void;
}

const DINING_MOODS = [
  { id: 'all', label: 'All Cravings', icon: Sparkles, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10 border-orange-500/25 text-orange-400' },
  { id: 'happy', label: 'Happy & Sweet', icon: Smile, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-400/10 border-yellow-400/25 text-yellow-400' },
  { id: 'spicy', label: 'Spicy & Fiery', icon: Flame, color: 'from-red-500 to-orange-500', bg: 'bg-red-500/10 border-red-500/25 text-red-400' },
  { id: 'peaceful', label: 'Cool & Placid', icon: Waves, color: 'from-teal-400 to-emerald-500', bg: 'bg-teal-400/10 border-teal-400/25 text-teal-400' },
  { id: 'comfort', label: 'Warm Comfort', icon: HeartHandshake, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10 border-pink-500/25 text-pink-400' }
] as const;

export default function MenuScreen({ language, cart, onUpdateCart, onContinue }: MenuScreenProps) {
  const t = translations[language];

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedMood, setSelectedMood] = useState<'all' | 'happy' | 'spicy' | 'peaceful' | 'comfort'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Fetch menu from live backend API
  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (e) {
      console.error("Failed to load backend menu", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter items matching query, category, and mood
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesMood = selectedMood === 'all' || item.moodTag === selectedMood;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesMood && matchesSearch;
  });

  // Calculate cart quantities and total price
  const totalQty = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const subTotal = cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);
  const tax = Math.round(subTotal * 0.05); // 5% CGST+SGST
  const grandTotal = subTotal + tax;

  const handleUpdateQuantity = (item: MenuItem, change: number) => {
    const existingIndex = cart.findIndex(c => c.menuItem.id === item.id);
    let newCart = [...cart];

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const targetQty = currentQty + change;
      if (targetQty <= 0) {
        newCart.splice(existingIndex, 1);
      } else {
        newCart[existingIndex] = {
          ...cart[existingIndex],
          quantity: targetQty
        };
      }
    } else if (change > 0) {
      newCart.push({
        menuItem: item,
        quantity: 1
      });
    }

    onUpdateCart(newCart);
  };

  const getQuantityInCart = (itemId: string): number => {
    const found = cart.find(c => c.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div id="menu_screen_container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-32">
      {/* Search and Title Block */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-sans font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 font-black">Foody</span> 
            <span className="text-slate-400 text-sm font-medium">Deluxe</span>
          </h2>
          <span className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-[10px] font-mono text-amber-500 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> High Attraction Kitchen
          </span>
        </div>

        {/* Dynamic Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="menu_search_box"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-orange-500 transition-all rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Dynamic Food Mood Recommendation Bar */}
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">
            <Sparkles className="w-3 h-3 text-orange-400" /> Dining Mood recommendation:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {DINING_MOODS.map(mood => {
              const MoodIcon = mood.icon;
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  id={`mood_${mood.id}`}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${
                    isSelected
                      ? `bg-gradient-to-r ${mood.color} text-slate-950 border-transparent shadow-md shadow-orange-500/10`
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <MoodIcon className="w-3.5 h-3.5 shrink-0" />
                  {mood.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Carousel Filters */}
        <div className="flex gap-2.5 overflow-x-auto pt-3 pb-1 no-scrollbar scroll-smooth border-t border-slate-850">
          {(['all', 'starters', 'main', 'drinks', 'desserts'] as const).map(cat => {
            const label = cat === 'all' ? t.all : t[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat_${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-orange-600/15'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dishes Grid */}
      <div className="p-4 md:p-6 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-3"></div>
            Syncing catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center justify-center">
            <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
            No matching items found for category or search text.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map(item => {
              const qty = getQuantityInCart(item.id);
              const available = item.isAvailable;

              return (
                <div
                  key={item.id}
                  id={`item_card_${item.id}`}
                  className={`bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden p-3 transition-all duration-300 flex flex-col justify-between relative shadow-md hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-500/25 hover:-translate-y-0.5 group ${
                    qty > 0 ? 'ring-2 ring-orange-500/40 bg-slate-900/90' : ''
                  } ${!available ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Dish Image */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800/60 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Floating Veg Status Badge */}
                      <span className={`absolute top-1.5 left-1.5 w-4.5 h-4.5 bg-slate-950 rounded border flex items-center justify-center p-0.5 ${
                        item.isVeg ? 'border-emerald-600' : 'border-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                      </span>

                      {/* Display Chef Special Accent overlay */}
                      {item.chefSpecial && (
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {/* Meta info info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Upper row: Chef special tag + Star Feedback */}
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          {item.chefSpecial ? (
                            <span className="text-[8px] font-bold text-amber-400 font-mono tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-400 text-amber-400" /> Signature
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                              {item.category}
                            </span>
                          )}

                          {/* Star aggregate rating */}
                          <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-semibold font-mono bg-amber-500/5 px-1 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            {item.rating || "4.8"}
                          </div>
                        </div>

                        {/* Title & Price */}
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-extrabold text-white leading-snug truncate group-hover:text-orange-400 transition-colors">{item.name}</h4>
                          <span className="text-[10px] text-orange-400 font-bold font-mono bg-orange-500/10 border border-orange-500/15 py-0.5 px-1.5 rounded-full shrink-0">
                            ₹{item.price}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal font-sans">
                          {item.description}
                        </p>
                      </div>

                      {/* Item Bottom Controls */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/50">
                        {/* Prep time sticker */}
                        <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 bg-slate-950 py-0.5 px-1.5 rounded border border-slate-850">
                          <Clock className="w-2.5 h-2.5 text-slate-500" /> {item.prepTime || "12 mins"}
                        </span>

                        {qty === 0 ? (
                          <button
                            id={`add_btn_${item.id}`}
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {t.addToCart}
                          </button>
                        ) : (
                          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg py-1 px-1.5">
                            <button
                              id={`minus_qty_${item.id}`}
                              onClick={() => handleUpdateQuantity(item, -1)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span id={`qty_count_${item.id}`} className="text-[11px] font-bold text-orange-450 px-2.5 font-mono">
                              {qty}
                            </span>
                            <button
                              id={`plus_qty_${item.id}`}
                              onClick={() => handleUpdateQuantity(item, 1)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Summary Overlay */}
      {totalQty > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl z-40 p-4">
          <div className="max-w-md mx-auto">
            {/* Split Header showing summary triggers */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <button
                id="toggle_cart_drawer"
                onClick={() => setShowCartDrawer(!showCartDrawer)}
                className="text-slate-400 hover:text-orange-500 font-semibold flex items-center gap-1 bg-slate-950/80 border border-slate-800 py-1.5 px-3 rounded-full"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {totalQty} {totalQty === 1 ? 'Dish' : 'Dishes'}
                <span className="text-[10px] text-slate-500">({showCartDrawer ? "Hide Plate" : "Show Plate"})</span>
              </button>
              <div className="text-right font-mono text-slate-300">
                Total: <span className="text-sm font-extrabold text-orange-500">₹{subTotal}</span>
              </div>
            </div>

            {/* Expandable Plate Drawer Details */}
            <AnimatePresence>
              {showCartDrawer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4 border-t border-slate-800/85 pt-3 max-h-48 overflow-y-auto space-y-2.5"
                >
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t.cartTitle}</p>
                  {cart.map(cartItem => (
                    <div key={cartItem.menuItem.id} className="flex justify-between items-center text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cartItem.menuItem.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="font-semibold">{cartItem.menuItem.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">x{cartItem.quantity}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">₹{cartItem.menuItem.price * cartItem.quantity}</span>
                    </div>
                  ))}
                  
                  {/* Bill Split Details */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 text-[10px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>{t.subTotal}:</span>
                      <span className="font-mono">₹{subTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.taxAmt}:</span>
                      <span className="font-mono">₹{tax}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-semibold">
                      <span>{t.totalBill}:</span>
                      <span className="font-mono text-orange-400">₹{grandTotal}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Large Next Progress Button */}
            <button
              id="menu_next_step_btn"
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-95 text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/25"
            >
              <span>{t.next} ({t.totalBill}: ₹{grandTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
