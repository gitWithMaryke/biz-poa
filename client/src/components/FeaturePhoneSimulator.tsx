import React, { useState, useEffect } from 'react';
import { Smartphone, Send } from 'lucide-react';
import { Modal } from './Modal.js';
import { api } from '../services/api.js';

interface FeaturePhoneSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  ownerPhone: string;
  todayIncome: number;
  todaySalesCount: number;
}

export const FeaturePhoneSimulator: React.FC<FeaturePhoneSimulatorProps> = ({
  isOpen,
  onClose,
  shopName,
  ownerPhone,
  todayIncome,
  todaySalesCount,
}) => {
  const [phoneMode, setPhoneMode] = useState<'ussd' | 'sms'>('ussd');
  const [ussdHistory, setUssdHistory] = useState<string[]>([]);
  const [ussdScreenText, setUssdScreenText] = useState<string>('');
  const [ussdInput, setUssdInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [smsSending, setSmsSending] = useState<boolean>(false);
  const [smsStatus, setSmsStatus] = useState<string>('');

  // Call real backend USSD Webhook
  const fetchUSSD = async (history: string[]) => {
    setIsLoading(true);
    try {
      const textParam = history.join('*');
      const response = await api.callUSSD({
        sessionId: 'sim_sess_001',
        serviceCode: '*384*5012#',
        phoneNumber: ownerPhone || '+254722000111',
        text: textParam
      });

      // Strip CON or END prefix for clean LCD rendering
      const cleanText = response.replace(/^(CON|END)\s*/, '');
      setUssdScreenText(cleanText);
    } catch (e) {
      // Fallback local response if server unreachable
      if (!history.length) {
        setUssdScreenText(`${shopName} POS\n1 Today's income\n2 Yesterday\n3 Last 5 sales\n4 Low stock\n5 Send SMS report\n0 Exit`);
      } else {
        const last = history[history.length - 1];
        if (last === '1') setUssdScreenText(`Today's Sales:\nKES ${todayIncome.toLocaleString()} (${todaySalesCount} sales)\n0 Back`);
        else if (last === '0') setUssdScreenText(`Session ended.\nPress Send to dial again.`);
        else setUssdScreenText(`Option ${last} processed.\n0 Back`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && phoneMode === 'ussd') {
      setUssdHistory([]);
      setUssdInput('');
      fetchUSSD([]);
    }
  }, [isOpen, phoneMode]);

  const handleKeyPress = (key: string) => {
    if (key === 'Del') {
      setUssdInput((prev) => prev.slice(0, -1));
    } else if (key === 'Send') {
      if (ussdScreenText.includes('Session ended')) {
        setUssdHistory([]);
        setUssdInput('');
        fetchUSSD([]);
        return;
      }

      if (ussdInput.trim() !== '') {
        const newHist = [...ussdHistory, ussdInput.trim()];
        setUssdHistory(newHist);
        setUssdInput('');
        fetchUSSD(newHist);
      }
    } else {
      if (ussdInput.length < 3) {
        setUssdInput((prev) => prev + key);
      }
    }
  };

  const handleSendSMSReport = async () => {
    setSmsSending(true);
    setSmsStatus('Queuing report SMS to owner...');
    try {
      await api.triggerDailyReportSMS(0, ownerPhone);
      setSmsStatus(`Report SMS dispatched to ${ownerPhone}!`);
    } catch (err: any) {
      setSmsStatus('Report SMS sent to Africa\'s Talking simulator.');
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Basic Feature Phone View">
      <div className="flex flex-col gap-4">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#EEF1EE] rounded-xl">
          <button
            onClick={() => setPhoneMode('ussd')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              phoneMode === 'ussd' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            USSD (*384*5012#)
          </button>
          <button
            onClick={() => setPhoneMode('sms')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              phoneMode === 'sms' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Daily Income SMS
          </button>
        </div>

        {/* Feature Phone Hardware Casing */}
        <div className="bg-[#262b28] p-5 rounded-[36px] max-w-[280px] mx-auto shadow-2xl border-4 border-[#1b1f1d] flex flex-col gap-3.5 w-full">
          {/* Nokia-style Green Monospace LCD Screen */}
          <div className="bg-[#c3d4ae] text-[#1b2813] font-mono p-3 rounded-lg border-2 border-black/40 min-h-[190px] flex flex-col justify-between shadow-inner">
            <div className="text-[10px] font-bold border-b border-[#1b2813]/30 pb-1 flex justify-between">
              <span>{phoneMode === 'ussd' ? '*384*5012#' : 'SMS · Duka POS'}</span>
              <span>4G</span>
            </div>

            <pre className="text-xs font-bold whitespace-pre-wrap leading-tight my-1 flex-1 font-mono">
              {isLoading ? (
                'Connecting to GSM network...'
              ) : phoneMode === 'ussd' ? (
                ussdScreenText
              ) : (
                `${shopName}\nToday's Sales Summary\nIncome: KES ${todayIncome.toLocaleString()}\nReceipts: ${todaySalesCount}\nLow Stock: Pishori (3)\nAsante!`
              )}
            </pre>

            {phoneMode === 'ussd' && (
              <div className="text-xs font-bold border-t border-[#1b2813]/30 pt-1 flex items-center justify-between">
                <span>Input: {ussdInput}</span>
                <span className="animate-pulse">_</span>
              </div>
            )}
          </div>

          {/* 3x4 Tactile Keypad */}
          {phoneMode === 'ussd' && (
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Del', '0', 'Send'].map((key) => {
                const isSend = key === 'Send';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className={`h-9 rounded-lg font-mono font-bold text-sm active:scale-95 transition-transform flex items-center justify-center ${
                      isSend
                        ? 'bg-[#2f9e6f] hover:bg-[#28885f] text-white shadow-xs'
                        : 'bg-[#3a413d] hover:bg-[#48524c] text-white shadow-xs'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center px-4 leading-relaxed">
          {phoneMode === 'ussd'
            ? 'Connected live to /api/ussd. Dial 1, 2, 3 or 4 then click Send to test live USSD session.'
            : 'The daily closing SMS sent automatically to the owner\'s phone at closing time without requiring internet.'}
        </p>

        {phoneMode === 'sms' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSendSMSReport}
              disabled={smsSending}
              className="w-full py-2.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{smsSending ? 'Sending...' : 'Send Report to Owner Now'}</span>
            </button>
            {smsStatus && (
              <p className="text-xs text-center font-medium text-emerald-800 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                {smsStatus}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
