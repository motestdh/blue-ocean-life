import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(({ title, body, icon, tag }: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
        badge: '/favicon.ico',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const scheduleNotification = useCallback((
    options: NotificationOptions,
    delayMs: number
  ) => {
    const timeoutId = setTimeout(() => {
      showNotification(options);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
  };
}

// Notification service for app-wide notifications
class NotificationService {
  private static instance: NotificationService;
  private reminders: Map<string, NodeJS.Timeout> = new Map();

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setTaskReminder(taskId: string, title: string, dueDate: Date) {
    // Clear existing reminder
    this.clearReminder(taskId);

    const now = new Date();
    const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000); // 30 min before

    if (reminderTime > now) {
      const delay = reminderTime.getTime() - now.getTime();
      const timeoutId = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('تذكير بمهمة', {
            body: `المهمة "${title}" تستحق خلال 30 دقيقة`,
            icon: '/favicon.ico',
            tag: `task-${taskId}`,
          });
        }
      }, delay);
      this.reminders.set(taskId, timeoutId);
    }
  }

  clearReminder(id: string) {
    const timeoutId = this.reminders.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reminders.delete(id);
    }
  }

  clearAllReminders() {
    this.reminders.forEach((timeoutId) => clearTimeout(timeoutId));
    this.reminders.clear();
  }
}

export const notificationService = NotificationService.getInstance();
