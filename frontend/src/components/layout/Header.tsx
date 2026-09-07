import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, Bell, ShieldCheck, User, LogOut, Wallet } from 'lucide-react';
import { setAppLanguage } from '../../i18n/config';
import type { FarmerProfile, FarmerWallet } from '../../lib/types/schema';

interface HeaderProps {
  farmer: FarmerProfile | null;
  wallet: FarmerWallet | null;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  farmer,
  wallet,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenAuth,
  onLogout,
  onOpenWallet,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';

  const toggleLanguage = (lang: 'en' | 'hi') => {
    setAppLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 font-display">
                {currentLang === 'hi' ? 'एग्री' : 'Agri'}
                <span className="text-emerald-600">{currentLang === 'hi' ? 'चेन' : 'Chain'}</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                {t('brand.mvp')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* User Info, Language Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* EN | HI Instant Language Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
            <button
              onClick={() => toggleLanguage('en')}
              id="lang-toggle-en"
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage('hi')}
              id="lang-toggle-hi"
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === 'hi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HI
            </button>
          </div>

          {farmer ? (
            <>
              {/* Quick Escrow Wallet Badge */}
              <button
                onClick={onOpenWallet}
                id="header-wallet-btn"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                title={t('header.viewWallet')}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">₹{wallet?.availableBalance.toLocaleString('en-IN') || '0'}</span>
                {wallet && wallet.escrowLockedBalance > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] rounded-full font-bold">
                    🔒 ₹{wallet.escrowLockedBalance.toLocaleString('en-IN')}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                id="header-notifications-btn"
                className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                aria-label={t('header.notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Farmer Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs font-bold text-slate-800">{farmer.fullName}</span>
                    <span title={t('header.kycVerified')}>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{farmer.fpoName || farmer.district}</span>
                </div>
                
                <button
                  onClick={onLogout}
                  id="header-logout-btn"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('header.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              id="header-login-btn"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <User className="w-4 h-4" />
              <span>{t('header.farmerLogin')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
