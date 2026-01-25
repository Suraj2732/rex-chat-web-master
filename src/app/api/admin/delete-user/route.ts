// src/app/api/admin/delete-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(userId);

    // Delete user document from Firestore
    await adminDb.collection('users').doc(userId).delete();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}