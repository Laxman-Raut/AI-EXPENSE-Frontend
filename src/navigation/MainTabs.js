import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';

// Import existing screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReceiptScannerScreen from '../screens/ai/ReceiptScannerScreen';
import ReceiptImportScreen from '../screens/ai/ReceiptImportScreen';
import CategoriesScreen from '../screens/budget/CategoriesScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import CalendarViewScreen from '../screens/calendar/CalendarViewScreen';
import NotificationScreen from '../screens/NotificationScreen';
import RecurringTransactionsScreen from '../screens/recurring/RecurringTransactionsScreen';
import AddEditRecurringScreen from '../screens/recurring/AddEditRecurringScreen';
import FloatingVoiceButton from '../components/FloatingVoiceButton';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Animated tab icon component for smooth spring animations
const AnimatedTabIcon = ({ name, color, focused }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.15 : 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [focused, scaleValue]);

  return (
    <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleValue }] }]}>
      <Icon name={name} size={24} color={color} />
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </Animated.View>
  );
};

// Stack navigation for Dashboard to allow drill downs
const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <DashboardStack.Screen name="TodayHome" component={DashboardScreen} />
    <DashboardStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <DashboardStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <DashboardStack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
    <DashboardStack.Screen name="ReceiptImport" component={ReceiptImportScreen} />
    <DashboardStack.Screen name="Categories" component={CategoriesScreen} />
    <DashboardStack.Screen name="Calendar" component={CalendarViewScreen} />
    <DashboardStack.Screen name="Budget" component={BudgetScreen} />
    <DashboardStack.Screen name="Notifications" component={NotificationScreen} />
  </DashboardStack.Navigator>
);

// Stack navigation for Profile tab
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="Budget" component={BudgetScreen} />
    <ProfileStack.Screen name="RecurringTransactions" component={RecurringTransactionsScreen} />
    <ProfileStack.Screen name="AddEditRecurring" component={AddEditRecurringScreen} />
    <ProfileStack.Screen name="Categories" component={CategoriesScreen} />
  </ProfileStack.Navigator>
);

// Stack navigation for Wallet/Transactions tab
const TransactionsStackScreen = () => (
  <TransactionsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
    <TransactionsStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <TransactionsStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <TransactionsStack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
    <TransactionsStack.Screen name="ReceiptImport" component={ReceiptImportScreen} />
    <TransactionsStack.Screen name="Categories" component={CategoriesScreen} />
    <TransactionsStack.Screen name="Calendar" component={CalendarViewScreen} />
    <TransactionsStack.Screen name="Notifications" component={NotificationScreen} />
  </TransactionsStack.Navigator>
);

// Custom Center Floating Action Tab Button
const CustomTabBarButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.customAddButtonContainer}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.customAddButton}>
      <Icon name="add" size={30} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

// Dummy component for center tab placeholder
const DummyComponent = () => null;

const MainTabs = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tab.Screen
          name="Today"
          component={DashboardStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'today' : 'today-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'analytics' : 'analytics-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Add"
          component={DummyComponent}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <CustomTabBarButton
                onPress={() => {
                  navigation.navigate('Today', { screen: 'AddTransaction' });
                }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Wallet"
          component={TransactionsStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingVoiceButton />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(18, 19, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingTop: spacing.xs,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: typography.sizes?.xs || 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  customAddButtonContainer: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MainTabs;
