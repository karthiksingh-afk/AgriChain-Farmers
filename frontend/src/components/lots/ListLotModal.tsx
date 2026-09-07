import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Scale, IndianRupee, Store, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import type { MandiBenchmark, QualityGrade } from '../../lib/types/schema';
import { LotService } from '../../services/lot-service';
import { translateCrop } from '../../i18n/dynamic-translations';

interface ListLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string;
  preselectedCrop?: MandiBenchmark | null;
  benchmarks: MandiBenchmark[];
  onLotCreated: (lot: any, dealId?: string) => void;
}

export const ListLotModal: React.FC<ListLotModalProps> = ({
  isOpen,
  onClose,
  farmerId,
  preselectedCrop,
  benchmarks,
  onLotCreated,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedCropName, setSelectedCropName] = useState<string>('Sharbati Wheat');
  const [variety, setVariety] = useState<string>('Lokwan-1 Gold');
  const [quantity, setQuantity] = useState<number>(50);
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('GRADE_A');
  const [askingPrice, setAskingPrice] = useState<number>(3250);
  const [storageLocation, setStorageLocation] = useState<string>('Warehouse 4A, Sehore');
  const [notes, setNotes] = useState<string>('Moisture tested at 11.2%, cleaned & sorted');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHindi = (i18n.language || 'en').startsWith('hi');

  // Sync benchmark details when crop changes
  useEffect(() => {
    if (preselectedCrop) {
      setSelectedCropName(preselectedCrop.cropName);
      setVariety(preselectedCrop.variety);
      setAskingPrice(preselectedCrop.modalRatePerQuintal);
    }
  }, [preselectedCrop]);

  if (!isOpen) return null;

  const currentBenchmark = benchmarks.find((b) => b.cropName === selectedCropName) || benchmarks[0];
  const benchmarkRate = currentBenchmark?.modalRatePerQuintal || 3000;
  const totalValue = Math.round(quantity * askingPrice * 100) / 100;
  const priceDiffPct = Math.round(((askingPrice - benchmarkRate) / benchmarkRate) * 100);

  const handleCropChange = (cropName: string) => {
    setSelectedCropName(cropName);
    const found = benchmarks.find((b) => b.cropName === cropName);
    if (found) {
      setVariety(found.variety);
      setAskingPrice(found.modalRatePerQuintal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError(isHindi ? 'मात्रा शून्य से अधिक होनी चाहिए' : 'Quantity must be greater than zero');
      return;
    }
    if (askingPrice <= 0) {
      setError(isHindi ? 'मांग मूल्य शून्य से अधिक होना चाहिए' : 'Asking price must be greater than zero');
      return;
    }

    setLoading(true);

    const res = await LotService.createLot({
      farmerId,
      cropName: selectedCropName,
      variety,
      quantityQuintals: Number(quantity),
      qualityGrade,
      askingPricePerQuintal: Number(askingPrice),
      storageLocation,
      notes,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    if (res.data) {
      onLotCreated(res.data.lot, res.data.dealId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Scale className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">{t('lots.listLotTitle')}</h2>
              <p className="text-xs text-emerald-100">{t('lots.listLotSubtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Crop Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('lots.selectCrop')}</label>
            <select
              id="lot-crop-select"
              value={selectedCropName}
              onChange={(e) => handleCropChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.cropName}>
                  {translateCrop(b.cropName)} ({b.variety}) - {t('lots.mandiBenchmark')} ₹{b.modalRatePerQuintal}{t('dashboard.perQuintal')}
                </option>
              ))}
            </select>
          </div>

          {/* Variety & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('lots.cropVariety')}</label>
              <input
                type="text"
                id="lot-variety-input"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('lots.quantity')}</label>
              <div className="relative">
                <input
                  type="number"
                  id="lot-quantity-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">Qtl</span>
              </div>
            </div>
          </div>

          {/* Quality Grade Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('lots.qualityGrading')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="grade-a-btn"
                onClick={() => setQualityGrade('GRADE_A')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  qualityGrade === 'GRADE_A'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">{t('lots.gradeAPremium')}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500">{t('lots.gradeAPremiumDesc')}</p>
              </button>

              <button
                type="button"
                id="grade-b-btn"
                onClick={() => setQualityGrade('GRADE_B')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  qualityGrade === 'GRADE_B'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">{t('lots.gradeBStandard')}</span>
                  <Store className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[10px] text-slate-500">{t('lots.gradeBStandardDesc')}</p>
              </button>
            </div>
          </div>

          {/* Asking Price vs Mandi Benchmark */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">{t('lots.askingPrice')}</label>
              <span className="text-[11px] text-slate-500">
                {t('lots.mandiBenchmark')}: <strong className="text-slate-800">₹{benchmarkRate.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
              <input
                type="number"
                id="lot-price-input"
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value))}
                min={1}
                required
                className="w-full pl-7 pr-16 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-900"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">{t('dashboard.perQuintal')}</span>
            </div>

            {/* Benchmark diff pill */}
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">
                {priceDiffPct > 0 ? (
                  <span className="text-emerald-700 font-semibold">+{priceDiffPct}% {t('lots.aboveBenchmark')}</span>
                ) : priceDiffPct < 0 ? (
                  <span className="text-amber-700 font-semibold">{priceDiffPct}% {t('lots.belowBenchmark')}</span>
                ) : (
                  <span className="text-slate-600 font-semibold">{t('lots.matchesBenchmark')}</span>
                )}
              </span>
              <span className="text-slate-600">{t('lots.totalLotValue')}: <strong className="text-slate-900 text-xs">₹{totalValue.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          {/* Storage & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('lots.storageLocation')}</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Warehouse / Godown"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('lots.qualityNote')}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Moisture 11%"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Instant Auto-Match Notice */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('lots.instantAutoMatch')}</p>
              <p className="text-[11px] text-emerald-800">
                {t('lots.instantAutoMatchDesc')} (₹{totalValue.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="lot-submit-btn"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <IndianRupee className="w-4 h-4" />
                <span>{t('lots.submitBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
