import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CalendarViewScreen from '../screens/calendar/CalendarViewScreen';
import { Colors } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();

const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
    <DashboardStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <DashboardStack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </DashboardStack.Navigator>
);

const TransactionsStackScreen = () => (
  <TransactionsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
    <TransactionsStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <TransactionsStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </TransactionsStack.Navigator>
);

interface CustomTabBarButtonProps {
  children?: React.ReactNode;
  onPress?: (e: any) => void;
}

const CustomTabBarButton: React.FC<CustomTabBarButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.customTabButtonContainer}
    activeOpacity={0.8}
    onPress={onPress}>
    <View style={styles.customTabButton}>
      <Icon name="add" size={28} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Match mockup (only icons, no labels)
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'android' ? 70 : 55 + insets.bottom,
            paddingBottom: Platform.OS === 'android' ? 12 : insets.bottom,
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
          },
        ],
        tabBarActiveTintColor: Colors.mockupOrange,
        tabBarInactiveTintColor: Colors.textMuted,
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'card' : 'card-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="AddTransactionTab"
        component={AddTransactionScreen}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarViewScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  customTabButtonContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF6037', // Mockup orange accent
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default MainTabs;
