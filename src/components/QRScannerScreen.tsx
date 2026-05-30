/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Camera, Sparkles, Volume2, Flashlight, AlertTriangle, CheckCircle, RefreshCcw, Landmark } from 'lucide-react';
import { TableInfo, Language } from '../types';
import { translations } from '../translations';

interface QRScannerScreenProps {
  language: Language;
  onScanSuccess: (tableInfo: TableInfo) => void;
}

export default function QRScannerScreen({ language, onScanSuccess }: QRScannerScreenProps) {
  const t = translations[language];

  // QR Generation state
  const [genTableNum, setGenTableNum] = useState<string>("3");
  const [genRestId, setGenRestId] = useState<string>("FOODY_DELUXE_01");
  const [genSessionId, setGenSessionId] = useState<string>("SESS-9821-X");
  const [generatedQRString, setGeneratedQRString] = useState<string>("");
  const [generatedSuccess, setGeneratedSuccess] = useState<boolean>(false);

  // Scanner states
  const [scanning, setScanning] = useState<boolean>(true);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<TableInfo | null>(null);
  const [scannedLogs, setScannedLogs] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Auto generate default QR on mount
  useEffect(() => {
    generateQR();
  }, []);

  // Request real camera access for ambient feel
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera fallback applied (Sandbox / Permission Denied)", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const generateQR = () => {
    if (!genTableNum || !genRestId) {
      setErrorMsg("Please fill in Table Number and Restaurant ID");
      return;
    }
    // Generate JSON payload
    const payloadObj = {
      tableNumber: genTableNum.trim(),
      restaurantId: genRestId.trim(),
      sessionId: genSessionId.trim() || `SESS-${Math.floor(1000 + Math.random() * 9000)}-X`
    };
    const qrString = JSON.stringify(payloadObj);
    setGeneratedQRString(qrString);
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 2000);
  };

  const decodeQRData = (dataStr: string) => {
    try {
      const decoded: Partial<TableInfo> = JSON.parse(dataStr);
      if (decoded.tableNumber && decoded.restaurantId && decoded.sessionId) {
        // Play subtle sound if API available
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, context.currentTime); // High pitch notification click
          gain.gain.setValueAtTime(0.1, context.currentTime);
          osc.connect(gain);
          gain.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 0.15);
        } catch (e) {}

        setSuccessInfo(decoded as TableInfo);
        setErrorMsg(null);
        setScanning(false);
        setScannedLogs(prev => [`[INFO] Scanned Table ${decoded.tableNumber} Successfully!`, ...prev]);

        // Proceed instantly to menu
        setTimeout(() => {
          onScanSuccess(decoded as TableInfo);
        }, 1500);
      } else {
        throw new Error("Missing structural table parameters");
      }
    } catch (e) {
      setErrorMsg(t.invalidQR);
      setScannedLogs(prev => [`[ERROR] Invalid Code - ${dataStr.substring(0, 30)}...`, ...prev]);
    }
  };

  // Simulate scanning of the current custom generated code
  const handleScanGeneratedCode = () => {
    decodeQRData(generatedQRString);
  };

  // Simulate scanning standard tabletop 3
  const handleSimulateAutoScan = () => {
    const mockCode = JSON.stringify({
      tableNumber: "3",
      restaurantId: "FOODY_LOUNGE_03",
      sessionId: "SESS-MOCK-3321"
    });
    decodeQRData(mockCode);
  };

  const handleRetry = () => {
    setScanning(true);
    setSuccessInfo(null);
    setErrorMsg(null);
  };

  return (
    <div id="qr_scanner_root" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-sans font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-orange-500" />
            {t.scanHeader}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t.scanSub}</p>
        </div>

        {/* Scan Frame */}
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl mb-6">
          {/* Laser Scanners Overlay */}
          {scanning && (
            <motion.div 
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent z-20 shadow-lg shadow-red-500/50"
            />
          )}

          {/* Flashlight Overlay Simulation */}
          <div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-300 ${flashlightOn ? 'bg-amber-100/15 mix-blend-overlay' : 'bg-transparent'}`}></div>

          {/* Camera / Video View */}
          {cameraStream ? (
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover grayscale brightness-95"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
              <p className="text-xs text-slate-500 font-sans tracking-tight">{t.cameraPlaceholder}</p>
            </div>
          )}

          {/* Corner Decors */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-md"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-md"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-md"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-md"></div>

          {/* Feedback Overlay */}
          <AnimatePresence>
            {successInfo && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-500/30"
                >
                  <CheckCircle className="w-9 h-9" />
                </motion.div>
                <h4 className="text-md font-semibold text-emerald-400">{t.scanSuccess}</h4>
                <div className="mt-3 bg-slate-900 border border-slate-800 py-2 px-4 rounded-xl text-xs font-mono text-slate-300">
                  <p>Table No: <span className="text-orange-400 font-bold">{successInfo.tableNumber}</span></p>
                  <p>Session ID: <span className="text-slate-400">{successInfo.sessionId}</span></p>
                </div>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-4 bottom-4 bg-red-950/95 border border-red-500/30 rounded-2xl p-4 z-30 flex gap-3 text-red-200 text-xs"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Scan Failed</p>
                  <p className="mt-1 opacity-90">{errorMsg}</p>
                  <button onClick={handleRetry} className="mt-2 text-white bg-red-600 px-3 py-1 rounded-lg font-semibold hover:bg-red-700">
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scanner Controls Row */}
        <div className="flex items-center justify-between gap-3 mb-8 px-4">
          <button
            id="toggle_flashlight"
            onClick={() => setFlashlightOn(!flashlightOn)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs transition-all ${
              flashlightOn
                ? 'bg-amber-500 border-amber-600 text-slate-950 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Flashlight className="w-4 h-4" />
            {t.flashlight} {flashlightOn ? "ON" : "OFF"}
          </button>

          <button
            id="btn_auto_scan"
            onClick={handleSimulateAutoScan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-xs text-white transition-all font-semibold shadow-lg shadow-orange-600/30"
          >
            <Sparkles className="w-4 h-4 animate-bounce" />
            {t.simulateScanBtn}
          </button>
        </div>

        {/* Test QR Generator Section */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-orange-500" />
            {t.orGenerateQR}
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                Table Number
              </label>
              <input
                id="gen_table_no"
                type="text"
                value={genTableNum}
                onChange={(e) => setGenTableNum(e.target.value)}
                placeholder="Table No."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                Restaurant ID
              </label>
              <input
                id="gen_rest_id"
                type="text"
                value={genRestId}
                onChange={(e) => setGenRestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed outline-none"
                disabled
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-800 pt-4">
            <div className="flex items-center gap-3 bg-slate-950 py-2.5 px-3 rounded-2xl border border-slate-800/50 w-full sm:w-auto overflow-hidden">
              <div className="w-14 h-14 bg-white rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                {/* Dotted Abstract QR Code Grid representation */}
                <span className="text-[6px] font-mono leading-none tracking-tighter text-black select-none text-center">
                  █ ▄ █ ▄ █<br />
                  █ ▀ █ ▀ █<br />
                  ▄ ▀ ▄ ▀ ▄<br />
                  █ █ ▄ █ █
                </span>
                <span className="text-[8px] font-bold text-orange-600 mt-1">T-{genTableNum}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-orange-500 font-semibold font-mono block">QR METADATA ENCODED</span>
                <span className="text-[10px] text-slate-500 block truncate font-mono">{generatedQRString || "No data loaded"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
              <button
                id="btn_build_qr"
                onClick={generateQR}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                {t.generateBtn}
              </button>
              
              <button
                id="btn_scan_gen"
                onClick={handleScanGeneratedCode}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs font-semibold rounded-xl text-white transition-all flex items-center justify-center gap-1 shadow-lg shadow-orange-600/10"
              >
                {t.clickToScanGen}
              </button>
            </div>
          </div>
        </div>

        {/* Live System Log */}
        <div className="mt-4 px-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            Scanner System Logs
          </span>
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 font-mono text-[10px] text-slate-400 h-20 overflow-y-auto space-y-1">
            <p className="text-slate-600">[SYSTEM] Direct camera scan engine online...</p>
            {scannedLogs.map((log, index) => (
              <p key={index} className={log.includes("ERROR") ? "text-red-400" : "text-emerald-400"}>{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
