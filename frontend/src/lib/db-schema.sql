-- =========================================================================
-- AgriChain Farmer-Side MVP Database Schema
-- Compatible with PostgreSQL / PostgREST / InsForge BaaS
-- =========================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Farmers Profile Table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    fpo_name VARCHAR(150),
    state VARCHAR(50) NOT NULL DEFAULT 'Madhya Pradesh',
    district VARCHAR(50) NOT NULL DEFAULT 'Sehore',
    mandi_name VARCHAR(100) DEFAULT 'Sehore APMC Mandi',
    pin_hash VARCHAR(255),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
    aadhaar_stub VARCHAR(20),
    farmer_id_stub VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on phone for fast lookup
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);

-- 2. Mandi Benchmark Rates Table (Seeded APMC market statistics)
CREATE TABLE IF NOT EXISTS mandi_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(50) NOT NULL,
    variety VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('Cereal', 'Pulse', 'Oilseed', 'Vegetable', 'Commercial')),
    market_name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    min_rate_per_quintal NUMERIC(10, 2) NOT NULL,
    max_rate_per_quintal NUMERIC(10, 2) NOT NULL,
    modal_rate_per_quintal NUMERIC(10, 2) NOT NULL,
    arrivals_mt NUMERIC(10, 2) NOT NULL DEFAULT 120.0,
    active_buyers_count INT NOT NULL DEFAULT 14,
    price_trend VARCHAR(10) NOT NULL DEFAULT 'UP' CHECK (price_trend IN ('UP', 'DOWN', 'STABLE')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mandi_benchmarks_crop ON mandi_benchmarks(crop_name);

-- 3. Produce Lots Table
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name VARCHAR(50) NOT NULL,
    variety VARCHAR(50) NOT NULL,
    quantity_quintals NUMERIC(10, 2) NOT NULL CHECK (quantity_quintals > 0),
    quality_grade VARCHAR(10) NOT NULL CHECK (quality_grade IN ('GRADE_A', 'GRADE_B')),
    asking_price_per_quintal NUMERIC(10, 2) NOT NULL CHECK (asking_price_per_quintal > 0),
    mandi_benchmark_rate NUMERIC(10, 2) NOT NULL,
    total_lot_value NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_quintals * asking_price_per_quintal) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'STOCK_HELD' CHECK (status IN ('STOCK_HELD', 'DEAL_ACTIVE', 'AWAITING_TRUCK', 'IN_TRANSIT', 'SETTLED')),
    cold_chain_temp_c NUMERIC(4, 1) DEFAULT 18.5,
    cold_chain_humidity_pct NUMERIC(4, 1) DEFAULT 65.0,
    storage_location VARCHAR(100) NOT NULL DEFAULT 'On-Farm Covered Godown #2',
    quality_certificate_id VARCHAR(50),
    quality_score NUMERIC(4, 1) DEFAULT 94.5,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lots_farmer_id ON lots(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);

-- 4. Deals Table (Auto-generated simulated buyer matches)
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_type VARCHAR(30) NOT NULL CHECK (buyer_type IN ('Miller', 'Exporter', 'Retail Chain', 'Agri-Processor')),
    buyer_location VARCHAR(100) NOT NULL,
    agreed_price_per_quintal NUMERIC(10, 2) NOT NULL,
    total_deal_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'PAYMENT_HELD', 'DISPATCHED', 'COMPLETED', 'CANCELLED')),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'ESCROW_DIRECT' CHECK (payment_method IN ('ESCROW_DIRECT', 'UPI', 'NEFT', 'RTGS')),
    payment_status VARCHAR(25) NOT NULL DEFAULT 'HELD_IN_ESCROW' CHECK (payment_status IN ('HELD_IN_ESCROW', 'RELEASED_TO_FARMER', 'REFUNDED')),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    escrow_ref VARCHAR(50) UNIQUE NOT NULL,
    pickup_estimated_at TIMESTAMPTZ,
    delivery_estimated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_farmer_id ON deals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deals_lot_id ON deals(lot_id);

-- 5. Escrow Records Table
CREATE TABLE IF NOT EXISTS escrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    held_amount NUMERIC(12, 2) NOT NULL,
    released_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'SECURED' CHECK (status IN ('SECURED', 'RELEASE_PENDING', 'DISBURSED', 'REFUNDED')),
    escrow_account_ref VARCHAR(50) NOT NULL,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_deal_id ON escrow_records(deal_id);
CREATE INDEX IF NOT EXISTS idx_escrow_farmer_id ON escrow_records(farmer_id);

-- 6. Farmer Wallets Table (Calculated or cached balances)
CREATE TABLE IF NOT EXISTS farmer_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID UNIQUE NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    escrow_locked_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_settled_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    active_deals_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_wallets ENABLE ROW LEVEL SECURITY;

-- Mandi Benchmarks: Publicly Readable
CREATE POLICY "Mandi rates are viewable by all users" 
ON mandi_benchmarks FOR SELECT USING (true);

-- Farmers: Farmer can view and update their own profile
CREATE POLICY "Farmers can view own profile" 
ON farmers FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Farmers can update own profile" 
ON farmers FOR UPDATE USING (auth.uid() = id);

-- Lots: Farmer can view, insert, update their own lots
CREATE POLICY "Farmers can view own lots" 
ON lots FOR SELECT USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can insert own lots" 
ON lots FOR INSERT WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can update own lots" 
ON lots FOR UPDATE USING (farmer_id = auth.uid());

-- Deals: Farmer can view their deals
CREATE POLICY "Farmers can view own deals" 
ON deals FOR SELECT USING (farmer_id = auth.uid());

-- Escrow Records: Farmer can view own escrow accounts
CREATE POLICY "Farmers can view own escrow records" 
ON escrow_records FOR SELECT USING (farmer_id = auth.uid());

-- Wallets: Farmer can view own wallet
CREATE POLICY "Farmers can view own wallet" 
ON farmer_wallets FOR SELECT USING (farmer_id = auth.uid());

-- =========================================================================
-- SEED DATA: Realistic APMC Mandi Rates Across Major Crops
-- =========================================================================

INSERT INTO mandi_benchmarks (crop_name, variety, category, market_name, state, district, min_rate_per_quintal, max_rate_per_quintal, modal_rate_per_quintal, arrivals_mt, active_buyers_count, price_trend) VALUES
('Sharbati Wheat', 'Lokwan-1', 'Cereal', 'Sehore APMC Mandi', 'Madhya Pradesh', 'Sehore', 2850.00, 3400.00, 3150.00, 240.5, 18, 'UP'),
('Basmati Rice', 'Pusa 1121', 'Cereal', 'Karnal Grain Market', 'Haryana', 'Karnal', 3900.00, 4650.00, 4350.00, 310.0, 25, 'UP'),
('Yellow Soybean', 'JS 9560', 'Oilseed', 'Indore Krishi Upaj Mandi', 'Madhya Pradesh', 'Indore', 4400.00, 5100.00, 4820.00, 480.0, 32, 'STABLE'),
('Desi Cotton', 'Bt-2 Hybrid', 'Commercial', 'Rajkot Marketing Yard', 'Gujarat', 'Rajkot', 6900.00, 7750.00, 7420.00, 195.0, 14, 'UP'),
('Nashik Red Onion', 'Garwa', 'Vegetable', 'Lasalgaon APMC', 'Maharashtra', 'Nashik', 1650.00, 2400.00, 2100.00, 650.0, 40, 'DOWN'),
('Jyoti Potato', 'Chipsona', 'Vegetable', 'Agra Mandi Samiti', 'Uttar Pradesh', 'Agra', 1250.00, 1750.00, 1520.00, 520.0, 22, 'STABLE'),
('Black Mustard', 'Pusa Bold', 'Oilseed', 'Bharatpur Mandi', 'Rajasthan', 'Bharatpur', 5100.00, 5800.00, 5540.00, 160.0, 16, 'UP'),
('Hybrid Tomato', 'Abhinav', 'Vegetable', 'Kolar APMC Market', 'Karnataka', 'Kolar', 1400.00, 2200.00, 1850.00, 380.0, 28, 'UP');
