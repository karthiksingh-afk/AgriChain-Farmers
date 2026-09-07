import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Droplets, Wind, Sparkles } from 'lucide-react';
import type { WeatherWidgetData } from '../../lib/types/schema';

interface WeatherWidgetProps {
  weather: WeatherWidgetData | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  const { t, i18n } = useTranslation();
  if (!weather) return null;

  const isHindi = (i18n.language || 'en').startsWith('hi');
  const recommendation = isHindi
    ? 'फसल कटाई और प्रेषण के लिए अनुकूल परिस्थितियां (<12% नमी)।'
    : weather.harvestRecommendation;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shadow-sm">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.weatherTitle')}
            </span>
            <h4 className="text-sm font-bold text-slate-800">{weather.location}</h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 font-display">{weather.tempC}°C</span>
          <p className="text-[10px] font-medium text-emerald-700">{t('dashboard.fairWeather')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-100/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Droplets className="w-4 h-4 text-sky-500" />
          <span>{t('dashboard.humidity')}: <strong>{weather.humidityPct}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Wind className="w-4 h-4 text-teal-600" />
          <span>{t('dashboard.rainForecast')}: <strong>{weather.rainfallForecastMm} mm</strong></span>
        </div>
      </div>

      <div className="mt-2.5 p-2 bg-white/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-1.5 border border-emerald-100">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span className="font-medium">{recommendation}</span>
      </div>
    </div>
  );
};
