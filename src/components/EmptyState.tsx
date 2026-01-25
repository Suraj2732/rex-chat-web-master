import { companyName } from "@/config/constants";

export default function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
    <div className="text-center max-w-md">
      <img
        src="https://static.whatsapp.net/rsrc.php/v3/yA/r/OLnY5o9lZ3S.png"
        className="mx-auto mb-6 w-48"
      />

      <h2 className="text-2xl mb-2">Download {companyName} for Mobile</h2>
      <p className="text-sm opacity-70 mb-6">
        Make calls, share your screen and get a faster experience when you
        download the Mobile app.
      </p>

      <button className="bg-green-500 text-black px-6 py-2 rounded-full font-medium">
        Download
      </button>

      <p className="text-xs opacity-50 mt-8">
        🔒 Your personal messages are end-to-end encrypted
      </p>
    </div>
    </div>
  );
}
