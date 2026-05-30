/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Coffee, Bell, BarChart2, Star, Plus, Trash2, Edit3, 
  Coins, User, Check, RefreshCcw, Eye, ShieldAlert, CircleDot, Sparkles, QrCode 
} from 'lucide-react';
import { MenuItem, Order, WaiterRequest, TransactionRecord, RatingRecord, Category } from '../types';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'waiters' | 'finances' | 'feedback'>('orders');

  // Database State Lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [waiters, setWaiters] = useState<WaiterRequest[]>([]);
  const [finances, setFinances] = useState<TransactionRecord[]>([]);
  const [ratings, setRatings] = useState<RatingRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  // Form Adding state
  const [addName, setAddName] = useState<string>("");
  const [addPrice, setAddPrice] = useState<number>(180);
  const [addCategory, setAddCategory] = useState<Category>("main");
  const [addDesc, setAddDesc] = useState<string>("");
  const [addVeg, setAddVeg] = useState<boolean>(true);
  const [addImage, setAddImage] = useState<string>("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80");
  const [formMsg, setFormMsg] = useState<string | null>(null);

  // Table QR Gen State
  const [qrTableNum, setQrTableNum] = useState<string>("5");
  const [generatedQRString, setGeneratedQRString] = useState<string>("");

  useEffect(() => {
    fetchAllData();
    const poll = setInterval(fetchAllData, 3000); // Poll administrative data every 3 seconds
    return () => clearInterval(poll);
  }, []);

  const fetchAllData = async () => {
    try {
      const [menuRes, ordRes, waitRes, finRes, ratRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/waiter'),
        fetch('/api/transactions'),
        fetch('/api/ratings'),
      ]);

      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (waitRes.ok) setWaiters(await waitRes.json());
      if (finRes.ok) setFinances(await finRes.json());
      if (ratRes.ok) setRatings(await ratRes.json());

      setLoading(false);
    } catch (e) {
      console.warn("Backend poll error in admin dashboard", e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const sequence: Record<string, string> = {
      'pending': 'preparing',
      'preparing': 'cooking',
      'cooking': 'ready',
      'ready': 'delivered',
      'delivered': 'delivered'
    };
    const targetStatus = sequence[currentStatus];
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItemAvailability = async (itemId: string, currentVal: boolean) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentVal })
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPrice) return;
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          price: addPrice,
          category: addCategory,
          description: addDesc.trim(),
          isVeg: addVeg,
          image: addImage.trim() || undefined
        })
      });

      if (response.ok) {
        setFormMsg("Item added successfully!");
        setAddName("");
        setAddDesc("");
        fetchAllData();
        setTimeout(() => setFormMsg(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveWaiter = async (id: string) => {
    try {
      const response = await fetch(`/api/waiter/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAdminTableQR = () => {
    const payload = {
      tableNumber: qrTableNum.trim(),
      restaurantId: "FOODY_LOUNGE_01",
      sessionId: `SESS-${Math.floor(1000 + Math.random() * 9000)}-X`
    };
    setGeneratedQRString(JSON.stringify(payload));
  };

  const handleResetDB = async () => {
    if (!confirm("Caution: This will clear dynamic records, orders, and reset menu items to standard defaults. Continue?")) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        alert("Database returned to pristine defaults!");
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stats Counters
  const pendingOrdersCount = orders.filter(o => o.status !== 'delivered').length;
  const activeWaiterCount = waiters.filter(w => w.status === 'pending').length;
  const totalFinancesSum = finances.reduce((acc, curr) => acc + curr.amount, 0);
  const averageRating = ratings.length > 0
    ? (ratings.reduce((acc, curr) => acc + curr.stars, 0) / ratings.length).toFixed(1)
    : "5.0";

  return (
    <div id="admin_panel_container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Admin Top Header Dashboard Brand */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
            📊
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-tight">Foody Control Center</h1>
            <p className="text-[10px] text-slate-500 font-mono">Restaurant Management Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="admin_reset_btn"
            onClick={handleResetDB}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-[10px] font-mono text-red-500 hover:text-red-400 rounded-xl transition-all"
            title="Reset Catalog & Orders to Pristine Defaults"
          >
            Reset DB Defaults
          </button>
          <span className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl text-[10px] font-mono text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse">
            <CircleDot className="w-3.5 h-3.5" /> Database Online
          </span>
        </div>
      </header>

      {/* Main Stats Grid Row */}
      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/40 border-b border-slate-900">
        <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 font-bold shrink-0">
            🧾
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Active Orders</span>
            <span className="text-md font-bold text-white">{pendingOrdersCount} Queue</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-bold shrink-0">
            🛎️
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Waiter Bells</span>
            <span className="text-md font-bold text-white">{activeWaiterCount} Alerts</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-bold shrink-0">
            💳
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Sales</span>
            <span className="text-md font-extrabold text-white font-mono">₹{totalFinancesSum}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500 font-bold shrink-0">
            ★
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Average Rating</span>
            <span className="text-md font-extrabold text-white font-mono">{averageRating} / 5</span>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav id="admin_nav_tabs" className="flex border-b border-slate-900 bg-slate-900/60 p-2 overflow-x-auto text-xs font-semibold gap-1 shrink-0">
        <button
          id="tab_orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeTab === 'orders' ? 'bg-orange-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-slate-950" />
          Manage Kitchen Orders ({orders.length})
        </button>

        <button
          id="tab_catalog"
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeTab === 'catalog' ? 'bg-orange-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4 text-slate-950" />
          Dish Catalog Editor ({menuItems.length})
        </button>

        <button
          id="tab_waiters"
          onClick={() => setActiveTab('waiters')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeTab === 'waiters' ? 'bg-orange-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-slate-950" />
          Waiter Assistance Requests ({activeWaiterCount})
        </button>

        <button
          id="tab_finances"
          onClick={() => setActiveTab('finances')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeTab === 'finances' ? 'bg-orange-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Coins className="w-4 h-4 text-slate-950" />
          Finance & Payments
        </button>

        <button
          id="tab_feedback"
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeTab === 'feedback' ? 'bg-orange-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Star className="w-4 h-4 text-slate-950" />
          Ratings ({ratings.length})
        </button>
      </nav>

      {/* Main Tab Contents Panel */}
      <main className="p-4 md:p-6 flex-1 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
            <span className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-3"></span>
            Syncing restaurant console...
          </div>
        ) : (
          <div id="tab_contents">
            {/* Tab: Orders Management */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Kitchen Status Monitor</h3>
                  <span className="text-[10px] text-slate-500">Click actions to advance states</span>
                </div>

                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="text-center py-10 border border-slate-900 bg-slate-900/25 rounded-2xl text-xs text-slate-500 font-sans">
                      No customer orders currently registered in database queues.
                    </div>
                  ) : (
                    [...orders].reverse().map((ord) => {
                      // Color mapping
                      const statusColors: Record<string, string> = {
                        'pending': 'bg-red-500/10 text-red-500 border-red-500/20',
                        'preparing': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
                        'cooking': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        'ready': 'bg-orange-500/10 text-orange-400 border-orange-500/35',
                        'delivered': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      };

                      return (
                        <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">Order {ord.id}</span>
                              <span className="text-[10px] bg-slate-950 font-mono text-slate-500 px-2 py-0.5 rounded">
                                Table {ord.tableNumber}
                              </span>
                              <span className={`text-[10px] border px-2 py-0.5 rounded-full capitalize ${statusColors[ord.status] || ''}`}>
                                {ord.status}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${ord.paymentStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {ord.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                              </span>
                            </div>

                            {/* Item mapping */}
                            <p className="text-xs text-slate-400">
                              {ord.items.map(it => `${it.menuItem.name} (x${it.quantity})`).join(', ')}
                            </p>

                            {ord.notes && (
                              <p className="text-[11px] text-amber-500 bg-slate-950 py-1 px-2.5 rounded-xl border border-slate-900 inline-block">
                                🥣 Instruction Note: "{ord.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            <span className="text-xs font-bold font-mono text-amber-500">₹{ord.totalAmount}</span>

                            {ord.status !== 'delivered' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, ord.status)}
                                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              >
                                Advance ➜
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab: Catalog Editor */}
            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form catalog adding */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 self-start">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-orange-500" />
                    Publish New Recipe
                  </h3>

                  <form onSubmit={handleAddMenuItem} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-1">Item Name</label>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="e.g. Masala Dosa"
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl outline-none focus:border-orange-500 text-slate-200"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-500 block mb-1">Category</label>
                        <select
                          value={addCategory}
                          onChange={(e) => setAddCategory(e.target.value as Category)}
                          className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl outline-none text-slate-300"
                        >
                          <option value="starters">Starters</option>
                          <option value="main">Main Course</option>
                          <option value="drinks">Drinks</option>
                          <option value="desserts">Desserts</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={addPrice}
                          onChange={(e) => setAddPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl outline-none focus:border-orange-500 text-slate-200 font-mono"
                          required
                          min={1}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">Description</label>
                      <textarea
                        value={addDesc}
                        onChange={(e) => setAddDesc(e.target.value)}
                        placeholder="Key spices, size, garnishing details..."
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl outline-none focus:border-orange-500 text-slate-200 h-16 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">Image URL</label>
                      <input
                        type="text"
                        value={addImage}
                        onChange={(e) => setAddImage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-[10px] rounded-xl outline-none text-slate-400 font-mono"
                      />
                    </div>

                    <div className="flex gap-4 items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[11px] text-slate-400">Dietary Profile:</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addVeg}
                          onChange={(e) => setAddVeg(e.target.checked)}
                          className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-[11px] text-emerald-400 font-bold">Vegetarian (Veg)</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 font-black py-3 rounded-xl transition"
                    >
                      Publish Item
                    </button>

                    {formMsg && (
                      <p className="text-center text-xs font-semibold text-emerald-400 animate-bounce">{formMsg}</p>
                    )}
                  </form>
                </div>

                {/* Left table of menus */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Catalog Registry</h3>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-h-[480px] overflow-y-auto space-y-2.5">
                    {menuItems.map((item) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-900 rounded-2xl p-3 flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl shrink-0" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                            </div>
                            <span className="text-[10px] text-slate-500 capitalize">{item.category} • ₹{item.price}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Availability Toggle */}
                          <button
                            onClick={() => handleToggleItemAvailability(item.id, item.isAvailable)}
                            className={`px-3 py-1 rounded-xl text-[9px] font-mono border transition ${
                              item.isAvailable
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {item.isAvailable ? "Instock" : "Hidden"}
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="bg-red-500/15 text-red-400 hover:bg-red-550 border border-red-500/25 p-2 rounded-xl transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* QR Tool Section */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mt-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-1">
                      <QrCode className="w-4 h-4 text-orange-500" />
                      Generate Table QR Identifier Cards
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                      Assign QR tags to physical tables. Customers scanning these will unlock table integrations instantly.
                    </p>

                    <div className="flex gap-4 items-center mb-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Table Number</label>
                        <input
                          type="text"
                          value={qrTableNum}
                          onChange={(e) => setQrTableNum(e.target.value)}
                          placeholder="e.g. 5"
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none w-full"
                        />
                      </div>
                      <button
                        onClick={handleGenerateAdminTableQR}
                        className="bg-slate-950 border border-slate-800 text-white text-xs py-2 px-4 rounded-xl hover:bg-slate-900 transition self-end"
                      >
                        Create QR Data
                      </button>
                    </div>

                    {generatedQRString && (
                      <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                        <div className="w-20 h-20 bg-white p-2.5 rounded-xl flex items-center justify-center shrink-0">
                          {/* Visual QR Card representation */}
                          <div className="text-[9px] font-mono leading-none tracking-tighter text-black select-none text-center">
                            █ ▄ █ ▄ █<br />
                            █ ▀ █ ▀ █<br />
                            ▄ ▀ ▄ ▀ ▄<br />
                            █ █ ▄ █ █
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono text-orange-500 font-extrabold block">ENCODED TABLE PAYLOAD STRING:</span>
                          <span className="text-[10px] text-slate-400 block break-all font-mono select-all p-1 bg-slate-900 rounded border border-slate-850">{generatedQRString}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Tab: Waiter Assist Alerts */}
            {activeTab === 'waiters' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dine-In Waiter Broadcast Console</h3>

                <div className="space-y-3">
                  {waiters.filter(w=>w.status === 'pending').length === 0 ? (
                    <div className="text-center py-12 border border-slate-900 bg-slate-900/10 rounded-2xl text-xs text-slate-500 font-sans">
                      All waiter bell requests have been answered! Standing by.
                    </div>
                  ) : (
                    waiters.filter(w=>w.status==='pending').map((request) => (
                      <div key={request.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center animate-pulse">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🛎️</span>
                          <div>
                            <p className="text-xs font-bold text-white">Table {request.tableNumber} Requesting Assistance!</p>
                            <span className="text-[10px] text-slate-500 font-mono">Raised: {new Date(request.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleResolveWaiter(request.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1 active:scale-95 transition"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" /> Dismiss Alert
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Finances Transaction Ledger */}
            {activeTab === 'finances' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Audit Log Ledger</h3>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl font-mono text-xs text-slate-400">
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-4 border-b border-slate-900 font-bold text-slate-200">
                    <span>Transaction ID</span>
                    <span>Order ID</span>
                    <span>Method</span>
                    <span className="text-right">Settled Amount</span>
                  </div>

                  <div className="divide-y divide-slate-850 max-h-96 overflow-y-auto">
                    {finances.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">
                        No financial records recorded for current session.
                      </div>
                    ) : (
                      [...finances].reverse().map((record) => (
                        <div key={record.id} className="grid grid-cols-4 gap-2 p-4 items-center">
                          <span className="text-slate-400 break-all">{record.id}</span>
                          <span className="text-slate-500 font-semibold">{record.orderId}</span>
                          <span className="capitalize">{record.method}</span>
                          <span className="text-right text-emerald-400 font-bold">₹{record.amount}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Feedback Reviews */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Customer Insights Feedbacks</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratings.length === 0 ? (
                    <div className="text-center py-12 border border-slate-900 bg-slate-900/10 rounded-2xl text-xs text-slate-500 font-sans md:col-span-2">
                      No customer reviews submitted yet. Feedback logs are populated upon checkout completion.
                    </div>
                  ) : (
                    [...ratings].reverse().map((r) => (
                      <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  r.stars >= starIdx ? 'text-amber-400 fill-current' : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded font-mono">
                            Table {r.tableNumber}
                          </span>
                        </div>

                        {r.feedback ? (
                          <p className="text-xs text-slate-300 italic">
                            "{r.feedback}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No written comment.
                          </p>
                        )}

                        <span className="text-[9px] text-slate-600 font-mono block">
                          Logged: {new Date(r.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
