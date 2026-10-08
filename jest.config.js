module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-redux|@react-native|@react-navigation|@tanstack|react-native-safe-area-context|react-native-gesture-handler|react-native-reanimated|react-native-svg|react-native-vector-icons)/)',
  ],
};
