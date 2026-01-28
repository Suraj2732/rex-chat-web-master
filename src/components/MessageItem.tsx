// components/MessageItem.tsx
import { format } from 'date-fns';
import {
    Check,
    CheckCheck,
    MoreVertical,
    Reply,
    Edit,
    Trash2,
    Forward
} from 'lucide-react';
import { useState , JSX } from 'react';
import type { Message } from '@/types';

interface MessageItemProps {
    message: Message;
    currentUserId: string | undefined;
    isOwn: boolean;
    isRead: boolean;
    renderFilePreview: (message: Message) => JSX.Element | null;
    onReply: (message: Message) => void;
    onEdit: (message: Message) => void;
    onDelete: (message: Message) => void;
    onForward: (message: Message) => void;
    showMessageMenu: string | null;
    setShowMessageMenu: (messageId: string | null) => void;
}

export default function MessageItem({
    message,
    currentUserId,
    isOwn,
    isRead,
    renderFilePreview,
    onReply,
    onEdit,
    onDelete,
    onForward,
    showMessageMenu,
    setShowMessageMenu,
}: MessageItemProps) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-md ${isOwn ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'
                    } rounded-lg p-3 shadow-sm relative group`}
            >
                {/* Reply Preview */}
                {message.replyTo && (
                    <div className={`text-xs mb-2 p-2 rounded ${isOwn ? 'bg-[#0a4d3a]' : 'bg-[#182229]'
                        }`}>
                        <p className="font-semibold text-[#00a884]">{message.replyTo.senderName}</p>
                        <p className="truncate opacity-70">{message.replyTo.content}</p>
                    </div>
                )}

                {/* Forwarded Label */}
                {message.forwardedFrom && (
                    <p className="text-xs italic mb-1 opacity-70">
                        Forwarded from {message.forwardedFrom.senderName}
                    </p>
                )}

                {/* Message Content */}
                {message.isDeleted ? (
                    <p className="italic opacity-70">{message.content}</p>
                ) : (
                    <>
                        {renderFilePreview(message)}
                        {message.content && <p className="break-words">{message.content}</p>}
                    </>
                )}

                {/* Message Info */}
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

                {/* Message Menu */}
                {!message.isDeleted && (
                    <button
                        onClick={() => setShowMessageMenu(
                            showMessageMenu === message.id ? null : message.id
                        )}
                        className="absolute -right-2 top-2 p-1 bg-[#233138] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-300" />
                    </button>
                )}

                {showMessageMenu === message.id && (
                    <div className="absolute right-0 top-10 bg-[#233138] rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                            onClick={() => {
                                onReply(message);
                                setShowMessageMenu(null);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] w-full text-left text-white"
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
                                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] w-full text-left text-white"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(message);
                                        setShowMessageMenu(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] w-full text-left text-red-400"
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
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-[#182229] w-full text-left text-white"
                        >
                            <Forward className="w-4 h-4" />
                            <span>Forward</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}