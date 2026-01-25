import { Chat, User } from "@/types";
import { formatTime } from "@/utils";
import { Check, CheckCheck } from "lucide-react";

interface ChatListItemProps {
    selectedChatId: string | null;
    chat: Chat;
    currentUser: User | null;
    otherUser: User | undefined;
    unreadCount: number;
    isRead: boolean | undefined;
    onClick?:()=>void;
     
}
export default function ChatItem(
    {
        selectedChatId,
        chat,
        otherUser,
        unreadCount,
        isRead,
        currentUser,
        onClick
    }: ChatListItemProps
) {
    return (

        <div onClick={onClick} className={`p-4 hover:bg-[#202c33] cursor-pointer rounded-sm transition-colors ${selectedChatId === chat.id ? 'bg-[#202c33]' : ''
            }`}>
            <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-[#0f3d2e] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {otherUser?.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white truncate">
                            {otherUser?.displayName}
                        </h3>
                        <span className="text-sm opacity-70 truncate w-auto">
                            {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center min-w-0 flex-1">
                            {chat.lastMessage?.senderId === currentUser?.uid && (
                                <span className="mr-1 flex-shrink-0">
                                    {isRead ? (
                                        <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                                    ) : (
                                        <Check className="w-4 h-4 text-gray-400" />
                                    )}
                                </span>
                            )}
                            <p className="text-sm opacity-70 truncate">
                                {chat.lastMessage?.isDeleted
                                    ? 'This message was deleted'
                                    : chat.lastMessage?.content || 'No messages yet'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-[#00a884] text-black text-[11px] px-2 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}