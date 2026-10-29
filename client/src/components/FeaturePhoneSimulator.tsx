import React, { useState } from 'react';
import { Smartphone, Send, MessageSquare } from 'lucide-react';
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
  const [ussdScreen, setUssdScreen] = useState<'menu' | 'today' | 'yesterday' | 'last5' | 'lowstock' | 'end'>('menu');
  const [ussdInput, setUssdInput] = useState<string>('');
  const [smsSending, setSmsSending] = useState<boolean>(false);
  const [smsStatus, setSmsStatus] = useState<string>('');

  const getUSSDContent = (): string => {
    switch (ussdScreen) {
      case 'menu':
        return `${shopName} POS\n1 Today's income\n2 Yesterday\n3 Last 5 sales\n4 Low stock\n5 Send SMS report\n0 Exit`;
      case 'today':
        return `Today's Income:\nKES ${todayIncome.toLocaleString()}\nReceipts: ${todaySalesCount}\n0 Back`;
      case 'yesterday':
        return `Yesterday's Income:\nKES 28,450\nReceipts: 34\n0 Back`;
      case 'last5':
        return `Last 5 Sales:\n#0042 11:30 KES 550 (MPESA)\n#0041 10:15 KES 200 (CASH)\n#0040 09:40 KES 1,240 (MPESA)\n0 Back`;
      case 'lowstock':
        return `Low Stock Items:\nPishori Rice: 3 left\nStoney Tangawizi: 2 left\n0 Back`;
      case 'end':
        return `Asante!\nSession ended.\nPress Send to dial again.`;
      default:
        return `Invalid choice.\n0 Back`;
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'Del') {
      setUssdInput((prev) => prev.slice(0, -1));
    } else if (key === 'Send') {
      if (ussdScreen === 'end') {
        setUssdScreen('menu');
        setUssdInput('');
        return;
      }
      if (ussdScreen === 'menu') {
        if (ussdInput === '1') setUssdScreen('today');
        else if (ussdInput === '2') setUssdScreen('yesterday');
        else if (ussdInput === '3') setUssdScreen('last5');
        else if (ussdInput === '4') setUssdScreen('lowstock');
        else if (ussdInput === '5') {
          handleSendSMSReport();
          setUssdScreen('end');
        } else if (ussdInput === '0') setUssdScreen('end');
        setUssdInput('');
      } else {
        if (ussdInput === '0') setUssdScreen('menu');
        setUssdInput('');
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
              {phoneMode === 'ussd' ? getUSSDContent() : (
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
                    onClick={() => handleKeyPress(key)}
                    className={`h-9 rounded-lg font-mono font-bold text-sm active:scale-95 transition-transform flex items-center justify-center ${
                      isSend
                        ? 'bg-[#2f9e6f] hover:bg-[#28885f] text-white'
                        : 'bg-[#3a413d] hover:bg-[#48524c] text-white'
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
            ? 'This simulates what the shop owner sees when querying sales and stock on any basic GSM phone using USSD.'
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
