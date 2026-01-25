import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { auth } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    // Get the current user's ID token from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token and check if user is admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Get current user's data to verify admin role
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData || currentUserData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get new user data from request body
    const { email, password, displayName, role } = await request.json();

    // Validate input
    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['admin', 'employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or employee' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      photoURL: null,
      createdAt: new Date(),
      lastSeen: new Date(),
      isOnline: false,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
      },
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}