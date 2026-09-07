import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import type { EscrowRecord } from '../../lib/types/schema';

interface EscrowStatusCardProps {
  escrows: EscrowRecord[];
  onReleaseEscrow: (escrowId: string) => Promise<void>;
  loading: boolean;
}

export const EscrowStatusCard: React.FC<EscrowStatusCardProps> = ({
  escrows,
  onReleaseEscrow,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  if (escrows.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{t('deals.escrowLedgerTitle')}</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">{t('deals.escrowLedgerSubtitle')}</span>
      </div>

      <div className="space-y-2">
        {escrows.map((record) => (
          <div
            key={record.id}
            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">{record.escrowAccountRef}</span>
                {record.status === 'SECURED' ? (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold text-[9px] rounded-full">
                    {isHindi ? 'सुरक्षित' : 'LOCKED'}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 font-bold text-[9px] rounded-full">
                    {isHindi ? 'जारी' : 'DISBURSED'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Deal #{record.dealId.slice(-6)} • {new Date(record.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')}
              </p>
            </div>

            <div className="text-right flex items-center gap-3">
              <div>
                <span className="text-sm font-black text-slate-900 font-display">
                  ₹{record.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {record.status === 'SECURED' ? t('deals.heldInVault') : t('deals.paidToFarmer')}
                </span>
              </div>

              {record.status === 'SECURED' && (
                <button
                  onClick={() => onReleaseEscrow(record.id)}
                  id={`release-escrow-${record.id}`}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {t('deals.releaseBtn')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
