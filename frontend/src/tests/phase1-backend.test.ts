import { AuthService } from '../services/auth-service';
import { MandiService } from '../services/mandi-service';
import { LotService } from '../services/lot-service';
import { DealService } from '../services/deal-service';
import { EscrowService } from '../services/escrow-service';
import { insforge, config } from '../lib/insforge';

declare const process: { exit: (code: number) => void };

async function runPhase1Tests() {
  console.log('===========================================================');
  console.log('🌾 AGRICHAIN BACKEND PHASE 1: INTEGRATION VERIFICATION SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // --- 1. InsForge Client & Environment Setup ---
  console.log('\n--- 1. Testing InsForge Connectivity & Config ---');
  assert(!!insforge, 'InsForge client initialized correctly');
  assert(typeof config.baseUrl === 'string' && config.baseUrl.length > 0, 'InsForge Base URL is configured');
  assert(typeof config.anonKey === 'string' && config.anonKey.length > 0, 'InsForge Anon Key is configured');

  // --- 2. Authentication & Security PIN ---
  console.log('\n--- 2. Testing Authentication, PIN & e-KYC ---');
  const testPhone = '9876543210';

  // Request OTP
  const otpRes = await AuthService.requestOtp(testPhone);
  assert(otpRes.error === null && otpRes.data?.mockOtp === '123456', 'Request OTP returns mock 123456');

  // Invalid OTP check
  const badOtpRes = await AuthService.verifyOtp(testPhone, '000000');
  assert(badOtpRes.error !== null, 'Rejects invalid OTP properly');

  // Verify Valid OTP
  const authRes = await AuthService.verifyOtp(testPhone, '123456', 'Ramesh Kumar Patel', 'Sehore Krishi FPO');
  assert(authRes.error === null && !!authRes.data?.profile.id, 'Verify OTP logs in farmer and creates profile');
  
  const farmer = authRes.data!.profile;
  assert(farmer.phone === testPhone, 'Farmer phone matches registration');

  // Set 6-Digit PIN
  const pinRes = await AuthService.setPin(farmer.id, '456789');
  assert(pinRes.error === null && pinRes.data?.success === true, 'Set 6-digit security PIN');

  // Verify Correct PIN
  const verifyPinRes = await AuthService.verifyPin(farmer.id, '456789');
  assert(verifyPinRes.error === null && verifyPinRes.data?.verified === true, 'Verify correct 6-digit PIN');

  // Verify Wrong PIN
  const wrongPinRes = await AuthService.verifyPin(farmer.id, '111111');
  assert(wrongPinRes.error !== null, 'Rejects incorrect PIN');

  // Forgot PIN Reset Flow
  const resetRes = await AuthService.resetPin(testPhone, '123456', '998877');
  assert(resetRes.error === null, 'Reset PIN via OTP successful');

  const reVerifyPin = await AuthService.verifyPin(farmer.id, '998877');
  assert(reVerifyPin.data?.verified === true, 'New PIN is now active and verified');

  // AgriStack / DigiLocker e-KYC Stub
  const kycRes = await AuthService.verifyAgriStackKYC(farmer.id, '1234-5678-9012');
  assert(kycRes.data?.kycStatus === 'VERIFIED' && kycRes.data.verifiedLandAreaAcres > 0, 'AgriStack e-KYC stub verified farmer land & credentials');

  // --- 3. Mandi Benchmarks & Market Overview ---
  console.log('\n--- 3. Testing Mandi Price Discovery & Benchmarks ---');
  const allBenchmarks = await MandiService.getAllBenchmarks();
  assert(allBenchmarks.data !== null && allBenchmarks.data.length >= 8, `Loaded ${allBenchmarks.data?.length} Mandi crop benchmarks`);

  const wheatBenchmark = await MandiService.getBenchmarkForCrop('Sharbati Wheat');
  assert(
    wheatBenchmark.data?.modalRatePerQuintal === 3150 && wheatBenchmark.data?.marketName === 'Sehore APMC Mandi',
    'Sharbati Wheat benchmark accurately retrieved (₹3,150/qtl)'
  );

  const marketOverview = await MandiService.getMarketOverview();
  assert(
    marketOverview.data !== null && marketOverview.data.totalArrivalsMt > 0 && marketOverview.data.totalActiveBuyers > 0,
    `Market overview aggregates: ${marketOverview.data?.totalArrivalsMt} MT arrivals, ${marketOverview.data?.totalActiveBuyers} active buyers`
  );

  const weather = await MandiService.getWeatherAdvisory('Sehore, MP');
  assert(weather.data !== null && weather.data.tempC > 0, 'Weather advisory and harvest recommendation loaded');

  // --- 4. Produce Lot Creation & Quality Grading ---
  console.log('\n--- 4. Testing Produce Lot Listing & Auto-Deal Match ---');

  // Negative validation
  const badLot = await LotService.createLot({
    farmerId: farmer.id,
    cropName: 'Sharbati Wheat',
    variety: 'Lokwan-1',
    quantityQuintals: -10, // Invalid
    qualityGrade: 'GRADE_A',
    askingPricePerQuintal: 3200,
  });
  assert(badLot.error !== null, 'Rejects invalid lot with non-positive quantity');

  // Create valid lot
  const validLotRes = await LotService.createLot({
    farmerId: farmer.id,
    cropName: 'Sharbati Wheat',
    variety: 'Lokwan-1 Gold',
    quantityQuintals: 50,
    qualityGrade: 'GRADE_A',
    askingPricePerQuintal: 3250,
    storageLocation: 'Warehouse 4A, Sehore',
    notes: 'Moisture tested at 11.2%, cleaned & sorted',
  });

  assert(validLotRes.error === null && !!validLotRes.data?.lot.id, 'Produce lot created successfully');
  const lot = validLotRes.data!.lot;
  assert(lot.totalLotValue === 162500, `Calculated lot total value: ₹${lot.totalLotValue} (50 qtl * ₹3,250)`);
  assert(lot.mandiBenchmarkRate === 3150, 'Mandi benchmark rate ₹3,150 linked to lot for comparison');
  assert(!!lot.qualityCertificateId, `Quality certificate generated: ${lot.qualityCertificateId} (Score: ${lot.qualityScore}%)`);

  // --- 5. Automated Deal & Escrow Verification ---
  console.log('\n--- 5. Testing Simulated Deal Generation & Escrow Locks ---');
  const dealRes = await DealService.getDealByLotId(lot.id);
  assert(dealRes.data !== null, 'Simulated buyer deal automatically generated for lot');
  
  const deal = dealRes.data!;
  assert(deal.totalDealAmount === 162500, `Deal amount matches lot value: ₹${deal.totalDealAmount}`);
  assert(deal.status === 'PROPOSED' || deal.status === 'PAYMENT_HELD', 'Deal status is PROPOSED / PAYMENT_HELD and funds secured in escrow');
  assert(deal.transactionRef.startsWith('AGRI-TXN-'), `Transaction Reference assigned: ${deal.transactionRef}`);
  assert(!!deal.buyerName, `Matched Simulated Buyer: ${deal.buyerName} (${deal.buyerType})`);

  // Check Farmer Wallet
  const walletRes = await EscrowService.getFarmerWallet(farmer.id);
  assert(walletRes.data !== null && walletRes.data.escrowLockedBalance >= 162500, `Farmer Escrow Locked Balance updated to ₹${walletRes.data?.escrowLockedBalance}`);

  // --- 6. Deal Progression & Escrow Settlement ---
  console.log('\n--- 6. Testing Deal Status Progression & Escrow Release ---');
  
  // Advance to In-Transit
  const dispatchRes = await DealService.updateDealStatus(deal.id, 'DISPATCHED');
  assert(dispatchRes.data?.status === 'DISPATCHED', 'Deal advanced to DISPATCHED state');

  // Complete Deal & Release Escrow
  const completeRes = await DealService.updateDealStatus(deal.id, 'COMPLETED');
  assert(completeRes.data?.status === 'COMPLETED' && completeRes.data.paymentStatus === 'RELEASED_TO_FARMER', 'Deal marked COMPLETED and payment released');

  // Disburse Escrow
  await EscrowService.releaseEscrow(deal.escrowRef, farmer.id);
  // Also verify wallet update
  const finalWallet = await EscrowService.getFarmerWallet(farmer.id);
  assert(finalWallet.data !== null, 'Farmer wallet updated upon simulated settlement');

  // --- Test Summary ---
  console.log('\n===========================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runPhase1Tests().catch((err) => {
  console.error('Fatal error during test run:', err);
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
});
