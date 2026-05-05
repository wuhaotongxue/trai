/**
 * time_utils.ts
 * i18n 时间工具函数(中文本地化规范)
 * - Intl.DateTimeFormat: 2026年4月10日 下午 3:30
 * - 自然相对时间: 刚刚 / 3 分钟前 / 2 天后
 */

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatShortDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("zh-CN").format(num);
}

export function formatPercent(num: number, decimals = 1): string {
  return `${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num * 100)}%`;
}

export function formatCurrency(amount: number, currency = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) {
    return diffSec >= 0 ? "刚刚" : "刚刚";
  }
  if (Math.abs(diffMin) < 60) {
    const abs = Math.abs(diffMin);
    return diffMin >= 0 ? `${abs} 分钟后` : `${abs} 分钟前`;
  }
  if (Math.abs(diffHour) < 24) {
    const abs = Math.abs(diffHour);
    return diffHour >= 0 ? `${abs} 小时后` : `${abs} 小时前`;
  }
  if (Math.abs(diffDay) < 30) {
    const abs = Math.abs(diffDay);
    return diffDay >= 0 ? `${abs} 天后` : `${abs} 天前`;
  }
  return formatDate(d);
}

export function getRelativeTimeLabel(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return formatDate(d);
}

