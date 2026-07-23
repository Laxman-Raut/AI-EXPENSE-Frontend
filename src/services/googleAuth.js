import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('No ID Token received');
  }

  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  const userCredential = await auth().signInWithCredential(googleCredential);

  return userCredential.user;
};