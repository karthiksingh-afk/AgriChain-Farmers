import type { Deal, DealStatus, PaymentMethod, ApiResponse } from '../lib/types/schema';
import { EscrowService } from './escrow-service';
import { NotificationService } from './notification-service';

const DEALS_STORAGE_KEY = 'agrichain_deals';
const memoryDeals = new Map<string, Deal>();

// Simulated Buyer Registry for instant matching
const SIMULATED_BUYERS = [
  { name: 'ITC Agri Business Hub', type: 'Agri-Processor' as const, location: 'Sehore Logistics Park, MP' },
  { name: 'Adani Wilmar Ltd', type: 'Miller' as const, location: 'Indore Mandi Terminal, MP' },
  { name: 'Cargill India Grains', type: 'Exporter' as const, location: 'Kandla Port Depot, Gujarat' },
  { name: 'Reliance Fresh Procurement', type: 'Retail Chain' as const, location: 'Bhopal Central Hub, MP' },
  { name: 'Patanjali Foods Division', type: 'Agri-Processor' as const, location: 'Ujjain Agro Park, MP' },
  { name: 'BigBasket Direct Farm', type: 'Retail Chain' as const, location: 'Indore Hub, MP' },
];

function getStoredDeals(): Map<string, Deal> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEALS_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryDeals;
}

function saveStoredDeals(map: Map<string, Deal>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

export class DealService {
  /**
   * Auto-generate simulated deal for a listed lot
   */
  static async autoGenerateSimulatedDeal(
    lotId: string,
    farmerId: string,
    cropName: string,
    quantityQuintals: number,
    askingPricePerQuintal: number
  ): Promise<ApiResponse<Deal>> {
    const deals = getStoredDeals();
    const now = new Date().toISOString();

    // Select random matching buyer
    const randomBuyer = SIMULATED_BUYERS[Math.floor(Math.random() * SIMULATED_BUYERS.length)];
    
    // Agreed price matches asking price
    const agreedPrice = askingPricePerQuintal;
    const totalAmount = Math.round(agreedPrice * quantityQuintals * 100) / 100;

    const dealId = `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const txnRef = `AGRI-TXN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const escrowRef = `ESCROW-SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    const deal: Deal = {
      id: dealId,
      lotId,
      farmerId,
      buyerName: randomBuyer.name,
      buyerType: randomBuyer.type,
      buyerLocation: randomBuyer.location,
      agreedPricePerQuintal: agreedPrice,
      originalProposedPrice: agreedPrice,
      totalDealAmount: totalAmount,
      status: 'PROPOSED', // Matched buyer proposing price before escrow lock
      paymentMethod: 'ESCROW_DIRECT',
      paymentStatus: 'PENDING',
      transactionRef: txnRef,
      escrowRef: escrowRef,
      pickupEstimatedAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      deliveryEstimatedAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    deals.set(dealId, deal);
    memoryDeals.set(dealId, deal);
    saveStoredDeals(deals);

    // Pre-secure Escrow for the matched deal
    await EscrowService.lockDealEscrow(dealId, farmerId, totalAmount);

    // Send Notification for proposed match
    await NotificationService.createNotification(
      farmerId,
      'DEAL_MATCHED',
      'Buyer Match Found! 🤝',
      `${randomBuyer.name} proposed to buy your ${quantityQuintals} qtl ${cropName} lot for ₹${totalAmount.toLocaleString('en-IN')} (₹${agreedPrice}/qtl). Review & accept or counter-offer. Txn: ${txnRef}`,
      dealId
    );

    return {
      data: deal,
      error: null,
    };
  }

  /**
   * Accept Proposed Deal without negotiating (advances to PAYMENT_HELD and locks escrow)
   */
  static async acceptProposedDeal(dealId: string): Promise<ApiResponse<Deal>> {
    const deals = getStoredDeals();
    const deal = deals.get(dealId) || memoryDeals.get(dealId);

    if (!deal) {
      return { data: null, error: { message: 'Deal not found' } };
    }

    if (deal.status !== 'PROPOSED') {
      return { data: deal, error: null };
    }

    deal.status = 'PAYMENT_HELD';
    deal.paymentStatus = 'HELD_IN_ESCROW';
    deal.updatedAt = new Date().toISOString();

    deals.set(dealId, deal);
    memoryDeals.set(dealId, deal);
    saveStoredDeals(deals);

    // Lock Escrow at agreed price
    await EscrowService.lockDealEscrow(dealId, deal.farmerId, deal.totalDealAmount);

    await NotificationService.createNotification(
      deal.farmerId,
      'ESCROW_LOCKED',
      'Proposed Price Accepted! 🔒',
      `Deal #${dealId.slice(-6)} confirmed with ${deal.buyerName} at ₹${deal.agreedPricePerQuintal}/qtl. ₹${deal.totalDealAmount.toLocaleString('en-IN')} secured in escrow vault.`,
      dealId
    );

    return {
      data: deal,
      error: null,
    };
  }

  /**
   * Negotiate Deal with Counter-Offer (validates bounds, updates price, auto-accepts & locks escrow)
   */
  static async negotiateDeal(
    dealId: string,
    counterPricePerQuintal: number
  ): Promise<ApiResponse<Deal>> {
    const deals = getStoredDeals();
    const deal = deals.get(dealId) || memoryDeals.get(dealId);

    if (!deal) {
      return { data: null, error: { message: 'Deal not found' } };
    }

    if (counterPricePerQuintal <= 0 || isNaN(counterPricePerQuintal)) {
      return { data: null, error: { message: 'Counter price must be a valid positive number' } };
    }

    const baselinePrice = deal.originalProposedPrice || deal.agreedPricePerQuintal;
    const minAllowed = Math.round(baselinePrice * 0.5);
    const maxAllowed = Math.round(baselinePrice * 1.5);

    if (counterPricePerQuintal < minAllowed || counterPricePerQuintal > maxAllowed) {
      return {
        data: null,
        error: {
          message: `Counter price ₹${counterPricePerQuintal} is outside reasonable demo bounds (₹${minAllowed} - ₹${maxAllowed}/qtl).`,
        },
      };
    }

    // Determine quantity from original total / agreed price
    const approxQuantity = Math.max(1, Math.round(deal.totalDealAmount / baselinePrice));
    const newTotalAmount = Math.round(counterPricePerQuintal * approxQuantity * 100) / 100;

    // Update deal with negotiated price and advance to PAYMENT_HELD
    deal.agreedPricePerQuintal = counterPricePerQuintal;
    deal.counterPrice = counterPricePerQuintal;
    deal.isNegotiated = true;
    deal.totalDealAmount = newTotalAmount;
    deal.status = 'PAYMENT_HELD';
    deal.paymentStatus = 'HELD_IN_ESCROW';
    deal.updatedAt = new Date().toISOString();

    deals.set(dealId, deal);
    memoryDeals.set(dealId, deal);
    saveStoredDeals(deals);

    // Lock Escrow at the NEW negotiated amount
    await EscrowService.lockDealEscrow(dealId, deal.farmerId, newTotalAmount);

    await NotificationService.createNotification(
      deal.farmerId,
      'ESCROW_LOCKED',
      'Counter-Offer Accepted by Buyer! 🤝',
      `${deal.buyerName} agreed to your counter price of ₹${counterPricePerQuintal}/qtl. ₹${newTotalAmount.toLocaleString('en-IN')} locked in escrow vault.`,
      dealId
    );

    return {
      data: deal,
      error: null,
    };
  }

  /**
   * Fetch all deals for a farmer
   */
  static async getFarmerDeals(farmerId: string, statusFilter?: DealStatus): Promise<ApiResponse<Deal[]>> {
    const deals = getStoredDeals();
    let list = Array.from(deals.values()).filter((d) => d.farmerId === farmerId);
    
    if (statusFilter) {
      list = list.filter((d) => d.status === statusFilter);
    }

    return {
      data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      error: null,
    };
  }

  /**
   * Get deal by ID
   */
  static async getDealById(dealId: string): Promise<ApiResponse<Deal | null>> {
    const deals = getStoredDeals();
    const deal = deals.get(dealId) || memoryDeals.get(dealId) || null;
    return {
      data: deal,
      error: null,
    };
  }

  /**
   * Get deal by Lot ID
   */
  static async getDealByLotId(lotId: string): Promise<ApiResponse<Deal | null>> {
    const deals = getStoredDeals();
    const deal = Array.from(deals.values()).find((d) => d.lotId === lotId) || null;
    return {
      data: deal,
      error: null,
    };
  }

  /**
   * Advance Deal Status (Dispatched -> Completed)
   */
  static async updateDealStatus(
    dealId: string,
    status: DealStatus,
    paymentMethod?: PaymentMethod
  ): Promise<ApiResponse<Deal>> {
    const deals = getStoredDeals();
    const deal = deals.get(dealId) || memoryDeals.get(dealId);

    if (!deal) {
      return {
        data: null,
        error: { message: 'Deal not found' },
      };
    }

    deal.status = status;
    if (paymentMethod) deal.paymentMethod = paymentMethod;
    deal.updatedAt = new Date().toISOString();

    if (status === 'COMPLETED') {
      deal.paymentStatus = 'RELEASED_TO_FARMER';
    }

    deals.set(dealId, deal);
    memoryDeals.set(dealId, deal);
    saveStoredDeals(deals);

    // Notify status progression
    await NotificationService.createNotification(
      deal.farmerId,
      'LOT_STATUS_CHANGED',
      `Deal Status: ${status}`,
      `Your deal with ${deal.buyerName} is now marked as ${status}.`,
      dealId
    );

    return {
      data: deal,
      error: null,
    };
  }
}
