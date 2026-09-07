import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, ArrowUpRight, ArrowDownLeft, Lock, History } from 'lucide-react';
import type { FarmerWallet } from '../../lib/types/schema';

interface WalletViewProps {
  wallet: FarmerWallet | null;
  onOpenPayout: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ wallet, onOpenPayout }) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs text-emerald-200 font-semibold">{t('wallet.title')}</span>
              <p className="text-[11px] text-slate-400">{t('wallet.subtitle')}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 text-xs font-bold rounded-full border border-emerald-400/20">
            {t('wallet.active')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          <div>
            <span className="text-xs text-slate-400 font-medium">{t('wallet.availableWithdrawal')}</span>
            <div className="text-3xl sm:text-4xl font-black font-display text-white mt-1">
              ₹{(wallet?.availableBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="sm:border-l sm:border-white/10 sm:pl-4">
            <span className="text-xs text-amber-300/90 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> {t('wallet.lockedInEscrow')}
            </span>
            <div className="text-2xl sm:text-3xl font-black font-display text-amber-300 mt-1">
              ₹{(wallet?.escrowLockedBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {t('wallet.totalLifetime')}: <strong className="text-white">₹{(wallet?.totalSettledEarnings || 0).toLocaleString('en-IN')}</strong>
          </span>

          <button
            onClick={onOpenPayout}
            id="wallet-withdraw-action-btn"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t('wallet.withdrawFunds')}</span>
          </button>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">{t('wallet.historyTitle')}</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{t('wallet.historySubtitle')}</span>
        </div>

        <div className="space-y-2">
          {(!wallet?.transactions || wallet.transactions.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {t('wallet.noTransactions')}
            </div>
          ) : (
            wallet.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      tx.type === 'CREDIT_SETTLEMENT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.type === 'DEBIT_WITHDRAWAL'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {tx.type === 'CREDIT_SETTLEMENT' && <ArrowDownLeft className="w-4 h-4" />}
                    {tx.type === 'DEBIT_WITHDRAWAL' && <ArrowUpRight className="w-4 h-4" />}
                    {tx.type === 'ESCROW_LOCK' && <Lock className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">{tx.description}</h4>
                    <p className="text-[10px] text-slate-500">
                      Ref: {tx.referenceId} • {new Date(tx.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black font-display ${
                      tx.type === 'CREDIT_SETTLEMENT'
                        ? 'text-emerald-700'
                        : tx.type === 'DEBIT_WITHDRAWAL'
                        ? 'text-red-600'
                        : 'text-amber-700'
                    }`}
                  >
                    {tx.type === 'DEBIT_WITHDRAWAL' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-700">
                    {isHindi ? 'सफल' : tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
