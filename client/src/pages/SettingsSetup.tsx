import React, { useState } from 'react';
import { Smartphone, Send, MessageSquare, Save, Terminal } from 'lucide-react';
import { ShopSettings, OutboxItem } from '../types/index.js';
import { api } from '../services/api.js';

interface SettingsSetupProps {
  settings: ShopSettings;
  outbox: OutboxItem[];
  isOnline: boolean;
  onUpdateSettings: (newSettings: Partial<ShopSettings>) => void;
  onOpenPhoneSimulator: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsSetup: React.FC<SettingsSetupProps> = ({
  settings,
  outbox,
  isOnline,
  onUpdateSettings,
  onOpenPhoneSimulator,
  onShowToast,
}) => {
  const [shop, setShop] = useState(settings.shop);
  const [till, setTill] = useState(settings.till);
  const [user, setUser] = useState(settings.user);
  const [key, setKey] = useState(settings.key);
  const [sender, setSender] = useState(settings.sender);
  const [sandbox, setSandbox] = useState(settings.sandbox);
  const [owner, setOwner] = useState(settings.owner);
  const [daily, setDaily] = useState(settings.daily);
  const [reportTime, setReportTime] = useState(settings.reportTime);

  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      shop: shop.trim(),
      till: till.trim(),
      user: user.trim(),
      key: key.trim(),
      sender: sender.trim(),
      sandbox,
      owner: owner.trim(),
      daily,
      reportTime,
    });
    onShowToast('Settings saved successfully!');
  };

  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      onShowToast('Enter a phone number to test SMS.');
      return;
    }
    setTestSending(true);
    try {
      await api.sendSMS(testPhone, `Test from ${shop}. Africa's Talking SMS integration is active!`);
      onShowToast(isOnline ? `Test SMS dispatched to ${testPhone}` : 'SMS queued in offline outbox');
      setTestPhone('');
    } catch (err: any) {
      onShowToast('SMS queued in outbox');
    } finally {
      setTestSending(false);
    }
  };

  const httpPreview = `POST https://${sandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com'}/version1/messaging\napiKey: ${key ? '••••' + key.slice(-4) : '(not set)'}\nAccept: application/json\n\nusername=${sandbox ? 'sandbox' : user || 'username'}\nto=${testPhone || '+254700000000'}${sender ? '\nfrom=' + sender : ''}\nmessage=Test from ${shop}`;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
          Shop & Africa's Talking Configuration
        </h3>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Shop Name
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-emerald-600"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Username
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-emerald-600"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Sender ID (Optional)
            <input
              type="text"
              placeholder="e.g. BIZPOA"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-emerald-600"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Africa's Talking API Key
          <input
            type="password"
            placeholder="Paste your API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-emerald-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          M-Pesa Till Number
          <input
            type="text"
            inputMode="numeric"
            value={till}
            onChange={(e) => setTill(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-emerald-600"
          />
        </label>

        <label className="flex items-center gap-2 p-2.5 bg-[#EEF1EE] rounded-xl text-xs font-medium text-gray-800">
          <input
            type="checkbox"
            checked={sandbox}
            onChange={(e) => setSandbox(e.target.checked)}
            className="w-4 h-4 text-[#0F7B5A] rounded-sm accent-[#0F7B5A]"
          />
          <div>
            <span className="font-bold block">Sandbox Mode</span>
            <span className="text-[11px] text-[#5C6962]">
              Dispatches SMS messages to Africa's Talking simulator
            </span>
          </div>
        </label>

        <button
          type="submit"
          className="w-full py-2.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Shop Settings</span>
        </button>
      </form>

      {/* Feature Phones & USSD Section */}
      <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            Feature Phones without Internet
          </h3>
          <p className="text-xs text-[#5C6962] mt-0.5 leading-relaxed">
            The shop owner can check income, yesterday's sales, and low stock from any basic GSM phone via USSD or daily SMS.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Owner Phone Number
          <input
            type="tel"
            inputMode="tel"
            placeholder="07XX XXX XXX or +254..."
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-emerald-600"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={daily}
              onChange={(e) => setDaily(e.target.checked)}
              className="w-4 h-4 accent-[#0F7B5A]"
            />
            <span>Daily Closing SMS</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <span>Time:</span>
            <select
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
              className="flex-1 px-2 py-1 bg-[#EEF1EE] border border-gray-200 rounded-lg text-xs font-mono font-bold"
            >
              {['18:00', '19:00', '20:00', '21:00', '22:00'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="p-3 bg-[#EEF1EE] rounded-xl flex flex-col gap-1.5 text-xs font-mono text-gray-800">
          <div className="flex justify-between">
            <span className="text-[#5C6962]">USSD Code:</span>
            <b className="text-[#0F7B5A]">*384*5012#</b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C6962]">SMS Keywords:</span>
            <b>SALES · STOCK</b>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPhoneSimulator}
          className="w-full py-2.5 bg-[#14201B] hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Launch Basic Feature Phone Simulator</span>
        </button>
      </div>

      {/* Test SMS Dispatcher */}
      <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
          Send a Test SMS
        </h3>

        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            placeholder="07XX XXX XXX"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-emerald-600"
          />
          <button
            onClick={handleSendTestSMS}
            disabled={testSending}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>

        {/* Africa's Talking HTTP Request Preview Box */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase">
            <Terminal className="w-3.5 h-3.5" />
            <span>HTTP Request Preview</span>
          </div>
          <pre className="p-3 bg-[#1B1F1D] text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
            {httpPreview}
          </pre>
        </div>
      </div>

      {/* Africa's Talking Outbox Message Log */}
      <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            SMS Outbox Feed ({outbox.length})
          </h3>
          <MessageSquare className="w-4 h-4 text-[#5C6962]" />
        </div>

        {outbox.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">No SMS messages sent yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {outbox.slice(0, 8).map((msg) => (
              <div key={msg.id} className="py-2.5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-gray-900">{msg.to}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      msg.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : msg.status === 'sending'
                        ? 'bg-sky-100 text-sky-800'
                        : msg.status === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {msg.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{msg.text.split('\n').join(' · ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
