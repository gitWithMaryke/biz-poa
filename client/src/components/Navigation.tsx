import React from 'react';
import { ShoppingCart, Package, BarChart3, Settings } from 'lucide-react';
import { TabType } from '../types/index.js';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  lowStockCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const tabs = [
    { id: 'sell' as TabType, label: 'Sell', icon: ShoppingCart },
    { id: 'stock' as TabType, label: 'Stock', icon: Package, badge: lowStockCount },
    { id: 'sales' as TabType, label: 'Sales', icon: BarChart3 },
    { id: 'setup' as TabType, label: 'Setup', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#DAE1DC] grid grid-cols-4 px-2 py-1.5 z-30 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl relative transition-all ${
              isActive ? 'text-[#0F7B5A] font-bold' : 'text-[#5C6962] hover:text-gray-900 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
