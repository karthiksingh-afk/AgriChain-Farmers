import type { EscrowRecord, FarmerWallet, WalletTransaction, ApiResponse } from '../lib/types/schema';
import { NotificationService } from './notification-service';

const ESCROW_STORAGE_KEY = 'agrichain_escrows';
const WALLET_STORAGE_KEY = 'agrichain_wallets';

const memoryEscrows = new Map<string, EscrowRecord>();
const memoryWallets = new Map<string, FarmerWallet>();

function getStoredEscrows(): Map<string, EscrowRecord> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(ESCROW_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryEscrows;
}

function saveStoredEscrows(map: Map<string, EscrowRecord>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

function getStoredWallets(): Map<string, FarmerWallet> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(WALLET_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryWallets;
}

function saveStoredWallets(map: Map<string, FarmerWallet>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

export class EscrowService {
  /**
   * Lock funds in simulated escrow when a deal is generated
   */
  static async lockDealEscrow(
    dealId: string,
    farmerId: string,
    amount: number
  ): Promise<ApiResponse<EscrowRecord>> {
    const escrows = getStoredEscrows();
    const now = new Date().toISOString();
    const escrowId = `escrow-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const record: EscrowRecord = {
      id: escrowId,
      dealId,
      farmerId,
      totalAmount: amount,
      heldAmount: amount,
      releasedAmount: 0,
      status: 'SECURED',
      escrowAccountRef: `ICICI-ESCROW-AGRI-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: now,
      updatedAt: now,
    };

    escrows.set(escrowId, record);
    memoryEscrows.set(escrowId, record);
    saveStoredEscrows(escrows);

    // Update Farmer Wallet
    await this.updateWalletOnDealLock(farmerId, amount, dealId);

    // Send Notification
    await NotificationService.createNotification(
      farmerId,
      'ESCROW_LOCKED',
      'Escrow Payment Secured! 🔒',
      `₹${amount.toLocaleString('en-IN')} has been safely locked in simulated escrow for Deal #${dealId.slice(-6)}.`,
      dealId
    );

    return {
      data: record,
      error: null,
    };
  }

  /**
   * Release escrow funds to Farmer upon verified delivery / settlement
   */
  static async releaseEscrow(
    escrowId: string,
    farmerId: string
  ): Promise<ApiResponse<EscrowRecord>> {
    const escrows = getStoredEscrows();
    const record = escrows.get(escrowId) || memoryEscrows.get(escrowId);

    if (!record) {
      return {
        data: null,
        error: { message: 'Escrow record not found' },
      };
    }

    if (record.status === 'DISBURSED') {
      return {
        data: null,
        error: { message: 'Escrow funds already disbursed' },
      };
    }

    record.releasedAmount = record.heldAmount;
    record.heldAmount = 0;
    record.status = 'DISBURSED';
    record.releasedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    escrows.set(escrowId, record);
    memoryEscrows.set(escrowId, record);
    saveStoredEscrows(escrows);

    // Adjust wallet
    await this.updateWalletOnSettlement(farmerId, record.totalAmount, record.dealId);

    // Send Notification
    await NotificationService.createNotification(
      farmerId,
      'ESCROW_RELEASED',
      'Payment Disbursed to Wallet! 🎉',
      `₹${record.totalAmount.toLocaleString('en-IN')} has been successfully transferred from escrow into your available balance.`,
      record.dealId
    );

    return {
      data: record,
      error: null,
    };
  }

  /**
   * Get all escrow records for a farmer
   */
  static async getFarmerEscrowRecords(farmerId: string): Promise<ApiResponse<EscrowRecord[]>> {
    const escrows = getStoredEscrows();
    const list = Array.from(escrows.values()).filter((e) => e.farmerId === farmerId);
    return {
      data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      error: null,
    };
  }

  /**
   * Get Farmer Wallet details with transaction ledger
   */
  static async getFarmerWallet(farmerId: string): Promise<ApiResponse<FarmerWallet>> {
    const wallets = getStoredWallets();
    let wallet = wallets.get(farmerId) || memoryWallets.get(farmerId);

    if (!wallet) {
      wallet = {
        id: `wallet-${farmerId}`,
        farmerId,
        availableBalance: 42500.0, // Initial demo seed
        escrowLockedBalance: 0.0,
        totalSettledEarnings: 154000.0,
        activeDealsCount: 0,
        transactions: [
          {
            id: `tx-init-1`,
            farmerId,
            type: 'CREDIT_SETTLEMENT',
            amount: 54000,
            referenceId: 'AGRI-TXN-PREV-01',
            description: 'Settlement for 20 Quintals Mustard lot',
            status: 'SUCCESS',
            createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      wallets.set(farmerId, wallet);
      memoryWallets.set(farmerId, wallet);
      saveStoredWallets(wallets);
    }

    return {
      data: wallet,
      error: null,
    };
  }

  /**
   * Simulate instant payout/withdrawal to farmer bank/UPI account
   */
  static async requestWithdrawal(
    farmerId: string,
    amount: number,
    destinationAccount: string
  ): Promise<ApiResponse<{ wallet: FarmerWallet; transaction: WalletTransaction }>> {
    if (amount <= 0) {
      return {
        data: null,
        error: { message: 'Withdrawal amount must be greater than 0' },
      };
    }

    const { data: wallet } = await this.getFarmerWallet(farmerId);
    if (!wallet) {
      return {
        data: null,
        error: { message: 'Farmer wallet not found' },
      };
    }

    if (wallet.availableBalance < amount) {
      return {
        data: null,
        error: {
          message: `Insufficient balance. Available: ₹${wallet.availableBalance.toLocaleString('en-IN')}`,
        },
      };
    }

    wallet.availableBalance -= amount;
    wallet.updatedAt = new Date().toISOString();

    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      farmerId,
      type: 'DEBIT_WITHDRAWAL',
      amount,
      referenceId: `PAYOUT-${Date.now().toString().slice(-6)}`,
      description: `Instant Payout to ${destinationAccount || 'Primary Bank Account'}`,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    };

    if (!wallet.transactions) wallet.transactions = [];
    wallet.transactions.unshift(transaction);

    const wallets = getStoredWallets();
    wallets.set(farmerId, wallet);
    memoryWallets.set(farmerId, wallet);
    saveStoredWallets(wallets);

    // Notify farmer
    await NotificationService.createNotification(
      farmerId,
      'WITHDRAWAL_PROCESSED',
      'Withdrawal Successful! 💸',
      `₹${amount.toLocaleString('en-IN')} has been sent to ${destinationAccount}. Ref: ${transaction.referenceId}`
    );

    return {
      data: { wallet, transaction },
      error: null,
    };
  }

  private static async updateWalletOnDealLock(farmerId: string, amount: number, dealId: string) {
    const { data: wallet } = await this.getFarmerWallet(farmerId);
    if (wallet) {
      wallet.escrowLockedBalance += amount;
      wallet.activeDealsCount += 1;
      wallet.updatedAt = new Date().toISOString();

      if (!wallet.transactions) wallet.transactions = [];
      wallet.transactions.unshift({
        id: `tx-lock-${Date.now()}`,
        farmerId,
        type: 'ESCROW_LOCK',
        amount,
        referenceId: dealId,
        description: `Buyer payment locked in escrow for Deal #${dealId.slice(-6)}`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      });

      const wallets = getStoredWallets();
      wallets.set(farmerId, wallet);
      memoryWallets.set(farmerId, wallet);
      saveStoredWallets(wallets);
    }
  }

  private static async updateWalletOnSettlement(farmerId: string, amount: number, dealId: string) {
    const { data: wallet } = await this.getFarmerWallet(farmerId);
    if (wallet) {
      wallet.escrowLockedBalance = Math.max(0, wallet.escrowLockedBalance - amount);
      wallet.availableBalance += amount;
      wallet.totalSettledEarnings += amount;
      wallet.activeDealsCount = Math.max(0, wallet.activeDealsCount - 1);
      wallet.updatedAt = new Date().toISOString();

      if (!wallet.transactions) wallet.transactions = [];
      wallet.transactions.unshift({
        id: `tx-settle-${Date.now()}`,
        farmerId,
        type: 'CREDIT_SETTLEMENT',
        amount,
        referenceId: dealId,
        description: `Escrow released for completed deal #${dealId.slice(-6)}`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      });

      const wallets = getStoredWallets();
      wallets.set(farmerId, wallet);
      memoryWallets.set(farmerId, wallet);
      saveStoredWallets(wallets);
    }
  }
}
