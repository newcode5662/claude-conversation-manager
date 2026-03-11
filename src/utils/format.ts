import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    return '昨天';
  }

  return format(date, 'MM月dd日', { locale: zhCN });
}

export function formatDateTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
}

export function formatFullDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`;
  }
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
