class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    // Don't auto-request permission or show test notification
    this.permission = Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    console.log('Notification permission denied');
    return false;
  }

  showNotification(title: string, options?: NotificationOptions): void {
 
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });


      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  showMessageNotification(senderName: string, message: string): void {
        // Request permission if not already granted
    if (this.permission !== 'granted') {
      this.requestPermission().then(granted => {
        if (granted) {
          this.showNotification(`New message from ${senderName}`, {
            body: message,
            tag: 'chat-message',
          });
        }
      });
    } else {
      this.showNotification(`New message from ${senderName}`, {
        body: message,
        tag: 'chat-message',
      });
    }
  }
}

export const notificationService =
  typeof window !== 'undefined' && 'Notification' in window
    ? new NotificationService()
    : null;
