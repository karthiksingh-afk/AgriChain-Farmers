// AI Route Optimization Data Models & Types Specification

export type RouteDecision = 'SKIP' | 'RETAIN';

export type BuyerCategory = 'Aggregator' | 'Trader' | 'Wholesaler' | 'Miller' | 'Agri-Processor' | 'Retail Chain' | 'Exporter';

export interface BuyerProfile {
  id: string;
  name: string;
  buyerType: BuyerCategory;
  location: string;
  paymentReliabilityScore: number;  // 0 - 100
  pickupExecutionScore: number;     // 0 - 100
  qualityAcceptanceRate: number;    // 0 - 100
  moqKg: number;                    // Minimum Order Quantity in KG
  interstatePermitVerified: boolean;
}

export interface CropPerishability {
  cropName: string;
  basePerishabilityIndex: number;   // 0.01 (cereals) to 1.0 (highly perishable tomatoes/berries)
  targetTempC: number;              // Ideal storage/transit temperature in °C
  respirationRateMgCo2PerKgHr: number;
}

export interface RouteScoringWeights {
  w1_price: number;        // Default 0.35
  w2_payment: number;      // Default 0.25
  w3_pickup: number;       // Default 0.15
  w4_quality: number;      // Default 0.15
  w5_logistics: number;    // Default 0.10
}

export interface LayerAnalysisDetails {
  layer1_compliance: {
    passed: boolean;
    reason?: string;
    interstateVerified: boolean;
    withinStockLimits: boolean;
  };
  layer2_necessity: {
    passed: boolean;
    lotQuantityKg: number;
    buyerMoqKg: number;
    paymentReliabilityScore: number;
    reason?: string;
  };
  layer3_spoilage: {
    ambientTempC: number;
    targetTempC: number;
    mandiTransitHours: number;
    directTransitHours: number;
    hoursSaved: number;
    mandiSpoilageIndex: number;
    directSpoilageIndex: number;
    spoilageReductionPct: number;
  };
  layer4_offerScoring: {
    traditionalRouteScore: number;
    directRouteScore: number;
    netBenefitPct: number;
    thresholdPct: number;
  };
}

export interface RouteRecommendation {
  id: string;
  lotId: string;
  cropName: string;
  quantityQuintals: number;
  routeAssessed: 'DIRECT_BUYER_SKIP_MANDI' | 'TRADITIONAL_MANDI_RETAIN';
  decision: RouteDecision;
  netBenefitPct: number;
  thresholdPct: number;
  explanationText: string;
  matchedBuyer?: BuyerProfile;
  layerDetails: LayerAnalysisDetails;
  createdAt: string;
}
