import { X } from "lucide-react";
import { useState } from "react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

export default function ToggleNotificationBar() {
  const [dismissed, setDismissed] = useState(false);
  const { permission, requestPermission } = useNotificationPermission();

  if (dismissed || permission === 'granted') return null;

  const handleEnable = async () => {
    await requestPermission();
  };

  return (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm flex justify-center items-center">
      <span>
        Notifications are {permission === 'denied' ? 'blocked' : 'turned off'}. 
        {permission === 'denied' 
          ? ' Please enable them in your browser settings.' 
          : ' '
        }
        {permission === 'default' && (
          <span 
            className="text-blue-700 underline cursor-pointer ml-1"
            onClick={handleEnable}
          >
            Turn on
          </span>
        )}
      </span>
      <X 
        onClick={() => setDismissed(true)} 
        className="w-4 h-4 ml-2 cursor-pointer text-red-700" 
      />
    </div>
  );
}