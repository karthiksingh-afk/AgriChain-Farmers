import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, PlusCircle, Handshake, Package, Wallet } from 'lucide-react';

export type NavTab = 'home' | 'deals' | 'inventory' | 'wallet';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenListLot: () => void;
  activeDealsCount: number;
  activeLotsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenListLot,
  activeDealsCount,
  activeLotsCount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg sm:max-w-md sm:mx-auto sm:bottom-4 sm:rounded-2xl sm:border">
      <div className="flex items-center justify-around py-2 px-2">
        {/* Home */}
        <button
          onClick={() => onChangeTab('home')}
          id="nav-home-btn"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">{t('nav.home')}</span>
        </button>

        {/* Deals */}
        <button
          onClick={() => onChangeTab('deals')}
          id="nav-deals-btn"
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'deals'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Handshake className={`w-5 h-5 ${activeTab === 'deals' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">{t('nav.deals')}</span>
          {activeDealsCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeDealsCount}
            </span>
          )}
        </button>

        {/* Action Button: List Lot */}
        <button
          onClick={onOpenListLot}
          id="nav-list-lot-btn"
          className="flex flex-col items-center -mt-5 group"
          title={t('nav.sellLot')}
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-active:scale-95 transition-transform">
            <PlusCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">{t('nav.sellLot')}</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => onChangeTab('inventory')}
          id="nav-inventory-btn"
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'inventory'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className={`w-5 h-5 ${activeTab === 'inventory' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">{t('nav.inventory')}</span>
          {activeLotsCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-slate-700 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeLotsCount}
            </span>
          )}
        </button>

        {/* Wallet */}
        <button
          onClick={() => onChangeTab('wallet')}
          id="nav-wallet-btn"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'wallet'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">{t('nav.wallet')}</span>
        </button>
      </div>
    </div>
  );
};
