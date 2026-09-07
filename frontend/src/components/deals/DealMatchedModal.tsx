import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import type { ProduceLot, Deal } from '../../lib/types/schema';
import { translateCrop } from '../../i18n/dynamic-translations';

interface DealMatchedModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: ProduceLot | null;
  deal: Deal | null;
  onViewDeals: () => void;
  onAcceptDeal?: (dealId: string) => Promise<void>;
  onNegotiateDeal?: (dealId: string, counterPrice: number) => Promise<void>;
}

export const DealMatchedModal: React.FC<DealMatchedModalProps> = ({
  isOpen,
  onClose,
  lot,
  deal,
  onViewDeals,
  onAcceptDeal,
  onNegotiateDeal,
}) => {
  const { t } = useTranslation();
  
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [negotiationError, setNegotiationError] = useState<string | null>(null);

  useEffect(() => {
    if (deal) {
      setCounterPrice(deal.agreedPricePerQuintal || lot?.askingPricePerQuintal || 2500);
      setShowCounterInput(false);
      setIsReviewing(false);
      setReviewSuccess(deal.status === 'PAYMENT_HELD' || deal.status === 'DISPATCHED' || deal.status === 'COMPLETED');
      setNegotiationError(null);
    }
  }, [deal, lot]);

  if (!isOpen || !deal || !lot) return null;

  const isProposed = deal.status === 'PROPOSED' && !reviewSuccess;
  const quantity = lot.quantityQuintals || 1;
  const calculatedCounterTotal = Math.round(counterPrice * quantity * 100) / 100;

  // Handle direct Accept
  const handleAccept = async () => {
    setIsReviewing(true);
    try {
      if (onAcceptDeal) {
        await onAcceptDeal(deal.id);
      }
      setReviewSuccess(true);
    } catch {
      setNegotiationError('Failed to accept deal');
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle Counter Offer
  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (counterPrice <= 0) return;

    setIsReviewing(true);
    setNegotiationError(null);

    // 1.5s simulated buyer review delay for realism
    setTimeout(async () => {
      try {
        if (onNegotiateDeal) {
          await onNegotiateDeal(deal.id, counterPrice);
        }
        setReviewSuccess(true);
      } catch (err: any) {
        setNegotiationError(err?.message || 'Counter-offer rejected. Try a price closer to mandi rate.');
      } finally {
        setIsReviewing(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 text-center">
        {/* Header */}
        <div className={`p-6 text-white relative transition-colors duration-300 ${
          isProposed && !reviewSuccess
            ? 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900'
            : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-900'
        }`}>
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
            {isProposed && !reviewSuccess ? (
              <TrendingUp className="w-9 h-9 text-indigo-200" />
            ) : (
              <Handshake className="w-9 h-9 text-emerald-200" />
            )}
          </div>

          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm inline-block mb-2 ${
            isProposed && !reviewSuccess ? 'bg-amber-400 text-slate-900' : 'bg-emerald-300 text-emerald-950'
          }`}>
            {isProposed && !reviewSuccess ? t('deals.buyerMatchedTitle') : t('deals.dealSecuredTitle')}
          </span>

          <h2 className="text-xl font-black font-display">
            {isProposed && !reviewSuccess ? t('deals.reviewProposedDeal') : t('deals.dealSecuredTitle')}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Txn Ref: <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{deal.transactionRef}</code>
          </p>
        </div>

        {/* Details & Negotiation Form */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{t('deals.matchedBuyer')}</span>
                <h4 className="text-sm font-bold text-slate-900">{deal.buyerName}</h4>
                <span className="text-[10px] text-slate-500">{deal.buyerLocation} • {deal.buyerType}</span>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg">
                {t('deals.verifiedBuyer')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">{t('deals.cropAndQuantity')}</span>
                <span className="font-bold text-slate-800">
                  {translateCrop(lot.cropName)} ({quantity} qtl)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {isProposed && !reviewSuccess ? t('deals.proposedPrice') : t('deals.agreedPrice')}
                </span>
                <span className="font-bold text-emerald-700">
                  ₹{deal.agreedPricePerQuintal}{t('dashboard.perQuintal')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">{t('deals.totalEscrowAmount')}:</span>
              <span className="text-lg font-black text-slate-900 font-display">
                ₹{deal.totalDealAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Reviewing Simulated State */}
          {isReviewing && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-indigo-900">{t('deals.buyerReviewingOffer')}</p>
              <span className="text-[10px] text-indigo-700">{deal.buyerName} is reviewing ₹{counterPrice}/qtl...</span>
            </div>
          )}

          {/* Success Banner after Accept/Negotiate */}
          {reviewSuccess && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left flex items-start gap-2.5 animate-fadeIn">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-bold">
                  ₹{deal.totalDealAmount.toLocaleString('en-IN')} {t('deals.lockedInVaultNotice')}
                </p>
                <p className="text-[11px] text-emerald-800">
                  {deal.isNegotiated ? t('deals.negotiatedRateConfirmed') : t('deals.lockedInVaultDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Error notice if any */}
          {negotiationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold text-left">
              {negotiationError}
            </div>
          )}

          {/* PROPOSED State Actions: Accept or Counter-Offer */}
          {isProposed && !isReviewing && !reviewSuccess && (
            <div className="space-y-3 pt-1">
              {!showCounterInput ? (
                <div className="space-y-2">
                  <button
                    onClick={handleAccept}
                    id="accept-proposed-deal-btn"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('deals.acceptProposedRateBtn')} (₹{deal.agreedPricePerQuintal}{t('dashboard.perQuintal')})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCounterInput(true)}
                    id="open-counter-offer-btn"
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t('deals.negotiateCounterOfferBtn')}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCounterSubmit} className="space-y-2.5 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200 text-left animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      {t('deals.counterOfferTitle')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCounterInput(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      {t('deals.cancelCounter')}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      {t('deals.enterCounterPriceLabel')}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={counterPrice || ''}
                          onChange={(e) => setCounterPrice(Number(e.target.value))}
                          id="counter-price-input"
                          min={Math.round((deal.originalProposedPrice || 2000) * 0.5)}
                          max={Math.round((deal.originalProposedPrice || 2000) * 1.5)}
                          step="10"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      {/* Quick Adjust Buttons */}
                      <button
                        type="button"
                        onClick={() => setCounterPrice((prev) => prev + 50)}
                        className="px-2 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-50"
                      >
                        +₹50
                      </button>
                      <button
                        type="button"
                        onClick={() => setCounterPrice((prev) => Math.max(100, prev - 50))}
                        className="px-2 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-50"
                      >
                        -₹50
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-indigo-100 font-bold text-indigo-950">
                    <span>{t('deals.newTotalDealValue')}:</span>
                    <span className="text-emerald-700 font-black font-display">₹{calculatedCounterTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    type="submit"
                    id="submit-counter-offer-btn"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t('deals.sendCounterOfferToBuyerBtn')}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Post-Accepted / Locked Action Buttons */}
          {(reviewSuccess || !isProposed) && (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onViewDeals();
                }}
                id="view-matched-deal-btn"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{t('deals.trackDealBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                {t('deals.closeBtn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
