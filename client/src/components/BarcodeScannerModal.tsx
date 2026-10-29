import React, { useState, useRef, useEffect } from 'react';
import { Camera, Barcode, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Modal } from './Modal.js';
import { Product } from '../types/index.js';
import { playBeep } from '../services/audioService.js';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanResult: (barcode: string, mode: 'sell' | 'receive', receiveQty: number) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanResult,
}) => {
  const [mode, setMode] = useState<'sell' | 'receive'>('sell');
  const [receiveQty, setReceiveQty] = useState<number>(1);
  const [manualCode, setManualCode] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<Array<{ text: string; success: boolean; time: string }>>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      alert('Camera access denied or unavailable. You can use manual entry or demo barcodes.');
    }
  };

  const handleBarcodeSubmit = (codeToUse?: string) => {
    const raw = codeToUse || manualCode;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const matchedProduct = products.find((p) => p.barcode === trimmed);
    const now = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (mode === 'sell') {
      if (matchedProduct) {
        if (matchedProduct.qty <= 0) {
          playBeep(false);
          setScanHistory((prev) => [{ text: `${matchedProduct.name} is out of stock!`, success: false, time: now }, ...prev.slice(0, 3)]);
        } else {
          playBeep(true);
          setScanHistory((prev) => [{ text: `Added ${matchedProduct.name} (KES ${matchedProduct.price})`, success: true, time: now }, ...prev.slice(0, 3)]);
          onScanResult(trimmed, 'sell', 1);
        }
      } else {
        playBeep(false);
        setScanHistory((prev) => [{ text: `Unknown Barcode: ${trimmed}`, success: false, time: now }, ...prev.slice(0, 3)]);
        onScanResult(trimmed, 'sell', 1);
      }
    } else {
      // Receive stock mode
      playBeep(true);
      const name = matchedProduct ? matchedProduct.name : `Barcode ${trimmed}`;
      setScanHistory((prev) => [{ text: `Restocked ${name} +${receiveQty}`, success: true, time: now }, ...prev.slice(0, 3)]);
      onScanResult(trimmed, 'receive', receiveQty);
    }

    setManualCode('');
  };

  const demoItems = products.filter((p) => p.barcode).slice(0, 3);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Barcode Scanner">
      <div className="flex flex-col gap-4">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#EEF1EE] rounded-xl">
          <button
            onClick={() => setMode('sell')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'sell' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Sell to Cart
          </button>
          <button
            onClick={() => setMode('receive')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'receive' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Receive Stock
          </button>
        </div>

        {/* Viewfinder Window */}
        <div className="relative h-40 bg-[#1B1F1D] rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-gray-700 shadow-inner">
          {isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold border border-white/30 backdrop-blur-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Open Device Camera</span>
              </button>
              <span className="text-[11px] text-gray-400">USB or Bluetooth scanner works automatically</span>
            </div>
          )}

          {/* Red Scanner Laser Beam */}
          <div className="absolute inset-x-4 h-0.5 bg-rose-500 shadow-[0_0_12px_#ff4d3d] animate-pulse pointer-events-none" />

          {/* Viewfinder Corners */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-md pointer-events-none" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-md pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-md pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-md pointer-events-none" />
        </div>

        {/* Receive stock batch buttons */}
        {mode === 'receive' && (
          <div className="flex items-center justify-between p-2 bg-[#EEF1EE] rounded-xl text-xs font-semibold">
            <span className="text-gray-600">Quantity per scan:</span>
            <div className="flex gap-1.5">
              {[1, 6, 12, 24].map((q) => (
                <button
                  key={q}
                  onClick={() => setReceiveQty(q)}
                  className={`w-8 h-8 rounded-lg font-mono font-bold transition-colors ${
                    receiveQty === q ? 'bg-[#0F7B5A] text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Barcode Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Type or paste barcode..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBarcodeSubmit();
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl font-mono text-sm text-gray-900 focus:outline-emerald-600"
            />
          </div>
          <button
            onClick={() => handleBarcodeSubmit()}
            className="px-4 py-2 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
          >
            <span>Scan</span>
          </button>
        </div>

        {/* Demo Fast Scan Chips */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6962] block mb-1.5">
            Quick Demo Barcodes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {demoItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleBarcodeSubmit(item.barcode)}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-full border border-gray-200 flex items-center gap-1 transition-colors"
              >
                <span>{item.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="text-[10px] text-gray-400 font-mono">({item.barcode.slice(-4)})</span>
              </button>
            ))}
            <button
              onClick={() => handleBarcodeSubmit('616000100099')}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200 transition-colors"
            >
              Kimbo (Sold Out demo)
            </button>
          </div>
        </div>

        {/* Scan History Feed */}
        {scanHistory.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase">Recent Scans</span>
            {scanHistory.map((h, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  h.success ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {h.success ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  <span className="truncate">{h.text}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">{h.time}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
