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
 * Google Sign-In + Firebase Authentication
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
      console.log('[GoogleAuthService] Previous session sign out notice:', signOutErr.message);
    }

    // Start Google Sign-In
    const signInResult = await GoogleSignin.signIn();

    console.log('Google Sign-In Result:', signInResult);

    // Get Tokens (ID Token & Access Token)
    let idToken = signInResult.data?.idToken || signInResult.idToken;
    let accessToken = signInResult.data?.accessToken || signInResult.accessToken;

    if (!idToken || !accessToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = idToken || tokens.idToken;
      accessToken = accessToken || tokens.accessToken;
    }

    if (!idToken) {
      throw new Error('No ID Token received from Google.');
    }

    // Firebase Authentication
    const googleCredential =
      auth.GoogleAuthProvider.credential(idToken, accessToken);

    const userCredential =
      await auth().signInWithCredential(googleCredential);

    const firebaseUser = userCredential.user;

    const firebaseToken = await firebaseUser.getIdToken();

    return {
      email: firebaseUser.email,
      fullName: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
      googleId: firebaseUser.uid,
      firebaseToken,
    };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('[GoogleAuthService] User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('[GoogleAuthService] Operation (e.g. sign in) is in progress already');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('[GoogleAuthService] Play services not available or outdated');
    } else {
      console.error('[GoogleAuthService] Detailed error:', error.code, error.message, error);
    }
    throw error;
  }
};