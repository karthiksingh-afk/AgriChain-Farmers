// AgriChain Backend Types & Data Models - Complete Specification

export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type QualityGrade = 'GRADE_A' | 'GRADE_B';

export type LotStatus = 
  | 'STOCK_HELD'      // Stored in warehouse/farm
  | 'DEAL_ACTIVE'     // Matched with buyer
  | 'AWAITING_TRUCK'  // Logistics scheduled
  | 'IN_TRANSIT'      // Truck en route
  | 'SETTLED';        // Delivery confirmed & payment released

export type DealStatus = 
  | 'PROPOSED'        // Buyer matched, price proposed (negotiation window)
  | 'LOCKED'          // Deal agreed, price fixed
  | 'PAYMENT_HELD'    // Funds secured in escrow
  | 'DISPATCHED'      // Produce in transit
  | 'COMPLETED'       // Verified at destination
  | 'CANCELLED';

export type PaymentMethod = 'ESCROW_DIRECT' | 'UPI' | 'NEFT' | 'RTGS';

export type EscrowStatus = 'SECURED' | 'RELEASE_PENDING' | 'DISBURSED' | 'REFUNDED';

export type NotificationType = 
  | 'DEAL_MATCHED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_RELEASED'
  | 'LOT_STATUS_CHANGED'
  | 'PRICE_ALERT'
  | 'KYC_VERIFIED'
  | 'WITHDRAWAL_PROCESSED';

export interface FarmerProfile {
  id: string;
  phone: string;
  fullName: string;
  fpoName?: string;
  state: string;
  district: string;
  mandiName?: string;
  pinHash?: string;
  kycStatus: KYCStatus;
  aadhaarStub?: string;
  farmerIdStub?: string;
  bankAccountStub?: string;
  upiIdStub?: string;
  landAreaAcres?: number;
  primaryCrop?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MandiBenchmark {
  id: string;
  cropName: string;
  variety: string;
  category: 'Cereal' | 'Pulse' | 'Oilseed' | 'Vegetable' | 'Commercial';
  marketName: string;
  state: string;
  district: string;
  minRatePerQuintal: number;
  maxRatePerQuintal: number;
  modalRatePerQuintal: number;
  arrivalsMt: number;
  activeBuyersCount: number;
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  date: string;
}

export interface ProduceLot {
  id: string;
  farmerId: string;
  cropName: string;
  variety: string;
  quantityQuintals: number;
  qualityGrade: QualityGrade;
  askingPricePerQuintal: number;
  mandiBenchmarkRate: number;
  totalLotValue: number;
  status: LotStatus;
  coldChainTempC?: number;
  coldChainHumidityPct?: number;
  storageLocation: string;
  qualityCertificateId?: string;
  qualityScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  lotId: string;
  farmerId: string;
  buyerName: string;
  buyerType: 'Miller' | 'Exporter' | 'Retail Chain' | 'Agri-Processor';
  buyerLocation: string;
  agreedPricePerQuintal: number;
  totalDealAmount: number;
  originalProposedPrice?: number;
  counterPrice?: number;
  isNegotiated?: boolean;
  status: DealStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED' | 'PENDING';
  transactionRef: string;
  escrowRef: string;
  pickupEstimatedAt?: string;
  deliveryEstimatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowRecord {
  id: string;
  dealId: string;
  farmerId: string;
  totalAmount: number;
  heldAmount: number;
  releasedAmount: number;
  status: EscrowStatus;
  escrowAccountRef: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  farmerId: string;
  type: 'CREDIT_SETTLEMENT' | 'DEBIT_WITHDRAWAL' | 'ESCROW_LOCK';
  amount: number;
  referenceId: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface FarmerWallet {
  id: string;
  farmerId: string;
  availableBalance: number;
  escrowLockedBalance: number;
  totalSettledEarnings: number;
  activeDealsCount: number;
  transactions?: WalletTransaction[];
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  farmerId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  referenceId?: string;
  createdAt: string;
}

export interface WeatherWidgetData {
  location: string;
  tempC: number;
  condition: string;
  rainfallForecastMm: number;
  humidityPct: number;
  harvestRecommendation: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    status?: number;
  } | null;
}
