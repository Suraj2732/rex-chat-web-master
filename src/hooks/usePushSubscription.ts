import { useEffect } from 'react';

export function usePushSubscription() {
  useEffect(() => {
    const subscribeToPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: '<Your-VAPID-Public-Key>',
        });

        // Send subscription to your backend
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      }
    };

    subscribeToPush();
  }, []);
}