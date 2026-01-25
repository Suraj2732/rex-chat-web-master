"use client"

import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { Chat , User} from "@/types";

interface ChatListItemProps {
    chat: Chat;
    otherUser?: User;
    currentUser?: User;
    selectedChatId?: string;
    onSelectChat: (chatId: string) => void;
    formatTime: (date: Date | string) => string;
    isRead: boolean;
    unreadCount: number;
  }
  

const ChatListItem = ({
  chat,
  otherUser,
  currentUser,
  selectedChatId,
  onSelectChat,
  formatTime,
  isRead,
  unreadCount,
}:ChatListItemProps) => {
  return (
    <div
      key={chat.id}
      onClick={() => onSelectChat(chat.id)}
      className={`p-2 hover:bg-[#202c33] cursor-pointer transition-colors ${
        selectedChatId === chat.id ? "bg-[#202c33]" : ""
      }`}
    >
      <div className="flex items-start">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[#0f3d2e] flex items-center justify-center text-white font-semibold flex-shrink-0">
          {otherUser?.displayName?.charAt(0).toUpperCase()}
        </div>

        {/* Chat details */}
        <div className="ml-3 flex-1 min-w-0">
          {/* Header: name + time */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white truncate">
              {otherUser?.displayName}
            </h3>
            <span className="text-sm opacity-70 truncate w-auto">
              {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
            </span>
          </div>

          {/* Last message + unread badge */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center min-w-0 flex-1">
              {chat.lastMessage?.senderId === currentUser?.uid && (
                <span className="mr-1 flex-shrink-0">
                  {isRead ? (
                    <CheckCheck className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Check className="w-4 h-4 text-gray-400" />
                  )}
                </span>
              )}
              <p className="text-sm opacity-70 truncate">
                {chat.lastMessage?.isDeleted
                  ? "This message was deleted"
                  : chat.lastMessage?.content || "No messages yet"}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Online indicator */}
          {otherUser?.isOnline && (
            <span className="text-xs d-flex">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1 animate-blink"></span>{" "}
              Online
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;