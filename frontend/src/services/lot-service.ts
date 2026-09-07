import type { ProduceLot, QualityGrade, LotStatus, ApiResponse } from '../lib/types/schema';
import { MandiService } from './mandi-service';
import { DealService } from './deal-service';
import { NotificationService } from './notification-service';

const LOTS_STORAGE_KEY = 'agrichain_lots';
const memoryLots = new Map<string, ProduceLot>();

function getStoredLots(): Map<string, ProduceLot> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOTS_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryLots;
}

function saveStoredLots(map: Map<string, ProduceLot>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

export interface CreateLotInput {
  farmerId: string;
  cropName: string;
  variety: string;
  quantityQuintals: number;
  qualityGrade: QualityGrade;
  askingPricePerQuintal: number;
  storageLocation?: string;
  notes?: string;
}

export class LotService {
  /**
   * List a new Produce Lot and auto-trigger simulated buyer deal
   */
  static async createLot(input: CreateLotInput): Promise<ApiResponse<{ lot: ProduceLot; dealId?: string }>> {
    // Validation
    if (!input.farmerId) {
      return { data: null, error: { message: 'Farmer ID is required' } };
    }
    if (!input.cropName || !input.variety) {
      return { data: null, error: { message: 'Crop Name and Variety are required' } };
    }
    if (input.quantityQuintals <= 0) {
      return { data: null, error: { message: 'Quantity must be greater than 0 quintals' } };
    }
    if (input.askingPricePerQuintal <= 0) {
      return { data: null, error: { message: 'Asking price must be greater than 0' } };
    }

    // Fetch Mandi Benchmark Rate for comparison
    const { data: benchmark } = await MandiService.getBenchmarkForCrop(input.cropName);
    const benchmarkRate = benchmark ? benchmark.modalRatePerQuintal : 3000;

    const lotId = `lot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const totalValue = Math.round(input.quantityQuintals * input.askingPricePerQuintal * 100) / 100;

    const newLot: ProduceLot = {
      id: lotId,
      farmerId: input.farmerId,
      cropName: input.cropName,
      variety: input.variety,
      quantityQuintals: input.quantityQuintals,
      qualityGrade: input.qualityGrade,
      askingPricePerQuintal: input.askingPricePerQuintal,
      mandiBenchmarkRate: benchmarkRate,
      totalLotValue: totalValue,
      status: 'DEAL_ACTIVE', // Auto matched with simulated buyer
      coldChainTempC: 18.2,
      coldChainHumidityPct: 62.5,
      storageLocation: input.storageLocation || 'On-Farm Covered Godown #2',
      qualityCertificateId: `AGRI-QC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      qualityScore: input.qualityGrade === 'GRADE_A' ? 96.5 : 88.0,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const storage = getStoredLots();
    storage.set(lotId, newLot);
    memoryLots.set(lotId, newLot);
    saveStoredLots(storage);

    // Auto-generate simulated buyer deal & escrow lock
    const { data: deal } = await DealService.autoGenerateSimulatedDeal(
      lotId,
      input.farmerId,
      input.cropName,
      input.quantityQuintals,
      input.askingPricePerQuintal
    );

    return {
      data: {
        lot: newLot,
        dealId: deal?.id,
      },
      error: null,
    };
  }

  /**
   * Get all lots for a specific farmer with optional search & status filter
   */
  static async getFarmerLots(
    farmerId: string,
    statusFilter?: LotStatus,
    searchQuery?: string
  ): Promise<ApiResponse<ProduceLot[]>> {
    const storage = getStoredLots();
    let list = Array.from(storage.values()).filter((l) => l.farmerId === farmerId);

    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) => l.cropName.toLowerCase().includes(q) || l.variety.toLowerCase().includes(q)
      );
    }

    return {
      data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      error: null,
    };
  }

  /**
   * Get lot by ID
   */
  static async getLotById(lotId: string): Promise<ApiResponse<ProduceLot | null>> {
    const storage = getStoredLots();
    const lot = storage.get(lotId) || memoryLots.get(lotId) || null;
    return {
      data: lot,
      error: null,
    };
  }

  /**
   * Update lot status (e.g. Stock Held -> Awaiting Truck -> In Transit -> Settled)
   */
  static async updateLotStatus(lotId: string, status: LotStatus): Promise<ApiResponse<ProduceLot>> {
    const storage = getStoredLots();
    const lot = storage.get(lotId) || memoryLots.get(lotId);

    if (!lot) {
      return {
        data: null,
        error: { message: 'Produce lot not found' },
      };
    }

    lot.status = status;
    lot.updatedAt = new Date().toISOString();

    storage.set(lotId, lot);
    memoryLots.set(lotId, lot);
    saveStoredLots(storage);

    // Notify farmer
    await NotificationService.createNotification(
      lot.farmerId,
      'LOT_STATUS_CHANGED',
      `Lot Status Updated: ${status}`,
      `Your lot of ${lot.quantityQuintals} qtl ${lot.cropName} is now marked as ${status}.`,
      lotId
    );

    return {
      data: lot,
      error: null,
    };
  }

  /**
   * Delete Lot (Restricted if lot is locked in active deal)
   */
  static async deleteLot(lotId: string, farmerId: string): Promise<ApiResponse<{ success: boolean }>> {
    const storage = getStoredLots();
    const lot = storage.get(lotId) || memoryLots.get(lotId);

    if (!lot) {
      return {
        data: null,
        error: { message: 'Produce lot not found' },
      };
    }

    if (lot.farmerId !== farmerId) {
      return {
        data: null,
        error: { message: 'Unauthorized: Cannot delete another farmer lot' },
      };
    }

    // Check deal status
    const { data: deal } = await DealService.getDealByLotId(lotId);
    if (deal && (deal.status === 'PROPOSED' || deal.status === 'PAYMENT_HELD' || deal.status === 'DISPATCHED')) {
      return {
        data: null,
        error: {
          message: `Cannot delete lot: Deal #${deal.id.slice(-6)} is currently active with buyer ${deal.buyerName} and funds are secured in escrow.`,
        },
      };
    }

    storage.delete(lotId);
    memoryLots.delete(lotId);
    saveStoredLots(storage);

    return {
      data: { success: true },
      error: null,
    };
  }
}
