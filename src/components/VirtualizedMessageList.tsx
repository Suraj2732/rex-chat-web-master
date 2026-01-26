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
  CheckCheck as CheckCheckIcon,
  Copy,
} from 'lucide-react';
import MediaGallery from './MediaGallery';
import toast from 'react-hot-toast';

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
  isSelectionMode: boolean;
  selectedMessageIds: Set<string>;
  onToggleSelection: (ids: string[]) => void;
  onEnterSelectionMode: (initialId: string) => void;
}

interface MessageWithDate {
  type: 'message' | 'date' | 'media-group';
  message?: Message;
  messages?: Message[];
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
  isSelectionMode,
  selectedMessageIds,
  onToggleSelection,
  onEnterSelectionMode,
}, ref) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isLoadingOlderRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest('[data-menu-toggle="true"]')) {
        return;
      }
      setShowMessageMenu(null);
    };

    if (showMessageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu, setShowMessageMenu]);

  // Group messages with date separators
  const messagesWithDates: MessageWithDate[] = [];
  let lastDate: Date | null = null;
  let currentMediaGroup: Message[] = [];

  const flushMediaGroup = () => {
    if (currentMediaGroup.length > 0) {
      const groupMessages = [...currentMediaGroup];
      messagesWithDates.push({
        type: 'media-group',
        messages: groupMessages,
        id: `group-${groupMessages[0].id}`,
      });
      currentMediaGroup = [];
    }
  };

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    const isMedia = (message.type === 'image' || message.type === 'video') && !message.isDeleted;
    
    if (!lastDate || !isSameDay(messageDate, lastDate)) {
      flushMediaGroup();
      messagesWithDates.push({
        type: 'date',
        date: messageDate,
        id: `date-${messageDate.toISOString()}`,
      });
    }
    
    if (isMedia) {
      const prevMessage = currentMediaGroup.length > 0 ? currentMediaGroup[currentMediaGroup.length - 1] : null;
      
      if (prevMessage && message.senderId === prevMessage.senderId && 
          messageDate.getTime() - new Date(prevMessage.createdAt).getTime() < 2 * 60 * 1000) {
        currentMediaGroup.push(message);
      } else {
        flushMediaGroup();
        currentMediaGroup.push(message);
      }
    } else {
      flushMediaGroup();
      messagesWithDates.push({
        type: 'message',
        message,
        id: message.id,
      });
    }
    
    lastDate = messageDate;
  });
  flushMediaGroup();

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

  const renderMediaGroup = (groupMessages: Message[]) => {
    if (!groupMessages || groupMessages.length === 0) return null;
    const firstMsg = groupMessages[0];
    const lastMsg = groupMessages[groupMessages.length - 1];
    const isOwn = firstMsg.senderId === currentUserId;
    
    const isRead = lastMsg.readBy && lastMsg.readBy.length > 1 && 
      lastMsg.readBy.some(userId => userId !== lastMsg.senderId);

    const isSelected = groupMessages.every(m => selectedMessageIds.has(m.id));
    const hasCaption = firstMsg.content && !firstMsg.content.startsWith('Sent ');

    const mediaItems = groupMessages.map(m => ({
      url: m.fileURL || '',
      type: m.type as 'image' | 'video',
      name: m.fileName
    }));

    return (
      <div
        key={`group-${firstMsg.id}`}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-1 ${isSelectionMode ? 'cursor-pointer hover:bg-white/5' : ''}`}
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelection(groupMessages.map(m => m.id));
          }
        }}
      >
        {isSelectionMode && (
             <div className={`flex items-center justify-center mr-3 ${isOwn ? 'order-last ml-3 mr-0' : ''}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#00a884] border-[#00a884]' : 'border-gray-500'}`}>
                    {isSelected && <Check size={14} className="text-white" />}
                </div>
             </div>
        )}
        <div
          className={`relative max-w-md group ${
            isOwn
              ? 'bg-black/60 text-white'
              : 'bg-[#202c33] text-white'
          } rounded-lg text-sm shadow-sm ${isOwn ? 'rounded-tr-none' : 'rounded-tl-none'} ${isSelected && isSelectionMode ? 'bg-opacity-80 ring-2 ring-[#00a884]' : ''}`}
        >
          {firstMsg.forwardedFrom && (
             <p className="text-xs italic mb-1 opacity-70 px-2 pt-1">
              Forwarded from {firstMsg.forwardedFrom.senderName}
            </p>
          )}
          
          <div className="p-[3px]">
             <MediaGallery media={mediaItems} />
          </div>
          
          {hasCaption && (
             <p className="px-2 py-1 break-words text-sm">{firstMsg.content}</p>
          )}

          <div className={`flex items-center justify-end space-x-1 ${hasCaption ? 'px-2 pb-1 relative' : 'absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/30 backdrop-blur-[1px]'}`}>
            <span className={`text-[11px] ${hasCaption ? 'opacity-70' : 'text-white/90'}`}>
              {format(lastMsg.createdAt, 'HH:mm')}
            </span>
            {isOwn && (
              <>
                {isRead ? (
                  <CheckCheck className={`w-3.5 h-3.5 ${hasCaption ? 'text-[#53bdeb]' : 'text-[#53bdeb]'}`} />
                ) : (
                  <Check className={`w-3.5 h-3.5 ${hasCaption ? 'opacity-70' : 'text-white/90'}`} />
                )}
              </>
            )}
          </div>
          
           {!isSelectionMode && <button
              data-menu-toggle="true"
              onClick={() =>
                setShowMessageMenu(
                  showMessageMenu === firstMsg.id ? null : firstMsg.id
                )
              }
              className="absolute right-1 top-1 p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full z-10"
            >
              <ChevronUp size={15} className="text-white" />
            </button>}
            
            {showMessageMenu === firstMsg.id && !isSelectionMode && (
              <div ref={menuRef} className="absolute right-0 top-8 bg-[#233138] rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    onReply(firstMsg);
                    setShowMessageMenu(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                {firstMsg.content && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(firstMsg.content);
                      toast.success('Copied to clipboard');
                      setShowMessageMenu(null);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                )}
                {isOwn  && (
                  <>
                    <button
                      onClick={() => {
                        onDelete(firstMsg);
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
                    onForward(firstMsg);
                    setShowMessageMenu(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                >
                  <Forward className="w-4 h-4" />
                  <span>Forward</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterSelectionMode(firstMsg.id);
                    setShowMessageMenu(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                >
                  <CheckCheckIcon className="w-4 h-4" />
                  <span>Select</span>
                </button>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    if (!message) return null;

    const isOwn = message.senderId === currentUserId;
    const isRead = message.readBy && message.readBy.length > 1 && 
      message.readBy.some(userId => userId !== message.senderId);

    const isSelected = selectedMessageIds.has(message.id);

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-2 ${isSelectionMode ? 'cursor-pointer hover:bg-white/5' : ''}`}
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelection([message.id]);
          }
        }}
      >
        {isSelectionMode && (
             <div className={`flex items-center justify-center mr-3 ${isOwn ? 'order-last ml-3 mr-0' : ''}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#00a884] border-[#00a884]' : 'border-gray-500'}`}>
                    {isSelected && <Check size={14} className="text-white" />}
                </div>
             </div>
        )}
        <div
          className={`min-w-20 relative max-w-md group ${
            isOwn
              ? 'bg-[#005c4b] text-white'
              : 'bg-[#202c33] text-white'
          } px-3 py-2 rounded-lg text-sm rounded-tr-none pt-2 pe-4 ${isSelected && isSelectionMode ? 'bg-opacity-80 ring-2 ring-[#00a884]' : ''}`}
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
            <p className="italic opacity-70">This message was deleted</p>
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

          {!message.isDeleted && !isSelectionMode && (
            <button
              data-menu-toggle="true"
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

          {/* Message Operation Menu */}
          {showMessageMenu === message.id && !isSelectionMode && (
            <div ref={menuRef} className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-4 bg-[#233138] rounded-lg shadow-lg py-1 z-10 min-w-[120px]`}>
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
              {message.content && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    toast.success('Copied to clipboard');
                    setShowMessageMenu(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              )}
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterSelectionMode(message.id);
                  setShowMessageMenu(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] cursor-pointer w-full text-white"
              >
                <CheckCheckIcon className="w-4 h-4" />
                <span>Select</span>
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
    if (item.type === 'media-group' && item.messages) {
      return renderMediaGroup(item.messages);
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
