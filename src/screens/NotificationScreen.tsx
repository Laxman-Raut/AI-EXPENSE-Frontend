import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotifications,
  AppNotification,
} from '../services/notificationStorage';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No notifications yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>

              <Text style={styles.body}>
                {item.body}
              </Text>

              <Text style={styles.time}>
                {item.time}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },

  heading: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },

  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  body: {
    color: '#CBD5E1',
    marginTop: 8,
  },

  time: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 12,
  },
});