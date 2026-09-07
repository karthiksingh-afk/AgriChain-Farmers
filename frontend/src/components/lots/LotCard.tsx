import React from 'react';
import { useTranslation } from 'react-i18next';
import { Thermometer, Award, Trash2, ShieldCheck, Lock } from 'lucide-react';
import type { ProduceLot } from '../../lib/types/schema';
import { translateCrop, translateLotStatus, translateGrade } from '../../i18n/dynamic-translations';
import { RouteInsightCard } from './RouteInsightCard';

interface LotCardProps {
  lot: ProduceLot;
  onDelete: (lotId: string) => void;
}

export const LotCard: React.FC<LotCardProps> = ({ lot, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:border-emerald-300 transition-all space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              #{lot.id.slice(-6)}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              lot.qualityGrade === 'GRADE_A'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {translateGrade(lot.qualityGrade)}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-1">{translateCrop(lot.cropName)}</h4>
          <p className="text-xs text-slate-500">{lot.variety} • {lot.storageLocation}</p>
        </div>

        <div className="text-right">
          <span className="text-base font-black text-slate-900 font-display block">
            {lot.quantityQuintals} <span className="text-xs font-normal text-slate-500">qtl</span>
          </span>
          <span className="text-xs font-bold text-emerald-700">₹{lot.askingPricePerQuintal}{t('dashboard.perQuintal')}</span>
        </div>
      </div>

      {/* Benchmark & Value comparison */}
      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block">{t('lots.mandiBenchmark')}</span>
          <span className="font-semibold text-slate-700">₹{lot.mandiBenchmarkRate}{t('dashboard.perQuintal')}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">{t('lots.totalLotValue')}</span>
          <span className="font-black text-slate-900 font-display">₹{lot.totalLotValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Cold Chain & Quality Certificate Telemetry */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Thermometer className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('lots.coldChain')}: <strong>{lot.coldChainTempC}°C</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 justify-end">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('lots.qcScore')}: <strong>{lot.qualityScore}%</strong></span>
        </div>
      </div>

      {/* AI Route Optimization Insight Card */}
      <div className="pt-1">
        <RouteInsightCard lot={lot} />
      </div>

      {/* Footer Status & Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          {lot.status === 'STOCK_HELD' && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
              📦 {translateLotStatus(lot.status)}
            </span>
          )}
          {lot.status === 'DEAL_ACTIVE' && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" /> {translateLotStatus(lot.status)}
            </span>
          )}
          {lot.status === 'AWAITING_TRUCK' && (
            <span className="px-2 py-0.5 bg-sky-100 text-sky-900 text-[10px] font-bold rounded-full">
              🚚 {translateLotStatus(lot.status)}
            </span>
          )}
          {lot.status === 'IN_TRANSIT' && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded-full">
              🚛 {translateLotStatus(lot.status)}
            </span>
          )}
          {lot.status === 'SETTLED' && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> {translateLotStatus(lot.status)}
            </span>
          )}
        </div>

        <button
          onClick={() => onDelete(lot.id)}
          id={`delete-lot-${lot.id}`}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title={t('lots.deleteLot')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
