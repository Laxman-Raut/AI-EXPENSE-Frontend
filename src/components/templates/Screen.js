import React from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

const Screen = ({
  children,
  scrollable = false,
  header,
  loading = false,
  edges = ['top', 'left', 'right'], // safe-area-context edges
  style,
  safeAreaStyle,
  keyboardAvoiding = true,
  refreshControl,
}) => {
  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, style]}>
      {children}
    </View>
  );

  const container = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.safeArea, safeAreaStyle]} edges={edges}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Optional Header Molecule */}
      {header && <View>{header}</View>}
      
      {/* Main Screen Layout Container */}
      <View style={styles.mainContainer}>
        {container}
      </View>

      {/* Full-Screen Loading Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

export default Screen;
