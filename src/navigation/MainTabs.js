import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import SubscriptionScreen from '../screens/profile/subscription/SubscriptionScreen';
import PaymentSuccessScreen from '../screens/profile/subscription/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/profile/subscription/PaymentFailedScreen';
import PremiumFeaturesScreen from '../screens/profile/subscription/PremiumFeaturesScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';
import UserSearchScreen from '../screens/friends/UserSearchScreen';
import GroupsListScreen from '../screens/groups/GroupsListScreen';
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import CreateEditGroupScreen from '../screens/groups/CreateEditGroupScreen';
import CreateSplitRequestScreen from '../screens/groups/CreateSplitRequestScreen';
import SplitRequestDetailScreen from '../screens/groups/SplitRequestDetailScreen';

import AIInsightsScreen from '../screens/ai/AIInsightsScreen';

import BankAccountsScreen from '../screens/profile/BankAccountsScreen';
import BankDetailsScreen from '../screens/profile/BankDetailsScreen';

import SavingsScreen from '../screens/savings/SavingsScreen';
import CreateSavingsJarScreen from '../screens/savings/CreateSavingsJarScreen';
import SavingsDetailsScreen from '../screens/savings/SavingsDetailsScreen';
import DepositScreen from '../screens/savings/DepositScreen';
import WithdrawScreen from '../screens/savings/WithdrawScreen';
import TransferScreen from '../screens/savings/TransferScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const AnalyticsStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();

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
  </DashboardStack.Navigator>
);

// Stack navigation for Analytics tab
const AnalyticsStackScreen = () => (
  <AnalyticsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <AnalyticsStack.Screen name="AnalyticsHome" component={AnalyticsScreen} />
    <AnalyticsStack.Screen name="AIInsights" component={AIInsightsScreen} />
  </AnalyticsStack.Navigator>
);

// Stack navigation for Friends tab
const FriendsStackScreen = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <FriendsStack.Screen name="FriendsHome" component={FriendsScreen} />
    <FriendsStack.Screen name="UserSearch" component={UserSearchScreen} />
    <FriendsStack.Screen name="GroupsList" component={GroupsListScreen} />
    <FriendsStack.Screen name="GroupDetails" component={GroupDetailsScreen} />
    <FriendsStack.Screen name="CreateEditGroup" component={CreateEditGroupScreen} />
    <FriendsStack.Screen name="CreateSplitRequest" component={CreateSplitRequestScreen} />
    <FriendsStack.Screen name="SplitRequestDetail" component={SplitRequestDetailScreen} />
  </FriendsStack.Navigator>
);

// Stack navigation for Profile tab
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="RecurringTransactions" component={RecurringTransactionsScreen} />
    <ProfileStack.Screen name="AddEditRecurring" component={AddEditRecurringScreen} />
  </ProfileStack.Navigator>
);

// Stack navigation for Wallet/Transactions tab
const TransactionsStackScreen = () => (
  <TransactionsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
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
  const insets = useSafeAreaInsets();

  // Dynamically calculate padding and height based on the device's safe area bottom inset
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 6 : (Platform.OS === 'ios' ? 20 : 16);
  const tabBarHeight = (Platform.OS === 'ios' ? 64 : 64) + bottomPadding;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: bottomPadding,
              paddingTop: Platform.OS === 'android' ? 8 : 6,
            }
          ],
          safeAreaInsets: { bottom: 0 },
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
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Today', { screen: 'TodayHome' });
            },
          })}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'analytics' : 'analytics-outline'} color={color} focused={focused} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Analytics', { screen: 'AnalyticsHome' });
            },
          })}
        />
        <Tab.Screen
          name="Add"
          component={DummyComponent}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <CustomTabBarButton
                onPress={() => {
                  navigation.navigate('AddTransaction');
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
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Wallet', { screen: 'TransactionsList' });
            },
          })}
        />
        <Tab.Screen
          name="Friends"
          component={FriendsStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Friends', { screen: 'FriendsHome' });
            },
          })}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Profile', { screen: 'ProfileHome' });
            },
          })}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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

const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main Tabs Group */}
      <RootStack.Group>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Group>

      {/* Shared Screens - accessible from any tab */}
      <RootStack.Group screenOptions={{ animation: 'slide_from_right' }}>
        <RootStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <RootStack.Screen name="BankDetails" component={BankDetailsScreen} />
        <RootStack.Screen name="BankAccounts" component={BankAccountsScreen} />
        <RootStack.Screen name="Categories" component={CategoriesScreen} />
        <RootStack.Screen name="Calendar" component={CalendarViewScreen} />
        <RootStack.Screen name="Budget" component={BudgetScreen} />
        <RootStack.Screen name="Notifications" component={NotificationScreen} />
        <RootStack.Screen name="Savings" component={SavingsScreen} />
        <RootStack.Screen name="CreateSavingsJar" component={CreateSavingsJarScreen} />
        <RootStack.Screen name="SavingsDetails" component={SavingsDetailsScreen} />
        <RootStack.Screen name="Deposit" component={DepositScreen} />
        <RootStack.Screen name="Withdraw" component={WithdrawScreen} />
        <RootStack.Screen name="Transfer" component={TransferScreen} />
        <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
        <RootStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <RootStack.Screen name="PaymentFailed" component={PaymentFailedScreen} />
        <RootStack.Screen name="PremiumFeatures" component={PremiumFeaturesScreen} />
      </RootStack.Group>

      {/* Modal Screens - slide up from bottom */}
      <RootStack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
        <RootStack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <RootStack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
        <RootStack.Screen name="ReceiptImport" component={ReceiptImportScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
};

export default RootNavigator;
