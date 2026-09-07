import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Wallet, ArrowUpRight, ShieldCheck, ChevronRight } from 'lucide-react';
import type { FarmerWallet } from '../../lib/types/schema';

interface QuickStatsProps {
  wallet: FarmerWallet | null;
  activeDealsCount: number;
  onOpenWallet: () => void;
  onOpenDeals: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  wallet,
  activeDealsCount,
  onOpenWallet,
  onOpenDeals,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Escrow Protected Funds Card */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
          <ShieldCheck className="w-32 h-32" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-white/10 rounded-lg">
              <Lock className="w-4 h-4 text-emerald-300" />
            </span>
            <span className="text-xs font-semibold text-emerald-200">{t('dashboard.escrowTitle')}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-400/20">
            {t('dashboard.protected')}
          </span>
        </div>

        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            ₹{(wallet?.escrowLockedBalance || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-emerald-200/80 mt-0.5">
            {t('dashboard.escrowSubtitle')}
          </p>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-300 font-medium">
            {wallet?.activeDealsCount || activeDealsCount} {t('dashboard.activeDealsInEscrow')}
          </span>
          <button
            onClick={onOpenDeals}
            id="quick-view-deals-btn"
            className="text-white hover:text-emerald-200 font-bold flex items-center gap-1 group text-[11px]"
          >
            <span>{t('dashboard.viewDeals')}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Available Balance Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">{t('dashboard.availableForPayout')}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {t('dashboard.totalSettled')}: ₹{(wallet?.totalSettledEarnings || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
              ₹{(wallet?.availableBalance || 0).toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-slate-500">{t('dashboard.payoutSubtitle')}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onOpenWallet}
            id="quick-withdraw-btn"
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>{t('dashboard.instantPayout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
