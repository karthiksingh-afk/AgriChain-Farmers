import { handleApiRequest } from '../server/api-router';
import type { ApiRequest } from '../server/types';

declare const process: { exit: (code: number) => void };

interface TestResult {
  endpoint: string;
  method: string;
  scenario: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes?: string;
}

async function runBrunoPostmanSuite() {
  console.log('========================================================================');
  console.log('🚀 AGRICHAIN PHASE 2: BRUNO / POSTMAN COMPREHENSIVE API TEST SUITE');
  console.log('========================================================================\n');

  const results: TestResult[] = [];

  const executeTest = async (
    name: string,
    req: ApiRequest,
    expectedStatus: number,
    validator?: (res: any) => boolean
  ) => {
    const res = await handleApiRequest(req);
    const passed = res.status === expectedStatus && (!validator || validator(res));

    results.push({
      endpoint: req.path.split('?')[0],
      method: req.method,
      scenario: name,
      expectedStatus,
      actualStatus: res.status,
      passed,
      notes: res.error?.message,
    });

    if (passed) {
      console.log(`✅ [${res.status}] ${req.method} ${req.path} -> ${name}`);
    } else {
      console.error(
        `❌ [Expected ${expectedStatus}, Got ${res.status}] ${req.method} ${req.path} -> ${name} (${res.error?.message || 'Validation failed'})`
      );
    }
    return res;
  };

  let authToken = '';
  let farmerId = '';
  let createdLotId = '';
  let matchedDealId = '';
  let escrowRecordId = '';
  let sampleNotifId = '';

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & PIN
  // -------------------------------------------------------------
  console.log('\n--- Group 1: Authentication & PIN APIs ---');

  // Request OTP - Positive
  await executeTest(
    'Request OTP with valid 10-digit number',
    { method: 'POST', path: '/api/auth/otp/request', headers: {}, body: { phone: '9876543210' } },
    200,
    (res) => res.data?.mockOtp === '123456'
  );

  // Request OTP - Negative (Missing phone)
  await executeTest(
    'Request OTP with missing phone number',
    { method: 'POST', path: '/api/auth/otp/request', headers: {}, body: {} },
    400
  );

  // Verify OTP - Positive
  const otpRes = await executeTest(
    'Verify OTP with valid 123456',
    {
      method: 'POST',
      path: '/api/auth/otp/verify',
      headers: {},
      body: { phone: '9876543210', otp: '123456', fullName: 'Ramesh Patel', fpoName: 'Sehore FPO' },
    },
    200,
    (res) => !!res.data?.token && !!res.data?.profile?.id
  );

  authToken = otpRes.data?.token;
  farmerId = otpRes.data?.profile?.id;

  const authHeaders = { authorization: `Bearer ${authToken}` };

  // Verify OTP - Negative (Invalid OTP)
  await executeTest(
    'Verify OTP with wrong code (000000)',
    {
      method: 'POST',
      path: '/api/auth/otp/verify',
      headers: {},
      body: { phone: '9876543210', otp: '000000' },
    },
    401
  );

  // Set PIN - Positive
  await executeTest(
    'Set 6-digit security PIN',
    { method: 'POST', path: '/api/auth/pin/set', headers: authHeaders, body: { pin: '654321' } },
    200
  );

  // Set PIN - Negative (Non 6-digits)
  await executeTest(
    'Set PIN with invalid length (3 digits)',
    { method: 'POST', path: '/api/auth/pin/set', headers: authHeaders, body: { pin: '123' } },
    400
  );

  // Verify PIN - Positive
  await executeTest(
    'Verify correct 6-digit PIN',
    { method: 'POST', path: '/api/auth/pin/verify', headers: authHeaders, body: { pin: '654321' } },
    200,
    (res) => res.data?.verified === true
  );

  // Verify PIN - Negative (Incorrect PIN)
  await executeTest(
    'Verify wrong 6-digit PIN',
    { method: 'POST', path: '/api/auth/pin/verify', headers: authHeaders, body: { pin: '999999' } },
    401
  );

  // Reset PIN (Forgot PIN) - Positive
  await executeTest(
    'Reset PIN using OTP verification',
    {
      method: 'POST',
      path: '/api/auth/pin/reset',
      headers: {},
      body: { phone: '9876543210', otp: '123456', newPin: '887766' },
    },
    200
  );

  // -------------------------------------------------------------
  // 2. PROFILE & E-KYC
  // -------------------------------------------------------------
  console.log('\n--- Group 2: Farmer Profile & e-KYC APIs ---');

  // Get Profile - Positive
  await executeTest(
    'Fetch authenticated farmer profile',
    { method: 'GET', path: '/api/profile', headers: authHeaders },
    200,
    (res) => res.data?.id === farmerId
  );

  // Get Profile - Negative (Unauthorized without token)
  await executeTest(
    'Fetch profile without auth token (Unauthorized)',
    { method: 'GET', path: '/api/profile', headers: {} },
    401
  );

  // Update Profile - Positive
  await executeTest(
    'Update profile bank & mandi details',
    {
      method: 'PUT',
      path: '/api/profile',
      headers: authHeaders,
      body: { mandiName: 'Indore Krishi Upaj Mandi', bankAccountStub: 'HDFC Bank A/C 9901' },
    },
    200,
    (res) => res.data?.mandiName === 'Indore Krishi Upaj Mandi'
  );

  // Verify AgriStack KYC - Positive
  await executeTest(
    'Verify AgriStack e-KYC credentials stub',
    {
      method: 'POST',
      path: '/api/profile/kyc/verify',
      headers: authHeaders,
      body: { aadhaarNumber: '1234-5678-9012' },
    },
    200,
    (res) => res.data?.kycStatus === 'VERIFIED'
  );

  // -------------------------------------------------------------
  // 3. MANDI BENCHMARKS & MARKET INTELLIGENCE
  // -------------------------------------------------------------
  console.log('\n--- Group 3: Mandi Benchmarks & Market Intelligence ---');

  // Get All Benchmarks
  await executeTest(
    'Get all APMC Mandi benchmarks',
    { method: 'GET', path: '/api/mandi/benchmarks', headers: {} },
    200,
    (res) => Array.isArray(res.data) && res.data.length >= 8
  );

  // Get Category Benchmarks Filter
  await executeTest(
    'Filter Mandi benchmarks by category (Cereal)',
    { method: 'GET', path: '/api/mandi/benchmarks?category=Cereal', headers: {}, query: { category: 'Cereal' } },
    200,
    (res) => res.data.every((b: any) => b.category === 'Cereal')
  );

  // Get Crop Benchmark
  await executeTest(
    'Get benchmark for Sharbati Wheat',
    { method: 'GET', path: '/api/mandi/benchmarks/Sharbati%20Wheat', headers: {} },
    200,
    (res) => res.data?.modalRatePerQuintal === 3150
  );

  // Get Market Overview
  await executeTest(
    'Get aggregated Mandi market arrivals & buyer overview',
    { method: 'GET', path: '/api/mandi/overview', headers: {} },
    200,
    (res) => res.data?.totalArrivalsMt > 0 && res.data?.totalActiveBuyers > 0
  );

  // Get Weather Advisory
  await executeTest(
    'Get localized agro-weather advisory',
    { method: 'GET', path: '/api/mandi/weather?location=Sehore,%20MP', headers: {}, query: { location: 'Sehore, MP' } },
    200,
    (res) => res.data?.tempC > 0 && typeof res.data?.harvestRecommendation === 'string'
  );

  // -------------------------------------------------------------
  // 4. PRODUCE LOTS & INVENTORY
  // -------------------------------------------------------------
  console.log('\n--- Group 4: Produce Lots & Inventory Management ---');

  // Create Lot - Positive
  const createLotRes = await executeTest(
    'Create produce lot with Grade A quality and asking price',
    {
      method: 'POST',
      path: '/api/lots',
      headers: authHeaders,
      body: {
        cropName: 'Sharbati Wheat',
        variety: 'Lokwan-1 Gold',
        quantityQuintals: 75,
        qualityGrade: 'GRADE_A',
        askingPricePerQuintal: 3350,
        storageLocation: 'Warehouse Block 3',
        notes: 'Moisture 10.8%, machine cleaned',
      },
    },
    201,
    (res) => !!res.data?.lot?.id && !!res.data?.dealId
  );

  createdLotId = createLotRes.data?.lot?.id;
  matchedDealId = createLotRes.data?.dealId;

  // Create Lot - Negative (Negative Quantity)
  await executeTest(
    'Create lot with negative quantity (-10 qtl)',
    {
      method: 'POST',
      path: '/api/lots',
      headers: authHeaders,
      body: {
        cropName: 'Yellow Soybean',
        variety: 'JS 9560',
        quantityQuintals: -10,
        askingPricePerQuintal: 4800,
      },
    },
    400
  );

  // Create Lot - Negative (Missing required crop name)
  await executeTest(
    'Create lot with missing crop name',
    {
      method: 'POST',
      path: '/api/lots',
      headers: authHeaders,
      body: {
        quantityQuintals: 20,
        askingPricePerQuintal: 3000,
      },
    },
    400
  );

  // Get Farmer Lots - Positive
  await executeTest(
    'List farmer produce lots',
    { method: 'GET', path: '/api/lots', headers: authHeaders },
    200,
    (res) => Array.isArray(res.data) && res.data.length > 0
  );

  // Get Lot By ID - Positive
  await executeTest(
    `Get lot details by ID (${createdLotId})`,
    { method: 'GET', path: `/api/lots/${createdLotId}`, headers: authHeaders },
    200,
    (res) => res.data?.id === createdLotId && res.data?.mandiBenchmarkRate === 3150
  );

  // Get Lot By ID - Negative (Non-existent ID)
  await executeTest(
    'Get non-existent lot ID (404)',
    { method: 'GET', path: '/api/lots/lot-fake-999999', headers: authHeaders },
    404
  );

  // Update Lot Status - Positive
  await executeTest(
    'Update lot status to AWAITING_TRUCK',
    {
      method: 'PATCH',
      path: `/api/lots/${createdLotId}/status`,
      headers: authHeaders,
      body: { status: 'AWAITING_TRUCK' },
    },
    200,
    (res) => res.data?.status === 'AWAITING_TRUCK'
  );

  // Delete Lot - Negative (Conflict: Locked in Active Deal)
  await executeTest(
    'Delete lot locked in active escrow deal (409 Conflict)',
    { method: 'DELETE', path: `/api/lots/${createdLotId}`, headers: authHeaders },
    409
  );

  // -------------------------------------------------------------
  // 5. DEALS, ESCROW & WALLET
  // -------------------------------------------------------------
  console.log('\n--- Group 5: Deals, Escrow & Wallet APIs ---');

  // Get Farmer Deals - Positive
  await executeTest(
    'List simulated deals for farmer',
    { method: 'GET', path: '/api/deals', headers: authHeaders },
    200,
    (res) => Array.isArray(res.data) && res.data.length > 0
  );

  // Get Deal by ID - Positive
  await executeTest(
    `Get deal details by ID (${matchedDealId})`,
    { method: 'GET', path: `/api/deals/${matchedDealId}`, headers: authHeaders },
    200,
    (res) => res.data?.id === matchedDealId && !!res.data?.transactionRef
  );

  // Update Deal Status - Positive (Dispatched -> Completed)
  await executeTest(
    'Update deal status to COMPLETED (releases payment)',
    {
      method: 'PATCH',
      path: `/api/deals/${matchedDealId}/status`,
      headers: authHeaders,
      body: { status: 'COMPLETED' },
    },
    200,
    (res) => res.data?.status === 'COMPLETED' && res.data?.paymentStatus === 'RELEASED_TO_FARMER'
  );

  // Get Escrow Records - Positive
  const escrowListRes = await executeTest(
    'Get farmer escrow records',
    { method: 'GET', path: '/api/escrow/records', headers: authHeaders },
    200,
    (res) => Array.isArray(res.data) && res.data.length > 0
  );

  if (escrowListRes.data && escrowListRes.data.length > 0) {
    escrowRecordId = escrowListRes.data[0].id;
  }

  // Release Escrow - Positive
  if (escrowRecordId) {
    await executeTest(
      `Release escrow funds for record (${escrowRecordId})`,
      {
        method: 'POST',
        path: '/api/escrow/release',
        headers: authHeaders,
        body: { escrowId: escrowRecordId },
      },
      200,
      (res) => res.data?.status === 'DISBURSED'
    );
  }

  // Get Wallet - Positive
  await executeTest(
    'Get farmer wallet balance and transaction ledger',
    { method: 'GET', path: '/api/wallet', headers: authHeaders },
    200,
    (res) => res.data?.availableBalance > 0 && Array.isArray(res.data?.transactions)
  );

  // Request Withdrawal - Positive
  await executeTest(
    'Withdraw ₹10,000 to primary UPI account',
    {
      method: 'POST',
      path: '/api/wallet/withdraw',
      headers: authHeaders,
      body: { amount: 10000, destinationAccount: '9876543210@upi' },
    },
    200,
    (res) => res.data?.transaction?.amount === 10000 && res.data?.transaction?.status === 'SUCCESS'
  );

  // Request Withdrawal - Negative (Insufficient Funds)
  await executeTest(
    'Withdraw ₹50,000,000 (Exceeds available balance)',
    {
      method: 'POST',
      path: '/api/wallet/withdraw',
      headers: authHeaders,
      body: { amount: 50000000, destinationAccount: '9876543210@upi' },
    },
    400
  );

  // -------------------------------------------------------------
  // 6. NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n--- Group 6: Notifications APIs ---');

  // Get Notifications - Positive
  const notifRes = await executeTest(
    'Get in-app notifications for farmer',
    { method: 'GET', path: '/api/notifications', headers: authHeaders },
    200,
    (res) => Array.isArray(res.data) && res.data.length > 0
  );

  if (notifRes.data && notifRes.data.length > 0) {
    sampleNotifId = notifRes.data[0].id;
  }

  // Mark Notification As Read - Positive
  if (sampleNotifId) {
    await executeTest(
      `Mark notification (${sampleNotifId}) as read`,
      { method: 'PATCH', path: `/api/notifications/${sampleNotifId}/read`, headers: authHeaders },
      200,
      (res) => res.data?.read === true
    );
  }

  // Mark All Notifications As Read - Positive
  await executeTest(
    'Mark all notifications as read',
    { method: 'PATCH', path: '/api/notifications/read-all', headers: authHeaders },
    200,
    (res) => typeof res.data?.updatedCount === 'number'
  );

  // -------------------------------------------------------------
  // 7. EDGE CASES & ROUTE NOT FOUND
  // -------------------------------------------------------------
  console.log('\n--- Group 7: Edge Cases & 404 Fallback ---');

  // Unknown Endpoint - 404
  await executeTest(
    'Handle non-existent route (404 Fallback)',
    { method: 'GET', path: '/api/non-existent-route', headers: {} },
    404
  );

  // -------------------------------------------------------------
  // SUMMARY TABLE GENERATION
  // -------------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n========================================================================');
  console.log(`🏁 PHASE 2 TEST SUMMARY: ${passedCount} / ${total} TESTS PASSED (${failedCount} FAILED)`);
  console.log('========================================================================\n');

  if (failedCount > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runBrunoPostmanSuite().catch((err) => {
  console.error('Fatal test error:', err);
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
});
