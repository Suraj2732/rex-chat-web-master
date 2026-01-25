// src/components/ChatWindow.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { chatService } from '@/lib/services/chatService';
import { fileService } from '@/lib/services/fileService';
import { Chat, Message, User } from '@/types';
import ForwardMessageModal from './ForwardMessageModal';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  X,
  Reply,
  Forward,
  Edit,
  Trash2,
  CheckCheck,
  Check,
  Image as ImageIcon,
  Video,
  Music,
  File as FileIcon,
  Download,
  Mic,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ChatHeader from './ChatHeader';
import TypingIndicator from './TypingIndicator';
import { useStateContext } from '@/contexts/StateContext';
import EmptyState from './EmptyState';

 

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const {selectedChatId, setSelectedChatId , selectedChatUser, setSelectedChatUser} = useStateContext();  
  const { messages, loading } = useMessages(selectedChatId);
  const typingUsers = useTypingIndicator(selectedChatId, currentUser?.uid);

  const [inputMessage, setInputMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    
    if (selectedChatId && currentUser) {
      chatService.markMessagesAsRead(selectedChatId, currentUser.uid);
    }
  }, [selectedChatId, currentUser]);

  
  if(!selectedChatId) return <EmptyState />


  const handleTyping = () => {
    if (!currentUser) return;

    chatService.setTypingIndicator(
      selectedChatId,
      currentUser.uid,
      currentUser.displayName,
      true
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatService.setTypingIndicator(
        selectedChatId,
        currentUser.uid,
        currentUser.displayName,
        false
      );
    }, 2000);
  };
  

  const handleSendMessage = async () => {
    if (!currentUser || (!inputMessage.trim() && !selectedFile)) return;

    try {
      let fileData = null;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await fileService.uploadFile(
          selectedFile,
          selectedChatId,
          currentUser.uid
        );

        if (uploadResult) {
          fileData = uploadResult;
        } else {
          toast.error('Failed to upload file');
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      if (editingMessage) {
        // Edit existing message
        const success = await chatService.editMessage(
          selectedChatId,
          editingMessage.id,
          inputMessage,
          currentUser.uid
        );

        if (success) {
          toast.success('Message edited');
          setEditingMessage(null);
        } else {
          toast.error('Cannot edit message (15 min limit or not your message)');
        }
      } else {
        // Send new message
        await chatService.sendMessage(
          selectedChatId,
          currentUser.uid,
          currentUser.displayName,
          selectedFile ? `Sent ${fileService.getFileType(selectedFile)}` : inputMessage,
          selectedFile ? fileService.getFileType(selectedFile) : 'text',
          fileData?.url,
          fileData?.fileName,
          fileData?.fileSize,
          replyTo || undefined
        );

        setReplyTo(null);
      }

      setInputMessage('');
      setSelectedFile(null);

      // Stop typing indicator
      chatService.setTypingIndicator(
        selectedChatId,
        currentUser.uid,
        currentUser.displayName,
        false
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = fileService.validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
      } else {
        toast.error(validation.error || 'Invalid file');
      }
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!currentUser) return;

    const success = await chatService.deleteMessage(
      selectedChatId,
      message.id,
      currentUser.uid
    );

    if (success) {
      toast.success('Message deleted');
    } else {
      toast.error('Cannot delete message (15 min limit or not your message)');
    }
    setShowMessageMenu(null);
  };

  const handleForwardMessage = async (message: Message, targetChatId: string) => {
    if (!currentUser) return;

    const messageId = await chatService.forwardMessage(
      message,
      targetChatId,
      currentUser.uid,
      currentUser.displayName
    );

    if (messageId) {
      toast.success('Message forwarded');
    } else {
      toast.error('Failed to forward message');
    }
  };

  const renderFilePreview = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <img
            src={message.fileURL}
            alt={message.fileName}
            className="max-w-sm rounded-lg cursor-pointer"
            onClick={() => window.open(message.fileURL, '_blank')}
          />
        );
      case 'video':
        return (
          <video
            src={message.fileURL}
            controls
            className="max-w-sm rounded-lg"
          />
        );
      case 'audio':
        return (
          <audio src={message.fileURL} controls className="w-64" />
        );
      case 'file':
        return (
          <a
            href={message.fileURL}
            download={message.fileName}
            className="mb-2 flex items-center space-x-2 p-3 bg-[#369f8c63] rounded-lg hover:bg-gray-200 hover:text-gray-800"
          >
            <FileIcon className="w-8 h-8" />
            <div className="flex-1">
              <p className="font-medium text-sm">{message.fileName}</p>
              <p className="text-xs ">
                {message.fileSize && fileService.formatFileSize(message.fileSize)}
              </p>
            </div>
            <Download />
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <main className={`h-full relative bg-[#16161659] bg-chat-background bg-repeat`}>
      <div className="relative z-10 h-full flex flex-col">
        {/* Chat Header */}
        <ChatHeader currentUser={selectedChatUser} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className=" flex items-center justify-center h-full text-white">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUser?.uid;
              const isRead = message.readBy?.length > 1;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`min-w-20 relative max-w-md ${isOwn ? 'bg-[#005c4b] text-white' : 'bg-white text-gray-900'
                      }  px-3 py-2 rounded-lg text-sm  rounded-tr-none pt-2 pe-4`}
                  >
                    {/* Reply Preview */}
                    {message.replyTo && (
                      <div className={`text-xs mb-2 p-2 rounded ${isOwn ? 'bg-[#369f8c63]' : 'bg-gray-100'
                        }`}>
                        <p className="font-semibold">{message.replyTo.senderName}</p>
                        <p className="truncate">{message.replyTo.content}</p>
                      </div>
                    )}

                    {/* Forwarded Label */}
                    {message.forwardedFrom && (
                      <p className="text-xs italic mb-1">
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
                            <CheckCheck className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Check className="w-4 h-4" />
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
                        className="absolute -right-0 -top-0 p-1 cursor-pointer"
                      >
                        <ChevronUp size={15} />
                      </button>
                    )}

                    {showMessageMenu === message.id && (
                      <div className="absolute right-0 top-4 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                        <button
                          onClick={() => {
                            setReplyTo(message);
                            setShowMessageMenu(null);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-500 cursor-pointer w-full"
                        >
                          <Reply className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                        {
                          isOwn &&
                          <button
                            onClick={() => {
                              setEditingMessage(message);
                              setInputMessage(message.content);
                              setShowMessageMenu(null);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-500 cursor-pointer w-full"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        }
                        {
                          isOwn &&
                          <button
                            onClick={() => handleDeleteMessage(message)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-500 cursor-pointer w-full text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        }
                        <button
                          onClick={() => {
                            setForwardingMessage(message);
                            setShowMessageMenu(null);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-500 cursor-pointer w-full"
                        >
                          <Forward className="w-4 h-4" />
                          <span>Forward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />

          )}

          <div ref={messagesEndRef} />
        </div>


        <div className="relative px-4 py-3 bg-[#202c33]">
          {/* Reply Preview */}
          {replyTo && (
            <div className="mb-2 p-2 bg-[#0f3d2e] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#00a771]">Replying to {replyTo.senderName}</p>
                <p className="text-sm truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)}>
                <X className="w-5 h-5 text-white cursor-pointer" />
              </button>
            </div>
          )}

          {/* Edit Preview */}
          {editingMessage && (
            <div className="mb-2 p-2  rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Editing message</p>
              </div>
              <button onClick={() => {
                setEditingMessage(null);
                setInputMessage('');
              }}>
                <X className="w-5 h-5 text-white " />
              </button>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="mb-2 p-2 bg-[#369f8c63] rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {fileService.getFileType(selectedFile) === 'image' && <ImageIcon className="w-5 h-5" />}
                {fileService.getFileType(selectedFile) === 'video' && <Video className="w-5 h-5" />}
                {fileService.getFileType(selectedFile) === 'audio' && <Music className="w-5 h-5" />}
                {fileService.getFileType(selectedFile) === 'file' && <FileIcon className="w-5 h-5" />}
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {fileService.formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)}>
                <X className="w-5 h-5 text-white cursor-pointer" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={uploading}
            >
              <Paperclip className="text-[#8696a0] cursor-pointer" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-sm outline-none"
              disabled={uploading}
            />

            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !selectedFile) || uploading}
              className="p-2 bg-[#0f3d2e] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
            <Mic className="text-[#8696a0]" />
          </div>
        </div>


        {forwardingMessage && (
          <ForwardMessageModal
            message={forwardingMessage}
            onClose={() => setForwardingMessage(null)}
          />
        )}
      </div>
    </main>
  );
}