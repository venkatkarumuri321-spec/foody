/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Sparkles, Smartphone, Settings2, ShieldCheck, Utensils } from 'lucide-react';
import { Language, TableInfo, CartItem, Order } from './types';
import { translations } from './translations';

// Screen imports
import WelcomeScreen from './components/WelcomeScreen';
import QRScannerScreen from './components/QRScannerScreen';
import MenuScreen from './components/MenuScreen';
import WaiterAssistanceScreen from './components/WaiterAssistanceScreen';
import PreparationTimeScreen from './components/PreparationTimeScreen';
import PaymentScreen from './components/PaymentScreen';
import LiveTrackingScreen from './components/LiveTrackingScreen';
import AdminPanel from './components/AdminPanel';
import DiscoveryAssistant from './components/DiscoveryAssistant';

export default function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'admin' | 'discovery'>('customer');
  const [page, setPage] = useState<number>(1);
  const [language, setLanguage] = useState<Language>('english');
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [needWaiter, setNeedWaiter] = useState<boolean | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Restore state from local storage on mount if available
  useEffect(() => {
    const savedLang = localStorage.getItem('foody_lang') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('foody_lang', lang);
    setPage(2);
  };

  const handleScanSuccess = (info: TableInfo) => {
    setTableInfo(info);
    setPage(3);
  };

  const handleOrderPlaced = (placedOrder: Order) => {
    setActiveOrder(placedOrder);
    setPage(6);
  };

  const handlePaymentComplete = (completedOrder: Order) => {
    setActiveOrder(completedOrder);
    setPage(7);
  };

  const handleReturnHome = () => {
    setPage(1);
    setCart([]);
    setNeedWaiter(null);
    setActiveOrder(null);
    setTableInfo(null);
  };

  const t = translations[language];

  return (
    <div id="app_root" className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-orange-500/30 selection:text-white">
      
      {/* Visual Demo Toggler Banner (Persistently available on top) */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 p-2 text-center sticky top-0 z-50 backdrop-blur-xl flex flex-col xs:flex-row justify-between items-center gap-2 max-w-7xl mx-auto w-full px-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-orange-500" />
          <span className="text-[11px] font-sans font-bold text-slate-300">
            Foody Smart Diner Hub
          </span>
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-850 p-1 rounded-xl">
          <button
            id="toggle_app_discovery"
            onClick={() => setViewMode('discovery')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 ${
              viewMode === 'discovery'
                ? 'bg-gradient-to-r from-orange-500 to-red-650 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Restaurant Scout
          </button>

          <button
            id="toggle_app_customer"
            onClick={() => setViewMode('customer')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 ${
              viewMode === 'customer'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Diner Mobile Device
          </button>
          
          <button
            id="toggle_app_admin"
            onClick={() => setViewMode('admin')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 ${
              viewMode === 'admin'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Kitchen Management Console
          </button>
        </div>
      </div>

      <div className="w-full flex-1 max-w-7xl mx-auto flex flex-col">
        <AnimatePresence mode="wait">
          {viewMode === 'discovery' ? (
            <motion.div
              key="discovery_app_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <DiscoveryAssistant 
                language={language}
                onSelectMenu={() => {
                  setViewMode('customer');
                  setPage(3);
                }}
                onSetTableInfo={setTableInfo}
              />
            </motion.div>
          ) : viewMode === 'admin' ? (
            <motion.div
              key="admin_app_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <AdminPanel />
            </motion.div>
          ) : (
            <motion.div
              key="customer_app_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <AnimatePresence mode="wait">
                {page === 1 && (
                  <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WelcomeScreen
                      initialLanguage={language}
                      onContinue={handleLanguageSelect}
                    />
                  </motion.div>
                )}

                {page === 2 && (
                  <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <QRScannerScreen
                      language={language}
                      onScanSuccess={handleScanSuccess}
                    />
                  </motion.div>
                )}

                {page === 3 && (
                  <motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                    <MenuScreen
                      language={language}
                      cart={cart}
                      onUpdateCart={setCart}
                      onContinue={() => setPage(4)}
                    />
                  </motion.div>
                )}

                {page === 4 && (
                  <motion.div key="p4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WaiterAssistanceScreen
                      language={language}
                      tableNumber={tableInfo?.tableNumber || "3"}
                      onSelectHasWaiter={setNeedWaiter}
                      onContinue={() => setPage(5)}
                    />
                  </motion.div>
                )}

                {page === 5 && (
                  <motion.div key="p5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PreparationTimeScreen
                      language={language}
                      tableInfo={tableInfo || { tableNumber: "3", restaurantId: "FOODY_DELUXE_01", sessionId: "SESS-7" }}
                      cart={cart}
                      onOrderPlaced={handleOrderPlaced}
                    />
                  </motion.div>
                )}

                {page === 6 && (
                  <motion.div key="p6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PaymentScreen
                      language={language}
                      order={activeOrder!}
                      onPaymentComplete={handlePaymentComplete}
                    />
                  </motion.div>
                )}

                {page === 7 && (
                  <motion.div key="p7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LiveTrackingScreen
                      language={language}
                      order={activeOrder!}
                      onReturnHome={handleReturnHome}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
