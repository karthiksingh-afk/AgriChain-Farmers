import type { FarmerProfile, ApiResponse } from '../lib/types/schema';
import { NotificationService } from './notification-service';

// Local storage / memory repository for fast offline / MVP responsiveness
const FARMERS_STORAGE_KEY = 'agrichain_farmers';
const CURRENT_USER_KEY = 'agrichain_current_farmer';

// In-memory / storage helper
function getStoredFarmers(): Map<string, FarmerProfile> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(FARMERS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // Ignore storage parse errors
  }
  return new Map();
}

function saveStoredFarmers(map: Map<string, FarmerProfile>) {
  try {
    if (typeof window !== 'undefined') {
      const obj = Object.fromEntries(map);
      localStorage.setItem(FARMERS_STORAGE_KEY, JSON.stringify(obj));
    }
  } catch {
    // Storage quota or SSR fallback
  }
}

// Global fallback in-memory state for Node / test environment
const memoryFarmers = new Map<string, FarmerProfile>();

export class AuthService {
  /**
   * Request OTP for login or registration
   * Mock OTP is always '123456' for hackathon demo
   */
  static async requestOtp(phone: string): Promise<ApiResponse<{ phone: string; mockOtp: string }>> {
    if (!phone || phone.trim().length < 10) {
      return {
        data: null,
        error: { message: 'Please enter a valid 10-digit mobile number' },
      };
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    return {
      data: {
        phone: cleanPhone,
        mockOtp: '123456',
      },
      error: null,
    };
  }

  /**
   * Verify OTP and authenticate/create Farmer Profile
   */
  static async verifyOtp(
    phone: string,
    otp: string,
    fullName = 'Kisan Bhai',
    fpoName = 'Sehore Krishi FPO'
  ): Promise<ApiResponse<{ profile: FarmerProfile; token: string; isNewUser: boolean }>> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Validate mock OTP (strictly requires 123456 for demo verification)
    if (otp !== '123456') {
      return {
        data: null,
        error: { message: 'Invalid OTP. Please enter 123456 for demo verification' },
      };
    }

    const storage = getStoredFarmers();
    let farmer = storage.get(cleanPhone) || memoryFarmers.get(cleanPhone);
    let isNewUser = false;

    if (!farmer) {
      isNewUser = true;
      const now = new Date().toISOString();
      const farmerId = `farmer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      farmer = {
        id: farmerId,
        phone: cleanPhone,
        fullName: fullName,
        fpoName: fpoName,
        state: 'Madhya Pradesh',
        district: 'Sehore',
        mandiName: 'Sehore APMC Mandi',
        kycStatus: 'VERIFIED',
        aadhaarStub: `XXXX-XXXX-${cleanPhone.slice(-4)}`,
        farmerIdStub: `MP-AGRI-${cleanPhone.slice(-6)}`,
        bankAccountStub: 'SBI A/C **** 4892',
        upiIdStub: `${cleanPhone}@upi`,
        landAreaAcres: 4.8,
        primaryCrop: 'Sharbati Wheat',
        createdAt: now,
        updatedAt: now,
      };

      storage.set(cleanPhone, farmer);
      memoryFarmers.set(cleanPhone, farmer);
      saveStoredFarmers(storage);

      // Welcome Notification
      await NotificationService.createNotification(
        farmerId,
        'KYC_VERIFIED',
        'Welcome to AgriChain! 🌾',
        'Your profile has been created and e-KYC verified with AgriStack.'
      );
    }

    // Save current session
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(farmer));
    }

    const token = `jwt-agrichain-mock-${farmer.id}-${Date.now()}`;

    return {
      data: {
        profile: farmer,
        token,
        isNewUser,
      },
      error: null,
    };
  }

  /**
   * Set 6-digit Security PIN for re-authentication
   */
  static async setPin(farmerId: string, pin: string): Promise<ApiResponse<{ success: boolean }>> {
    if (!/^\d{6}$/.test(pin)) {
      return {
        data: null,
        error: { message: 'PIN must be exactly 6 numeric digits' },
      };
    }

    const pinHash = `hash_${pin}_salt`;

    const storage = getStoredFarmers();
    for (const [phone, farmer] of storage.entries()) {
      if (farmer.id === farmerId) {
        farmer.pinHash = pinHash;
        farmer.updatedAt = new Date().toISOString();
        storage.set(phone, farmer);
        saveStoredFarmers(storage);
        break;
      }
    }

    for (const [phone, farmer] of memoryFarmers.entries()) {
      if (farmer.id === farmerId) {
        farmer.pinHash = pinHash;
        farmer.updatedAt = new Date().toISOString();
        memoryFarmers.set(phone, farmer);
        break;
      }
    }

    return {
      data: { success: true },
      error: null,
    };
  }

  /**
   * Verify 6-digit PIN for quick re-auth session
   */
  static async verifyPin(farmerId: string, pin: string): Promise<ApiResponse<{ verified: boolean }>> {
    const pinHash = `hash_${pin}_salt`;
    const storage = getStoredFarmers();

    let targetFarmer: FarmerProfile | undefined;
    for (const f of storage.values()) {
      if (f.id === farmerId) targetFarmer = f;
    }
    if (!targetFarmer) {
      for (const f of memoryFarmers.values()) {
        if (f.id === farmerId) targetFarmer = f;
      }
    }

    if (!targetFarmer) {
      return {
        data: null,
        error: { message: 'Farmer account not found' },
      };
    }

    if (!targetFarmer.pinHash) {
      await this.setPin(farmerId, pin);
      return { data: { verified: true }, error: null };
    }

    if (targetFarmer.pinHash !== pinHash) {
      return {
        data: null,
        error: { message: 'Incorrect 6-digit Security PIN' },
      };
    }

    return {
      data: { verified: true },
      error: null,
    };
  }

  /**
   * Forgot PIN Recovery Flow
   */
  static async resetPin(
    phone: string,
    otp: string,
    newPin: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (otp !== '123456') {
      return {
        data: null,
        error: { message: 'Invalid OTP for PIN reset' },
      };
    }

    if (!/^\d{6}$/.test(newPin)) {
      return {
        data: null,
        error: { message: 'New PIN must be 6 digits' },
      };
    }

    const storage = getStoredFarmers();
    const farmer = storage.get(cleanPhone) || memoryFarmers.get(cleanPhone);

    if (!farmer) {
      return {
        data: null,
        error: { message: 'No registered farmer found with this phone number' },
      };
    }

    farmer.pinHash = `hash_${newPin}_salt`;
    farmer.updatedAt = new Date().toISOString();

    storage.set(cleanPhone, farmer);
    memoryFarmers.set(cleanPhone, farmer);
    saveStoredFarmers(storage);

    return {
      data: { success: true },
      error: null,
    };
  }

  /**
   * Get Farmer Profile by ID
   */
  static async getFarmerProfile(farmerId: string): Promise<ApiResponse<FarmerProfile>> {
    const storage = getStoredFarmers();
    let target: FarmerProfile | undefined;
    for (const f of storage.values()) {
      if (f.id === farmerId) target = f;
    }
    if (!target) {
      for (const f of memoryFarmers.values()) {
        if (f.id === farmerId) target = f;
      }
    }

    if (!target) {
      return {
        data: null,
        error: { message: 'Farmer profile not found' },
      };
    }

    return {
      data: target,
      error: null,
    };
  }

  /**
   * Update Farmer Profile
   */
  static async updateFarmerProfile(
    farmerId: string,
    updates: Partial<FarmerProfile>
  ): Promise<ApiResponse<FarmerProfile>> {
    const storage = getStoredFarmers();
    let target: FarmerProfile | undefined;
    for (const f of storage.values()) {
      if (f.id === farmerId) target = f;
    }
    if (!target) {
      for (const f of memoryFarmers.values()) {
        if (f.id === farmerId) target = f;
      }
    }

    if (!target) {
      return {
        data: null,
        error: { message: 'Farmer profile not found' },
      };
    }

    Object.assign(target, updates, { updatedAt: new Date().toISOString() });

    storage.set(target.phone, target);
    memoryFarmers.set(target.phone, target);
    saveStoredFarmers(storage);

    return {
      data: target,
      error: null,
    };
  }

  /**
   * Stubbed AgriStack / DigiLocker e-KYC Verification
   */
  static async verifyAgriStackKYC(
    farmerId: string,
    _aadhaarStubNumber: string
  ): Promise<
    ApiResponse<{
      kycStatus: 'VERIFIED';
      farmerRegistryId: string;
      verifiedLandAreaAcres: number;
      primaryCrop: string;
    }>
  > {
    const registryId = `IND-AGRI-STACK-${Date.now().toString().slice(-6)}`;
    
    // Update profile in storage
    await this.updateFarmerProfile(farmerId, {
      kycStatus: 'VERIFIED',
      farmerIdStub: registryId,
      landAreaAcres: 4.8,
      primaryCrop: 'Sharbati Wheat & Soybean',
    });

    return {
      data: {
        kycStatus: 'VERIFIED',
        farmerRegistryId: registryId,
        verifiedLandAreaAcres: 4.8,
        primaryCrop: 'Sharbati Wheat & Soybean',
      },
      error: null,
    };
  }

  /**
   * Get currently active session profile
   */
  static getCurrentFarmer(): FarmerProfile | null {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(CURRENT_USER_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    const first = Array.from(memoryFarmers.values())[0];
    return first || null;
  }

  /**
   * Sign out
   */
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
}
