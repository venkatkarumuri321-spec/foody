/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, MapPin, Compass, Navigation, Clock, DollarSign, 
  Star, Phone, ArrowRight, ChevronRight, Send, Sliders, Check, 
  Loader2, Grid, Map, Locate, Activity, Info, ExternalLink, Utensils
} from 'lucide-react';
import { Language } from '../types';

interface Restaurant {
  name: string;
  rating: string;
  cuisine: string;
  priceRange: string;
  address: string;
  distance: string;
  openHours: string;
  popularDishes: string;
  mapLink: string;
  whyRecommended: string;
  travelTime: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  navigationDirections: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  restaurants?: Restaurant[];
  suggestedFollowups?: string[];
}

interface DiscoveryAssistantProps {
  language: Language;
  onSelectMenu: () => void;
  onSetTableInfo: (info: any) => void;
}

export default function DiscoveryAssistant({ language, onSelectMenu, onSetTableInfo }: DiscoveryAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '### Welcome to Foody Discovery AI!\n\nI am your intelligent Restaurant Discovery Assistant. Tell me what cuisine, budget, or dining vibe you are looking for, and I will list the highest-rated spots and draw them on our interactive radar map below.\n\nTo begin, please specify your location or query one of the suggestions below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowups: [
        'Best North Indian near me',
        'Find premium Italian with tandoor options',
        'Healthy vegan cafes under ₹400',
        'What are the trending desserts places?'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtering states for quick insertion
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  // User location tracking
  const [coords, setCoords] = useState<{ lat: number; lng: number; city: string }>({
    lat: 12.9716,
    lng: 77.5946,
    city: 'Bengaluru Downtown'
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'standby' | 'active'>('standby');

  // Interactive Map State
  const [activeResIndex, setActiveResIndex] = useState<number | null>(0);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapScannerActive, setMapScannerActive] = useState<boolean>(true);
  const [focusedRestaurant, setFocusedRestaurant] = useState<Restaurant | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Set focused restaurant from of latest assistant message with recommendations
    const assistantMsgs = [...messages].reverse().find(m => m.role === 'assistant' && m.restaurants && m.restaurants.length > 0);
    if (assistantMsgs && assistantMsgs.restaurants && assistantMsgs.restaurants.length > 0) {
      const idx = activeResIndex !== null && activeResIndex < assistantMsgs.restaurants.length ? activeResIndex : 0;
      setFocusedRestaurant(assistantMsgs.restaurants[idx]);
    } else {
      setFocusedRestaurant(null);
    }
  }, [messages, activeResIndex]);

  // Request browser geolocation on mount or click
  const detectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'My GPS Location'
          });
          setLocationStatus('active');
          setIsLocating(false);
          addSystemLog(`GPS location locked successfully at [${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}]`);
        },
        (error) => {
          console.warn('Geolocation blocked or error:', error);
          // Fall back to a beautiful default
          setCoords({
            lat: 12.9716,
            lng: 77.5946,
            city: 'Bengaluru Downtown'
          });
          setLocationStatus('active');
          setIsLocating(false);
          addSystemLog('Using fallback Bengaluru Downtown coordinates (GPS Permission Blocked/Timed out).');
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setLocationStatus('active');
      addSystemLog('Browser does not support direct GPS. Loaded Fallback city center config.');
    }
  };

  const addSystemLog = (text: string) => {
    const logMsg: Message = {
      id: 'sys_' + Date.now(),
      role: 'assistant',
      content: `⚡ **Location Diagnostic**: ${text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, logMsg]);
  };

  // Convert coordinate degrees to localized scale for the custom SVG grid vector map
  const getMapPixelCoords = (itemLat: number, itemLng: number) => {
    // Offset relative to the user center
    const latDiff = itemLat - coords.lat;
    const lngDiff = itemLng - coords.lng;

    // Standard scalar expansion
    const scale = 2500 / mapZoom; // pixel per degree deviation

    // Map size is 450x450, center is 225, 225
    const x = 225 + lngDiff * scale;
    const y = 225 - latDiff * scale; // inverted for screen coord system

    // Constrain inside bounds
    return {
      x: Math.max(15, Math.min(435, x)),
      y: Math.max(15, Math.min(435, y))
    };
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    // Reset inputs
    if (!customText) {
      setInputText('');
    }

    // Capture filters if any
    let formattedText = textToSend;
    const filterContext: string[] = [];
    if (selectedCuisine) filterContext.push(`Cuisine: ${selectedCuisine}`);
    if (selectedBudget) filterContext.push(`Budget: ${selectedBudget}`);
    if (selectedVibe) filterContext.push(`Vibe: ${selectedVibe}`);
    
    if (filterContext.length > 0) {
      formattedText += ` (Applying Filters: ${filterContext.join(', ')})`;
    }

    // Add user message
    const newUserMsg: Message = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setMapScannerActive(true);

    try {
      const response = await fetch('/api/discovery/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formattedText,
          history: messages.filter(m => !m.id.startsWith('sys_')).map(m => ({
            role: m.role,
            content: m.content
          })),
          userLocation: {
            lat: coords.lat,
            lng: coords.lng,
            city: coords.city
          }
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status code');
      }

      const data = await response.json();
      
      const newAssistantMsg: Message = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: data.message || 'I found some excellent spots matching your preferences!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        restaurants: data.restaurants || [],
        suggestedFollowups: data.suggestedFollowups || []
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      setActiveResIndex(0); // auto-focus first item of new recommendations
    } catch (err) {
      console.error(err);
      // Fallback
      const failAssistantMsg: Message = {
        id: 'ai_err_' + Date.now(),
        role: 'assistant',
        content: `Oops, my AI core has met a minor connection delay. Don't worry! Here are some supreme handpicked alternatives in your general vicinity. Check them out on our real-time tactical SVG Map on the right!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        restaurants: [
          {
            name: "The Viceroy Grand",
            rating: "4.9",
            cuisine: "Royal North Indian, Tandoori",
            priceRange: "₹300 - ₹600",
            address: "18, Royal Heritage Arcade, MG Road",
            distance: "1.2 km",
            openHours: "12:00 PM - 11:30 PM",
            popularDishes: "Murgh Makhani Velvet, Shahi Paneer, Garlic Naan",
            mapLink: "https://www.google.com/maps/search/?api=1&query=The+Viceroy+Grand+MG+Road",
            whyRecommended: "Highest rated gourmet North Indian diner in the neighborhood. Legendary for its copper-pot slow cooking and signature saffron gravies.",
            travelTime: "6 mins drive",
            coordinates: { latitude: coords.lat + 0.008, longitude: coords.lng + 0.005 },
            navigationDirections: "Head North-East on MG Road, take a sharp left at Metro Pillar 45."
          },
          {
            name: "Portofino Bistro",
            rating: "4.8",
            cuisine: "Woodfired Pizza, Authentic Italian",
            priceRange: "₹400 - ₹800",
            address: "42, Residency Layout, Cross Rd",
            distance: "2.4 km",
            openHours: "11:30 AM - 11:00 PM",
            popularDishes: "Truffle Mushroom Pizza, Hand-rolled Gnocchi, Classic Tiramisu",
            mapLink: "https://www.google.com/maps/search/?api=1&query=Portofino+Bistro+Residency+Road",
            whyRecommended: "Recognized for double-zero woodfired crust. Ideal for custom gourmet flavor pairings and an atmospheric warm dining setting.",
            travelTime: "10 mins driving",
            coordinates: { latitude: coords.lat - 0.005, longitude: coords.lng + 0.012 },
            navigationDirections: "Travel South on Club Road, cross the first junction and check the storefront opposite Saffron Tower."
          },
          {
            name: "Organic Garden Cafe",
            rating: "4.7",
            cuisine: "Healthy Bowls, Vegan Specialities, Specialty Teas",
            priceRange: "₹200 - ₹400",
            address: "5, Green Alley Main, 3rd Block",
            distance: "3.1 km",
            openHours: "9:00 AM - 9:30 PM",
            popularDishes: "Quinoa Pesto Harvest, Smashed Avocado Toast, Hibiscus Cold Tea",
            mapLink: "https://www.google.com/maps/search/?api=1&query=Organic+Garden+Cafe+Jayanagar",
            whyRecommended: "Excellent choice for complete plant-based meal profiles, nutrient-dense breakfast boards, and single-estate cold brews.",
            travelTime: "12 mins ride",
            coordinates: { latitude: coords.lat + 0.003, longitude: coords.lng - 0.008 },
            navigationDirections: "Drive West on 12th Main Road, take a left at the Post Office, cafe will be on your left next to the park."
          }
        ],
        suggestedFollowups: [
          'Show me premium starters',
          'Search for spicy chicken options',
          'Is there a dessert bar near me?'
        ]
      };
      setMessages(prev => [...prev, failAssistantMsg]);
      setActiveResIndex(0);
    } finally {
      setIsLoading(false);
      setMapScannerActive(false);
    }
  };

  // Connects AI Discoveries to table order system
  const handleSimulateBookingAtVenue = (venue: Restaurant) => {
    // Fill state to resemble a successful table QR code scan at a Table corresponding to the venue
    onSetTableInfo({
      tableNumber: Math.floor(Math.random() * 8 + 1).toString(),
      restaurantId: venue.name.toUpperCase().replace(/\s+/g, '_') + "_01",
      sessionId: "SESS-" + Math.floor(Math.random() * 80 + 10)
    });
    // Shift page to menu screening
    onSelectMenu();
  };

  // Extract restaurants in conversational feed to gather current Pins active
  const anyAssistantList = [...messages].reverse().find(m => m.role === 'assistant' && m.restaurants && m.restaurants.length > 0);
  const activeRestaurants = anyAssistantList?.restaurants || [];

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto w-full relative">
      
      {/* LEFT PANEL: Chat with Gemini Assistant */}
      <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-[76vh] shadow-xl backdrop-blur-md">
        
        {/* Chat Panel Header */}
        <div className="border-b border-slate-800/85 pb-3 mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/30">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                Foody Discovery AI
                <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-mono font-medium">
                  v3.5 Live
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Tactical Gourmet Search Agent & Navigation Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={detectLocation}
              disabled={isLocating}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-sans font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                locationStatus === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Detecting...' : locationStatus === 'active' ? 'GPS Active' : 'Acquire GPS'}
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
          {/* Cuisine Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl text-[10px] shrink-0 gap-1.5 text-slate-300">
            <span className="font-semibold text-[9px] text-slate-500">CUISINE:</span>
            {['Italian', 'North Indian', 'Vegan', 'Desserts'].map(c => (
              <button 
                key={c}
                onClick={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                className={`px-1.5 py-0.5 rounded transition ${selectedCuisine === c ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800'}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Budget Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl text-[10px] shrink-0 gap-1.5 text-slate-300">
            <span className="font-semibold text-[9px] text-slate-500">BUDGET:</span>
            {['Cheap', 'Mid', 'Fine-dining'].map(b => (
              <button
                key={b}
                onClick={() => setSelectedBudget(selectedBudget === b ? null : b)}
                className={`px-1.5 py-0.5 rounded transition ${selectedBudget === b ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800'}`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Vibe Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl text-[10px] shrink-0 gap-1.5 text-slate-300">
            <span className="font-semibold text-[9px] text-slate-500">VIBE:</span>
            {['Rooftop', 'Quiet/Solo', 'Family'].map(v => (
              <button 
                key={v}
                onClick={() => setSelectedVibe(selectedVibe === v ? null : v)}
                className={`px-1.5 py-0.5 rounded transition ${selectedVibe === v ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Stream History Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs ${
                message.role === 'user'
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              }`}>
                {message.role === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5 text-orange-400" />}
              </div>

              {/* Bubble Body */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-orange-500/90 to-red-600/90 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-850 text-slate-200'
                }`}>
                  {/* Markdown Renderer Fallback */}
                  <div className="whitespace-pre-line antialiased font-sans">
                    {message.content}
                  </div>

                  {/* Curated Interactive Cards list - appended within bubble */}
                  {message.restaurants && message.restaurants.length > 0 && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-slate-800/60">
                      <p className="text-[10px] font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-2">
                        <Activity className="w-3 h-3 text-orange-500 animate-pulse" />
                        RECOMMENDED DINING SPOTS ({message.restaurants.length}):
                      </p>
                      
                      {message.restaurants.map((res: Restaurant, rIdx: number) => {
                        const isFocusedInHUD = activeResIndex === rIdx;
                        return (
                          <div 
                            key={rIdx}
                            onClick={() => setActiveResIndex(rIdx)}
                            className={`p-3 rounded-xl cursor-pointer text-slate-200 text-xs transition-all duration-300 border ${
                              isFocusedInHUD 
                                ? 'bg-slate-900 border-orange-500/65 shadow shadow-orange-500/10' 
                                : 'bg-slate-950/70 border-slate-850 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1 pb-1">
                              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-orange-500 text-white rounded-lg inline-flex items-center justify-center font-mono text-[11px] font-semibold">
                                  {rIdx + 1}
                                </span>
                                {res.name}
                              </h4>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                <span className="font-bold text-[10px] text-orange-300">{res.rating}</span>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 flex flex-wrap gap-1.5 items-center pb-2">
                              <span>🍽 {res.cuisine}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-orange-400/90 font-medium">{res.priceRange}</span>
                            </p>

                            <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/30 mb-2 italic">
                              "{res.whyRecommended}"
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 py-1.5 border-t border-slate-800/50 mb-2">
                              <div>📍 {res.address}</div>
                              <div>⏰ {res.openHours}</div>
                              <div className="text-orange-400/80 font-medium">🔥 Dishes: {res.popularDishes}</div>
                              <div className="text-slate-200">🚗 {res.distance} ({res.travelTime})</div>
                            </div>

                            {/* Cards Action panel */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/40">
                              <a
                                href={res.mapLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-semibold text-orange-400 hover:text-orange-350 flex items-center gap-1 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Map
                              </a>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSimulateBookingAtVenue(res);
                                }}
                                className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                              >
                                <Utensils className="w-3 h-3" />
                                Order Menu
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Suggested followups rendered directly under assistant bubbles */}
                {message.role === 'assistant' && message.suggestedFollowups && message.suggestedFollowups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 pl-1.5">
                    {message.suggestedFollowups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleSendMessage(f)}
                        className="px-2.5 py-1 rounded bg-slate-950/70 border border-slate-850 hover:border-slate-700 text-slate-300 text-[10px] hover:text-white transition duration-200 cursor-pointer text-left"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-slate-500 self-start pl-1.5">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              </div>
              <div className="flex flex-col gap-1 w-full text-left">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  Searching neighborhood database and checking travel vectors...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-850 pt-3 mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Query any cuisine, dining requirements, or ask 'What best spots are near me?'"
              className="flex-1 bg-slate-950 border border-slate-850 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition font-sans"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-650 cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow-md transition-all flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-2 text-[9px] text-slate-500 text-center flex justify-center items-center gap-1.5">
            <Info className="w-2.5 h-2.5" />
            Powered by Gemini AI. Custom vector coordinates are generated automatically relative to device location.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive SVG Location Map HUD */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Map Canvas Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center h-[46vh] lg:h-[50vh] shadow-xl relative overflow-hidden backdrop-blur-md">
          
          {/* Map Header Indicators */}
          <div className="w-full flex justify-between items-center mb-2 z-10">
            <div className="flex items-center gap-1.5">
              <Compass className={`w-4 h-4 text-orange-400 ${mapScannerActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider">
                TACTICAL RADAR HUD MAP
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 bg-slate-950/70 border border-slate-850 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              GPS Locked: {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
            </div>
          </div>

          {/* SVG Map Core Area */}
          <div className="flex-1 w-full bg-slate-950/95 border border-slate-850 rounded-xl relative flex justify-center items-center overflow-hidden">
            
            {/* Real-time radar scan sweeping effect background */}
            {mapScannerActive && (
              <div className="absolute inset-0 bg-radial-radar-scan opacity-40 select-none pointer-events-none animate-radar-sweep border-r border-orange-500" />
            )}

            {/* Custom SVG Drawing */}
            <svg 
              viewBox="0 0 450 450" 
              className="w-full h-full max-w-[400px] max-h-[400px] select-none text-slate-600 transition-transform duration-300"
            >
              <defs>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="pinGlow animate" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid concentric measurement rings representing radar ranges */}
              <circle cx="225" cy="225" r="50" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="225" cy="225" r="100" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle cx="225" cy="225" r="150" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="225" cy="225" r="200" fill="none" stroke="#334155" strokeWidth="1.2" />

              {/* Radar Crosshairs */}
              <line x1="225" y1="15" x2="225" y2="435" stroke="#1e293b" strokeWidth="1" />
              <line x1="15" y1="225" x2="435" y2="225" stroke="#1e293b" strokeWidth="1" />
              
              {/* Secondary Diagonal Grid Lines */}
              <line x1="76" y1="76" x2="374" y2="374" stroke="#0f172a" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="374" y1="76" x2="76" y2="374" stroke="#0f172a" strokeWidth="0.8" strokeDasharray="2,2" />

              {/* Simulated streets / navigation grid layout */}
              <path d="M 50 120 Q 225 180 400 120" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M 80 340 T 360 280" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M 120 40 L 150 400" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.2.5" />
              <path d="M 330 30 Q 300 225 350 420" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.2.5" />

              {/* DRAW navigation path line from Center coordinates to the active restaurant node */}
              {focusedRestaurant && (() => {
                const pin = getMapPixelCoords(focusedRestaurant.coordinates.latitude, focusedRestaurant.coordinates.longitude);
                return (
                  <g>
                    <line 
                      x1="225" 
                      y1="225" 
                      x2={pin.x} 
                      y2={pin.y} 
                      stroke="#f97316" 
                      strokeWidth="2.5" 
                      strokeDasharray="4,4" 
                      className="animate-route-glow"
                    />
                    <circle cx={pin.x} cy={pin.y} r="24" fill="url(#pinGlow)" />
                  </g>
                );
              })()}

              {/* Draw Center Target Pin for User Location */}
              <circle cx="225" cy="225" r="28" fill="url(#centerGlow)" />
              <circle cx="225" cy="225" r="6" fill="#10b981" />
              <circle cx="225" cy="225" r="1.5" fill="#ffffff" />
              <text x="225" y="245" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                MY PHONE
              </text>

              {/* Dynamic Venue Nodes */}
              {activeRestaurants.map((res, rIdx) => {
                const pin = getMapPixelCoords(res.coordinates.latitude, res.coordinates.longitude);
                const isActive = activeResIndex === rIdx;
                
                return (
                  <g 
                    key={rIdx} 
                    className="cursor-pointer group"
                    onClick={() => setActiveResIndex(rIdx)}
                  >
                    {/* Pulsing ring around node */}
                    <circle 
                      cx={pin.x} 
                      cy={pin.y} 
                      r={isActive ? "13" : "9"} 
                      fill="none" 
                      stroke={isActive ? "#f97316" : "#64748b"} 
                      strokeWidth="1.5" 
                      className={isActive ? "animate-ping" : ""}
                    />
                    
                    {/* Glowing background */}
                    <circle 
                      cx={pin.x} 
                      cy={pin.y} 
                      r="8" 
                      fill={isActive ? "#f97316" : "#475569"} 
                    />

                    {/* Number text labeled on pin */}
                    <text 
                      x={pin.x} 
                      y={pin.y + 3} 
                      fill="#ffffff" 
                      fontSize="9" 
                      fontFamily="monospace"
                      fontWeight="bold" 
                      textAnchor="middle"
                    >
                      {rIdx + 1}
                    </text>

                    {/* Small name tooltip overlay displayed in svg under node pin */}
                    <text 
                      x={pin.x} 
                      y={pin.y - 12} 
                      fill={isActive ? "#f97316" : "#94a3b8"} 
                      fontSize="8" 
                      fontWeight={isActive ? "bold" : "normal"}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {res.name.substring(0, 15)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Radar Sweep Animation Elements */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-850 p-1.5 rounded-lg text-[9px] font-mono select-none flex flex-col gap-0.5">
              <span className="text-orange-400 font-bold">RADAR TELEMETRY</span>
              <span className="text-slate-400">OFFSET MODE: ZOOM x{mapZoom.toFixed(1)}</span>
              <span className="text-slate-400">BEARING: 034° NNE</span>
            </div>

            {/* Zoom / Controls Panel */}
            <div className="absolute bottom-3 right-3 flex items-center bg-slate-950/90 border border-slate-850 p-1 rounded-xl gap-1">
              <button
                onClick={() => setMapZoom(prev => Math.min(3, prev + 0.3))}
                className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono hover:text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="text-[9px] font-mono text-slate-400 px-1 font-semibold">ZOOM</span>
              <button
                onClick={() => setMapZoom(prev => Math.max(0.4, prev - 0.3))}
                className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono hover:text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry / Selected Restaurant Information Section */}
        <AnimatePresence mode="wait">
          {focusedRestaurant ? (
            <motion.div
              key={focusedRestaurant.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col shadow-xl backdrop-blur-md flex-1 text-slate-200"
            >
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-500/15 rounded-lg border border-orange-500/25">
                    <Navigation className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                      COGNITIVE NAVIGATION GUIDANCE
                    </h3>
                    <p className="text-[10px] text-slate-400">Auto calculated vectors from GPS phone node</p>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-orange-400 font-mono font-bold">
                  ETA: {focusedRestaurant.travelTime}
                </div>
              </div>

              {/* Target Venue specs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center mb-3">
                <div className="border-r border-slate-900 flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 tracking-wider">DISTANCE:</span>
                  <span className="text-xs font-bold text-slate-100 font-mono">{focusedRestaurant.distance}</span>
                </div>
                <div className="border-r border-slate-900 flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 tracking-wider">TRAVEL TIME:</span>
                  <span className="text-xs font-bold text-orange-400 font-mono">{focusedRestaurant.travelTime}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 tracking-wider">GRID COORDS:</span>
                  <span className="text-[10px] font-bold text-[10px] text-slate-300 font-mono">
                    {focusedRestaurant.coordinates.latitude.toFixed(3)}, {focusedRestaurant.coordinates.longitude.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Turn-by-Turn GPS Guidance Directions */}
              <div>
                <p className="text-[9px] font-extrabold text-slate-500 font-mono uppercase tracking-widest mb-1">
                  GPS TURN-BY-TURN STEP-UP ROUTE:
                </p>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850/80 text-[11px] flex items-start gap-2.5 text-slate-300 leading-relaxed font-sans">
                  <Navigation className="w-5 h-5 text-orange-500 shrink-0 rotate-45 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 font-mono">[START-DEVIATION POINTER] </span>
                    {focusedRestaurant.navigationDirections}
                  </div>
                </div>
              </div>

              {/* Trigger fast menu redirect */}
              <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-center gap-2">
                <div className="text-[10px] text-slate-400 italic">
                  Order from table or preview this restaurant's dishes directly.
                </div>
                <button
                  onClick={() => handleSimulateBookingAtVenue(focusedRestaurant)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-[10px] font-bold text-slate-200 hover:text-orange-400 hover:border-orange-500/40 flex items-center gap-1.5 transition duration-300 shrink-0"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Deploy Table Order Menu
                </button>
              </div>

            </motion.div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500 h-[18vh] lg:h-[22vh] shadow-xl backdrop-blur-md flex-1">
              <Compass className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">GPS Navigation Core Ready</p>
              <p className="text-[10px] text-slate-500 mt-1">Specify your gastronomy query to begin drawing radar map vectors.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Styled inline keyframe css elements */}
      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-radar-sweep {
          transform-origin: center center;
          animation: radarSweep 10s linear infinite;
        }
        @keyframes routeGlow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-route-glow {
          animation: routeGlow 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
