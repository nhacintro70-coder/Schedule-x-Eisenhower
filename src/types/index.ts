import { LucideIcon } from 'lucide-react';

export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4';

export interface Task {
  id: string;
  title: string;
  note: string;
  quadrant: QuadrantId;
  completed: boolean;
  carryOver: string;
  urgentAlert: boolean;
}

export type TagColor = 'rose' | 'indigo' | 'amber' | 'emerald' | 'slate';

export type SlotStatus = 'current' | 'upcoming' | 'overdue' | 'completed' | 'routine-past' | 'routine-current';

export interface ScheduleSlot {
  id: string;
  time: string;
  title: string;
  note: string;
  tag: string;
  tagColor: TagColor;
  completed: boolean;
  isUrgentCountdown?: boolean;
  isRoutine?: boolean; // Khung giờ sinh hoạt (ăn uống, nghỉ ngơi) miễn nhiễm cảnh báo & không tính tiến độ ảo
}

export interface ScheduleData {
  today: ScheduleSlot[];
  tomorrow: ScheduleSlot[];
}

export interface RoutineSettings {
  showRoutinesOnSchedule: boolean;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
}

export interface QuadrantConfigItem {
  id: QuadrantId;
  code: string;
  title: string;
  subtitle: string;
  strategy: string;
  icon: LucideIcon;
  border: string;
  dragOverBorder: string;
  bg: string;
  headerBg: string;
  badge: string;
  accentText: string;
  checkboxColor: string;
}

export interface DateInfo {
  todayLabel: string;
  tomorrowLabel: string;
  todayShort: string;
  tomorrowShort: string;
  todayDateKey: string; // YYYY-MM-DD
  fullClock: string;
}

export interface UserProfile {
  name: string;
  isConfigured: boolean;
  routineSettings?: RoutineSettings;
}

export type SyncStatus = 'synced' | 'connecting' | 'error';
