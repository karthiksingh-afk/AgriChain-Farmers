import type {
  BuyerProfile,
  CropPerishability,
  RouteScoringWeights,
  RouteRecommendation,
  LayerAnalysisDetails,
} from '../lib/types/route-optimization-types';
import type { ProduceLot, ApiResponse } from '../lib/types/schema';
import { LotService } from './lot-service';

// In-memory / LocalStorage cache for recommendations
const ROUTE_RECS_STORAGE_KEY = 'agrichain_route_recommendations';
const memoryRecommendations = new Map<string, RouteRecommendation>();

// Default Configurable Weights for Layer 4 Offer Scoring
export const DEFAULT_SCORING_WEIGHTS: RouteScoringWeights = {
  w1_price: 0.35,
  w2_payment: 0.25,
  w3_pickup: 0.15,
  w4_quality: 0.15,
  w5_logistics: 0.10,
};

// Default Skip Threshold (5% Net Benefit requirement)
export const DEFAULT_SKIP_THRESHOLD_PCT = 5.0;

// Lookup Table: Crop Perishability Parameters
export const CROP_PERISHABILITY_REGISTRY: Record<string, CropPerishability> = {
  'Sharbati Wheat': { cropName: 'Sharbati Wheat', basePerishabilityIndex: 0.05, targetTempC: 22.0, respirationRateMgCo2PerKgHr: 2.5 },
  'Basmati Rice': { cropName: 'Basmati Rice', basePerishabilityIndex: 0.05, targetTempC: 22.0, respirationRateMgCo2PerKgHr: 2.0 },
  'Yellow Soybean': { cropName: 'Yellow Soybean', basePerishabilityIndex: 0.08, targetTempC: 20.0, respirationRateMgCo2PerKgHr: 3.8 },
  'Desi Cotton': { cropName: 'Desi Cotton', basePerishabilityIndex: 0.03, targetTempC: 25.0, respirationRateMgCo2PerKgHr: 1.0 },
  'Nashik Red Onion': { cropName: 'Nashik Red Onion', basePerishabilityIndex: 0.35, targetTempC: 15.0, respirationRateMgCo2PerKgHr: 12.0 },
  'Jyoti Potato': { cropName: 'Jyoti Potato', basePerishabilityIndex: 0.28, targetTempC: 10.0, respirationRateMgCo2PerKgHr: 9.5 },
  'Black Mustard': { cropName: 'Black Mustard', basePerishabilityIndex: 0.06, targetTempC: 20.0, respirationRateMgCo2PerKgHr: 3.0 },
  'Hybrid Tomato': { cropName: 'Hybrid Tomato', basePerishabilityIndex: 0.88, targetTempC: 12.0, respirationRateMgCo2PerKgHr: 35.0 },
};

// Lookup Registry: Buyer Profiles with Reliability & MOQs
export const BUYER_PROFILES_REGISTRY: BuyerProfile[] = [
  {
    id: 'buyer-itc-01',
    name: 'ITC Agri Business Hub',
    buyerType: 'Agri-Processor',
    location: 'Sehore Logistics Park, MP',
    paymentReliabilityScore: 98,
    pickupExecutionScore: 96,
    qualityAcceptanceRate: 94,
    moqKg: 4000, // 40 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-cargill-02',
    name: 'Cargill India Grains',
    buyerType: 'Exporter',
    location: 'Kandla Port Depot, Gujarat',
    paymentReliabilityScore: 97,
    pickupExecutionScore: 95,
    qualityAcceptanceRate: 96,
    moqKg: 5000, // 50 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-adani-03',
    name: 'Adani Wilmar Ltd',
    buyerType: 'Miller',
    location: 'Indore Mandi Terminal, MP',
    paymentReliabilityScore: 96,
    pickupExecutionScore: 92,
    qualityAcceptanceRate: 91,
    moqKg: 7500, // 75 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-reliance-04',
    name: 'Reliance Fresh Procurement',
    buyerType: 'Retail Chain',
    location: 'Bhopal Central Hub, MP',
    paymentReliabilityScore: 95,
    pickupExecutionScore: 94,
    qualityAcceptanceRate: 95,
    moqKg: 2500, // 25 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-patanjali-05',
    name: 'Patanjali Foods Division',
    buyerType: 'Agri-Processor',
    location: 'Ujjain Agro Park, MP',
    paymentReliabilityScore: 94,
    pickupExecutionScore: 90,
    qualityAcceptanceRate: 92,
    moqKg: 4000, // 40 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-bigbasket-06',
    name: 'BigBasket Direct Farm',
    buyerType: 'Retail Chain',
    location: 'Indore Hub, MP',
    paymentReliabilityScore: 96,
    pickupExecutionScore: 95,
    qualityAcceptanceRate: 93,
    moqKg: 1500, // 15 Quintals
    interstatePermitVerified: true,
  },
  {
    id: 'buyer-trader-07',
    name: 'Local Unregulated Trader',
    buyerType: 'Trader',
    location: 'Rural Mandi Yard, MP',
    paymentReliabilityScore: 78, // Low reliability (<90)
    pickupExecutionScore: 72,
    qualityAcceptanceRate: 80,
    moqKg: 1000, // 10 Quintals
    interstatePermitVerified: false,
  },
  {
    id: 'buyer-mega-agg-08',
    name: 'Mega Bulk Grain Terminal',
    buyerType: 'Aggregator',
    location: 'Nagpur Central Hub, MH',
    paymentReliabilityScore: 95,
    pickupExecutionScore: 91,
    qualityAcceptanceRate: 90,
    moqKg: 20000, // 200 Quintals (High MOQ)
    interstatePermitVerified: true,
  },
];

function getStoredRecs(): Map<string, RouteRecommendation> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(ROUTE_RECS_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryRecommendations;
}

function saveStoredRecs(map: Map<string, RouteRecommendation>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROUTE_RECS_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

export class RouteOptimizationService {
  /**
   * Layer 1: Stubbed Compliance Check
   * Evaluates boolean regulatory rules and stock limits.
   */
  static evaluateCompliance(lotQuantityKg: number, buyer: BuyerProfile): { passed: boolean; reason?: string } {
    // Stock limit check: single lot > 50,000 kg (500 MT) without special license fails direct route
    if (lotQuantityKg > 50000) {
      return {
        passed: false,
        reason: `Retain — compliance constraint: Lot size (${(lotQuantityKg / 1000).toFixed(1)} MT) exceeds direct movement threshold (50 MT). Mandi gate aggregation required.`,
      };
    }

    // Interstate permit check
    if (buyer.location.includes('Gujarat') || buyer.location.includes('MH')) {
      if (!buyer.interstatePermitVerified) {
        return {
          passed: false,
          reason: `Retain — compliance constraint: Interstate direct transit requires verified e-Way permit for ${buyer.location}.`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * Layer 2: Functional Necessity Check
   * Evaluates Minimum Order Quantity (MOQ) and Direct Buyer Payment Reliability (≥90).
   */
  static evaluateNecessity(
    lotQuantityKg: number,
    buyer: BuyerProfile
  ): { passed: boolean; reason?: string } {
    // Check MOQ
    if (lotQuantityKg < buyer.moqKg) {
      return {
        passed: false,
        reason: `Retain — lot quantity (${lotQuantityKg.toLocaleString('en-IN')} kg) does not meet ${buyer.name} MOQ (${buyer.moqKg.toLocaleString('en-IN')} kg). Mandi intermediary pooling needed.`,
      };
    }

    // Check Buyer Reliability (Hard threshold >= 90 for skipping Mandi)
    if (buyer.paymentReliabilityScore < 90) {
      return {
        passed: false,
        reason: `Retain — direct buyer payment reliability (${buyer.paymentReliabilityScore}/100) is below the 90-point safety threshold. Mandi auction guarantee advised.`,
      };
    }

    return { passed: true };
  }

  /**
   * Layer 3: Spoilage Risk Calculation
   * Spoilage Risk Factor (SRF) = base_perishability_index * e^(ambient_temp / target_temp) * transit_hours
   */
  static computeSpoilageRisk(
    cropName: string,
    ambientTempC: number,
    mandiTransitHours: number = 36,
    directTransitHours: number = 12
  ): {
    mandiSpoilageIndex: number;
    directSpoilageIndex: number;
    spoilageReductionPct: number;
    hoursSaved: number;
    targetTempC: number;
  } {
    const cropParams = CROP_PERISHABILITY_REGISTRY[cropName] || {
      cropName,
      basePerishabilityIndex: 0.15,
      targetTempC: 18.0,
      respirationRateMgCo2PerKgHr: 5.0,
    };

    const targetTemp = Math.max(1, cropParams.targetTempC);
    const tempRatio = Math.min(3.0, ambientTempC / targetTemp);
    const thermalExp = Math.exp(tempRatio);

    // Spoilage risk index for each route
    const mandiRisk = cropParams.basePerishabilityIndex * thermalExp * (mandiTransitHours / 10);
    const directRisk = cropParams.basePerishabilityIndex * thermalExp * (directTransitHours / 10);

    const reductionPct = Math.max(0, Math.round(((mandiRisk - directRisk) / Math.max(0.01, mandiRisk)) * 1000) / 10);
    const hoursSaved = mandiTransitHours - directTransitHours;

    return {
      mandiSpoilageIndex: Math.round(mandiRisk * 100) / 100,
      directSpoilageIndex: Math.round(directRisk * 100) / 100,
      spoilageReductionPct: reductionPct,
      hoursSaved,
      targetTempC: cropParams.targetTempC,
    };
  }

  /**
   * Layer 4: Multi-Factor Offer Scoring
   * S_offer = w1*P_norm + w2*R_pay + w3*R_pickup + w4*Q_accept - w5*C_logistics
   */
  static computeOfferScore(
    offeredPrice: number,
    benchmarkRate: number,
    buyer: BuyerProfile,
    isDirect: boolean,
    weights: RouteScoringWeights = DEFAULT_SCORING_WEIGHTS
  ): number {
    // Normalized price score (0 to 100 based on mandi benchmark)
    const priceRatio = (offeredPrice / Math.max(1, benchmarkRate)) * 100;
    const priceScore = Math.min(120, Math.max(50, priceRatio));

    // Logistics penalty score (0 to 100)
    // Direct route has lower total handling cost (approx 10 vs mandi 25)
    const logisticsPenalty = isDirect ? 10 : 25;

    const score =
      weights.w1_price * priceScore +
      weights.w2_payment * buyer.paymentReliabilityScore +
      weights.w3_pickup * buyer.pickupExecutionScore +
      weights.w4_quality * buyer.qualityAcceptanceRate -
      weights.w5_logistics * logisticsPenalty;

    return Math.round(score * 100) / 100;
  }

  /**
   * Full Recommendation Engine:
   * Evaluates all 4 layers, compares Net Benefit against Skip Threshold τ (default 5%),
   * and produces natural-language explanation.
   */
  static async computeRecommendation(
    lot: ProduceLot,
    customBuyer?: BuyerProfile,
    skipThresholdPct: number = DEFAULT_SKIP_THRESHOLD_PCT,
    weights: RouteScoringWeights = DEFAULT_SCORING_WEIGHTS
  ): Promise<RouteRecommendation> {
    const lotQuantityKg = lot.quantityQuintals * 100;
    const ambientTemp = 28.5; // From localized weather stub

    // Select matched buyer or best matching direct buyer from registry
    const buyer = customBuyer || (
      BUYER_PROFILES_REGISTRY.find((b) => b.moqKg <= lotQuantityKg && b.paymentReliabilityScore >= 90) ||
      BUYER_PROFILES_REGISTRY[0]
    );

    // Layer 1: Compliance
    const compliance = this.evaluateCompliance(lotQuantityKg, buyer);

    // Layer 2: Necessity (MOQ & Reliability)
    const necessity = this.evaluateNecessity(lotQuantityKg, buyer);

    // Layer 3: Spoilage Model
    const spoilage = this.computeSpoilageRisk(lot.cropName, ambientTemp);

    // Layer 4: Offer Scores
    const mandiBenchmark = lot.mandiBenchmarkRate || 3000;
    const directOfferPrice = lot.askingPricePerQuintal || mandiBenchmark;
    const traditionalRouteScore = this.computeOfferScore(mandiBenchmark * 0.94, mandiBenchmark, {
      ...buyer,
      paymentReliabilityScore: 82,
      pickupExecutionScore: 80,
      qualityAcceptanceRate: 85,
    }, false, weights);

    const directRouteScore = this.computeOfferScore(directOfferPrice, mandiBenchmark, buyer, true, weights);

    // Net Benefit % (Price Premium + Spoilage Savings + Intermediary Fee Savings)
    const priceDeltaPct = ((directOfferPrice - mandiBenchmark) / mandiBenchmark) * 100;
    const intermediaryFeeSavingsPct = 6.5; // Direct bypass of 6.5% mandi commission/cess
    const spoilageBenefitPct = spoilage.spoilageReductionPct * 0.12; // Weighted contribution of spoilage

    const rawNetBenefitPct = Math.round((priceDeltaPct + intermediaryFeeSavingsPct + spoilageBenefitPct) * 10) / 10;
    const netBenefitPct = Math.max(-10, rawNetBenefitPct);

    // Construct Layer Analysis Details
    const layerDetails: LayerAnalysisDetails = {
      layer1_compliance: {
        passed: compliance.passed,
        reason: compliance.reason,
        interstateVerified: buyer.interstatePermitVerified,
        withinStockLimits: lotQuantityKg <= 50000,
      },
      layer2_necessity: {
        passed: necessity.passed,
        lotQuantityKg,
        buyerMoqKg: buyer.moqKg,
        paymentReliabilityScore: buyer.paymentReliabilityScore,
        reason: necessity.reason,
      },
      layer3_spoilage: {
        ambientTempC: ambientTemp,
        targetTempC: spoilage.targetTempC,
        mandiTransitHours: 36,
        directTransitHours: 12,
        hoursSaved: spoilage.hoursSaved,
        mandiSpoilageIndex: spoilage.mandiSpoilageIndex,
        directSpoilageIndex: spoilage.directSpoilageIndex,
        spoilageReductionPct: spoilage.spoilageReductionPct,
      },
      layer4_offerScoring: {
        traditionalRouteScore,
        directRouteScore,
        netBenefitPct,
        thresholdPct: skipThresholdPct,
      },
    };

    let decision: 'SKIP' | 'RETAIN';
    let explanationText: string;

    if (!compliance.passed) {
      decision = 'RETAIN';
      explanationText = compliance.reason || 'Retain — compliance constraint.';
    } else if (!necessity.passed) {
      decision = 'RETAIN';
      explanationText = necessity.reason || 'Retain — functional necessity constraint.';
    } else if (netBenefitPct >= skipThresholdPct) {
      decision = 'SKIP';
      explanationText = `Skip Mandi — Direct dispatch to ${buyer.name} achieves +${netBenefitPct}% net financial benefit (saving ${spoilage.hoursSaved}h transit & reducing ${spoilage.spoilageReductionPct}% spoilage on ${lot.cropName}), exceeding the ${skipThresholdPct}% skip threshold with ${buyer.paymentReliabilityScore}% buyer payment reliability.`;
    } else {
      decision = 'RETAIN';
      explanationText = `Retain Mandi Route — Net benefit (+${netBenefitPct}%) is below the ${skipThresholdPct}% skip threshold for direct route. Traditional Mandi pooling provides better price discovery.`;
    }

    const recommendation: RouteRecommendation = {
      id: `rec-${lot.id}-${Date.now()}`,
      lotId: lot.id,
      cropName: lot.cropName,
      quantityQuintals: lot.quantityQuintals,
      routeAssessed: decision === 'SKIP' ? 'DIRECT_BUYER_SKIP_MANDI' : 'TRADITIONAL_MANDI_RETAIN',
      decision,
      netBenefitPct,
      thresholdPct: skipThresholdPct,
      explanationText,
      matchedBuyer: buyer,
      layerDetails,
      createdAt: new Date().toISOString(),
    };

    const cache = getStoredRecs();
    cache.set(lot.id, recommendation);
    memoryRecommendations.set(lot.id, recommendation);
    saveStoredRecs(cache);

    return recommendation;
  }

  /**
   * Fetch or compute recommendation for a specific lot ID
   */
  static async getRecommendationForLot(
    lotId: string,
    skipThresholdPct: number = DEFAULT_SKIP_THRESHOLD_PCT
  ): Promise<ApiResponse<RouteRecommendation>> {
    const { data: lot } = await LotService.getLotById(lotId);
    if (!lot) {
      return {
        data: null,
        error: { message: `Lot ${lotId} not found`, code: 'NOT_FOUND' },
      };
    }

    const cache = getStoredRecs();
    const existing = cache.get(lotId) || memoryRecommendations.get(lotId);
    if (existing) {
      return { data: existing, error: null };
    }

    const rec = await this.computeRecommendation(lot, undefined, skipThresholdPct);
    return { data: rec, error: null };
  }
}
