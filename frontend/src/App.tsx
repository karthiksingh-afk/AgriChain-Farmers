import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/layout/Header';
import { BottomNav, type NavTab } from './components/layout/BottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { WeatherWidget } from './components/dashboard/WeatherWidget';
import { MarketOverview } from './components/dashboard/MarketOverview';
import { MandiRateTicker } from './components/dashboard/MandiRateTicker';
import { QuickStats } from './components/dashboard/QuickStats';
import { ValueDistributionCard } from './components/dashboard/ValueDistributionCard';
import { ListLotModal } from './components/lots/ListLotModal';
import { DealMatchedModal } from './components/deals/DealMatchedModal';
import { DealCard } from './components/deals/DealCard';
import { EscrowStatusCard } from './components/deals/EscrowStatusCard';
import { WalletView } from './components/wallet/WalletView';
import { PayoutModal } from './components/wallet/PayoutModal';
import { InventoryView } from './components/inventory/InventoryView';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';

import { AuthService } from './services/auth-service';
import { MandiService } from './services/mandi-service';
import { LotService } from './services/lot-service';
import { DealService } from './services/deal-service';
import { EscrowService } from './services/escrow-service';
import { NotificationService } from './services/notification-service';

import type {
  FarmerProfile,
  FarmerWallet,
  MandiBenchmark,
  WeatherWidgetData,
  ProduceLot,
  Deal,
  EscrowRecord,
  NotificationItem,
  DealStatus,
} from './lib/types/schema';
import { ShieldCheck, Handshake, PlusCircle, AlertTriangle } from 'lucide-react';

export function App() {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  // Session & Farmer Profile
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [wallet, setWallet] = useState<FarmerWallet | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Domain Datasets
  const [benchmarks, setBenchmarks] = useState<MandiBenchmark[]>([]);
  const [marketOverview, setMarketOverview] = useState<any>(null);
  const [weather, setWeather] = useState<WeatherWidgetData | null>(null);
  const [lots, setLots] = useState<ProduceLot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isListLotModalOpen, setIsListLotModalOpen] = useState(false);
  const [isDealMatchedModalOpen, setIsDealMatchedModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Active Flow References
  const [preselectedCrop, setPreselectedCrop] = useState<MandiBenchmark | null>(null);
  const [recentMatchedLot, setRecentMatchedLot] = useState<ProduceLot | null>(null);
  const [recentMatchedDeal, setRecentMatchedDeal] = useState<Deal | null>(null);

  // Status message / toast
  const [actionAlert, setActionAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const showAlert = (message: string, type: 'error' | 'success' = 'error') => {
    setActionAlert({ message, type });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Load all user data for active session
  const refreshUserData = useCallback(async (currentFarmerId: string) => {
    const [lotsRes, dealsRes, escrowsRes, walletRes, notifsRes] = await Promise.all([
      LotService.getFarmerLots(currentFarmerId),
      DealService.getFarmerDeals(currentFarmerId),
      EscrowService.getFarmerEscrowRecords(currentFarmerId),
      EscrowService.getFarmerWallet(currentFarmerId),
      NotificationService.getFarmerNotifications(currentFarmerId),
    ]);

    if (lotsRes.data) setLots(lotsRes.data);
    if (dealsRes.data) setDeals(dealsRes.data);
    if (escrowsRes.data) setEscrows(escrowsRes.data);
    if (walletRes.data) setWallet(walletRes.data);
    if (notifsRes.data) setNotifications(notifsRes.data);
  }, []);

  // Initial App Mount
  useEffect(() => {
    // 1. Fetch public mandi & weather data
    Promise.all([
      MandiService.getAllBenchmarks(),
      MandiService.getMarketOverview(),
      MandiService.getWeatherAdvisory(),
    ]).then(([benchmarksRes, overviewRes, weatherRes]) => {
      if (benchmarksRes.data) setBenchmarks(benchmarksRes.data);
      if (overviewRes.data) setMarketOverview(overviewRes.data);
      if (weatherRes.data) setWeather(weatherRes.data);
    });

    // 2. Check for active farmer session (or auto login default demo farmer)
    const existingFarmer = AuthService.getCurrentFarmer();
    if (existingFarmer) {
      setFarmer(existingFarmer);
      refreshUserData(existingFarmer.id);
    } else {
      // Auto-initialize demo farmer for seamless experience
      AuthService.verifyOtp('9876543210', '123456', 'Ramesh Kumar Patel', 'Sehore Krishi FPO').then((res) => {
        if (res.data) {
          setFarmer(res.data.profile);
          refreshUserData(res.data.profile.id);
        }
      });
    }
  }, [refreshUserData]);

  // Auth Handlers
  const handleAuthSuccess = (authenticatedFarmer: FarmerProfile) => {
    setFarmer(authenticatedFarmer);
    refreshUserData(authenticatedFarmer.id);
    showAlert(
      isHindi
        ? `स्वागत है, ${authenticatedFarmer.fullName}! सत्र सक्रिय है।`
        : `Welcome, ${authenticatedFarmer.fullName}! Session active.`,
      'success'
    );
  };

  const handleLogout = () => {
    AuthService.logout();
    setFarmer(null);
    setWallet(null);
    setLots([]);
    setDeals([]);
    setEscrows([]);
    showAlert(isHindi ? 'सफलतापूर्वक लॉगआउट किया गया' : 'Logged out successfully', 'success');
  };

  // Lot Listing & Deal Match Trigger
  const handleLotCreated = async (newLot: ProduceLot, dealId?: string) => {
    if (!farmer) return;
    await refreshUserData(farmer.id);

    if (dealId) {
      const { data: matchedDeal } = await DealService.getDealById(dealId);
      if (matchedDeal) {
        setRecentMatchedLot(newLot);
        setRecentMatchedDeal(matchedDeal);
        setIsDealMatchedModalOpen(true);
      }
    } else {
      showAlert(isHindi ? 'फसल लॉट सफलतापूर्वक सूचीबद्ध किया गया!' : 'Produce lot listed successfully!', 'success');
    }
  };

  // Accept Proposed Deal Handler
  const handleAcceptDeal = async (dealId: string) => {
    if (!farmer) return;
    setLoadingAction(true);
    const res = await DealService.acceptProposedDeal(dealId);
    setLoadingAction(false);

    if (res.error) {
      showAlert(res.error.message);
      return;
    }

    if (res.data) {
      setRecentMatchedDeal(res.data);
      await refreshUserData(farmer.id);
      showAlert(
        isHindi
          ? `सौदा स्वीकृत! ₹${res.data.totalDealAmount.toLocaleString('en-IN')} एस्क्रो में सुरक्षित कर दिए गए हैं।`
          : `Deal accepted! ₹${res.data.totalDealAmount.toLocaleString('en-IN')} secured in escrow vault.`,
        'success'
      );
    }
  };

  // Negotiate Counter-Offer Handler
  const handleNegotiateDeal = async (dealId: string, counterPrice: number) => {
    if (!farmer) return;
    setLoadingAction(true);
    const res = await DealService.negotiateDeal(dealId, counterPrice);
    setLoadingAction(false);

    if (res.error) {
      showAlert(res.error.message);
      throw new Error(res.error.message);
    }

    if (res.data) {
      setRecentMatchedDeal(res.data);
      await refreshUserData(farmer.id);
      showAlert(
        isHindi
          ? `नया भाव ₹${counterPrice}/क्विंटल स्वीकृत! ₹${res.data.totalDealAmount.toLocaleString('en-IN')} एस्क्रो में सुरक्षित।`
          : `Counter price ₹${counterPrice}/qtl accepted! ₹${res.data.totalDealAmount.toLocaleString('en-IN')} locked in escrow.`,
        'success'
      );
    }
  };

  // Deal Progression Handler (Dispatch -> Complete & Disburse Escrow)
  const handleAdvanceDealStatus = async (dealId: string, nextStatus: DealStatus) => {
    if (!farmer) return;
    setLoadingAction(true);

    let res;
    if (nextStatus === 'PAYMENT_HELD') {
      res = await DealService.acceptProposedDeal(dealId);
    } else {
      res = await DealService.updateDealStatus(dealId, nextStatus);
    }
    setLoadingAction(false);

    if (res.error) {
      showAlert(res.error.message);
      return;
    }

    if (res.data) {
      if (nextStatus === 'COMPLETED') {
        const matchingEscrow = escrows.find((e) => e.dealId === dealId);
        if (matchingEscrow) {
          await EscrowService.releaseEscrow(matchingEscrow.id, farmer.id);
        }
      }

      const associatedLot = lots.find((l) => l.id === res.data!.lotId);
      if (associatedLot) {
        const lotNextStatus = nextStatus === 'DISPATCHED' ? 'IN_TRANSIT' : nextStatus === 'COMPLETED' ? 'SETTLED' : 'DEAL_ACTIVE';
        await LotService.updateLotStatus(associatedLot.id, lotNextStatus);
      }

      await refreshUserData(farmer.id);
      showAlert(
        isHindi
          ? `सौदा #${dealId.slice(-6)} को ${nextStatus} में अद्यतन किया गया!`
          : `Deal #${dealId.slice(-6)} updated to ${nextStatus}!`,
        'success'
      );
    }
  };

  // Escrow Release Handler
  const handleReleaseEscrow = async (escrowId: string) => {
    if (!farmer) return;
    setLoadingAction(true);
    const res = await EscrowService.releaseEscrow(escrowId, farmer.id);
    setLoadingAction(false);

    if (res.error) {
      showAlert(res.error.message);
      return;
    }

    await refreshUserData(farmer.id);
    showAlert(
      isHindi
        ? 'एस्क्रो राशि आपके उपलब्ध बैलेंस में जारी कर दी गई!'
        : 'Escrow payment released to your available balance!',
      'success'
    );
  };

  // Delete Lot Handler
  const handleDeleteLot = async (lotId: string) => {
    if (!farmer) return;
    const res = await LotService.deleteLot(lotId, farmer.id);
    if (res.error) {
      showAlert(res.error.message, 'error');
      return;
    }

    await refreshUserData(farmer.id);
    showAlert(isHindi ? 'फसल लॉट इन्वेंट्री से हटा दिया गया' : 'Produce lot removed from inventory', 'success');
  };

  // Notifications Handlers
  const handleMarkNotificationAsRead = async (notifId: string) => {
    if (!farmer) return;
    await NotificationService.markAsRead(notifId, farmer.id);
    await refreshUserData(farmer.id);
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!farmer) return;
    await NotificationService.markAllAsRead(farmer.id);
    await refreshUserData(farmer.id);
    showAlert(isHindi ? 'सभी सूचनाएं पढ़ी हुई चिह्नित की गईं' : 'All notifications marked as read', 'success');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeDealsCount = deals.filter((d) => d.status === 'PROPOSED' || d.status === 'PAYMENT_HELD' || d.status === 'DISPATCHED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28">
      {/* Header with EN | HI Toggle */}
      <Header
        farmer={farmer}
        wallet={wallet}
        unreadNotifsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenWallet={() => setActiveTab('wallet')}
      />

      {/* Action Alerts / Toasts */}
      {actionAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-bounce">
          <div
            className={`p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              actionAlert.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {actionAlert.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="flex-1">{actionAlert.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fadeIn">
            {/* AgriStack e-KYC Stub Banner */}
            {farmer && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950">{t('dashboard.kycBannerTitle')}</span>
                    <p className="text-[10px] text-emerald-800">
                      {t('dashboard.farmerId')}: {farmer.farmerIdStub || 'MP-AGRI-987654'} • {t('dashboard.land')}: {farmer.landAreaAcres || 4.8} {t('dashboard.acres')} ({isHindi ? 'गेहूं और सोयाबीन' : farmer.primaryCrop || 'Wheat & Soybean'})
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 text-[10px] font-black rounded-lg uppercase tracking-wider">
                  {t('dashboard.verified')}
                </span>
              </div>
            )}

            {/* Quick Balances Stats */}
            <QuickStats
              wallet={wallet}
              activeDealsCount={activeDealsCount}
              onOpenWallet={() => setActiveTab('wallet')}
              onOpenDeals={() => setActiveTab('deals')}
            />

            {/* Feature A: ₹100 Value Distribution Comparison Visual */}
            <ValueDistributionCard />

            {/* Weather & Harvesting Advisory */}
            <WeatherWidget weather={weather} />

            {/* Market Overview Statistics */}
            <MarketOverview
              overview={marketOverview}
              onSelectCrop={(cropName) => {
                const found = benchmarks.find((b) => b.cropName === cropName);
                if (found) setPreselectedCrop(found);
                setIsListLotModalOpen(true);
              }}
            />

            {/* Live APMC Mandi Rates & Listing Ticker */}
            <MandiRateTicker
              benchmarks={benchmarks}
              onSelectCropForListing={(crop) => {
                setPreselectedCrop(crop);
                setIsListLotModalOpen(true);
              }}
            />
          </div>
        )}

        {/* 2. DEALS & SETTLEMENT TAB */}
        {activeTab === 'deals' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">{t('deals.title')}</h2>
                <p className="text-xs text-slate-500">{t('deals.subtitle')}</p>
              </div>

              <button
                onClick={() => setIsListLotModalOpen(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('deals.newLot')}</span>
              </button>
            </div>

            {/* Active Deals List */}
            {deals.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Handshake className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t('deals.noDealsTitle')}</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                  {t('deals.noDealsDesc')}
                </p>
                <button
                  onClick={() => setIsListLotModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  {t('deals.listLotNow')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onAdvanceStatus={handleAdvanceDealStatus}
                    onNegotiate={handleNegotiateDeal}
                    onAccept={handleAcceptDeal}
                    loading={loadingAction}
                  />
                ))}
              </div>
            )}

            {/* Escrow Ledger Component */}
            <EscrowStatusCard
              escrows={escrows}
              onReleaseEscrow={handleReleaseEscrow}
              loading={loadingAction}
            />
          </div>
        )}

        {/* 3. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="animate-fadeIn">
            <InventoryView
              lots={lots}
              onOpenListLot={() => setIsListLotModalOpen(true)}
              onDeleteLot={handleDeleteLot}
            />
          </div>
        )}

        {/* 4. WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="animate-fadeIn">
            <WalletView
              wallet={wallet}
              onOpenPayout={() => setIsPayoutModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onOpenListLot={() => {
          setPreselectedCrop(null);
          setIsListLotModalOpen(true);
        }}
        activeDealsCount={activeDealsCount}
        activeLotsCount={lots.length}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* List Produce Lot Modal */}
      {farmer && (
        <ListLotModal
          isOpen={isListLotModalOpen}
          onClose={() => setIsListLotModalOpen(false)}
          farmerId={farmer.id}
          preselectedCrop={preselectedCrop}
          benchmarks={benchmarks}
          onLotCreated={handleLotCreated}
        />
      )}

      {/* Deal Matched Celebration Modal with Negotiation */}
      <DealMatchedModal
        isOpen={isDealMatchedModalOpen}
        onClose={() => setIsDealMatchedModalOpen(false)}
        lot={recentMatchedLot}
        deal={recentMatchedDeal}
        onViewDeals={() => {
          setIsDealMatchedModalOpen(false);
          setActiveTab('deals');
        }}
        onAcceptDeal={handleAcceptDeal}
        onNegotiateDeal={handleNegotiateDeal}
      />

      {/* Instant Payout Modal */}
      {farmer && (
        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          farmerId={farmer.id}
          wallet={wallet}
          onPayoutSuccess={(updatedWallet) => {
            setWallet(updatedWallet);
            if (farmer) refreshUserData(farmer.id);
          }}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      />
    </div>
  );
}

export default App;
