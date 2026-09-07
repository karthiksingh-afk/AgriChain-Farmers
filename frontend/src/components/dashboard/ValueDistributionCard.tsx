import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, ShieldCheck, Truck, Scale, Sparkles, Info } from 'lucide-react';

export const ValueDistributionCard: React.FC = () => {
  const { t } = useTranslation();
  const [activeModel, setActiveModel] = useState<'compare' | 'agrichain' | 'mandi'>('compare');

  // Representative standard illustrative breakdown per ₹100
  const mandiBreakdown = [
    { key: 'farmer', name: t('valueDist.farmerShare'), amount: 42, color: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', bgLight: 'bg-amber-50', icon: Users },
    { key: 'middlemen', name: t('valueDist.middlemen'), amount: 18, color: 'bg-rose-400', text: 'text-rose-700', border: 'border-rose-200', bgLight: 'bg-rose-50', icon: Users },
    { key: 'logistics', name: t('valueDist.transport'), amount: 15, color: 'bg-sky-400', text: 'text-sky-700', border: 'border-sky-200', bgLight: 'bg-sky-50', icon: Truck },
    { key: 'spoilage', name: t('valueDist.spoilage'), amount: 15, color: 'bg-slate-400', text: 'text-slate-700', border: 'border-slate-200', bgLight: 'bg-slate-100', icon: Scale },
    { key: 'intermediary', name: t('valueDist.intermediaries'), amount: 10, color: 'bg-orange-400', text: 'text-orange-700', border: 'border-orange-200', bgLight: 'bg-orange-50', icon: Users },
  ];

  const agrichainBreakdown = [
    { key: 'farmer', name: t('valueDist.farmerShareDirect'), amount: 85, color: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-300', bgLight: 'bg-emerald-50', icon: Sparkles },
    { key: 'coldLogistics', name: t('valueDist.coldLogistics'), amount: 10, color: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200', bgLight: 'bg-sky-50', icon: Truck },
    { key: 'platformFee', name: t('valueDist.platformFee'), amount: 3, color: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200', bgLight: 'bg-indigo-50', icon: TrendingUp },
    { key: 'escrowAssurance', name: t('valueDist.escrowAssurance'), amount: 2, color: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', bgLight: 'bg-teal-50', icon: ShieldCheck },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
            ₹100
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
              <span>{t('valueDist.title')}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                {t('valueDist.directModelBadge')}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">{t('valueDist.subtitle')}</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveModel('compare')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeModel === 'compare' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('valueDist.tabCompare')}
          </button>
          <button
            onClick={() => setActiveModel('agrichain')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeModel === 'agrichain' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('valueDist.tabAgriChain')} (₹85)
          </button>
          <button
            onClick={() => setActiveModel('mandi')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeModel === 'mandi' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('valueDist.tabMandi')} (₹42)
          </button>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="space-y-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70">
        {/* AgriChain Model Bar */}
        {(activeModel === 'compare' || activeModel === 'agrichain') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                {t('valueDist.agrichainDirectModel')}
              </span>
              <span className="font-black text-emerald-700 text-xs">
                {t('valueDist.farmerEarns')} <span className="text-sm font-display">₹85</span> / ₹100
                <span className="ml-1 text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  +102%
                </span>
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
              {agrichainBreakdown.map((item) => (
                <div
                  key={item.key}
                  style={{ width: `${item.amount}%` }}
                  className={`${item.color} h-full transition-all flex items-center justify-center text-[9px] font-black text-white`}
                  title={`${item.name}: ₹${item.amount}`}
                >
                  {item.amount >= 10 ? `₹${item.amount}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traditional Mandi Model Bar */}
        {(activeModel === 'compare' || activeModel === 'mandi') && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {t('valueDist.traditionalMandiModel')}
              </span>
              <span className="font-bold text-slate-700 text-xs">
                {t('valueDist.farmerEarns')} <span className="text-sm font-display text-amber-800">₹42</span> / ₹100
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
              {mandiBreakdown.map((item) => (
                <div
                  key={item.key}
                  style={{ width: `${item.amount}%` }}
                  className={`${item.color} h-full transition-all flex items-center justify-center text-[9px] font-black text-white`}
                  title={`${item.name}: ₹${item.amount}`}
                >
                  {item.amount >= 10 ? `₹${item.amount}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Breakdown Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {activeModel !== 'mandi' ? (
          <>
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-800 font-bold block">{t('valueDist.farmerNetShare')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-emerald-700 font-display">₹85</span>
                <span className="text-[10px] text-emerald-600 font-bold">(85%)</span>
              </div>
              <span className="text-[9px] text-emerald-800/80 mt-0.5 block">{t('valueDist.directEscrowDisbursed')}</span>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5">
              <span className="text-[10px] text-sky-800 font-bold block">{t('valueDist.directLogistics')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-sky-700 font-display">₹10</span>
                <span className="text-[10px] text-sky-600 font-bold">(10%)</span>
              </div>
              <span className="text-[9px] text-sky-800/80 mt-0.5 block">{t('valueDist.farmGatePickup')}</span>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
              <span className="text-[10px] text-indigo-800 font-bold block">{t('valueDist.platformFee')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-indigo-700 font-display">₹3</span>
                <span className="text-[10px] text-indigo-600 font-bold">(3%)</span>
              </div>
              <span className="text-[9px] text-indigo-800/80 mt-0.5 block">{t('valueDist.matchingTech')}</span>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-2.5">
              <span className="text-[10px] text-teal-800 font-bold block">{t('valueDist.escrowAssurance')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-teal-700 font-display">₹2</span>
                <span className="text-[10px] text-teal-600 font-bold">(2%)</span>
              </div>
              <span className="text-[9px] text-teal-800/80 mt-0.5 block">{t('valueDist.qualityAndEscrow')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <span className="text-[10px] text-amber-800 font-bold block">{t('valueDist.farmerNetShare')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-amber-700 font-display">₹42</span>
                <span className="text-[10px] text-amber-600 font-bold">(42%)</span>
              </div>
              <span className="text-[9px] text-amber-800/80 mt-0.5 block">{t('valueDist.delayedParchi')}</span>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-800 font-bold block">{t('valueDist.middlemen')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-rose-700 font-display">₹18</span>
                <span className="text-[10px] text-rose-600 font-bold">(18%)</span>
              </div>
              <span className="text-[9px] text-rose-800/80 mt-0.5 block">{t('valueDist.commissionAgents')}</span>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-800 font-bold block">{t('valueDist.spoilage')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-slate-700 font-display">₹15</span>
                <span className="text-[10px] text-slate-600 font-bold">(15%)</span>
              </div>
              <span className="text-[9px] text-slate-600 mt-0.5 block">{t('valueDist.openYardLoss')}</span>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5">
              <span className="text-[10px] text-sky-800 font-bold block">{t('valueDist.transport')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-sky-700 font-display">₹25</span>
                <span className="text-[10px] text-sky-600 font-bold">(25%)</span>
              </div>
              <span className="text-[9px] text-sky-800/80 mt-0.5 block">{t('valueDist.multiHopHandling')}</span>
            </div>
          </>
        )}
      </div>

      {/* Illustrative Disclaimer Note */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{t('valueDist.illustrativeDisclaimer')}</span>
      </div>
    </div>
  );
};
