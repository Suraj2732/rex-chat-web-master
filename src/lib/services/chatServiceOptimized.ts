// Optimized chat service with batch operations and denormalization

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Chat, Message, MessageType } from '@/types';

// Batch size for Firestore operations
const BATCH_SIZE = 500;

export const chatServiceOptimized = {
  // Create or get existing chat (same as before)
  createOrGetChat: async (currentUserId: string, otherUserId: string): Promise<string | null> => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUserId)
      );

      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find((doc) =>
        doc.data().participants.includes(otherUserId)
      );

      if (existingChat) {
        return existingChat.id;
      }

      const newChatRef = doc(collection(db, 'chats'));
      await setDoc(newChatRef, {
        participants: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        createdBy: currentUserId,
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0,
        },
        // Denormalize: Store last message in chat document
        lastMessage: null,
      });

      return newChatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  },

  // Send message with denormalization
  sendMessage: async (
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: MessageType = 'text',
    fileURL?: string,
    fileName?: string,
    fileSize?: number,
    replyTo?: Message
  ): Promise<string | null> => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      const messageData = {
        chatId,
        senderId,
        senderName,
        content,
        type,
        fileURL: fileURL || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        replyTo: replyTo
          ? {
              messageId: replyTo.id,
              content: replyTo.content,
              senderName: replyTo.senderName,
            }
          : null,
        readBy: [senderId],
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false,
      };

      const docRef = await addDoc(messagesRef, messageData);

      // Update chat document with denormalized last message
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();

      // Denormalize lastMessage with all necessary fields for chat list
      const lastMessage = {
        id: docRef.id,
        chatId,
        senderId,
        senderName,
        content,
        type,
        fileURL: fileURL || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        readBy: [senderId], // Only sender has read it initially
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false,
      };

      const updateData: any = {
        lastMessageTime: serverTimestamp(),
        lastMessage, // Denormalize for efficient chat list loading
      };

      // Increment unread count for other participants
      if (chatData?.participants) {
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== senderId) {
            updateData[`unreadCount.${participantId}`] = increment(1);
          }
        });
      }

      await updateDoc(chatRef, updateData);

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  // Optimized mark messages as read using batch writes
  markMessagesAsRead: async (chatId: string, userId: string) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const unreadMessages = snapshot.docs.filter(
        (doc) => {
          const messageData = doc.data();
          return messageData.readBy && !messageData.readBy.includes(userId);
        }
      );

      if (unreadMessages.length === 0) {
        await updateDoc(doc(db, 'chats', chatId), {
          [`unreadCount.${userId}`]: 0,
        });
        return;
      }

      // Update messages in batches
      for (let i = 0; i < unreadMessages.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const messageBatch = unreadMessages.slice(i, i + BATCH_SIZE);

        messageBatch.forEach((messageDoc) => {
          batch.update(messageDoc.ref, {
            readBy: arrayUnion(userId),
          });
        });

        await batch.commit();
      }

      // Update chat document
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      
      // Update denormalized lastMessage readBy if it exists
      const updateData: any = {
        [`unreadCount.${userId}`]: 0,
      };
      
      if (chatData?.lastMessage && !chatData.lastMessage.readBy?.includes(userId)) {
        updateData.lastMessage = {
          ...chatData.lastMessage,
          readBy: [...(chatData.lastMessage.readBy || []), userId],
        };
      }
      
      await updateDoc(chatRef, updateData);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  // Optimized typing indicator with debouncing
  setTypingIndicator: async (
    chatId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ) => {
    try {
      const typingRef = doc(db, 'typing', chatId);

      if (isTyping) {
        // Use merge to avoid overwriting other users' typing status
        await setDoc(
          typingRef,
          {
            [userId]: {
              userName,
              timestamp: serverTimestamp(),
            },
          },
          { merge: true }
        );
      } else {
        const typingDoc = await getDoc(typingRef);
        if (typingDoc.exists()) {
          const data = typingDoc.data();
          const newData = { ...data };
          delete newData[userId];

          // Only update if there are other users typing, otherwise delete doc
          if (Object.keys(newData).length > 0) {
            await setDoc(typingRef, newData);
          } else {
            await deleteDoc(typingRef);
          }
        }
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  },

  // Keep other methods the same (editMessage, deleteMessage, etc.)
  editMessage: async (
    chatId: string,
    messageId: string,
    newContent: string,
    senderId: string
  ): Promise<boolean> => {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) return false;

      const messageData = messageDoc.data();
      const createdAt = messageData.createdAt?.toDate();
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeDiff > fifteenMinutes || messageData.senderId !== senderId) {
        return false;
      }

      await updateDoc(messageRef, {
        content: newContent,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });

      // Update denormalized lastMessage if this is the last message
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();

      if (chatData?.lastMessage?.id === messageId) {
        await updateDoc(chatRef, {
          lastMessage: {
            ...chatData.lastMessage,
            content: newContent,
            isEdited: true,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  },

   deleteMessage: async (
    chatId: string,
    messageId: string,
    senderId: string
  ): Promise<boolean> => {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) return false;

      const messageData = messageDoc.data();
      const createdAt = messageData.createdAt?.toDate();
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeDiff > fifteenMinutes || messageData.senderId !== senderId) {
        // alert("Message is already older than 15 mins")
        return false;
      }

      await updateDoc(messageRef, {
        isDeleted: true,
        // content: 'This message was deleted',
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  },

  // Forward message
  forwardMessage: async (
    message: Message,
    newChatId: string,
    senderId: string,
    senderName: string
  ): Promise<string | null> => {
    try {
      const messagesRef = collection(db, 'chats', newChatId, 'messages');

      const forwardedMessage = {
        chatId: newChatId,
        senderId,
        senderName,
        content: message.content,
        type: message.type,
        fileURL: message.fileURL || null,
        fileName: message.fileName || null,
        fileSize: message.fileSize || null,
        forwardedFrom: {
          senderName: message.senderName,
          originalChatId: message.chatId,
        },
        readBy: [senderId],
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false,
      };

      const docRef = await addDoc(messagesRef, forwardedMessage);

      // Update chat document with denormalized last message
      const chatRef = doc(db, 'chats', newChatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();

      // Denormalize lastMessage
      const lastMessage = {
        id: docRef.id,
        chatId: newChatId,
        senderId,
        senderName,
        content: message.content,
        type: message.type,
        fileURL: message.fileURL || null,
        fileName: message.fileName || null,
        fileSize: message.fileSize || null,
        readBy: [senderId],
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false,
      };

      const updateData: any = {
        lastMessageTime: serverTimestamp(),
        lastMessage,
      };

      // Increment unread count for other participants
      if (chatData?.participants) {
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== senderId) {
            updateData[`unreadCount.${participantId}`] = increment(1);
          }
        });
      }

      await updateDoc(chatRef, updateData);

      return docRef.id;
    } catch (error) {
      console.error('Error forwarding message:', error);
      return null;
    }
  },
  
  
};
