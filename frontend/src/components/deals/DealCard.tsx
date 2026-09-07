import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, CheckCircle2, Lock, ShieldCheck, ChevronRight, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import type { Deal, DealStatus } from '../../lib/types/schema';
import { translateDealStatus } from '../../i18n/dynamic-translations';

interface DealCardProps {
  deal: Deal;
  onAdvanceStatus: (dealId: string, nextStatus: DealStatus) => Promise<void>;
  onNegotiate?: (dealId: string, counterPrice: number) => Promise<void>;
  onAccept?: (dealId: string) => Promise<void>;
  loading: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onAdvanceStatus,
  onNegotiate,
  onAccept,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number>(deal.agreedPricePerQuintal || 2500);

  const isProposed = deal.status === 'PROPOSED';

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onNegotiate || counterPrice <= 0) return;
    await onNegotiate(deal.id, counterPrice);
    setShowCounter(false);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:border-emerald-300 transition-all space-y-3">
      {/* Header with Txn ID & Status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {deal.transactionRef}
            </span>
            <span className="text-[10px] text-slate-500">
              {new Date(deal.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 mt-1">{deal.buyerName}</h4>
          <p className="text-[11px] text-slate-500">{deal.buyerLocation} • {deal.buyerType}</p>
        </div>

        <div>
          {deal.status === 'PROPOSED' && (
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded-full border border-indigo-300 flex items-center gap-1 animate-pulse">
              <TrendingUp className="w-3 h-3 text-indigo-700" /> {translateDealStatus(deal.status)}
            </span>
          )}
          {deal.status === 'PAYMENT_HELD' && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" /> {translateDealStatus(deal.status)}
            </span>
          )}
          {deal.status === 'DISPATCHED' && (
            <span className="px-2.5 py-1 bg-sky-100 text-sky-900 text-[10px] font-bold rounded-full border border-sky-300 flex items-center gap-1">
              <Truck className="w-3 h-3 text-sky-700 animate-bounce" /> {translateDealStatus(deal.status)}
            </span>
          )}
          {deal.status === 'COMPLETED' && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" /> {translateDealStatus(deal.status)}
            </span>
          )}
        </div>
      </div>

      {/* Pricing & Escrow Details */}
      <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block">
            {isProposed ? t('deals.proposedPrice') : t('deals.agreedRate')}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-900">
              ₹{deal.agreedPricePerQuintal.toLocaleString('en-IN')}{t('dashboard.perQuintal')}
            </span>
            {deal.isNegotiated && (
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-black rounded">
                {t('deals.negotiatedBadge')}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">{t('deals.totalEscrowValue')}</span>
          <span className="text-sm font-black text-emerald-700 font-display">
            ₹{deal.totalDealAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Interactive Progression Workflow Steps */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-2.5">
          <span className={`font-semibold ${deal.status === 'PROPOSED' ? 'text-indigo-700' : 'text-slate-400'}`}>
            {t('deals.step0')}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className={`font-semibold ${deal.status === 'PAYMENT_HELD' ? 'text-amber-700' : 'text-slate-400'}`}>
            {t('deals.step1')}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className={`font-semibold ${deal.status === 'DISPATCHED' ? 'text-sky-700' : 'text-slate-400'}`}>
            {t('deals.step2')}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className={`font-semibold ${deal.status === 'COMPLETED' ? 'text-emerald-700' : 'text-slate-400'}`}>
            {t('deals.step3')}
          </span>
        </div>

        {/* Action Button depending on state */}
        {deal.status === 'PROPOSED' && (
          <div className="space-y-2">
            {!showCounter ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAccept ? onAccept(deal.id) : onAdvanceStatus(deal.id, 'PAYMENT_HELD')}
                  id={`accept-deal-${deal.id}`}
                  disabled={loading}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1 transition-all"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{t('deals.acceptBtn')}</span>
                </button>

                <button
                  onClick={() => setShowCounter(true)}
                  id={`open-counter-deal-${deal.id}`}
                  disabled={loading}
                  className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t('deals.counterBtn')}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCounterSubmit} className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> {t('deals.counterOfferTitle')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCounter(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-800"
                  >
                    {t('deals.cancelCounter')}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(Number(e.target.value))}
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                      min={Math.round((deal.originalProposedPrice || 2000) * 0.5)}
                      max={Math.round((deal.originalProposedPrice || 2000) * 1.5)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    id={`submit-counter-${deal.id}`}
                    disabled={loading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                  >
                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                    <span>{t('deals.sendOfferBtn')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {deal.status === 'PAYMENT_HELD' && (
          <button
            onClick={() => onAdvanceStatus(deal.id, 'DISPATCHED')}
            id={`dispatch-deal-${deal.id}`}
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
            <span>{t('deals.dispatchBtn')}</span>
          </button>
        )}

        {deal.status === 'DISPATCHED' && (
          <button
            onClick={() => onAdvanceStatus(deal.id, 'COMPLETED')}
            id={`complete-deal-${deal.id}`}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{t('deals.confirmDeliveryBtn')} (₹{deal.totalDealAmount.toLocaleString('en-IN')})</span>
          </button>
        )}

        {deal.status === 'COMPLETED' && (
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>₹{deal.totalDealAmount.toLocaleString('en-IN')} {t('deals.disbursedMsg')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
