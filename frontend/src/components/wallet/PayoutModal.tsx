import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { EscrowService } from '../../services/escrow-service';
import type { FarmerWallet } from '../../lib/types/schema';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string;
  wallet: FarmerWallet | null;
  onPayoutSuccess: (updatedWallet: FarmerWallet) => void;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  farmerId,
  wallet,
  onPayoutSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  const [amount, setAmount] = useState<number>(10000);
  const [destination, setDestination] = useState('9876543210@upi (Primary UPI)');
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableBalance = wallet?.availableBalance || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (amount <= 0) {
      setError(isHindi ? 'निकासी राशि शून्य से अधिक होनी चाहिए' : 'Amount must be greater than zero');
      return;
    }

    if (amount > availableBalance) {
      setError(
        isHindi
          ? `अपर्याप्त बैलेंस। उपलब्ध: ₹${availableBalance.toLocaleString('en-IN')}`
          : `Insufficient balance. Available: ₹${availableBalance.toLocaleString('en-IN')}`
      );
      return;
    }

    setLoading(true);

    const res = await EscrowService.requestWithdrawal(farmerId, Number(amount), destination);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    if (res.data) {
      setSuccessMsg(
        isHindi
          ? `₹${amount.toLocaleString('en-IN')} सफलतापूर्वक ${destination} पर भेज दिए गए!`
          : `₹${amount.toLocaleString('en-IN')} successfully sent to ${destination}!`
      );
      onPayoutSuccess(res.data.wallet);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">{t('wallet.payoutModalTitle')}</h2>
              <p className="text-xs text-emerald-100">{t('wallet.payoutModalSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleWithdraw} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">{t('wallet.availableBalance')}</span>
              <p className="text-xl font-black text-slate-900 font-display">
                ₹{availableBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <span className="px-2 py-1 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-lg">
              {t('wallet.instant24x7')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('wallet.withdrawalAmount')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">₹</span>
              <input
                type="number"
                id="payout-amount-input"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={availableBalance}
                min={1}
                required
                className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Destination Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('wallet.transferDestination')}</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setPayoutMethod('UPI'); setDestination('9876543210@upi (Primary UPI)'); }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  payoutMethod === 'UPI' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {t('wallet.upiOption')}
              </button>
              <button
                type="button"
                onClick={() => { setPayoutMethod('BANK'); setDestination('SBI A/C **** 4892 (IFSC: SBIN0001234)'); }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  payoutMethod === 'BANK' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {t('wallet.bankOption')}
              </button>
            </div>

            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center gap-1.5 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('wallet.zeroChargesNotice')}</span>
          </div>

          <button
            type="submit"
            id="payout-submit-btn"
            disabled={loading || availableBalance <= 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{t('wallet.confirmPayoutBtn')}</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
