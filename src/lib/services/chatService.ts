// src/lib/services/chatService.ts
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
    Timestamp,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  import { Chat, Message, MessageType } from '@/types';
  
  export const chatService = {
    // Create or get existing chat
    createOrGetChat: async (currentUserId: string, otherUserId: string): Promise<string | null> => {
      try {
        // Check if chat already exists
        const chatsRef = collection(db, 'chats');
        const q = query(
          chatsRef,
          where('participants', 'array-contains', currentUserId)
        );
        
        const snapshot = await getDocs(q);
        const existingChat = snapshot.docs.find(doc => 
          doc.data().participants.includes(otherUserId)
        );
  
        if (existingChat) {
          return existingChat.id;
        }
  
        // Create new chat
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
        });
  
        return newChatRef.id;
      } catch (error) {
        console.error('Error creating chat:', error);
        return null;
      }
    },
  
    // Get user chats
    getUserChats: async (userId: string, userRole: string): Promise<Chat[]> => {
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(
          chatsRef,
          where('participants', 'array-contains', userId),
          orderBy('lastMessageTime', 'desc')
        );
  
        const snapshot = await getDocs(q);
        const chats: Chat[] = [];
  
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data();
          const chat: Chat = {
            id: chatDoc.id,
            participants: chatData.participants,
            participantsData: [],
            lastMessageTime: chatData.lastMessageTime?.toDate() || new Date(),
            unreadCount: chatData.unreadCount || {},
            createdAt: chatData.createdAt?.toDate() || new Date(),
            createdBy: chatData.createdBy,
          };
  
          // Get last message
          const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
          const lastMessageQuery = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const lastMessageSnapshot = await getDocs(lastMessageQuery);
          
          if (!lastMessageSnapshot.empty) {
            const lastMsg = lastMessageSnapshot.docs[0].data();
            chat.lastMessage = {
              ...lastMsg,
              id: lastMessageSnapshot.docs[0].id,
              createdAt: lastMsg.createdAt?.toDate() || new Date(),
            } as Message;
          }
  
          chats.push(chat);
        }
  
        return chats;
      } catch (error) {
        console.error('Error fetching chats:', error);
        return [];
      }
    },
  
    // Send message
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
          replyTo: replyTo ? {
            messageId: replyTo.id,
            content: replyTo.content,
            senderName: replyTo.senderName,
          } : null,
          readBy: [senderId],
          createdAt: serverTimestamp(),
          isEdited: false,
          isDeleted: false,
        };
  
        const docRef = await addDoc(messagesRef, messageData);
  
        // Update chat's last message time and unread count
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.data();
        
        const updateData: any = {
          lastMessageTime: serverTimestamp(),
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
  
    // Edit message (within 15 minutes)
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
  
        // Check if within 15 minutes and sender is the owner
        if (timeDiff > fifteenMinutes || messageData.senderId !== senderId) {
          return false;
        }
  
        await updateDoc(messageRef, {
          content: newContent,
          isEdited: true,
          updatedAt: serverTimestamp(),
        });
  
        return true;
      } catch (error) {
        console.error('Error editing message:', error);
        return false;
      }
    },
  
    // Delete message (within 15 minutes)
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
          return false;
        }
  
        await updateDoc(messageRef, {
          isDeleted: true,
          content: 'This message was deleted',
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
  
        // Update chat's last message time
        await updateDoc(doc(db, 'chats', newChatId), {
          lastMessageTime: serverTimestamp(),
        });
  
        return docRef.id;
      } catch (error) {
        console.error('Error forwarding message:', error);
        return null;
      }
    },
  
    // Mark messages as read
    markMessagesAsRead: async (chatId: string, userId: string) => {
      try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, where('readBy', 'not-in', [[userId]]));
        
        const snapshot = await getDocs(q);
        
        const updatePromises = snapshot.docs.map(messageDoc =>
          updateDoc(messageDoc.ref, {
            readBy: arrayUnion(userId),
          })
        );
  
        await Promise.all(updatePromises);
  
        // Reset unread count
        await updateDoc(doc(db, 'chats', chatId), {
          [`unreadCount.${userId}`]: 0,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    },
  
    // Set typing indicator
    setTypingIndicator: async (chatId: string, userId: string, userName: string, isTyping: boolean) => {
      try {
        const typingRef = doc(db, 'typing', chatId);
        
        if (isTyping) {
          await setDoc(typingRef, {
            [userId]: {
              userName,
              timestamp: serverTimestamp(),
            },
          }, { merge: true });
        } else {
          const typingDoc = await getDoc(typingRef);
          if (typingDoc.exists()) {
            const data = typingDoc.data();
            delete data[userId];
            await setDoc(typingRef, data);
          }
        }
      } catch (error) {
        console.error('Error setting typing indicator:', error);
      }
    },
  };