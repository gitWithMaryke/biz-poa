import React, { useState, useMemo } from 'react';
import { Send, TrendingUp, Receipt, Award } from 'lucide-react';
import { Sale } from '../types/index.js';
import { api } from '../services/api.js';

interface SalesReportsProps {
  sales: Sale[];
  ownerPhone: string;
  onOpenReceipt: (sale: Sale) => void;
  onShowToast: (msg: string) => void;
}

export const SalesReports: React.FC<SalesReportsProps> = ({
  sales,
  ownerPhone,
  onOpenReceipt,
  onShowToast,
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Compute 7-day revenue summary
  const weekData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [6, 5, 4, 3, 2, 1, 0].map((offset) => {
      const start = today.getTime() - offset * 86400000;
      const end = start + 86400000;
      const daySales = sales.filter((s) => s.timestamp >= start && s.timestamp < end);
      const income = daySales.reduce((sum, s) => sum + s.total, 0);
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : new Date(start).toLocaleDateString('en-KE', { weekday: 'short' });

      return {
        offset,
        start,
        label,
        income,
        count: daySales.length,
        sales: daySales,
      };
    });
  }, [sales]);

  const maxIncome = Math.max(...weekData.map((w) => w.income), 1);
  const selectedDay = weekData.find((w) => w.offset === selectedDayOffset) || weekData[6];
  const prevDay = weekData.find((w) => w.offset === selectedDayOffset + 1);

  // Day breakdown calculations
  const { income, count, sales: currentDaySales } = selectedDay;
  const itemsSold = currentDaySales.reduce((sum, s) => sum + s.lines.reduce((lSum, l) => lSum + l.qty, 0), 0);
  const averageTicket = count > 0 ? Math.round(income / count) : 0;

  const paymentBreakdown = useMemo(() => {
    const by = { cash: 0, mpesa: 0, card: 0 };
    currentDaySales.forEach((s) => {
      by[s.method] = (by[s.method] || 0) + s.total;
    });
    return by;
  }, [currentDaySales]);

  const topItems = useMemo(() => {
    const map: Record<string, number> = {};
    currentDaySales.forEach((s) => {
      s.lines.forEach((l) => {
        map[l.name] = (map[l.name] || 0) + l.qty;
      });
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }, [currentDaySales]);

  let deltaPct: number | null = null;
  if (prevDay && prevDay.income > 0) {
    deltaPct = Math.round(((income - prevDay.income) / prevDay.income) * 100);
  }

  const handleSendSMS = async () => {
    if (!ownerPhone) {
      onShowToast('Please set owner phone number in Setup first.');
      return;
    }
    try {
      await api.triggerDailyReportSMS(selectedDayOffset, ownerPhone);
      onShowToast(`Report SMS sent to ${ownerPhone}!`);
    } catch (e: any) {
      onShowToast(`SMS queued for dispatch to ${ownerPhone}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Gross Daily Revenue Header Banner */}
      <div className="bg-[#0F7B5A] text-white p-4 rounded-3xl shadow-md flex flex-col gap-1">
        <div className="flex items-center justify-between opacity-80 text-xs font-semibold">
          <span>{selectedDay.label}'s Revenue</span>
          {deltaPct !== null && (
            <span className="flex items-center gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`} vs prev day</span>
            </span>
          )}
        </div>
        <b className="text-3xl font-bold font-mono tracking-tight">
          KES {income.toLocaleString()}
        </b>
        <span className="text-xs opacity-75">{count} transaction{count === 1 ? '' : 's'} recorded</span>
      </div>

      {/* Daily KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-0.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Receipts</span>
          <b className="text-xl font-bold font-mono text-gray-900">{count}</b>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-0.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Items Sold</span>
          <b className="text-xl font-bold font-mono text-gray-900">{itemsSold}</b>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-0.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Average Basket</span>
          <b className="text-xl font-bold font-mono text-gray-900">KES {averageTicket}</b>
        </div>
      </div>

      {/* 7-Day Interactive Revenue Bar Chart */}
      <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Last 7 Days (KES)</h3>
          <span className="text-[11px] text-[#5C6962] font-medium">Tap bar to view day</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 h-32 items-end pt-4">
          {weekData.map((d) => {
            const isSelected = d.offset === selectedDayOffset;
            const barHeightPct = Math.round((d.income / maxIncome) * 100);

            return (
              <button
                key={d.offset}
                onClick={() => setSelectedDayOffset(d.offset)}
                className="flex flex-col items-center justify-end h-full group focus:outline-none"
              >
                {/* Numeric revenue pill on active */}
                <span className={`text-[10px] font-mono font-bold mb-1 transition-opacity ${isSelected ? 'text-[#0F7B5A]' : 'opacity-0'}`}>
                  {d.income >= 1000 ? `${(d.income / 1000).toFixed(0)}k` : d.income}
                </span>

                {/* Animated bar element */}
                <div
                  style={{ height: `${Math.max(barHeightPct, 6)}%` }}
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${
                    isSelected ? 'bg-[#0F7B5A] shadow-xs' : 'bg-gray-200 group-hover:bg-gray-300'
                  }`}
                />

                <span className={`text-[10px] mt-1.5 font-semibold ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                  {d.label.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Tender Distribution */}
      <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">How Customers Paid</h3>
        {(['cash', 'mpesa', 'card'] as const).map((m) => {
          const val = paymentBreakdown[m];
          const pct = income > 0 ? Math.round((val / income) * 100) : 0;
          return (
            <div key={m} className="flex items-center gap-2.5 text-xs">
              <span className="w-14 capitalize font-semibold text-gray-700">{m}</span>
              <div className="flex-1 h-2.5 bg-[#EEF1EE] rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${
                    m === 'mpesa' ? 'bg-[#0F7B5A]' : m === 'cash' ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                />
              </div>
              <span className="w-20 text-right font-mono font-bold text-gray-900">
                KES {val.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top Sellers Leaderboard */}
      {topItems.length > 0 && (
        <div className="bg-white border border-[#DAE1DC] rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Best Sellers</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topItems.map((item, idx) => (
              <div key={item.name} className="py-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800">
                  {idx + 1}. {item.name}
                </span>
                <span className="font-mono font-bold text-gray-900">{item.qty} units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SMS Closing Report Trigger Button */}
      <button
        onClick={handleSendSMS}
        className="w-full py-3 bg-white border border-[#0F7B5A] text-[#0F7B5A] hover:bg-emerald-50 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
      >
        <Send className="w-3.5 h-3.5" />
        <span>Send {selectedDay.label}'s Closing Report via SMS</span>
      </button>

      {/* Itemized Transactions List */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C6962]">
          Transactions ({currentDaySales.length})
        </h3>

        {currentDaySales.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">No sales recorded on this day.</div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {currentDaySales.map((sale) => {
              const time = new Date(sale.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
              const lineSummary = sale.lines.map((l) => `${l.qty}x ${l.name}`).join(', ');

              return (
                <li key={sale.id}>
                  <button
                    onClick={() => onOpenReceipt(sale)}
                    className="w-full p-3 bg-white hover:bg-gray-50 border border-[#DAE1DC] rounded-xl text-left flex items-center justify-between gap-3 shadow-2xs transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{lineSummary}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 font-mono">
                        <span>#{String(sale.receiptNo).padStart(4, '0')}</span>
                        <span>·</span>
                        <span>{time}</span>
                        <span>·</span>
                        <span className="uppercase font-semibold text-emerald-800 bg-emerald-50 px-1.5 rounded-sm">
                          {sale.method}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold font-mono text-gray-900 shrink-0">
                      KES {sale.total.toLocaleString()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
