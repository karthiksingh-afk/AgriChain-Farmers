import type { NotificationItem, NotificationType, ApiResponse } from '../lib/types/schema';

const NOTIFICATIONS_STORAGE_KEY = 'agrichain_notifications';
const memoryNotifications = new Map<string, NotificationItem>();

function getStoredNotifications(): Map<string, NotificationItem> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {
    // Ignore
  }
  return memoryNotifications;
}

function saveStoredNotifications(map: Map<string, NotificationItem>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
    }
  } catch {
    // Ignore
  }
}

export class NotificationService {
  /**
   * Create and trigger in-app notification
   */
  static async createNotification(
    farmerId: string,
    type: NotificationType,
    title: string,
    message: string,
    referenceId?: string
  ): Promise<ApiResponse<NotificationItem>> {
    const storage = getStoredNotifications();
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const item: NotificationItem = {
      id,
      farmerId,
      type,
      title,
      message,
      read: false,
      referenceId,
      createdAt: now,
    };

    storage.set(id, item);
    memoryNotifications.set(id, item);
    saveStoredNotifications(storage);

    return {
      data: item,
      error: null,
    };
  }

  /**
   * Get all notifications for a farmer
   */
  static async getFarmerNotifications(
    farmerId: string,
    unreadOnly = false
  ): Promise<ApiResponse<NotificationItem[]>> {
    const storage = getStoredNotifications();
    let list = Array.from(storage.values()).filter((n) => n.farmerId === farmerId);

    if (unreadOnly) {
      list = list.filter((n) => !n.read);
    }

    // Sort by latest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      data: list,
      error: null,
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId: string, farmerId: string): Promise<ApiResponse<NotificationItem>> {
    const storage = getStoredNotifications();
    const item = storage.get(notificationId) || memoryNotifications.get(notificationId);

    if (!item) {
      return {
        data: null,
        error: { message: 'Notification not found' },
      };
    }

    if (item.farmerId !== farmerId) {
      return {
        data: null,
        error: { message: 'Unauthorized access to notification' },
      };
    }

    item.read = true;
    storage.set(notificationId, item);
    memoryNotifications.set(notificationId, item);
    saveStoredNotifications(storage);

    return {
      data: item,
      error: null,
    };
  }

  /**
   * Mark all notifications as read for a farmer
   */
  static async markAllAsRead(farmerId: string): Promise<ApiResponse<{ updatedCount: number }>> {
    const storage = getStoredNotifications();
    let count = 0;

    for (const item of storage.values()) {
      if (item.farmerId === farmerId && !item.read) {
        item.read = true;
        count++;
      }
    }

    for (const item of memoryNotifications.values()) {
      if (item.farmerId === farmerId && !item.read) {
        item.read = true;
      }
    }

    saveStoredNotifications(storage);

    return {
      data: { updatedCount: count },
      error: null,
    };
  }
}
