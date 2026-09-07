// Dynamic translation lookup helper for crops, statuses, categories, and event messages
import i18n from 'i18next';
import type { LotStatus, DealStatus, QualityGrade } from '../lib/types/schema';

export const CROP_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'Sharbati Wheat': { en: 'Sharbati Wheat', hi: 'शरबती गेहूं' },
  'Basmati Rice': { en: 'Basmati Rice', hi: 'बासमती चावल' },
  'Yellow Soybean': { en: 'Yellow Soybean', hi: 'पीली सोयाबीन' },
  'Desi Cotton': { en: 'Desi Cotton', hi: 'देसी कपास' },
  'Nashik Red Onion': { en: 'Nashik Red Onion', hi: 'नासिक लाल प्याज' },
  'Jyoti Potato': { en: 'Jyoti Potato', hi: 'ज्योति आलू' },
  'Black Mustard': { en: 'Black Mustard', hi: 'काली सरसों' },
  'Hybrid Tomato': { en: 'Hybrid Tomato', hi: 'हाइब्रिड टमाटर' },
};

export const CATEGORY_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  'ALL': { en: 'All', hi: 'सभी' },
  'Cereal': { en: 'Cereal', hi: 'अनाज' },
  'Pulse': { en: 'Pulse', hi: 'दलहन' },
  'Oilseed': { en: 'Oilseed', hi: 'तिलहन' },
  'Vegetable': { en: 'Vegetable', hi: 'सब्जी' },
  'Commercial': { en: 'Commercial', hi: 'व्यावसायिक' },
};

export const LOT_STATUS_TRANSLATIONS: Record<LotStatus, { en: string; hi: string }> = {
  'STOCK_HELD': { en: 'Stock Held in Godown', hi: 'गोदाम में सुरक्षित' },
  'DEAL_ACTIVE': { en: 'Deal Active (Escrow)', hi: 'सक्रिय सौदा (एस्क्रो)' },
  'AWAITING_TRUCK': { en: 'Awaiting Truck', hi: 'ट्रक की प्रतीक्षा' },
  'IN_TRANSIT': { en: 'In Transit', hi: 'रास्ते में (परिवहन)' },
  'SETTLED': { en: 'Settled', hi: 'निपटारा पूर्ण' },
};

export const DEAL_STATUS_TRANSLATIONS: Record<DealStatus, { en: string; hi: string }> = {
  'PROPOSED': { en: 'Price Proposed', hi: 'मूल्य प्रस्तावित' },
  'LOCKED': { en: 'Locked', hi: 'तय सौदा' },
  'PAYMENT_HELD': { en: 'Payment in Escrow', hi: 'एस्क्रो में सुरक्षित' },
  'DISPATCHED': { en: 'In Transit', hi: 'रास्ते में' },
  'COMPLETED': { en: 'Settled & Paid', hi: 'वितरित एवं भुगतान प्राप्त' },
  'CANCELLED': { en: 'Cancelled', hi: 'रद्द' },
};

export const GRADE_TRANSLATIONS: Record<QualityGrade, { en: string; hi: string }> = {
  'GRADE_A': { en: 'Grade A (Premium)', hi: 'ग्रेड ए (प्रीमियम)' },
  'GRADE_B': { en: 'Grade B (Standard)', hi: 'ग्रेड बी (मानक)' },
};

export function translateCrop(cropName: string): string {
  const lang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  return CROP_TRANSLATIONS[cropName]?.[lang] || cropName;
}

export function translateCategory(cat: string): string {
  const lang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  return CATEGORY_TRANSLATIONS[cat]?.[lang] || cat;
}

export function translateLotStatus(status: LotStatus): string {
  const lang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  return LOT_STATUS_TRANSLATIONS[status]?.[lang] || status;
}

export function translateDealStatus(status: DealStatus): string {
  const lang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  return DEAL_STATUS_TRANSLATIONS[status]?.[lang] || status;
}

export function translateGrade(grade: QualityGrade): string {
  const lang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  return GRADE_TRANSLATIONS[grade]?.[lang] || grade;
}
