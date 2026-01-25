// src/lib/services/fileService.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export const fileService = {
   // Upload single file to Firebase Storage
  uploadFile: async (
    file: File,
    chatId: string,
    userId: string
  ): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `chats/${chatId}/${userId}/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (
    files: File[],
    chatId: string,
    userId: string
  ): Promise<Array<{ url: string; fileName: string; fileSize: number; type: string }>> => {
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await fileService.uploadFile(file, chatId, userId);
        if (result) {
          return {
            ...result,
            type: fileService.getFileType(file),
          };
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      return results.filter(r => r !== null) as Array<{ url: string; fileName: string; fileSize: number; type: string }>;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      return [];
    }
  },

  //  Upload Voice note
  uploadVoiceNote: async (
    audioBlob: Blob,
    chatId: string,
    userId: string
  ): Promise<{ url: string; fileName: string; fileSize: number; duration: number } | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `voice_note_${timestamp}.webm`;
      const storagePath = `chats/${chatId}/${userId}/voice_notes/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, audioBlob);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        fileName,
        fileSize: audioBlob.size,
        duration: 0, // Will be calculated on the client
      };
    } catch (error) {
      console.error('Error uploading voice note:', error);
      return null;
    }
  },

  //  Upload profile image
  uploadProfileImage: async (
    file: File,
    userId: string
  ): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `profiles/${userId}/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }
  },

  // Get file type from file
  getFileType: (file: File): 'image' | 'video' | 'audio' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Validate file
  validateFile: (file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } => {
    // Check file size (default 50MB)
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${fileService.formatFileSize(maxSize)}`,
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported',
      };
    }

    return { valid: true };
  },

    // Validate profile image
    validateProfileImage: (file: File): { valid: boolean; error?: string } => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSize) {
        return {
          valid: false,
          error: 'Image size must be less than 5MB',
        };
      }
  
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Only JPEG, PNG, GIF, and WebP images are allowed',
        };
      }
  
      return { valid: true };
    },
  
};