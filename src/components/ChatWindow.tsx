// src/components/ChatWindow.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessagesOptimized } from '@/hooks/useMessagesOptimized';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import VirtualizedMessageList, { VirtualizedMessageListHandle } from './VirtualizedMessageList';
import { chatService } from '@/lib/services/chatService';
import { chatServiceOptimized } from '@/lib/services/chatServiceOptimized';
import { fileService } from '@/lib/services/fileService';
import { Message, User } from '@/types';
import ForwardMessageModal from './ForwardMessageModal';
import UserProfileModal from './UserProfileModal';
import {
  Send,
  X,
  Image as ImageIcon,
  Video,
  Music,
  File as FileIcon,
  Download,
  Mic,
  Plus,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChatHeader from './ChatHeader';
import TypingIndicator from './TypingIndicator';
import { useSelectedChatId, useSelectedChatUser } from '@/store/appStore';
import EmptyState from './EmptyState';
import VoiceRecorder from './features/VoiceRecorder';

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const selectedChatId = useSelectedChatId();
  const selectedChatUser = useSelectedChatUser();
  const { messages, loading, hasMore, loadingOlder, loadOlderMessages } = useMessagesOptimized(selectedChatId, currentUser?.uid);
  // const typingUsers = useTypingIndicator(selectedChatId, currentUser?.uid);

  const [inputMessage, setInputMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
  // const typingClearRef = useRef<NodeJS.Timeout | null>(null);
  // const lastTypingSentRef = useRef<number>(0);
  const messageListRef = useRef<VirtualizedMessageListHandle>(null);

  // useEffect(() => {
  //   return () => {
  //     if (typingClearRef.current) clearTimeout(typingClearRef.current);
  //     if (currentUser && selectedChatId) {
  //       chatServiceOptimized.setTypingIndicator(selectedChatId, currentUser.uid, currentUser.displayName, false);
  //     }
  //   };
  // }, [selectedChatId, currentUser]);

  useEffect(() => {
    if (selectedChatId && currentUser && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUser.uid && !lastMessage.readBy?.includes(currentUser.uid)) {
        chatServiceOptimized.markMessagesAsRead(selectedChatId, currentUser.uid);
      }
    }
  }, [selectedChatId, currentUser, messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //   const triggerTyping = useCallback(() => {
  //   if (!currentUser || !selectedChatId) return;
    
  //   const now = Date.now();
  //   if (now - lastTypingSentRef.current > 2000) {
  //     lastTypingSentRef.current = now;
  //     chatServiceOptimized.setTypingIndicator(selectedChatId, currentUser.uid, currentUser.displayName, true);
  //   }

  //   if (typingClearRef.current) clearTimeout(typingClearRef.current);

  //   typingClearRef.current = setTimeout(() => {
  //     chatServiceOptimized.setTypingIndicator(selectedChatId, currentUser.uid, currentUser.displayName, false);
  //     lastTypingSentRef.current = 0;
  //   }, 3000);
  // }, [currentUser, selectedChatId]);



  if (!selectedChatId) return <EmptyState />;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      const validation = fileService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected`);
    }

    e.target.value = '';
    setShowAttachmentMenu(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!currentUser || (!inputMessage.trim() && selectedFiles.length === 0)) return;

    try {
      setUploading(true);

      if (editingMessage) {
        const success = await chatServiceOptimized.editMessage(selectedChatId, editingMessage.id, inputMessage, currentUser.uid);
        if (success) {
          toast.success('Message edited');
          setEditingMessage(null);
        } else {
          toast.error('Cannot edit message (15 min limit or not your message)');
        }
      } else {
        if (selectedFiles.length > 0) {
          const uploadResults = await fileService.uploadMultipleFiles(selectedFiles, selectedChatId, currentUser.uid);
          if (uploadResults.length === 0) {
            toast.error('Failed to upload files');
            setUploading(false);
            return;
          }

          for (const fileData of uploadResults) {
            await chatServiceOptimized.sendMessage(
              selectedChatId, currentUser.uid, currentUser.displayName,
              inputMessage || `Sent ${fileData.type}`, fileData.type as any,
              fileData.url, fileData.fileName, fileData.fileSize, replyTo || undefined
            );
          }
          toast.success(`${uploadResults.length} file(s) sent`);
        } else {
          await chatServiceOptimized.sendMessage(
            selectedChatId, currentUser.uid, currentUser.displayName,
            inputMessage, 'text', undefined, undefined, undefined, replyTo || undefined
          );
        }
        setReplyTo(null);
      }

      setInputMessage('');
      setSelectedFiles([]);
      setUploading(false);

      // if (typingClearRef.current) clearTimeout(typingClearRef.current);
      // chatServiceOptimized.setTypingIndicator(selectedChatId, currentUser.uid, currentUser.displayName, false);
      // lastTypingSentRef.current = 0;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setUploading(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!currentUser) return;
    const success = await chatService.deleteMessage(selectedChatId, message.id, currentUser.uid);
    if (success) {
      toast.success('Message deleted');
    } else {
      toast.error('Cannot delete message (15 min limit or not your message)');
    }
    setShowMessageMenu(null);
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
        return <video src={message.fileURL} controls className="max-w-sm rounded-lg" />;
      case 'audio':
        return <audio src={message.fileURL} controls className="w-64" />;
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
              <p className="text-xs">{message.fileSize && fileService.formatFileSize(message.fileSize)}</p>
            </div>
            <Download />
          </a>
        );
      case 'voice':
        return (
          <div className="flex items-center space-x-2 mb-2">
            <audio src={message.fileURL} controls className="w-64" />
          </div>
        );
      default:
        return null;
    }
  };

  const handleVoiceNoteSend = async (audioBlob: Blob, duration: number) => {
    if (!currentUser) return;
    try {
      setUploading(true);
      const uploadResult = await fileService.uploadVoiceNote(audioBlob, selectedChatId, currentUser.uid);
      if (!uploadResult) {
        toast.error('Failed to upload voice note');
        setUploading(false);
        return;
      }

      await chatServiceOptimized.sendMessage(
        selectedChatId, currentUser.uid, currentUser.displayName,
        'Voice message', 'voice', uploadResult.url, uploadResult.fileName, uploadResult.fileSize, replyTo || undefined
      );

      toast.success('Voice note sent');
      setIsRecordingVoice(false);
      setReplyTo(null);
      setUploading(false);
    } catch (error) {
      console.error('Error sending voice note:', error);
      toast.error('Failed to send voice note');
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const type = fileService.getFileType(file);
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      default: return <FileIcon className="w-5 h-5" />;
    }
  };

  const handleScrollToBottom = () => {
    messageListRef.current?.scrollToBottom();
  };

  return (
    <main className="h-full relative bg-[#16161659] bg-chat-background bg-repeat">
      <div className="relative z-10 h-full flex flex-col">
        <ChatHeader 
          currentUser={selectedChatUser} 
          onUserClick={(user) => setSelectedUserProfile(user)}
        />

        <div className="flex-1 overflow-hidden relative">
          <VirtualizedMessageList
            ref={messageListRef}
            messages={messages}
            currentUserId={currentUser?.uid}
            loading={loading}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
            onLoadOlder={loadOlderMessages}
            renderFilePreview={renderFilePreview}
            onReply={(message) => setReplyTo(message)}
            onEdit={(message) => {
              setEditingMessage(message);
              setInputMessage(message.content);
            }}
            onDelete={handleDeleteMessage}
            onForward={(message) => setForwardingMessage(message)}
            showMessageMenu={showMessageMenu}
            setShowMessageMenu={setShowMessageMenu}
            onAtBottomStateChange={(atBottom) => setShowScrollBottom(!atBottom)}
          />
          
          {showScrollBottom && (
            <button
              onClick={handleScrollToBottom}
              className="absolute bottom-4 right-4 p-2 bg-[#202c33] text-[#8696a0] rounded-full shadow-lg hover:bg-[#2a3942] transition-colors z-20"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          )}

          {/* {typingUsers.length > 0 && (
            <div className="px-4 pb-2">
              <TypingIndicator typingUsers={typingUsers} />
            </div>
          )} */}
        </div>

        {isRecordingVoice ? (
          <VoiceRecorder onSend={handleVoiceNoteSend} onCancel={() => setIsRecordingVoice(false)} />
        ) : (
          <div className="relative px-4 py-3 bg-[#202c33]">
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

            {editingMessage && (
              <div className="mb-2 p-2 rounded-lg flex items-center justify-between">
                <div><p className="text-sm font-medium">Editing message</p></div>
                <button onClick={() => { setEditingMessage(null); setInputMessage(''); }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mb-2 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="p-2 bg-[#369f8c63] rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{fileService.formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(index)}>
                      <X className="w-5 h-5 text-white cursor-pointer" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

              <div className="relative" ref={attachmentMenuRef}>
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  disabled={uploading}
                >
                  <Plus className="text-[#8696a0] cursor-pointer w-6 h-6" />
                </button>

                {showAttachmentMenu && (
                  <div className="absolute bottom-12 left-0 bg-[#233138] rounded-lg shadow-lg py-2 min-w-[200px] z-20">
                    <button onClick={() => imageInputRef.current?.click()} className="flex items-center space-x-3 text-sm px-4 cursor-pointer py-2 hover:bg-[#182229] w-full text-left text-white">
                      <div className="p-2 bg-purple-600 rounded-full"><ImageIcon className="w-5 h-5" /></div>
                      <span>Images</span>
                    </button>
                    <button onClick={() => videoInputRef.current?.click()} className="flex items-center space-x-3 text-sm px-4 cursor-pointer py-2 hover:bg-[#182229] w-full text-left text-white">
                      <div className="p-2 bg-pink-600 rounded-full"><Video className="w-5 h-5" /></div>
                      <span>Videos</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-3 text-sm px-4 cursor-pointer py-2 hover:bg-[#182229] w-full text-left text-white">
                      <div className="p-2 bg-blue-600 rounded-full"><FileIcon className="w-5 h-5" /></div>
                      <span>Documents</span>
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  // if (e.target.value.trim()) triggerTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-sm outline-none"
                disabled={uploading}
              />

              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && selectedFiles.length === 0) || uploading}
                className="p-2 bg-[#0f3d2e] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Send size={18} />
                )}
              </button>

              <button
                onClick={() => setIsRecordingVoice(true)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                disabled={uploading || isRecordingVoice}
              >
                <Mic className="text-[#8696a0] cursor-pointer" />
              </button>
            </div>
          </div>
        )}

        {forwardingMessage && (
          <ForwardMessageModal message={forwardingMessage} onClose={() => setForwardingMessage(null)} />
        )}

        {selectedUserProfile && (
          <UserProfileModal 
            user={selectedUserProfile} 
            isOpen={!!selectedUserProfile}
            onClose={() => setSelectedUserProfile(null)}
          />
        )}
      </div>
    </main>
  );
}
