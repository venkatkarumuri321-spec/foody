/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Globe, ChevronRight, Star, Heart, Clock } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface WelcomeScreenProps {
  onContinue: (lang: Language) => void;
  initialLanguage?: Language;
}

// Gorgeous rotating food highlights to trigger initial "food attraction" and appetite
const FOOD_ATTRACTIONS = [
  {
    name: "Classic Butter Chicken",
    sub: "Creamy tandoor chicken clay-roasted to absolute caramelization",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80",
    rating: "4.9 ★ Exceptional",
    tag: "Most Popular",
  },
  {
    name: "Spiced Tandoori Paneer",
    sub: "Smoked artisan cottage cheese with bell peppers and tandoor char",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
    rating: "4.8 ★ Chef Specialty",
    tag: "Clay Oven Gold",
  },
  {
    name: "Pistachio Mango Kulfi",
    sub: "Reduced cardamom milk pops filled with pure mango pulp and pistachios",
    image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=500&q=80",
    rating: "4.9 ★ Sweet Delight",
    tag: "Artisanal",
  }
];

export default function WelcomeScreen({ onContinue, initialLanguage = 'english' }: WelcomeScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(initialLanguage);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Rotate images every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % FOOD_ATTRACTIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = () => {
    onContinue(selectedLanguage);
  };

  const t = translations[selectedLanguage];
  const activeAttraction = FOOD_ATTRACTIONS[carouselIndex];

  return (
    <div id="welcome_screen_container" className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-6 relative overflow-hidden">
      {/* Dynamic Warm Ambient BG Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Top Header branding */}
      <div className="flex items-center justify-between z-10 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">FOODY DELUXE</span>
        </div>
        <span className="text-[10px] bg-slate-900/90 border border-slate-800/80 text-amber-500 font-mono px-3 py-1 rounded-full uppercase tracking-wider">
          ★ Touchless AI Dining
        </span>
      </div>

      {/* Main Container combining Logo / Rotating Gourmet Card */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 my-4 max-w-lg mx-auto w-full">
        {/* App Title */}
        <motion.h1 
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl xs:text-5xl font-sans tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-300 text-center"
        >
          {t.appName}
        </motion.h1>
        
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-slate-400 text-xs text-center mt-2 font-sans font-medium px-4 tracking-wide max-w-xs"
        >
          {t.welcomeSub}
        </motion.p>

        {/* Rotating Gourmet Showcase Card */}
        <div className="w-full mt-6 relative h-64 xs:h-72 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl flex flex-col justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Cover dish image */}
              <img
                src={activeAttraction.image}
                alt={activeAttraction.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-75 contrasts-105"
              />
              {/* Left/Right vignetting & Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              {/* Top info stickers */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-red-600/90 text-white py-1 px-2.5 rounded-full shadow-lg">
                  {activeAttraction.tag}
                </span>
                <span className="text-[9px] font-mono font-bold bg-slate-950/90 text-amber-400 border border-slate-800 py-1 px-2.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> {activeAttraction.rating}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dish Meta card footer content */}
          <div className="dark-overlay p-4 z-10 text-left bg-gradient-to-t from-slate-950 to-transparent">
            <div className="flex items-center gap-1.5 text-[9px] font-sans font-semibold text-orange-400 uppercase tracking-widest mb-1.5 animate-pulse">
              <Heart className="w-3.5 h-3.5 fill-orange-500/40" /> Recommended Food Attraction
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIndex}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {activeAttraction.name}
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  {activeAttraction.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Language Selector Form */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-full max-w-sm mx-auto bg-slate-900/90 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-xl z-10 shadow-2xl relative"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-4 py-1 rounded-full text-[9px] text-orange-400 tracking-widest uppercase font-mono scroll-smooth">
          Let's Begin
        </div>

        <span className="text-[10px] text-slate-500 flex items-center gap-2 font-mono uppercase tracking-wider mb-4 justify-center mt-2">
          <Globe className="w-3.5 h-3.5 text-orange-500" />
          {t.selectLanguage}
        </span>

        <div className="grid grid-cols-1 gap-2.5 mb-5">
          {/* Telugu option */}
          <button
            id="lang_btn_telugu"
            onClick={() => handleLanguageSelect('telugu')}
            className={`flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 font-sans text-xs ${
              selectedLanguage === 'telugu'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg shadow-orange-600/25 ring-2 ring-orange-500/50'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>తెలుగు (Telugu)</span>
            {selectedLanguage === 'telugu' && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
          </button>

          {/* Hindi option */}
          <button
            id="lang_btn_hindi"
            onClick={() => handleLanguageSelect('hindi')}
            className={`flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 font-sans text-xs ${
              selectedLanguage === 'hindi'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg shadow-orange-600/25 ring-2 ring-orange-500/50'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>हिन्दी (Hindi)</span>
            {selectedLanguage === 'hindi' && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
          </button>

          {/* English option */}
          <button
            id="lang_btn_english"
            onClick={() => handleLanguageSelect('english')}
            className={`flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 font-sans text-xs ${
              selectedLanguage === 'english'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg shadow-orange-600/25 ring-2 ring-orange-500/50'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>English</span>
            {selectedLanguage === 'english' && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
          </button>
        </div>

        {/* Continue button */}
        <button
          id="btn_continue_welcome"
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-95 text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-orange-600/40 text-xs"
        >
          {t.continue}
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Footer copyright */}
      <div className="text-center text-slate-600 text-[10px] mt-4 z-10 font-sans tracking-wide">
        Premium Dine-In Experience • Realtime Kitchen Automations • © 2026
      </div>
    </div>
  );
}
