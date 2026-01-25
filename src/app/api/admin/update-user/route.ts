// src/app/api/admin/update-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Verify admin role
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData || currentUserData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { userId, displayName, email, role, isActive, photoURL } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update Firebase Auth user
    const updateData: any = {};
    if (displayName) updateData.displayName = displayName;
    if (email) updateData.email = email;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    if (Object.keys(updateData).length > 0) {
      await adminAuth.updateUser(userId, updateData);
    }

    // Update Firestore user document
    const firestoreUpdateData: any = {};
    if (displayName) firestoreUpdateData.displayName = displayName;
    if (email) firestoreUpdateData.email = email;
    if (role) firestoreUpdateData.role = role;
    if (isActive !== undefined) firestoreUpdateData.isActive = isActive;
    if (photoURL !== undefined) firestoreUpdateData.photoURL = photoURL;
    firestoreUpdateData.updatedAt = new Date();

    await adminDb.collection('users').doc(userId).update(firestoreUpdateData);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
