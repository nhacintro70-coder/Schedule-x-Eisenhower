import { SlotStatus } from '../types';

/**
 * Phân tích chuỗi giờ như "09:40 - 11:00", "20:00 - 21:00", "21:00"
 * Trả về số phút kể từ 00:00 (startMinutes, endMinutes)
 */
export const parseSlotTimeRange = (timeStr: string): { startMinutes: number; endMinutes: number } | null => {
  if (!timeStr) return null;

  // Tìm các cụm HH:MM hoặc HHhMM hoặc HH
  const matches = timeStr.match(/(\d{1,2})([:h](\d{2}))?/gi);
  if (!matches || matches.length === 0) return null;

  const parseToMinutes = (part: string): number => {
    const clean = part.replace(/h/i, ':');
    if (!clean.includes(':')) {
      const h = parseInt(clean, 10) || 0;
      return h * 60;
    }
    const [hStr, mStr] = clean.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    return h * 60 + m;
  };

  const startMinutes = parseToMinutes(matches[0]);
  const endMinutes = matches.length > 1 ? parseToMinutes(matches[1]) : startMinutes + 60; // Mặc định 60 phút nếu chỉ có 1 mốc

  return { startMinutes, endMinutes };
};

/**
 * BỘ CHUẨN HÓA THỜI GIAN THÔNG MINH (SMART TIME NORMALIZER)
 * Tự động chuyển đổi các dạng gõ tắt của người Việt thành chuẩn "HH:mm - HH:mm"
 * Ví dụ:
 * - "21" hoặc "21h" -> "21:00 - 22:00"
 * - "21h30" -> "21:30 - 22:30"
 * - "20-21" hoặc "20h-21h" -> "20:00 - 21:00"
 * - "8-9" hoặc "8h-9h" (nếu nhập vào buổi chiều/tối) -> "20:00 - 21:00"
 */
export const normalizeTimeString = (rawInput: string, now: Date = new Date()): string => {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const isExplicitEvening =
    lower.includes('tối') || lower.includes('chiều') || lower.includes('đêm') || lower.includes('pm');
  const isExplicitMorning =
    lower.includes('sáng') || lower.includes('am') || lower.includes('trưa');

  // Ngữ cảnh buổi tối: chỉ tính từ 17:00 chiều tối trở đi
  const isCurrentlyEvening = now.getHours() >= 17;

  // Loại bỏ các từ khóa tiếng Việt để trích xuất số
  const cleanStr = lower
    .replace(/(buổi\s*)?(tối|chiều|sáng|trưa|đêm|pm|am)/g, '')
    .trim();

  // Tìm các phần tử số hoặc giờ (hỗ trợ phân tách bằng -, –, —, đến, tới, ->)
  const parts = cleanStr.split(/\s*(?:[-–—]|->|đến|tới)\s*/i).map((s) => s.trim()).filter(Boolean);

  const parseComponent = (part: string): { hour: number; minute: number; hasColon: boolean } | null => {
    if (!part) return null;

    let hour = 0;
    let minute = 0;
    const hasColon = part.includes(':');

    if (hasColon || part.includes('h')) {
      const separator = hasColon ? ':' : 'h';
      const [hPart, mPart] = part.split(separator);
      hour = parseInt(hPart, 10) || 0;
      minute = parseInt(mPart, 10) || 0;
    } else {
      // Chỉ có số trần, vd: "20", "8"
      hour = parseInt(part, 10) || 0;
      minute = 0;
    }

    // NGUYÊN TẮC CHUYỂN 12H -> 24H:
    // 1. Nếu có viết chữ rõ ràng "tối", "chiều", "đêm", "pm" -> +12h (trừ 12h)
    if (isExplicitEvening && hour < 12) {
      hour += 12;
    }
    // 2. Nếu KHÔNG nói sáng/trưa và KHÔNG dùng định dạng dấu hai chấm ":" chuẩn (chỉ gõ tắt 8h, 8-9h)
    //    thì chỉ tự động +12h cho các số giờ tối phổ biến (6h đến 10h tối: 18h - 22h).
    //    Tuyệt đối KHÔNG tự đổi 11h hay 12h (vì 11h, 12h trong sinh hoạt/học tập luôn là giờ trưa).
    else if (!isExplicitMorning && !hasColon && isCurrentlyEvening) {
      if (hour >= 6 && hour <= 10) {
        hour += 12; // 8h -> 20h, 9h -> 21h
      }
    }

    // Đảm bảo không quá 23:59
    if (hour > 23) hour = 23;
    if (minute > 59) minute = 59;

    return { hour, minute, hasColon };
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  if (parts.length >= 2) {
    const start = parseComponent(parts[0]);
    const end = parseComponent(parts[1]);

    if (start && end) {
      // Kiểm tra hợp lý logic thời gian:
      // Nếu start > end mà start vô tình bị cộng thành giờ đêm (ví dụ start=23, end=14)
      if (start.hour > end.hour && start.hour > 12 && start.hour - 12 <= end.hour) {
        start.hour -= 12; // Hoàn tác: 23h -> 11h để thành 11:00 - 14:00 chuẩn xác
      } else if (end.hour < start.hour && end.hour + 12 <= 23 && !end.hasColon) {
        end.hour += 12; // ví dụ 20h - 9h -> 20:00 - 21:00
      }

      return `${pad(start.hour)}:${pad(start.minute)} - ${pad(end.hour)}:${pad(end.minute)}`;
    }
  } else if (parts.length === 1) {
    const start = parseComponent(parts[0]);
    if (start) {
      // Nếu chỉ nhập 1 mốc, mặc định kết thúc sau 1 tiếng
      let endHour = start.hour + 1;
      let endMinute = start.minute;
      if (endHour > 23) endHour = 23;
      return `${pad(start.hour)}:${pad(start.minute)} - ${pad(endHour)}:${pad(endMinute)}`;
    }
  }

  return trimmed;
};

/**
 * Xác định trạng thái của khung giờ theo thời gian thực (Giờ hiện tại của máy)
 * Hỗ trợ MIỄN NHIỄM cho Khung Sinh Hoạt (Ăn uống / Nghỉ ngơi)
 */
export const getSlotStatus = (
  timeStr: string,
  completed: boolean,
  isToday: boolean,
  isRoutine: boolean = false,
  now: Date = new Date()
): SlotStatus => {
  if (completed) return 'completed';
  if (!isToday) return 'upcoming'; // Ngày mai thì luôn là sắp tới

  const parsed = parseSlotTimeRange(timeStr);
  if (!parsed) return 'upcoming';

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < parsed.startMinutes) {
    return 'upcoming';
  } else if (currentMinutes >= parsed.startMinutes && currentMinutes <= parsed.endMinutes) {
    return isRoutine ? 'routine-current' : 'current';
  } else {
    // Đã qua thời gian kết thúc
    return isRoutine ? 'routine-past' : 'overdue';
  }
};

/**
 * Tính thời gian đếm ngược thực tế cho từng khung giờ riêng biệt
 * - Nếu chưa tới giờ: Đếm ngược tới giờ bắt đầu
 * - Nếu đang diễn ra: Đếm ngược tới giờ kết thúc
 * - Nếu đã qua hoặc ngày mai: Trả về null
 */
export const getSlotCountdown = (
  timeStr: string,
  isToday: boolean,
  now: Date = new Date()
): string | null => {
  if (!isToday || !timeStr) return null;
  const parsed = parseSlotTimeRange(timeStr);
  if (!parsed) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  // 1. Chưa tới giờ bắt đầu: Đếm ngược tới startMinutes
  if (currentMinutes < parsed.startMinutes) {
    const totalDiffSeconds = (parsed.startMinutes - currentMinutes) * 60 - currentSeconds;
    if (totalDiffSeconds <= 0) return null;
    const hours = Math.floor(totalDiffSeconds / 3600);
    const mins = Math.floor((totalDiffSeconds % 3600) / 60);
    const secs = totalDiffSeconds % 60;
    return `Còn ${hours > 0 ? `${hours}h ` : ''}${mins}p ${secs}s tới giờ`;
  }

  // 2. Đang trong khung giờ: Đếm ngược tới khi kết thúc
  if (currentMinutes >= parsed.startMinutes && currentMinutes <= parsed.endMinutes) {
    const totalDiffSeconds = (parsed.endMinutes - currentMinutes) * 60 - currentSeconds;
    if (totalDiffSeconds <= 0) return null;
    const hours = Math.floor(totalDiffSeconds / 3600);
    const mins = Math.floor((totalDiffSeconds % 3600) / 60);
    const secs = totalDiffSeconds % 60;
    return `Còn ${hours > 0 ? `${hours}h ` : ''}${mins}p ${secs}s`;
  }

  return null;
};
