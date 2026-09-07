import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Search, PlusCircle } from 'lucide-react';
import { LotCard } from '../lots/LotCard';
import type { ProduceLot } from '../../lib/types/schema';
import { translateLotStatus } from '../../i18n/dynamic-translations';

interface InventoryViewProps {
  lots: ProduceLot[];
  onOpenListLot: () => void;
  onDeleteLot: (lotId: string) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  lots,
  onOpenListLot,
  onDeleteLot,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.cropName.toLowerCase().includes(search.toLowerCase()) ||
      lot.variety.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Listing CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">{t('inventory.title')}</h2>
          <p className="text-xs text-slate-500">{t('inventory.subtitle')}</p>
        </div>

        <button
          onClick={onOpenListLot}
          id="inventory-add-lot-btn"
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('nav.sellLot')}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('lots.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:bg-white focus:border-emerald-500 outline-none"
        >
          <option value="ALL">{t('lots.allStatuses')} ({lots.length})</option>
          <option value="STOCK_HELD">{translateLotStatus('STOCK_HELD')}</option>
          <option value="DEAL_ACTIVE">{translateLotStatus('DEAL_ACTIVE')}</option>
          <option value="AWAITING_TRUCK">{translateLotStatus('AWAITING_TRUCK')}</option>
          <option value="IN_TRANSIT">{translateLotStatus('IN_TRANSIT')}</option>
          <option value="SETTLED">{translateLotStatus('SETTLED')}</option>
        </select>
      </div>

      {/* Lots Grid */}
      {filteredLots.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{t('lots.noLotsFound')}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
            {t('lots.noLotsFoundDesc')}
          </p>
          <button
            onClick={onOpenListLot}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            {t('lots.sellFirstLot')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} onDelete={onDeleteLot} />
          ))}
        </div>
      )}
    </div>
  );
};
