import type { MandiBenchmark, WeatherWidgetData, ApiResponse } from '../lib/types/schema';

// Seeded APMC benchmark database
const SEEDED_MANDI_BENCHMARKS: MandiBenchmark[] = [
  {
    id: 'mandi-1',
    cropName: 'Sharbati Wheat',
    variety: 'Lokwan-1 Gold',
    category: 'Cereal',
    marketName: 'Sehore APMC Mandi',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    minRatePerQuintal: 2850,
    maxRatePerQuintal: 3400,
    modalRatePerQuintal: 3150,
    arrivalsMt: 240.5,
    activeBuyersCount: 18,
    priceTrend: 'UP',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-2',
    cropName: 'Basmati Rice',
    variety: 'Pusa 1121 Export',
    category: 'Cereal',
    marketName: 'Karnal Grain Market',
    state: 'Haryana',
    district: 'Karnal',
    minRatePerQuintal: 3900,
    maxRatePerQuintal: 4650,
    modalRatePerQuintal: 4350,
    arrivalsMt: 310.0,
    activeBuyersCount: 25,
    priceTrend: 'UP',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-3',
    cropName: 'Yellow Soybean',
    variety: 'JS 9560 Clean',
    category: 'Oilseed',
    marketName: 'Indore Krishi Upaj Mandi',
    state: 'Madhya Pradesh',
    district: 'Indore',
    minRatePerQuintal: 4400,
    maxRatePerQuintal: 5100,
    modalRatePerQuintal: 4820,
    arrivalsMt: 480.0,
    activeBuyersCount: 32,
    priceTrend: 'STABLE',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-4',
    cropName: 'Desi Cotton',
    variety: 'Bt-2 Long Staple',
    category: 'Commercial',
    marketName: 'Rajkot Marketing Yard',
    state: 'Gujarat',
    district: 'Rajkot',
    minRatePerQuintal: 6900,
    maxRatePerQuintal: 7750,
    modalRatePerQuintal: 7420,
    arrivalsMt: 195.0,
    activeBuyersCount: 14,
    priceTrend: 'UP',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-5',
    cropName: 'Nashik Red Onion',
    variety: 'Garwa Medium',
    category: 'Vegetable',
    marketName: 'Lasalgaon APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    minRatePerQuintal: 1650,
    maxRatePerQuintal: 2400,
    modalRatePerQuintal: 2100,
    arrivalsMt: 650.0,
    activeBuyersCount: 40,
    priceTrend: 'DOWN',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-6',
    cropName: 'Jyoti Potato',
    variety: 'Chipsona Grade-1',
    category: 'Vegetable',
    marketName: 'Agra Mandi Samiti',
    state: 'Uttar Pradesh',
    district: 'Agra',
    minRatePerQuintal: 1250,
    maxRatePerQuintal: 1750,
    modalRatePerQuintal: 1520,
    arrivalsMt: 520.0,
    activeBuyersCount: 22,
    priceTrend: 'STABLE',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-7',
    cropName: 'Black Mustard',
    variety: 'Pusa Bold 42% Oil',
    category: 'Oilseed',
    marketName: 'Bharatpur Mandi',
    state: 'Rajasthan',
    district: 'Bharatpur',
    minRatePerQuintal: 5100,
    maxRatePerQuintal: 5800,
    modalRatePerQuintal: 5540,
    arrivalsMt: 160.0,
    activeBuyersCount: 16,
    priceTrend: 'UP',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mandi-8',
    cropName: 'Hybrid Tomato',
    variety: 'Abhinav Firm',
    category: 'Vegetable',
    marketName: 'Kolar APMC Market',
    state: 'Karnataka',
    district: 'Kolar',
    minRatePerQuintal: 1400,
    maxRatePerQuintal: 2200,
    modalRatePerQuintal: 1850,
    arrivalsMt: 380.0,
    activeBuyersCount: 28,
    priceTrend: 'UP',
    date: new Date().toISOString().split('T')[0],
  },
];

export class MandiService {
  /**
   * Fetch all Mandi benchmark rates with optional category/name filters
   */
  static async getAllBenchmarks(category?: string): Promise<ApiResponse<MandiBenchmark[]>> {
    let benchmarks = [...SEEDED_MANDI_BENCHMARKS];
    if (category && category !== 'ALL') {
      benchmarks = benchmarks.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }
    return {
      data: benchmarks,
      error: null,
    };
  }

  /**
   * Get specific benchmark by Crop Name
   */
  static async getBenchmarkForCrop(cropName: string): Promise<ApiResponse<MandiBenchmark>> {
    const found = SEEDED_MANDI_BENCHMARKS.find(
      (b) => b.cropName.toLowerCase() === cropName.toLowerCase()
    );

    if (!found) {
      // Default to first benchmark if not exact
      return {
        data: SEEDED_MANDI_BENCHMARKS[0],
        error: null,
      };
    }

    return {
      data: found,
      error: null,
    };
  }

  /**
   * Aggregate market overview statistics for dashboard
   */
  static async getMarketOverview(): Promise<
    ApiResponse<{
      totalArrivalsMt: number;
      totalActiveBuyers: number;
      topGainers: MandiBenchmark[];
      totalLiveLots: number;
    }>
  > {
    const totalArrivals = SEEDED_MANDI_BENCHMARKS.reduce((acc, curr) => acc + curr.arrivalsMt, 0);
    const totalBuyers = SEEDED_MANDI_BENCHMARKS.reduce((acc, curr) => acc + curr.activeBuyersCount, 0);
    const topGainers = SEEDED_MANDI_BENCHMARKS.filter((b) => b.priceTrend === 'UP').slice(0, 3);

    return {
      data: {
        totalArrivalsMt: totalArrivals,
        totalActiveBuyers: totalBuyers,
        topGainers,
        totalLiveLots: 142,
      },
      error: null,
    };
  }

  /**
   * Get localized agricultural weather advisory
   */
  static async getWeatherAdvisory(location = 'Sehore, MP'): Promise<ApiResponse<WeatherWidgetData>> {
    return {
      data: {
        location,
        tempC: 29.5,
        condition: 'Clear & Sunny (Good for Harvesting)',
        rainfallForecastMm: 0,
        humidityPct: 48,
        harvestRecommendation: 'Ideal conditions for lot dispatch & moisture testing (<12%).',
      },
      error: null,
    };
  }
}
