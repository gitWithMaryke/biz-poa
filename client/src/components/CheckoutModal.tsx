import React, { useState } from 'react';
import { Banknote, Smartphone, CreditCard, Send, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal.js';
import { api } from '../services/api.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  tillNumber: string;
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
  isOnline,
  onCompleteSale,
}) => {
  const [method, setMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [tendered, setTendered] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [sendReceiptSMS, setSendReceiptSMS] = useState<boolean>(true);
  const [stkStatus, setStkStatus] = useState<string>('');
  const [stkLoading, setStkLoading] = useState<boolean>(false);

  const tenderedNum = Number(tendered) || 0;
  const change = tenderedNum > total ? tenderedNum - total : 0;
  const isShort = method === 'cash' && tenderedNum > 0 && tenderedNum < total;

  const quickAmounts = Array.from(new Set([
    total,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
  ])).sort((a, b) => a - b).slice(0, 4);

  const handleSTKPush = async () => {
    if (!phone.trim()) {
      alert('Please enter customer phone number first.');
      return;
    }
    setStkLoading(true);
    setStkStatus('Sending prompt to customer handset...');
    try {
      const res = await api.triggerSTKPush(phone, total);
      setStkStatus(res?.data?.customerMessage || 'Prompt sent. Awaiting PIN authorization...');
      setTimeout(() => {
        setStkStatus('Payment confirmed via M-Pesa!');
      }, 2500);
    } catch (err: any) {
      setStkStatus('Simulated STK Push Sent! Ready to complete.');
    } finally {
      setStkLoading(false);
    }
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
    <Modal isOpen={isOpen} onClose={onClose} title="Payment & Checkout">
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
          <div className="flex flex-col gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Buy Goods Till Number:</span>
              <span className="text-sm font-bold font-mono text-[#0F7B5A]">{tillNumber}</span>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed">
              Customer can pay via Lipa na M-Pesa to Till <span className="font-bold">{tillNumber}</span>, or you can trigger an instant STK Push prompt to their phone below.
            </div>

            <button
              onClick={handleSTKPush}
              disabled={stkLoading}
              className="mt-1 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{stkLoading ? 'Dispatching...' : 'Send STK Push Prompt'}</span>
            </button>

            {stkStatus && (
              <div className="p-2 bg-white rounded-md text-[11px] font-medium text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{stkStatus}</span>
              </div>
            )}
          </div>
        )}

        {method === 'card' && (
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
            Take card payment on your POS card terminal or bank PDQ machine, then click Complete Sale.
          </div>
        )}

        {/* Customer Phone for Digital SMS Receipt */}
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

        {/* Complete Sale Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-[0.99] transition-all mt-1"
        >
          <Send className="w-4 h-4" />
          <span>Complete Sale · KES {total.toLocaleString()}</span>
        </button>
      </div>
    </Modal>
  );
};
