import { Task, ScheduleData, UserProfile, RoutineSettings } from '../types';
import { INITIAL_TASKS, INITIAL_SCHEDULE, INITIAL_AI_MESSAGE } from '../constants/initialData';

const STORAGE_KEYS = {
  PROFILE: 'eisenhower_user_profile',
  TASKS: 'eisenhower_tasks',
  SCHEDULE: 'eisenhower_schedule',
  AI_MESSAGE: 'eisenhower_ai_message',
  API_KEY: 'eisenhower_gemini_api_key',
  LAST_DATE: 'eisenhower_last_active_date'
};

export const DEFAULT_ROUTINE_SETTINGS: RoutineSettings = {
  showRoutinesOnSchedule: true,
  lunchTime: '11:30 - 13:30',
  dinnerTime: '18:30 - 19:30',
  sleepTime: '23:00 - 07:00'
};

export const sanitizeRoutineSettings = (settings?: RoutineSettings): RoutineSettings => {
  if (!settings) return DEFAULT_ROUTINE_SETTINGS;
  let lunchTime = settings.lunchTime || DEFAULT_ROUTINE_SETTINGS.lunchTime;
  let dinnerTime = settings.dinnerTime || DEFAULT_ROUTINE_SETTINGS.dinnerTime;

  // Kiểm tra nếu giờ ăn trưa bị đảo ngược do lỗi cũ (ví dụ 23:00 - 14:00)
  if (lunchTime.includes('23:') || lunchTime.startsWith('23')) {
    lunchTime = '11:30 - 13:30';
  }

  return {
    showRoutinesOnSchedule: settings.showRoutinesOnSchedule ?? true,
    lunchTime,
    dinnerTime,
    sleepTime: settings.sleepTime || DEFAULT_ROUTINE_SETTINGS.sleepTime
  };
};

export const BLANK_TASKS: Task[] = [];

export const createBlankScheduleWithRoutines = (routines: RoutineSettings = DEFAULT_ROUTINE_SETTINGS): ScheduleData => {
  if (!routines.showRoutinesOnSchedule) {
    return { today: [], tomorrow: [] };
  }

  const defaultRoutineSlots = [
    {
      id: 'routine-lunch-today',
      time: routines.lunchTime,
      title: 'Ăn trưa & Nghỉ ngơi',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate' as const,
      completed: false,
      isRoutine: true
    },
    {
      id: 'routine-dinner-today',
      time: routines.dinnerTime,
      title: 'Ăn tối & Thư giãn',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate' as const,
      completed: false,
      isRoutine: true
    }
  ];

  const defaultRoutineSlotsTomorrow = [
    {
      id: 'routine-lunch-tomorrow',
      time: routines.lunchTime,
      title: 'Ăn trưa & Nghỉ ngơi',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate' as const,
      completed: false,
      isRoutine: true
    },
    {
      id: 'routine-dinner-tomorrow',
      time: routines.dinnerTime,
      title: 'Ăn tối & Thư giãn',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate' as const,
      completed: false,
      isRoutine: true
    }
  ];

  return {
    today: defaultRoutineSlots,
    tomorrow: defaultRoutineSlotsTomorrow
  };
};

export const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        routineSettings: sanitizeRoutineSettings(parsed.routineSettings)
      };
    }

    // Nếu chưa có profile nhưng máy người dùng ĐÃ CÓ lưu danh sách công việc trước đó:
    // Tự động giữ nguyên trạng thái để không làm mất dữ liệu người dùng đang dùng
    const existingTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (existingTasks) {
      return {
        name: 'Bạn',
        isConfigured: true,
        routineSettings: DEFAULT_ROUTINE_SETTINGS
      };
    }
  } catch (e) {
    console.error('Lỗi đọc User Profile:', e);
  }
  return {
    name: 'Bạn',
    isConfigured: false,
    routineSettings: DEFAULT_ROUTINE_SETTINGS
  };
};

export const saveStoredProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Lỗi lưu User Profile:', e);
  }
};

export const getStoredAppData = (): {
  tasks: Task[];
  schedule: ScheduleData;
  lastAiMessage: string;
  customApiKey: string;
  lastActiveDate: string | null;
} => {
  try {
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const rawSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    const rawAiMessage = localStorage.getItem(STORAGE_KEYS.AI_MESSAGE);
    const rawApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);

    return {
      tasks: rawTasks ? JSON.parse(rawTasks) : INITIAL_TASKS,
      schedule: rawSchedule ? JSON.parse(rawSchedule) : INITIAL_SCHEDULE,
      lastAiMessage: rawAiMessage || INITIAL_AI_MESSAGE,
      customApiKey: rawApiKey || '',
      lastActiveDate
    };
  } catch (e) {
    console.error('Lỗi đọc localStorage:', e);
    return {
      tasks: INITIAL_TASKS,
      schedule: INITIAL_SCHEDULE,
      lastAiMessage: INITIAL_AI_MESSAGE,
      customApiKey: '',
      lastActiveDate: null
    };
  }
};

export const saveStoredAppData = (
  tasks: Task[],
  schedule: ScheduleData,
  lastAiMessage?: string,
  customApiKey?: string,
  lastActiveDate?: string
): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    if (lastAiMessage !== undefined) localStorage.setItem(STORAGE_KEYS.AI_MESSAGE, lastAiMessage);
    if (customApiKey !== undefined) localStorage.setItem(STORAGE_KEYS.API_KEY, customApiKey);
    if (lastActiveDate !== undefined) localStorage.setItem(STORAGE_KEYS.LAST_DATE, lastActiveDate);
  } catch (e) {
    console.error('Lỗi ghi localStorage:', e);
  }
};
