import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Typography } from '../../theme';

const { width } = Dimensions.get('window');

const CalendarModal = ({ visible, onClose, onSelect, selectedValue }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    if (visible) {
      const initialDate = selectedValue ? dayjs(selectedValue) : dayjs();
      const validDate = initialDate.isValid() ? initialDate : dayjs();
      setSelectedDate(validDate);
      setCurrentMonth(validDate.startOf('month'));
    }
  }, [visible, selectedValue]);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onSelect(selectedDate.format('YYYY-MM-DD'));
    onClose();
  };

  // Generate calendar days
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = currentMonth.startOf('month').day(); // 0 (Sunday) to 6 (Saturday)

  const cells = [];
  // Add empty placeholders for the offset
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ id: `empty-${i}`, isPlaceholder: true });
  }
  // Add actual days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = currentMonth.date(i);
    cells.push({
      id: `day-${i}`,
      date,
      dayNum: i,
      isPlaceholder: false,
    });
  }

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Calendar Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <Icon name="chevron-back-outline" size={20} color={Colors.textPrimary || '#F8FAFC'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentMonth.format('MMMM YYYY')}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <Icon name="chevron-forward-outline" size={20} color={Colors.textPrimary || '#F8FAFC'} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdaysContainer}>
            {weekdays.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {cells.map((cell) => {
              if (cell.isPlaceholder) {
                return <View key={cell.id} style={styles.cell} />;
              }

              const isSelected = selectedDate.isSame(cell.date, 'day');
              const isToday = dayjs().isSame(cell.date, 'day');

              return (
                <TouchableOpacity
                  key={cell.id}
                  style={[
                    styles.cell,
                    isSelected && styles.selectedCell,
                    isToday && !isSelected && styles.todayCell,
                  ]}
                  onPress={() => handleDateSelect(cell.date)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.cellText,
                      isSelected && styles.selectedCellText,
                      isToday && !isSelected && styles.todayCellText,
                    ]}>
                    {cell.dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay || 'rgba(2, 3, 6, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl || 24,
  },
  container: {
    width: Math.min(width - 48, 360),
    backgroundColor: Colors.surface || '#0A0E1A',
    borderRadius: Spacing.borderRadius || 16,
    borderWidth: 1,
    borderColor: Colors.border || 'rgba(138, 63, 252, 0.15)',
    padding: Spacing.base || 16,
    shadowColor: Colors.primary || '#8A3FFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base || 16,
  },
  navButton: {
    padding: Spacing.sm || 8,
    borderRadius: Spacing.borderRadiusSmall || 12,
    backgroundColor: Colors.surfaceLight || '#141A2D',
    borderWidth: 1,
    borderColor: Colors.border || 'rgba(138, 63, 252, 0.15)',
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary || '#F8FAFC',
    fontWeight: '700',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm || 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || 'rgba(138, 63, 252, 0.15)',
    paddingBottom: Spacing.xs || 4,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    ...Typography.caption,
    color: Colors.textMuted || '#64748B',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.base || 16,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  cellText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary || '#94A3B8',
    fontWeight: '500',
  },
  selectedCell: {
    backgroundColor: Colors.primary || '#8A3FFC',
    shadowColor: Colors.primary || '#8A3FFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCellText: {
    color: Colors.textPrimary || '#F8FAFC',
    fontWeight: '700',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: Colors.primaryLight || '#A767FF',
  },
  todayCellText: {
    color: Colors.primaryLight || '#A767FF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border || 'rgba(138, 63, 252, 0.15)',
    paddingTop: Spacing.base || 16,
    gap: Spacing.sm || 8,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm || 8,
    paddingHorizontal: Spacing.base || 16,
    borderRadius: Spacing.borderRadiusSmall || 12,
  },
  cancelBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.textSecondary || '#94A3B8',
  },
  confirmBtn: {
    backgroundColor: Colors.primary || '#8A3FFC',
    paddingVertical: Spacing.sm || 8,
    paddingHorizontal: Spacing.base || 16,
    borderRadius: Spacing.borderRadiusSmall || 12,
    shadowColor: Colors.primary || '#8A3FFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.textPrimary || '#F8FAFC',
  },
});

export default CalendarModal;
