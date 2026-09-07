import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus, Store, ChevronRight } from 'lucide-react';
import type { MandiBenchmark } from '../../lib/types/schema';
import { translateCrop, translateCategory } from '../../i18n/dynamic-translations';

interface MandiRateTickerProps {
  benchmarks: MandiBenchmark[];
  onSelectCropForListing: (crop: MandiBenchmark) => void;
}

const CATEGORIES = ['ALL', 'Cereal', 'Pulse', 'Oilseed', 'Vegetable', 'Commercial'];

export const MandiRateTicker: React.FC<MandiRateTickerProps> = ({
  benchmarks,
  onSelectCropForListing,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filtered = selectedCategory === 'ALL'
    ? benchmarks
    : benchmarks.filter((b) => b.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('dashboard.mandiRatesTitle')}</h3>
            <p className="text-[10px] text-slate-500">{t('dashboard.mandiRatesSubtitle')}</p>
          </div>
        </div>

        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
          {t('dashboard.liveToday')}
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {translateCategory(cat)}
          </button>
        ))}
      </div>

      {/* Rates Grid */}
      <div className="space-y-2">
        {filtered.map((crop) => (
          <div
            key={crop.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900">{translateCrop(crop.cropName)}</h4>
                <span className="text-[10px] text-slate-500 font-medium">({crop.variety})</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {crop.marketName}, {crop.district} • {crop.arrivalsMt} MT {t('dashboard.mandiArrivals').toLowerCase()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs font-black text-slate-900 font-display">
                    ₹{crop.modalRatePerQuintal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">{t('dashboard.perQuintal')}</span>
                </div>
                
                <div className="flex items-center justify-end text-[10px] font-bold">
                  {crop.priceTrend === 'UP' && (
                    <span className="text-emerald-600 flex items-center">
                      <ArrowUpRight className="w-3 h-3" /> {t('dashboard.bullish')}
                    </span>
                  )}
                  {crop.priceTrend === 'DOWN' && (
                    <span className="text-red-500 flex items-center">
                      <ArrowDownRight className="w-3 h-3" /> {t('dashboard.bearish')}
                    </span>
                  )}
                  {crop.priceTrend === 'STABLE' && (
                    <span className="text-slate-500 flex items-center">
                      <Minus className="w-3 h-3" /> {t('dashboard.stable')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onSelectCropForListing(crop)}
                id={`list-crop-${crop.cropName.replace(/\s+/g, '-').toLowerCase()}`}
                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                title="List Lot for this crop"
              >
                <span>{t('dashboard.sell')}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
