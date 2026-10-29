import React, { useState } from 'react';
import { Banknote, Smartphone, CreditCard, Send, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Modal } from './Modal.js';
import { api } from '../services/api.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  tillNumber: string;
  shopName: string;
  isOnline: boolean;
  onCompleteSale: (saleData: {
    method: 'cash' | 'mpesa' | 'card';
    tendered: number;
    change: number;
    phone: string;
    sendReceiptSMS: boolean;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  total,
  tillNumber,
  shopName,
  isOnline,
  onCompleteSale,
}) => {
  const [method, setMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [tendered, setTendered] = useState<string>('');
  const [phone, setPhone] = useState<string>('0712345678');
  const [sendReceiptSMS, setSendReceiptSMS] = useState<boolean>(true);

  // M-Pesa STK Push Simulation State
  const [isStkPromptOpen, setIsStkPromptOpen] = useState<boolean>(false);
  const [mpesaPin, setMpesaPin] = useState<string>('');
  const [stkProcessing, setStkProcessing] = useState<boolean>(false);
  const [stkSuccessMessage, setStkSuccessMessage] = useState<string>('');

  const tenderedNum = Number(tendered) || 0;
  const change = tenderedNum > total ? tenderedNum - total : 0;
  const isShort = method === 'cash' && tenderedNum > 0 && tenderedNum < total;

  const quickAmounts = Array.from(new Set([
    total,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
  ])).sort((a, b) => a - b).slice(0, 4);

  const handleOpenStkPrompt = () => {
    if (!phone.trim()) {
      alert('Please enter the customer phone number.');
      return;
    }
    setMpesaPin('');
    setStkSuccessMessage('');
    setIsStkPromptOpen(true);
  };

  const handleAuthorizeSTK = async () => {
    if (mpesaPin.length < 4) {
      alert('Please enter a 4-digit M-Pesa PIN.');
      return;
    }
    setStkProcessing(true);

    try {
      // Trigger STK push to backend
      await api.triggerSTKPush(phone, total);
    } catch (e) {
      // Simulated response
    }

    setTimeout(() => {
      setStkProcessing(false);
      const randomRef = `QKH${Math.floor(100000 + Math.random() * 900000)}KL`;
      setStkSuccessMessage(`Confirmed. KES ${total.toLocaleString()} sent to ${shopName}. Ref: ${randomRef}.`);

      setTimeout(() => {
        setIsStkPromptOpen(false);
        onCompleteSale({
          method: 'mpesa',
          tendered: total,
          change: 0,
          phone: phone.trim(),
          sendReceiptSMS: true,
        });
      }, 1600);
    }, 1200);
  };

  const handleFinish = () => {
    if (method === 'cash' && tenderedNum > 0 && tenderedNum < total) {
      alert('Cash received is less than the total due.');
      return;
    }

    onCompleteSale({
      method,
      tendered: method === 'cash' ? (tenderedNum || total) : 0,
      change: method === 'cash' ? change : 0,
      phone: phone.trim(),
      sendReceiptSMS: Boolean(sendReceiptSMS && phone.trim()),
    });
  };

  return (
    <>
      <Modal isOpen={isOpen && !isStkPromptOpen} onClose={onClose} title="Payment & Checkout">
        <div className="flex flex-col gap-4">
          {/* Amount Due Banner */}
          <div className="flex items-baseline justify-between p-3.5 bg-[#DAEEE5] rounded-xl text-[#0F7B5A]">
            <span className="text-xs font-semibold uppercase tracking-wider">Amount Due</span>
            <span className="text-2xl font-bold font-mono">KES {total.toLocaleString()}</span>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EEF1EE] rounded-xl">
            {[
              { id: 'cash' as const, label: 'Cash', icon: Banknote },
              { id: 'mpesa' as const, label: 'M-Pesa', icon: Smartphone },
              { id: 'card' as const, label: 'Card', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = method === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMethod(item.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Payment Body */}
          {method === 'cash' && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Cash Received (KES)
                <input
                  type="number"
                  inputMode="numeric"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={String(total)}
                  className="w-full px-3 py-2.5 bg-[#EEF1EE] border border-gray-200 rounded-xl font-mono text-base font-bold text-gray-900 focus:outline-emerald-600"
                />
              </label>

              {/* Quick cash pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTendered(String(amt))}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-mono font-semibold rounded-full border border-gray-200 transition-colors"
                  >
                    {amt === total ? 'Exact' : amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Change Indicator */}
              {tenderedNum > 0 && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between ${
                    isShort ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span>{isShort ? 'Short by' : 'Change due to customer'}</span>
                  <span>KES {Math.abs(tenderedNum - total).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {method === 'mpesa' && (
            <div className="flex flex-col gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">M-Pesa Buy Goods Till:</span>
                <span className="text-sm font-bold font-mono text-[#0F7B5A]">{tillNumber}</span>
              </div>

              <div className="text-xs text-gray-600 leading-relaxed">
                Enter the customer's phone to trigger an instant <b>Lipa Na M-Pesa STK Push</b> prompt on their phone screen.
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-emerald-900">
                Customer M-Pesa Phone Number
                <input
                  type="tel"
                  placeholder="07XX XXX XXX or +254..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-emerald-600"
                />
              </label>

              <button
                onClick={handleOpenStkPrompt}
                className="w-full py-3 bg-[#0F7B5A] hover:bg-[#0c664a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Trigger STK Push Prompt (Simulate)</span>
              </button>
            </div>
          )}

          {method === 'card' && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
              Take card payment on your POS card terminal or bank PDQ machine, then click Complete Sale.
            </div>
          )}

          {/* Customer Phone for Digital SMS Receipt */}
          {method !== 'mpesa' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Customer Phone (for digital SMS receipt)
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="07XX XXX XXX or +254..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-emerald-600"
                />
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={sendReceiptSMS}
                  onChange={(e) => setSendReceiptSMS(e.target.checked)}
                  className="w-4 h-4 text-[#0F7B5A] rounded-sm accent-[#0F7B5A]"
                />
                <span>Send receipt via Africa's Talking SMS {!isOnline && '(queues while offline)'}</span>
              </label>
            </div>
          )}

          {/* Complete Sale Button */}
          {method !== 'mpesa' && (
            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-[0.99] transition-all mt-1"
            >
              <Send className="w-4 h-4" />
              <span>Complete Sale · KES {total.toLocaleString()}</span>
            </button>
          )}
        </div>
      </Modal>

      {/* Realistic Safaricom M-Pesa STK Push Handset Simulator Modal */}
      {isStkPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 flex flex-col">
            {/* Handset Speaker Notch */}
            <div className="bg-gray-800 py-1.5 flex justify-center">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Safaricom Green Header */}
            <div className="bg-[#008A44] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span className="font-bold text-xs tracking-wide">SAFARICOM M-PESA</span>
              </div>
              <button
                onClick={() => setIsStkPromptOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STK Push Dialog Body */}
            <div className="p-4 flex flex-col gap-3 bg-[#F4F6F5] text-gray-900">
              {stkSuccessMessage ? (
                <div className="py-6 flex flex-col items-center gap-2 text-center animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
                  <span className="font-bold text-sm text-emerald-900">Payment Successful!</span>
                  <p className="text-xs text-gray-600 font-mono leading-relaxed mt-1">
                    {stkSuccessMessage}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed shadow-2xs">
                    <p className="font-semibold text-gray-900">
                      Do you want to pay <span className="text-[#008A44] font-bold font-mono">KES {total.toLocaleString()}</span> to <span className="font-bold">{shopName}</span> (Till {tillNumber})?
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Phone: {phone}</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">Enter M-Pesa PIN:</label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      autoFocus
                      placeholder="• • • •"
                      value={mpesaPin}
                      onChange={(e) => setMpesaPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-2.5 bg-white border-2 border-emerald-500 rounded-xl focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsStkPromptOpen(false)}
                      className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={stkProcessing || mpesaPin.length < 4}
                      onClick={handleAuthorizeSTK}
                      className="py-2.5 bg-[#008A44] hover:bg-[#007439] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {stkProcessing ? 'Authorizing...' : 'Authorize (OK)'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMpesaPin('1234')}
                    className="text-[11px] text-emerald-800 text-center hover:underline font-mono"
                  >
                    Fill Demo PIN (1234)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
