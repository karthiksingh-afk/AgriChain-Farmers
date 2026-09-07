import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, CheckCheck, Handshake, Lock, ShieldCheck, Truck, ArrowDownLeft } from 'lucide-react';
import type { NotificationItem } from '../../lib/types/schema';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const { t, i18n } = useTranslation();
  const isHindi = (i18n.language || 'en').startsWith('hi');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('notifications.title')}</h3>
              <p className="text-[10px] text-slate-500">{unreadCount} {t('notifications.unreadAlerts')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                id="notif-mark-all-read-btn"
                className="p-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-semibold"
                title={t('notifications.markAllRead')}
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    {notif.type === 'DEAL_MATCHED' && <Handshake className="w-4 h-4 text-emerald-600" />}
                    {notif.type === 'ESCROW_LOCKED' && <Lock className="w-4 h-4 text-amber-600" />}
                    {notif.type === 'ESCROW_RELEASED' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                    {notif.type === 'LOT_STATUS_CHANGED' && <Truck className="w-4 h-4 text-sky-600" />}
                    {notif.type === 'KYC_VERIFIED' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    {notif.type === 'WITHDRAWAL_PROCESSED' && <ArrowDownLeft className="w-4 h-4 text-purple-600" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-emerald-600 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString(isHindi ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
