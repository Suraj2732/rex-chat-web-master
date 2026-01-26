// src/types/index.ts
export type UserRole = 'admin' | 'employee';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  password?: string;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  isActive: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  participantsData: User[];
  lastMessage?: Message;
  lastMessageTime: Date;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  createdBy: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice';

export interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  size?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  mediaFiles?: MediaFile[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  forwardedFrom?: {
    senderName: string;
    originalChatId: string;
  };
  readBy: string[];
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
}
export interface TypingIndicator {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: Date;
}