import { User } from "@/types"

export default function UserInfo({
    user
}: {
    user: User | null
}) {
    return (
        <div className="p-4 border-gray-700 border-b mb-3">

        {/* User Info */}
        <div className="flex items-center justify-between">
            <span>
                <p className="font-semibold">{user?.displayName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
            </span>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${user?.role === 'admin'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
                }`}>
                {user?.role}
            </span>
        </div>

        {/* New Chat Button */}
        {/* <button
          onClick={onNewChat}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </button> */}
      </div>
       
    )
}