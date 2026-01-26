import { companyName } from "@/config/constants";
import { MessageCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">

        <div className="p-3 bg-teal-900/50 rounded-xl mx-auto w-fit mb-3">
          <MessageCircle className="w-10 h-10 text-teal-500" />
        </div>

        <h2 className="text-2xl mb-2">Download {companyName} for Mobile</h2>
        <p className="text-sm opacity-70 mb-6">
          Make calls, share your screen and get a faster experience when you
          download the Mobile app.
        </p>

        <button className="bg-green-500 text-black px-6 py-2 rounded-full font-medium cursor-pointer">
          Download
        </button>

        <p className="text-xs opacity-50 mt-8">
          🔒 Your personal messages are end-to-end encrypted
        </p>
      </div>
    </div>
  );
}
