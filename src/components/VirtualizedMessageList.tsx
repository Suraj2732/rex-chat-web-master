// src/components/VirtualizedMessageList.tsx
'use client';

import { useEffect, useRef, useCallback, JSX, forwardRef, useImperativeHandle } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Message } from '@/types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  Check,
  CheckCheck,
  ChevronUp,
  Reply,
  Edit,
  Trash2,
  Forward,
} from 'lucide-react';

export interface VirtualizedMessageListHandle {
  scrollToBottom: () => void;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string | undefined;
  loading: boolean;
  hasMore: boolean;
  loadingOlder?: boolean;
  onLoadOlder: () => void;
  renderFilePreview: (message: Message) => JSX.Element | null;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onForward: (message: Message) => void;
  showMessageMenu: string | null;
  setShowMessageMenu: (messageId: string | null) => void;
  onAtBottomStateChange?: (atBottom: boolean) => void;
}

interface MessageWithDate {
  type: 'message' | 'date';
  message?: Message;
  date?: Date;
  id: string;
}

const VirtualizedMessageList = forwardRef<VirtualizedMessageListHandle, VirtualizedMessageListProps>(({
  messages,
  currentUserId,
  loading,
  hasMore,
  loadingOlder = false,
  onLoadOlder,
  renderFilePreview,
  onReply,
  onEdit,
  onDelete,
  onForward,
  showMessageMenu,
  setShowMessageMenu,
  onAtBottomStateChange,
}, ref) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isLoadingOlderRef = useRef(false);

  // Group messages with date separators
  const messagesWithDates: MessageWithDate[] = [];
  let lastDate: Date | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    
    if (!lastDate || !isSameDay(messageDate, lastDate)) {
      messagesWithDates.push({
        type: 'date',
        date: messageDate,
        id: `date-${messageDate.toISOString()}`,
      });
    }
    
    messagesWithDates.push({
      type: 'message',
      message,
      id: message.id,
    });
    
    lastDate = messageDate;
  });

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      virtuosoRef.current?.scrollToIndex({
        index: messagesWithDates.length - 1,
        align: 'end',
        behavior: 'smooth',
      });
    }
  }), [messagesWithDates.length]);

  useEffect(() => {
    if (messagesWithDates.length > 0 && !loading) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messagesWithDates.length - 1,
          behavior: 'smooth',
          align: 'end',
        });
      }, 100);
    }
  }, [messagesWithDates.length, loading]);

  const startReached = useCallback(() => {
    if (hasMore && !loading && !isLoadingOlderRef.current) {
      isLoadingOlderRef.current = true;
      onLoadOlder();
      setTimeout(() => {
        isLoadingOlderRef.current = false;
      }, 1000);
    }
  }, [hasMore, loading, onLoadOlder]);

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const renderDateSeparator = (date: Date) => (
    <div className="flex justify-center py-2">
      <div className="bg-[#182229] px-3 py-1 rounded-full text-xs text-gray-300">
        {formatDateSeparator(date)}
      </div>
    </div>
  );

  const renderMessage = (message: Message) => {
    if (!message) return null;

    const isOwn = message.senderId === currentUserId;
    const isRead = message.readBy && message.readBy.length > 1 && 
      message.readBy.some(userId => userId !== message.senderId);

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div
          className={`min-w-20 relative max-w-md group ${
            isOwn
              ? 'bg-[#005c4b] text-white'
              : 'bg-[#202c33] text-white'
          } px-3 py-2 rounded-lg text-sm rounded-tr-none pt-2 pe-4`}
        >
          {message.replyTo && (
            <div
              className={`text-xs mb-2 p-2 rounded ${
                isOwn ? 'bg-[#0a4d3a]' : 'bg-[#182229]'
              }`}
            >
              <p className="font-semibold text-[#00a884]">{message.replyTo.senderName}</p>
              <p className="truncate opacity-70">{message.replyTo.content}</p>
            </div>
          )}

          {message.forwardedFrom && (
            <p className="text-xs italic mb-1 opacity-70">
              Forwarded from {message.forwardedFrom.senderName}
            </p>
          )}

          {message.isDeleted ? (
            <p className="italic opacity-70">{message.content}</p>
          ) : (
            <>
              {renderFilePreview(message)}
              {message.content && <p className="break-words">{message.content}</p>}
            </>
          )}

          <div className="flex items-center justify-end mt-1 space-x-1">
            <span className="text-xs opacity-70">
              {format(message.createdAt, 'HH:mm')}
            </span>
            {message.isEdited && (
              <span className="text-xs opacity-70">(edited)</span>
            )}
            {isOwn && (
              <>
                {isRead ? (
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                ) : (
                  <Check className="w-4 h-4 opacity-70" />
                )}
              </>
            )}
          </div>

          {!message.isDeleted && (
            <button
              onClick={() =>
                setShowMessageMenu(
                  showMessageMenu === message.id ? null : message.id
                )
              }
              className="absolute -right-0 -top-0 p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronUp size={15} className="text-gray-300" />
            </button>
          )}

          {showMessageMenu === message.id && (
            <div className="absolute right-0 top-4 bg-[#233138] rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onReply(message);
                  setShowMessageMenu(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      onEdit(message);
                      setShowMessageMenu(null);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete(message);
                      setShowMessageMenu(null);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  onForward(message);
                  setShowMessageMenu(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
              >
                <Forward className="w-4 h-4" />
                <span>Forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderItem = (item: MessageWithDate) => {
    if (item.type === 'date' && item.date) {
      return renderDateSeparator(item.date);
    }
    if (item.type === 'message' && item.message) {
      return renderMessage(item.message);
    }
    return null;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%', width: '100%' }}
      data={messagesWithDates}
      itemContent={(index, item) => renderItem(item)}
      initialTopMostItemIndex={messagesWithDates.length > 0 ? messagesWithDates.length - 1 : 0}
      followOutput="smooth"
      startReached={startReached}
      atBottomStateChange={onAtBottomStateChange}
      components={{
        Header: () =>
          hasMore && loadingOlder ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : null,
      }}
    />
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;
