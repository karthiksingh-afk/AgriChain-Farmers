import { RouteOptimizationService, BUYER_PROFILES_REGISTRY } from '../services/route-optimization-service';
import { LotService } from '../services/lot-service';
import { AuthService } from '../services/auth-service';
import { handleApiRequest } from '../server/api-router';
import type { ProduceLot } from '../lib/types/schema';

declare const process: any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runRouteOptimizationTests() {
  console.log('========================================================================');
  console.log('🧠 AGRICHAIN: 4-LAYER AI ROUTE OPTIMIZATION TEST SUITE');
  console.log('========================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  const testWrapper = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passedCount++;
    } catch (err: any) {
      failedCount++;
      console.error(`❌ Test Failed [${name}]:`, err.message);
    }
  };

  // -------------------------------------------------------------
  // 1. LAYER 1: COMPLIANCE TESTS
  // -------------------------------------------------------------
  console.log('--- 1. Testing Layer 1: Stubbed Regulatory Compliance ---');
  
  await testWrapper('Stock limit overflow (>50 MT) triggers compliance RETAIN', () => {
    const buyer = BUYER_PROFILES_REGISTRY[0];
    const res = RouteOptimizationService.evaluateCompliance(55000, buyer); // 55,000 kg = 55 MT
    assert(!res.passed, 'Stock limit > 50 MT correctly fails direct route compliance');
    assert(Boolean(res.reason?.includes('compliance constraint')), 'Reason explicitly names compliance constraint');
  });

  await testWrapper('Normal lot size (≤50 MT) passes compliance check', () => {
    const buyer = BUYER_PROFILES_REGISTRY[0];
    const res = RouteOptimizationService.evaluateCompliance(7500, buyer); // 75 quintals = 7,500 kg
    assert(res.passed, 'Normal lot size passes compliance check');
  });

  // -------------------------------------------------------------
  // 2. LAYER 2: FUNCTIONAL NECESSITY & RELIABILITY TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Layer 2: Functional Necessity (MOQ & Reliability) ---');

  await testWrapper('Lot smaller than buyer MOQ triggers RETAIN with quantity figures', () => {
    const buyer = BUYER_PROFILES_REGISTRY[1]; // Cargill MOQ: 5,000 kg
    const res = RouteOptimizationService.evaluateNecessity(2000, buyer); // 2,000 kg < 5,000 kg
    assert(!res.passed, 'Small lot below MOQ correctly rejected from direct route');
    assert(Boolean(res.reason?.includes('2,000 kg') && res.reason?.includes('5,000 kg')), 'Explanation contains exact lot quantity and buyer MOQ');
  });

  await testWrapper('Buyer with low payment reliability (<90) triggers RETAIN', () => {
    const unverifiedTrader = BUYER_PROFILES_REGISTRY.find((b) => b.paymentReliabilityScore < 90)!;
    const res = RouteOptimizationService.evaluateNecessity(5000, unverifiedTrader);
    assert(!res.passed, 'Unreliable direct buyer (<90) correctly rejected');
    assert(Boolean(res.reason?.includes('78/100') || res.reason?.includes('safety threshold')), 'Explanation contains reliability score requirement');
  });

  await testWrapper('Valid lot size meeting MOQ with reliable buyer (≥90) passes necessity', () => {
    const reliableBuyer = BUYER_PROFILES_REGISTRY[0]; // ITC: 4000 kg MOQ, 98 score
    const res = RouteOptimizationService.evaluateNecessity(6000, reliableBuyer);
    assert(res.passed, 'Valid lot meeting MOQ with 98% reliability buyer passes Layer 2');
  });

  // -------------------------------------------------------------
  // 3. LAYER 3: THERMAL SPOILAGE MODEL TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Layer 3: Thermal Spoilage Risk Model ---');

  await testWrapper('High perishability crop (Tomato) shows major spoilage reduction on direct route', () => {
    const tomatoSpoilage = RouteOptimizationService.computeSpoilageRisk('Hybrid Tomato', 30.0);
    assert(tomatoSpoilage.hoursSaved === 24, 'Direct route saves 24 hours (12h direct vs 36h mandi)');
    assert(tomatoSpoilage.spoilageReductionPct > 50, `Tomato spoilage risk reduced by ${tomatoSpoilage.spoilageReductionPct}%`);
    assert(tomatoSpoilage.targetTempC === 12.0, 'Tomato target storage temperature is 12°C');
  });

  await testWrapper('Stable grain crop (Wheat) computes stable low spoilage risk', () => {
    const wheatSpoilage = RouteOptimizationService.computeSpoilageRisk('Sharbati Wheat', 28.0);
    assert(wheatSpoilage.mandiSpoilageIndex < 1.0, `Wheat spoilage index is low (${wheatSpoilage.mandiSpoilageIndex})`);
    assert(wheatSpoilage.hoursSaved === 24, 'Transit hours saved is 24h');
  });

  // -------------------------------------------------------------
  // 4. LAYER 4 & END-TO-END RECOMMENDATION ENGINE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing End-to-End Decision Scenarios (RETAIN vs SKIP) ---');

  // Setup mock farmer & lots for testing
  const authRes = await AuthService.verifyOtp('9876543210', '123456', 'Ramesh Patel', 'Sehore FPO');
  const farmerId = authRes.data!.profile.id;

  await testWrapper('Scenario A: Small Lot below MOQ triggers RETAIN recommendation', async () => {
    const smallLot: ProduceLot = {
      id: 'test-lot-small-01',
      farmerId,
      cropName: 'Sharbati Wheat',
      variety: 'Lokwan-1',
      quantityQuintals: 10, // 10 qtl = 1,000 kg (Below ITC 4,000 kg MOQ)
      qualityGrade: 'GRADE_B',
      askingPricePerQuintal: 2800,
      mandiBenchmarkRate: 3150,
      totalLotValue: 28000,
      status: 'STOCK_HELD',
      storageLocation: 'Farm Store',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rec = await RouteOptimizationService.computeRecommendation(smallLot, BUYER_PROFILES_REGISTRY[0]);
    assert(rec.decision === 'RETAIN', 'Small lot recommended to RETAIN Mandi route');
    assert(rec.explanationText.includes('1,000 kg') && rec.explanationText.includes('4,000 kg'), 'Explanation specifies 1,000 kg lot vs 4,000 kg buyer MOQ');
    assert(rec.routeAssessed === 'TRADITIONAL_MANDI_RETAIN', 'Route assessed is TRADITIONAL_MANDI_RETAIN');
  });

  await testWrapper('Scenario B: Large Lot meeting MOQ with high perishability triggers SKIP recommendation', async () => {
    const largeLot: ProduceLot = {
      id: 'test-lot-large-02',
      farmerId,
      cropName: 'Hybrid Tomato',
      variety: 'Abhinav-Special',
      quantityQuintals: 80, // 80 qtl = 8,000 kg (Meets 5,000 kg MOQ)
      qualityGrade: 'GRADE_A',
      askingPricePerQuintal: 2200,
      mandiBenchmarkRate: 1950,
      totalLotValue: 176000,
      status: 'STOCK_HELD',
      storageLocation: 'Cold Room #1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rec = await RouteOptimizationService.computeRecommendation(largeLot, BUYER_PROFILES_REGISTRY[1]); // Cargill
    assert(rec.decision === 'SKIP', 'Large perishable lot recommended to SKIP Mandi (Direct)');
    assert(rec.netBenefitPct >= 5.0, `Net Benefit (+${rec.netBenefitPct}%) exceeds 5% threshold`);
    assert(rec.explanationText.includes('Skip Mandi'), 'Explanation starts with Skip Mandi recommendation');
    assert(rec.explanationText.includes('24h transit') || rec.explanationText.includes('saving'), 'Explanation cites hours/spoilage saved');
    assert(rec.explanationText.includes('Cargill India Grains'), 'Explanation mentions buyer name');
    assert(rec.routeAssessed === 'DIRECT_BUYER_SKIP_MANDI', 'Route assessed is DIRECT_BUYER_SKIP_MANDI');
  });

  // -------------------------------------------------------------
  // 5. REST API ENDPOINT DISPATCH TEST
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing REST API Dispatch: GET /api/lots/:id/route-optimization ---');

  // Create real lot via service to test API router
  const lotCreateRes = await LotService.createLot({
    farmerId,
    cropName: 'Sharbati Wheat',
    variety: 'Lokwan-1 Gold',
    quantityQuintals: 75, // 7,500 kg
    qualityGrade: 'GRADE_A',
    askingPricePerQuintal: 3350,
    storageLocation: 'Central Godown',
  });

  const createdLotId = lotCreateRes.data!.lot.id;

  await testWrapper('GET /api/lots/:id/route-optimization returns 200 with recommendation payload', async () => {
    const apiRes = await handleApiRequest({
      method: 'GET',
      path: `/api/lots/${createdLotId}/route-optimization`,
      headers: { 'x-farmer-id': farmerId },
    });

    assert(apiRes.status === 200, `API returned status 200 (Got ${apiRes.status})`);
    assert(apiRes.data !== null && typeof apiRes.data === 'object', 'Response data is populated');
    assert(apiRes.data.lotId === createdLotId, 'Recommendation lotId matches query');
    assert(apiRes.data.decision === 'SKIP' || apiRes.data.decision === 'RETAIN', `Decision is valid (${apiRes.data.decision})`);
    assert(typeof apiRes.data.netBenefitPct === 'number', 'netBenefitPct is a valid number');
    assert(typeof apiRes.data.explanationText === 'string' && apiRes.data.explanationText.length > 20, 'explanationText is formatted');
    assert(apiRes.data.layerDetails?.layer1_compliance !== undefined, 'Layer 1 compliance details present');
    assert(apiRes.data.layerDetails?.layer2_necessity !== undefined, 'Layer 2 necessity details present');
    assert(apiRes.data.layerDetails?.layer3_spoilage !== undefined, 'Layer 3 spoilage details present');
    assert(apiRes.data.layerDetails?.layer4_offerScoring !== undefined, 'Layer 4 offer scoring details present');
  });

  await testWrapper('GET /api/lots/non-existent/route-optimization returns 404', async () => {
    const apiRes = await handleApiRequest({
      method: 'GET',
      path: `/api/lots/lot-non-existent-99999/route-optimization`,
      headers: { 'x-farmer-id': farmerId },
    });

    assert(apiRes.status === 404, `API returned 404 for invalid lot ID (Got ${apiRes.status})`);
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`🏁 AI ROUTE OPTIMIZATION TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED`);
  console.log('========================================================================\n');

  if (typeof process !== 'undefined' && failedCount > 0) {
    process.exit(1);
  }
}

runRouteOptimizationTests();
