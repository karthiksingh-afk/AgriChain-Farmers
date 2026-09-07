import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, Truck, ArrowUpRight } from 'lucide-react';
import type { MandiBenchmark } from '../../lib/types/schema';
import { translateCrop } from '../../i18n/dynamic-translations';

interface MarketOverviewProps {
  overview: {
    totalArrivalsMt: number;
    totalActiveBuyers: number;
    topGainers: MandiBenchmark[];
    totalLiveLots: number;
  } | null;
  onSelectCrop: (cropName: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ overview, onSelectCrop }) => {
  const { t } = useTranslation();
  if (!overview) return null;

  return (
    <div className="space-y-3">
      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">{t('dashboard.mandiArrivals')}</span>
          <span className="text-sm sm:text-base font-black text-slate-900 font-display">
            {overview.totalArrivalsMt.toLocaleString('en-IN')} <span className="text-[10px] font-medium text-slate-500">MT</span>
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">{t('dashboard.activeBuyers')}</span>
          <span className="text-sm sm:text-base font-black text-slate-900 font-display">
            {overview.totalActiveBuyers} <span className="text-[10px] font-medium text-emerald-600">{t('dashboard.live')}</span>
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">{t('dashboard.activeLots')}</span>
          <span className="text-sm sm:text-base font-black text-slate-900 font-display">
            {overview.totalLiveLots} <span className="text-[10px] font-medium text-slate-500">{t('dashboard.listed')}</span>
          </span>
        </div>
      </div>

      {/* Top Price Gainers */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            {t('dashboard.topGainersTitle')}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {t('dashboard.highDemand')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {overview.topGainers.map((crop) => (
            <button
              key={crop.id}
              onClick={() => onSelectCrop(crop.cropName)}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 text-left transition-colors group"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  {translateCrop(crop.cropName)}
                </p>
                <p className="text-[10px] text-slate-500">{crop.marketName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 font-display">₹{crop.modalRatePerQuintal}</span>
                <span className="text-[9px] text-emerald-600 font-bold flex items-center justify-end">
                  +3.2% <ArrowUpRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
