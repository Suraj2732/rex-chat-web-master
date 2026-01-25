class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.requestPermission();
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      console.log('Notification permission already granted');
      // Test notification
      this.showNotification('Test Notification', { body: 'Notifications are working!' });
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('Notification permission result:', permission);
      if (permission === 'granted') {
        // Test notification
        this.showNotification('Test Notification', { body: 'Notifications are now enabled!' });
      }
      return permission === 'granted';
    }

    console.log('Notification permission denied');
    return false;
  }

  showNotification(title: string, options?: NotificationOptions): void {
    console.log('Attempting to show notification:', title, 'Permission:', this.permission);
    
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }

  showMessageNotification(senderName: string, message: string): void {
    console.log('Showing message notification for:', senderName, message);
    this.showNotification(`New message from ${senderName}`, {
      body: message,
      tag: 'chat-message',
    });
  }
}

export const notificationService = new NotificationService();