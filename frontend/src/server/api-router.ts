import type { ApiRequest, ApiResponsePayload } from './types';
import { AuthService } from '../services/auth-service';
import { MandiService } from '../services/mandi-service';
import { LotService } from '../services/lot-service';
import { DealService } from '../services/deal-service';
import { EscrowService } from '../services/escrow-service';
import { NotificationService } from '../services/notification-service';
import type { LotStatus, DealStatus } from '../lib/types/schema';

/**
 * Universal REST API Dispatcher
 * Handles standard HTTP requests, authentication verification, parameter parsing, and status codes.
 */
export async function handleApiRequest(req: ApiRequest): Promise<ApiResponsePayload> {
  const method = req.method.toUpperCase();
  const rawPath = req.path.split('?')[0];
  const cleanPath = rawPath.replace(/\/$/, '') || '/';

  // Normalize headers
  const headers = Object.fromEntries(
    Object.entries(req.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Helper to extract authenticated farmer
  const getAuthenticatedFarmerId = (): string | null => {
    if (headers['x-farmer-id']) return headers['x-farmer-id'];
    const authHeader = headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Format: jwt-agrichain-mock-<farmerId>-<timestamp>
      const match = token.match(/^jwt-agrichain-mock-(.+?)-\d+$/);
      if (match) return match[1];
      if (token.length > 5) return token;
    }
    return null;
  };

  // -------------------------------------------------------------
  // AUTH ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/auth/otp/request' && method === 'POST') {
    if (!req.body || !req.body.phone) {
      return { status: 400, error: { message: 'Mobile number is required', code: 'MISSING_FIELD' } };
    }
    const res = await AuthService.requestOtp(req.body.phone);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/auth/otp/verify' && method === 'POST') {
    const { phone, otp, fullName, fpoName } = req.body || {};
    if (!phone || !otp) {
      return { status: 400, error: { message: 'Phone and OTP are required', code: 'MISSING_FIELD' } };
    }
    const res = await AuthService.verifyOtp(phone, otp, fullName, fpoName);
    if (res.error) return { status: 401, error: { message: res.error.message, code: 'INVALID_OTP' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/auth/pin/set' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId() || req.body?.farmerId;
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    if (!req.body?.pin) return { status: 400, error: { message: 'PIN is required' } };
    const res = await AuthService.setPin(farmerId, req.body.pin);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/auth/pin/verify' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId() || req.body?.farmerId;
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    if (!req.body?.pin) return { status: 400, error: { message: 'PIN is required' } };
    const res = await AuthService.verifyPin(farmerId, req.body.pin);
    if (res.error) return { status: 401, error: { message: res.error.message, code: 'INVALID_PIN' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/auth/pin/reset' && method === 'POST') {
    const { phone, otp, newPin } = req.body || {};
    if (!phone || !otp || !newPin) {
      return { status: 400, error: { message: 'Phone, OTP and newPin are required' } };
    }
    const res = await AuthService.resetPin(phone, otp, newPin);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // PROFILE ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/profile' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const res = await AuthService.getFarmerProfile(farmerId);
    if (res.error) return { status: 404, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/profile' && method === 'PUT') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    if (!req.body) return { status: 400, error: { message: 'Update body required' } };
    const res = await AuthService.updateFarmerProfile(farmerId, req.body);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/profile/kyc/verify' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId() || req.body?.farmerId;
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const res = await AuthService.verifyAgriStackKYC(farmerId, req.body?.aadhaarNumber || '1234-5678-9012');
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // MANDI & MARKET ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/mandi/benchmarks' && method === 'GET') {
    const category = req.query?.category;
    const res = await MandiService.getAllBenchmarks(category);
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/mandi/benchmarks/') && method === 'GET') {
    const cropName = decodeURIComponent(cleanPath.replace('/api/mandi/benchmarks/', ''));
    const res = await MandiService.getBenchmarkForCrop(cropName);
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/mandi/overview' && method === 'GET') {
    const res = await MandiService.getMarketOverview();
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/mandi/weather' && method === 'GET') {
    const location = req.query?.location || 'Sehore, MP';
    const res = await MandiService.getWeatherAdvisory(location);
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // PRODUCE LOTS ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/lots' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId() || req.body?.farmerId;
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    
    const { cropName, variety, quantityQuintals, qualityGrade, askingPricePerQuintal, storageLocation, notes } = req.body || {};
    
    if (!cropName || !variety || quantityQuintals === undefined || askingPricePerQuintal === undefined) {
      return { status: 400, error: { message: 'Missing required lot listing fields', code: 'INVALID_INPUT' } };
    }

    if (quantityQuintals <= 0 || askingPricePerQuintal <= 0) {
      return { status: 400, error: { message: 'Quantity and asking price must be greater than zero', code: 'INVALID_NUMBER' } };
    }

    const res = await LotService.createLot({
      farmerId,
      cropName,
      variety,
      quantityQuintals: Number(quantityQuintals),
      qualityGrade: qualityGrade || 'GRADE_A',
      askingPricePerQuintal: Number(askingPricePerQuintal),
      storageLocation,
      notes,
    });

    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 201, data: res.data };
  }

  if (cleanPath === '/api/lots' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const status = req.query?.status as LotStatus | undefined;
    const search = req.query?.search;
    const res = await LotService.getFarmerLots(farmerId, status, search);
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/lots/') && cleanPath.endsWith('/route-optimization') && method === 'GET') {
    const lotId = cleanPath.replace('/api/lots/', '').replace('/route-optimization', '');
    const { RouteOptimizationService } = await import('../services/route-optimization-service');
    const threshold = req.query?.threshold ? Number(req.query.threshold) : undefined;
    const res = await RouteOptimizationService.getRecommendationForLot(lotId, threshold);
    if (res.error) return { status: 404, error: { message: res.error.message, code: 'NOT_FOUND' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/lots/') && !cleanPath.endsWith('/status') && !cleanPath.endsWith('/route-optimization') && method === 'GET') {
    const lotId = cleanPath.replace('/api/lots/', '');
    const res = await LotService.getLotById(lotId);
    if (!res.data) return { status: 404, error: { message: 'Lot not found', code: 'NOT_FOUND' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/lots/') && cleanPath.endsWith('/status') && method === 'PATCH') {
    const lotId = cleanPath.replace('/api/lots/', '').replace('/status', '');
    const status = req.body?.status as LotStatus;
    if (!status) return { status: 400, error: { message: 'Status is required' } };
    const res = await LotService.updateLotStatus(lotId, status);
    if (res.error) return { status: 404, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/lots/') && method === 'DELETE') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const lotId = cleanPath.replace('/api/lots/', '');
    const res = await LotService.deleteLot(lotId, farmerId);
    if (res.error) return { status: 409, error: { message: res.error.message, code: 'DEAL_LOCKED_CONFLICT' } };
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // DEALS ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/deals' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const status = req.query?.status as DealStatus | undefined;
    const res = await DealService.getFarmerDeals(farmerId, status);
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/deals/') && !cleanPath.endsWith('/status') && method === 'GET') {
    const dealId = cleanPath.replace('/api/deals/', '');
    const res = await DealService.getDealById(dealId);
    if (!res.data) return { status: 404, error: { message: 'Deal not found', code: 'NOT_FOUND' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/deals/') && cleanPath.endsWith('/negotiate') && method === 'PATCH') {
    const dealId = cleanPath.replace('/api/deals/', '').replace('/negotiate', '');
    const counterPrice = req.body?.counterPricePerQuintal ?? req.body?.counterPrice;
    if (counterPrice === undefined || counterPrice === null) {
      return { status: 400, error: { message: 'counterPricePerQuintal is required', code: 'MISSING_FIELD' } };
    }
    const numPrice = Number(counterPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      return { status: 400, error: { message: 'Counter price must be a positive number', code: 'INVALID_PRICE' } };
    }
    const res = await DealService.negotiateDeal(dealId, numPrice);
    if (res.error) return { status: 400, error: { message: res.error.message, code: 'NEGOTIATION_ERROR' } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/deals/') && cleanPath.endsWith('/accept') && method === 'POST') {
    const dealId = cleanPath.replace('/api/deals/', '').replace('/accept', '');
    const res = await DealService.acceptProposedDeal(dealId);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/deals/') && cleanPath.endsWith('/status') && method === 'PATCH') {
    const dealId = cleanPath.replace('/api/deals/', '').replace('/status', '');
    const { status, paymentMethod } = req.body || {};
    if (!status) return { status: 400, error: { message: 'Status is required' } };
    
    // If advancing from PROPOSED to PAYMENT_HELD, trigger acceptProposedDeal to ensure escrow is locked
    if (status === 'PAYMENT_HELD') {
      const res = await DealService.acceptProposedDeal(dealId);
      if (res.error) return { status: 404, error: { message: res.error.message } };
      return { status: 200, data: res.data };
    }

    const res = await DealService.updateDealStatus(dealId, status, paymentMethod);
    if (res.error) return { status: 404, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // ESCROW & WALLET ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/escrow/records' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const res = await EscrowService.getFarmerEscrowRecords(farmerId);
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/escrow/release' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const { escrowId } = req.body || {};
    if (!escrowId) return { status: 400, error: { message: 'Escrow ID is required' } };
    const res = await EscrowService.releaseEscrow(escrowId, farmerId);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/wallet' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const res = await EscrowService.getFarmerWallet(farmerId);
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/wallet/withdraw' && method === 'POST') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const { amount, destinationAccount } = req.body || {};
    if (!amount || amount <= 0) {
      return { status: 400, error: { message: 'Valid withdrawal amount is required', code: 'INVALID_AMOUNT' } };
    }
    const res = await EscrowService.requestWithdrawal(farmerId, Number(amount), destinationAccount);
    if (res.error) return { status: 400, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS ROUTES
  // -------------------------------------------------------------
  if (cleanPath === '/api/notifications' && method === 'GET') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const unreadOnly = req.query?.unread === 'true';
    const res = await NotificationService.getFarmerNotifications(farmerId, unreadOnly);
    return { status: 200, data: res.data };
  }

  if (cleanPath.startsWith('/api/notifications/') && cleanPath.endsWith('/read') && method === 'PATCH') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const notifId = cleanPath.replace('/api/notifications/', '').replace('/read', '');
    const res = await NotificationService.markAsRead(notifId, farmerId);
    if (res.error) return { status: 404, error: { message: res.error.message } };
    return { status: 200, data: res.data };
  }

  if (cleanPath === '/api/notifications/read-all' && method === 'PATCH') {
    const farmerId = getAuthenticatedFarmerId();
    if (!farmerId) return { status: 401, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    const res = await NotificationService.markAllAsRead(farmerId);
    return { status: 200, data: res.data };
  }

  // 404 Not Found fallback
  return {
    status: 404,
    error: {
      message: `Route not found: ${method} ${cleanPath}`,
      code: 'ROUTE_NOT_FOUND',
    },
  };
}
