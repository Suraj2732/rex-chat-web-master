import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export function ToggleNotification() {
  const { permission, requestPermission } = useNotificationPermission();
  
  if (permission === 'granted') return null;
  
  return (
    <div className="mx-3 my-2 mb-5 bg-[#0f3d2e] px-3 py-2 rounded-lg text-sm">
      Message notifications are {permission === 'denied' ? 'blocked' : 'off'}. 
      {permission === 'default' && (
        <span 
          className="text-green-300 underline cursor-pointer ml-1"
          onClick={requestPermission}
        >
          Turn on
        </span>
      )}
      {permission === 'denied' && (
        <span className="text-green-300"> Enable in browser settings</span>
      )}
    </div>
  );
}