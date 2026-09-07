import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Phone, KeyRound, ArrowRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthService } from '../../services/auth-service';
import type { FarmerProfile } from '../../lib/types/schema';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (farmer: FarmerProfile) => void;
}

type AuthStep = 'PHONE_INPUT' | 'OTP_INPUT' | 'PIN_INPUT' | 'PIN_SETUP' | 'FORGOT_PIN';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  const [step, setStep] = useState<AuthStep>('PHONE_INPUT');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('Ramesh Kumar Patel');
  const [fpoName, setFpoName] = useState('Sehore Krishi FPO');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempFarmer, setTempFarmer] = useState<FarmerProfile | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await AuthService.requestOtp(phone);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    setOtp('123456');
    setStep('OTP_INPUT');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await AuthService.verifyOtp(phone, otp, fullName, fpoName);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    if (res.data) {
      setTempFarmer(res.data.profile);
      if (!res.data.profile.pinHash) {
        setStep('PIN_SETUP');
      } else {
        setStep('PIN_INPUT');
      }
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFarmer) return;
    setError(null);
    setLoading(true);

    const res = await AuthService.setPin(tempFarmer.id, pin);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    onSuccess(tempFarmer);
    onClose();
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFarmer) return;
    setError(null);
    setLoading(true);

    const res = await AuthService.verifyPin(tempFarmer.id, pin);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    onSuccess(tempFarmer);
    onClose();
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await AuthService.resetPin(phone, otp, pin);
    setLoading(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    if (tempFarmer) {
      onSuccess(tempFarmer);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">{t('auth.title')}</h2>
              <p className="text-xs text-emerald-100">{t('auth.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Phone Number */}
          {step === 'PHONE_INPUT' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.mobileNumber')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-semibold text-slate-500">+91</span>
                  <input
                    type="tel"
                    id="auth-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.enterMobilePlaceholder')}
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                  />
                  <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.fpoName')}</label>
                <input
                  type="text"
                  value={fpoName}
                  onChange={(e) => setFpoName(e.target.value)}
                  placeholder="e.g. Sehore Krishi FPO"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800">
                💡 <strong>{isHindi ? 'डेमो मोड:' : 'Demo Mode:'}</strong> {t('auth.demoNotice')}
              </div>

              <button
                type="submit"
                id="auth-request-otp-btn"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>{t('auth.getOtpBtn')}</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'OTP_INPUT' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-slate-600">{t('auth.enterOtpSentTo')}</p>
                <p className="text-sm font-bold text-slate-900">+91 {phone}</p>
              </div>

              <div>
                <input
                  type="text"
                  id="auth-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 bg-slate-50 border-2 border-emerald-500/30 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none"
                />
                <p className="text-[11px] text-center text-slate-500 mt-1">{t('auth.defaultDemoOtp')} <strong>123456</strong></p>
              </div>

              <button
                type="submit"
                id="auth-verify-otp-btn"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>{t('auth.verifyOtpBtn')}</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              <button
                type="button"
                onClick={() => setStep('PHONE_INPUT')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
              >
                {t('auth.changeMobile')}
              </button>
            </form>
          )}

          {/* STEP 3: Setup or Enter PIN */}
          {(step === 'PIN_SETUP' || step === 'PIN_INPUT') && (
            <form onSubmit={step === 'PIN_SETUP' ? handleSetPin : handleVerifyPin} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {step === 'PIN_SETUP' ? t('auth.createPinTitle') : t('auth.enterPinTitle')}
                </h3>
                <p className="text-xs text-slate-500">{t('auth.pinSubtitle')}</p>
              </div>

              <div>
                <input
                  type="password"
                  id="auth-pin-input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <button
                type="submit"
                id="auth-submit-pin-btn"
                disabled={loading || pin.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{t('auth.confirmPinBtn')}</span>}
              </button>

              {step === 'PIN_INPUT' && (
                <button
                  type="button"
                  id="auth-forgot-pin-btn"
                  onClick={() => { setPin(''); setStep('FORGOT_PIN'); }}
                  className="w-full text-center text-xs text-emerald-700 font-semibold hover:underline"
                >
                  {t('auth.forgotPinBtn')}
                </button>
              )}
            </form>
          )}

          {/* STEP 4: Forgot PIN Recovery */}
          {step === 'FORGOT_PIN' && (
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-slate-900">{t('auth.resetPinTitle')}</h3>
                <p className="text-xs text-slate-500">{t('auth.resetPinSubtitle')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.enterOtp')}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.newPin')}</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                id="auth-reset-pin-btn"
                disabled={loading || pin.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {t('auth.resetPinAction')}
              </button>

              <button
                type="button"
                onClick={() => setStep('PIN_INPUT')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
              >
                {t('auth.backToPinLogin')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
