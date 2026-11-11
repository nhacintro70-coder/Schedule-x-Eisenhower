import { DateInfo } from '../types';

export const DAYS_VN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const getFormattedDateInfo = (baseDate: Date = new Date()): DateInfo => {
  const today = new Date(baseDate);
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(today.getDate() + 1);

  const formatShort = (d: Date) => {
    const dayName = DAYS_VN[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dayName}, ${dd}/${mm}`;
  };

  const formatFullClock = (d: Date) => {
    const dayName = DAYS_VN[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${dayName}, ${dd}/${mm}/${yyyy} • ${hh}:${min}:${sec}`;
  };

  const getDayKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    todayLabel: `Hôm nay (${formatShort(today)})`,
    tomorrowLabel: `Ngày mai (${formatShort(tomorrow)})`,
    todayShort: formatShort(today),
    tomorrowShort: formatShort(tomorrow),
    todayDateKey: getDayKey(today),
    fullClock: formatFullClock(today)
  };
};
