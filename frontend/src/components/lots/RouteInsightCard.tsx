import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, ShieldCheck, AlertCircle, ArrowRight, ChevronDown, ChevronUp, Sparkles, Clock, Scale, Thermometer } from 'lucide-react';
import type { ProduceLot } from '../../lib/types/schema';
import type { RouteRecommendation } from '../../lib/types/route-optimization-types';
import { RouteOptimizationService } from '../../services/route-optimization-service';

interface RouteInsightCardProps {
  lot: ProduceLot;
}

export const RouteInsightCard: React.FC<RouteInsightCardProps> = ({ lot }) => {
  const { t } = useTranslation();
  const [recommendation, setRecommendation] = useState<RouteRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    RouteOptimizationService.getRecommendationForLot(lot.id)
      .then((res) => {
        if (isMounted && res.data) {
          setRecommendation(res.data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lot.id, lot.quantityQuintals, lot.askingPricePerQuintal, lot.cropName]);

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 animate-pulse text-xs text-slate-500 flex items-center gap-2">
        <Route className="w-4 h-4 text-slate-400 animate-spin" />
        <span>{t('routeOpt.calculatingInsight')}</span>
      </div>
    );
  }

  if (!recommendation) return null;

  const isSkip = recommendation.decision === 'SKIP';
  const { layerDetails } = recommendation;

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isSkip
        ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-200/80 shadow-xs'
        : 'bg-gradient-to-br from-amber-50/90 to-orange-50/50 border-amber-200/80 shadow-xs'
    }`}>
      {/* Header Banner */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isSkip ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              <Route className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  {t('routeOpt.engineTitle')}
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                  isSkip ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isSkip ? t('routeOpt.badgeSkip') : t('routeOpt.badgeRetain')}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5 font-display flex items-center gap-1">
                {isSkip ? t('routeOpt.skipMandiTitle') : t('routeOpt.retainMandiTitle')}
              </h4>
            </div>
          </div>

          {/* Net Benefit Metric */}
          <div className="text-right shrink-0">
            <span className="text-[9px] text-slate-500 block">{t('routeOpt.netBenefit')}</span>
            <span className={`text-sm font-black font-display ${
              isSkip ? 'text-emerald-700' : 'text-amber-800'
            }`}>
              {recommendation.netBenefitPct > 0 ? `+${recommendation.netBenefitPct}%` : `${recommendation.netBenefitPct}%`}
            </span>
            <span className="text-[9px] text-slate-400 block">
              (τ: {recommendation.thresholdPct}%)
            </span>
          </div>
        </div>

        {/* Natural Language Explanation Text */}
        <p className="text-[11px] text-slate-700 leading-relaxed bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/60">
          {recommendation.explanationText}
        </p>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-700">
          <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">{t('routeOpt.hoursSaved')}</span>
              <span className="font-bold">{layerDetails.layer3_spoilage.hoursSaved}h {t('routeOpt.faster')}</span>
            </div>
          </div>

          <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">{t('routeOpt.spoilageSaved')}</span>
              <span className="font-bold">-{layerDetails.layer3_spoilage.spoilageReductionPct}%</span>
            </div>
          </div>

          <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">{t('routeOpt.buyerMoq')}</span>
              <span className="font-bold">{(layerDetails.layer2_necessity.buyerMoqKg / 100).toFixed(0)} qtl</span>
            </div>
          </div>
        </div>

        {/* Accordion Toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors"
        >
          <span>{expanded ? t('routeOpt.hideLayers') : t('routeOpt.viewLayerAnalysis')}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded 4-Layer Diagnostic Checklist */}
      {expanded && (
        <div className="bg-white/90 border-t border-slate-200/80 p-3 space-y-2.5 text-xs animate-fadeIn">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {t('routeOpt.fourLayerAudit')}
          </h5>

          {/* Layer 1 */}
          <div className="flex items-start gap-2 text-[11px] pb-2 border-b border-slate-100">
            {layerDetails.layer1_compliance.passed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold text-slate-800">{t('routeOpt.layer1Title')}:</span>
              <p className="text-[10px] text-slate-600">
                {layerDetails.layer1_compliance.passed
                  ? t('routeOpt.layer1Pass')
                  : layerDetails.layer1_compliance.reason}
              </p>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="flex items-start gap-2 text-[11px] pb-2 border-b border-slate-100">
            {layerDetails.layer2_necessity.passed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold text-slate-800">{t('routeOpt.layer2Title')}:</span>
              <p className="text-[10px] text-slate-600">
                {t('routeOpt.lotQty')}: {layerDetails.layer2_necessity.lotQuantityKg} kg | {t('routeOpt.buyerMoq')}: {layerDetails.layer2_necessity.buyerMoqKg} kg | {t('routeOpt.reliability')}: {layerDetails.layer2_necessity.paymentReliabilityScore}/100
              </p>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="flex items-start gap-2 text-[11px] pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">{t('routeOpt.layer3Title')}:</span>
              <p className="text-[10px] text-slate-600">
                {lot.cropName} ({layerDetails.layer3_spoilage.targetTempC}°C target) • Mandi: 36h (Index: {layerDetails.layer3_spoilage.mandiSpoilageIndex}) vs Direct: 12h (Index: {layerDetails.layer3_spoilage.directSpoilageIndex}) → {layerDetails.layer3_spoilage.spoilageReductionPct}% {t('routeOpt.spoilageSaved')}
              </p>
            </div>
          </div>

          {/* Layer 4 */}
          <div className="flex items-start gap-2 text-[11px]">
            <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">{t('routeOpt.layer4Title')}:</span>
              <p className="text-[10px] text-slate-600">
                Direct Score: {layerDetails.layer4_offerScoring.directRouteScore} vs Mandi Score: {layerDetails.layer4_offerScoring.traditionalRouteScore} → Net Benefit: +{layerDetails.layer4_offerScoring.netBenefitPct}% (Threshold: {layerDetails.layer4_offerScoring.thresholdPct}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
