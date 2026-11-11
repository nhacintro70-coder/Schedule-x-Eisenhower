import { ScheduleSlot, ScheduleData, DateInfo } from '../types';
import { parseSlotTimeRange } from '../utils/timeUtils';

// Định danh key lưu trữ Client ID & Client ID mặc định của hệ thống
export const GOOGLE_CLIENT_ID_KEY = 'eisenhower_google_client_id';
export const DEFAULT_GOOGLE_CLIENT_ID = '388646801304-rbmad5a2jdbnodjm7i0ivotvkjqks4uq.apps.googleusercontent.com';

export const getStoredGoogleClientId = (): string => {
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || DEFAULT_GOOGLE_CLIENT_ID;
};

export const saveStoredGoogleClientId = (clientId: string): void => {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
};

// Ánh xạ màu từ Eisenhower sang Google Calendar ColorId (1 - 11)
// 11: Tomato/Đỏ (P1), 9: Blueberry/Xanh biển (P2), 5: Banana/Vàng (P3), 10: Basil/Xanh lá (P4), 8: Graphite/Xám (Sinh hoạt)
export const mapTagColorToGoogleColor = (tagColor: string): string => {
  switch (tagColor) {
    case 'rose':
      return '11'; // Đỏ nổi bật cho P1
    case 'indigo':
      return '9'; // Xanh lam cho P2
    case 'amber':
      return '5'; // Vàng cho P3
    case 'emerald':
      return '10'; // Xanh lá cho P4
    case 'slate':
    default:
      return '8'; // Xám than cho Sinh hoạt
  }
};

/**
 * Tạo URL Deep Link (Web Intent) mở thẳng trang tạo sự kiện của Google Calendar
 * Hoạt động 100% không cần cài đặt API hay Client ID!
 */
export const createGoogleCalendarWebIntentUrl = (
  slot: ScheduleSlot,
  dateStr: string // YYYY-MM-DD
): string => {
  const parsed = parseSlotTimeRange(slot.time);
  const cleanDate = dateStr.replace(/-/g, '');

  let startIso = `${cleanDate}T090000`;
  let endIso = `${cleanDate}T100000`;

  if (parsed) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const startH = Math.floor(parsed.startMinutes / 60);
    const startM = parsed.startMinutes % 60;
    const endH = Math.floor(parsed.endMinutes / 60);
    const endM = parsed.endMinutes % 60;

    startIso = `${cleanDate}T${pad(startH)}${pad(startM)}00`;
    endIso = `${cleanDate}T${pad(endH)}${pad(endM)}00`;
  }

  const title = encodeURIComponent(`${slot.title} [${slot.tag}]`);
  const details = encodeURIComponent(
    `${slot.note ? `${slot.note}\n\n` : ''}Được lên lịch tự động từ ứng dụng Eisenhower Schedule.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startIso}/${endIso}`;
};

/**
 * Tải động thư viện Google Identity Services (GIS)
 */
export const loadGoogleIdentityScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.onload = () => resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Yêu cầu Access Token từ người dùng thông qua Google Identity Services Popup
 */
export const requestGoogleAccessToken = async (clientId: string): Promise<string> => {
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Không nhận được Access Token từ Google.'));
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Đẩy một sự kiện lên Google Calendar thông qua REST API
 */
export const pushEventToGoogleCalendar = async (
  slot: ScheduleSlot,
  dateStr: string, // YYYY-MM-DD
  accessToken: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
): Promise<any> => {
  const parsed = parseSlotTimeRange(slot.time);
  const pad = (n: number) => String(n).padStart(2, '0');

  let startDateTime = `${dateStr}T09:00:00`;
  let endDateTime = `${dateStr}T10:00:00`;

  if (parsed) {
    const startH = Math.floor(parsed.startMinutes / 60);
    const startM = parsed.startMinutes % 60;
    const endH = Math.floor(parsed.endMinutes / 60);
    const endM = parsed.endMinutes % 60;

    startDateTime = `${dateStr}T${pad(startH)}:${pad(startM)}:00`;
    endDateTime = `${dateStr}T${pad(endH)}:${pad(endM)}:00`;
  }

  const eventPayload = {
    summary: `${slot.title} [${slot.tag}]`,
    description: `${slot.note ? `${slot.note}\n\n` : ''}Được lên lịch tự động từ ứng dụng Eisenhower Schedule.`,
    colorId: mapTagColorToGoogleColor(slot.tagColor),
    start: {
      dateTime: startDateTime,
      timeZone
    },
    end: {
      dateTime: endDateTime,
      timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 5 }
      ]
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

/**
 * Đồng bộ toàn bộ danh sách ScheduleSlot lên Google Calendar
 */
export const syncSlotsToGoogleCalendarApi = async (
  slots: ScheduleSlot[],
  dateStr: string,
  accessToken: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    try {
      await pushEventToGoogleCalendar(slot, dateStr, accessToken);
      success++;
    } catch (e) {
      console.error(`Lỗi đẩy sự kiện "${slot.title}" lên Google Calendar:`, e);
      failed++;
    }
    if (onProgress) {
      onProgress(i + 1, slots.length);
    }
    // Nghỉ nhẹ 100ms giữa các request để tránh rate-limit
    await new Promise((r) => setTimeout(r, 100));
  }

  return { success, failed };
};

/**
 * Tạo và tải xuống file lịch tiêu chuẩn .ics (iCalendar)
 * Dùng làm phương án dự phòng 1-click cho mọi trường hợp
 */
export const exportScheduleToIcsFile = (
  schedule: ScheduleData,
  dateInfo: DateInfo
): void => {
  const pad = (n: number) => String(n).padStart(2, '0');

  const formatIcsDate = (dateStr: string, minutes: number) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${cleanDate}T${pad(h)}${pad(m)}00`;
  };

  // Tính dateStr cho ngày mai
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const getDayKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayKey = dateInfo.todayDateKey || getDayKey(today);
  const tomorrowKey = getDayKey(tomorrow);

  const events: string[] = [];

  const addSlotsToEvents = (slots: ScheduleSlot[], dayKey: string) => {
    slots.forEach((slot) => {
      const parsed = parseSlotTimeRange(slot.time);
      const startMin = parsed ? parsed.startMinutes : 9 * 60;
      const endMin = parsed ? parsed.endMinutes : 10 * 60;

      const dtStart = formatIcsDate(dayKey, startMin);
      const dtEnd = formatIcsDate(dayKey, endMin);
      const uid = `eisenhower-${slot.id}-${Date.now()}@eisenhower-schedule.local`;

      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `SUMMARY:${slot.title} [${slot.tag}]`,
          `DESCRIPTION:${slot.note || ''} (Tạo tự động từ Eisenhower Schedule)`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Nhắc nhở công việc',
          'END:VALARM',
          'END:VEVENT'
        ].join('\r\n')
      );
    });
  };

  addSlotsToEvents(schedule.today || [], todayKey);
  addSlotsToEvents(schedule.tomorrow || [], tomorrowKey);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eisenhower Schedule Web//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lich-trinh-eisenhower-${todayKey}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
