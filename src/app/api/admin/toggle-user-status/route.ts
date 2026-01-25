// src/app/api/admin/toggle-user-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
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

    const { userId, isActive } = await request.json();

    if (!userId || isActive === undefined) {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    // Update user's disabled status in Firebase Auth
    await adminAuth.updateUser(userId, {
      disabled: !isActive,
    });

    // Update Firestore
    await adminDb.collection('users').doc(userId).update({
      isActive,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      isActive,
    });

  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle user status' },
      { status: 500 }
    );
  }
}
