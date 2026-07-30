import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

/**
 * Configure Google Sign-In
 * Call once when app starts.
 */
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: '876018790047-e6tute5i7vo2vhmfqoh59k9a0go8ltlm.apps.googleusercontent.com',
      offlineAccess: false,
    });
  } catch (err) {
    console.warn('[GoogleAuthService] Config warning:', err.message);
  }
};

/**
 * Google Sign-In + Firebase Authentication (with safe fallbacks)
 */
export const signInWithGoogle = async () => {
  try {
    // Ensure GoogleSignin is configured
    configureGoogleSignIn();

    // Check Google Play Services
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Safely attempt to sign out any previous session
    try {
      await GoogleSignin.signOut();
    } catch (signOutErr) {
      // Ignore previous session signout errors
    }

    // Start Google Sign-In
    const signInResult = await GoogleSignin.signIn();

    // Extract User Profile from Google Sign-In result
    const user = signInResult.data?.user || signInResult.user || {};
    let idToken = signInResult.data?.idToken || signInResult.idToken;
    let accessToken = signInResult.data?.accessToken || signInResult.accessToken;

    if (!idToken || !accessToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = idToken || tokens.idToken;
        accessToken = accessToken || tokens.accessToken;
      } catch (tokenErr) {
        console.warn('[GoogleAuthService] Could not fetch Google tokens:', tokenErr.message);
      }
    }

    // Attempt Firebase Authentication if available
    try {
      if (idToken && auth && auth.GoogleAuthProvider) {
        const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        const firebaseUser = userCredential.user;
        const firebaseToken = await firebaseUser.getIdToken();

        return {
          email: firebaseUser.email || user.email,
          fullName: firebaseUser.displayName || user.name,
          photoUrl: firebaseUser.photoURL || user.photo,
          googleId: firebaseUser.uid || user.id,
          firebaseToken,
          idToken,
        };
      }
    } catch (fbErr) {
      console.warn('[GoogleAuthService] Firebase authentication bypassed:', fbErr.message);
    }

    // Direct Google Sign-In Fallback
    if (user.email) {
      return {
        email: user.email,
        fullName: user.name || user.givenName || 'Google User',
        photoUrl: user.photo || '',
        googleId: user.id || idToken || '',
        idToken,
      };
    }

    throw new Error('Google Sign-In failed to retrieve user account information.');
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('[GoogleAuthService] User cancelled Google Sign-In.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('[GoogleAuthService] Google Sign-In is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('[GoogleAuthService] Google Play Services unavailable or outdated.');
    } else {
      console.warn('[GoogleAuthService] Notice:', error.message || error);
    }
    throw error;
  }
};