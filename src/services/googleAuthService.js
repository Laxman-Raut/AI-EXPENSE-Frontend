import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

/**
 * Configure Google Sign-In options.
 * Call this once when app mounts or before sign in.
 */
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      // webClientId is optional if google-services.json is configured, but recommended
      offlineAccess: true,
    });
  } catch (err) {
    console.warn('[GoogleAuthService] Config warning:', err.message);
  }
};

/**
 * Triggers Google Sign-In flow via Google Play Services & Firebase Auth.
 * Returns { email, fullName, photoUrl, googleId, firebaseToken }
 */
export const signInWithGoogle = async () => {
  try {
    // 1. Ensure Play Services are available on Android
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Perform Google Sign In
    const signInResult = await GoogleSignin.signIn();
    console.log('[GoogleAuthService] Google Sign-In result:', signInResult);

    const userObj = signInResult.data?.user || signInResult.user || {};
    let idToken = signInResult.data?.idToken || signInResult.idToken;

    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    let firebaseToken = null;
    let firebaseUser = null;

    // 3. Link with Firebase Auth if idToken is available
    if (idToken) {
      try {
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        firebaseUser = userCredential.user;
        firebaseToken = await firebaseUser.getIdToken();
      } catch (fbErr) {
        console.warn('[GoogleAuthService] Firebase credential link warning:', fbErr.message);
      }
    }

    const email = firebaseUser?.email || userObj.email;
    const fullName = firebaseUser?.displayName || userObj.name || (userObj.givenName ? `${userObj.givenName} ${userObj.familyName || ''}` : 'Google User');
    const photoUrl = firebaseUser?.photoURL || userObj.photo;
    const googleId = firebaseUser?.uid || userObj.id;

    if (!email) {
      throw new Error('Could not retrieve email from Google Account.');
    }

    return {
      email,
      fullName: fullName.trim(),
      photoUrl: photoUrl || '',
      googleId: googleId || '',
      firebaseToken: firebaseToken || '',
    };
  } catch (error) {
    console.error('[GoogleAuthService] Error during Google Sign-In:', error);
    throw error;
  }
};
