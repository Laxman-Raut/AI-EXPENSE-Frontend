import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '876018790047-e6tute5i7vo2vhmfqoh59k9a0go8ltlm.apps.googleusercontent.com',
  offlineAccess: true,
});

export default GoogleSignin;