import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export const formatDate = (date) => {
  const d = dayjs(date);
  if (d.isToday()) return 'Today';
  if (d.isYesterday()) return 'Yesterday';
  return d.format('DD MMM YYYY');
};

export const formatDateTime = (date) => {
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const formatMonthName = (monthNumber) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[monthNumber - 1] || '';
};

export const formatRelative = (date) => {
  return dayjs(date).fromNow();
};

export const getDateString = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};
