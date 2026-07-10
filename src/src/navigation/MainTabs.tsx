import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Colors, Typography } from '../theme';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();

const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
    <DashboardStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </DashboardStack.Navigator>
);

const TransactionsStackScreen = () => (
  <TransactionsStack.Navigator screenOptions={{ headerShown: false }}>
    <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
    <TransactionsStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <TransactionsStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </TransactionsStack.Navigator>
);

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsStackScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Icon name="swap-horizontal-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
    elevation: 0,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
});

export default MainTabs;
