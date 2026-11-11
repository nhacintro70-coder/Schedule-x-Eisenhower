import { useState, useEffect } from 'react';
import { Task, ScheduleData, QuadrantId, TagColor, UserProfile, RoutineSettings } from './types';
import { QUADRANT_CONFIG } from './constants/quadrantConfig';
import { getFormattedDateInfo } from './utils/dateUtils';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredAppData,
  saveStoredAppData,
  DEFAULT_ROUTINE_SETTINGS,
  BLANK_TASKS,
  createBlankScheduleWithRoutines
} from './services/storage';
import { callGeminiWithBackoff, createAiPromptPayload } from './services/gemini';

import { Header } from './components/Header';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { AiCommandBar } from './components/AiCommandBar';
import { ManualAddTaskForm } from './components/ManualAddTaskForm';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { TimelineSchedule } from './components/TimelineSchedule';

export default function App() {
  // Real-time Date & Clock
  const [nowDate, setNowDate] = useState(() => new Date());
  const dateInfo = getFormattedDateInfo(nowDate);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredProfile());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !getStoredProfile().isConfigured);

  // App Data (Loaded from LocalStorage)
  const initialData = getStoredAppData();
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [schedule, setSchedule] = useState<ScheduleData>(initialData.schedule);
  const [lastAiMessage, setLastAiMessage] = useState<string>(initialData.lastAiMessage);
  const [customApiKey, setCustomApiKey] = useState<string>(initialData.customApiKey);
  const [lastActiveDate, setLastActiveDate] = useState<string>(initialData.lastActiveDate || dateInfo.todayDateKey);

  // Modals & UI states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGoogleCalendarModal, setShowGoogleCalendarModal] = useState(false);
  const [showManualAddTask, setShowManualAddTask] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const routineSettings = userProfile.routineSettings || DEFAULT_ROUTINE_SETTINGS;

  // Đồng hồ chạy thời gian thực mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. TỰ ĐỘNG CHUYỂN NGÀY & DỒN VIỆC (AUTOMATIC OVERNIGHT ROLLOVER)
  useEffect(() => {
    const currentKey = dateInfo.todayDateKey;
    if (lastActiveDate && lastActiveDate !== currentKey) {
      // Đã bước sang ngày mới! Tự động quét các việc chưa xong hôm qua (loại trừ khung giờ sinh hoạt)
      const incompleteYesterday = (schedule.today || []).filter(
        (s) => !s.completed && !s.isRoutine && s.tag !== 'Nghỉ ngơi' && s.tag !== 'Sinh hoạt'
      );

      if (incompleteYesterday.length > 0) {
        const carriedOverSlots = incompleteYesterday.map((s, idx) => ({
          ...s,
          id: 'sch-auto-rollover-' + Date.now() + '-' + idx,
          note: `[Chưa xong hôm qua - Tự động dồn] ${s.note || ''}`,
          completed: false
        }));

        // Đôn lịch tomorrow hôm qua lên thành today hôm nay + kèm các việc chưa xong
        const newToday = [...(schedule.tomorrow || []), ...carriedOverSlots];
        const newSchedule: ScheduleData = {
          today: newToday,
          tomorrow: []
        };

        const newAiMsg = `🌅 Chào ngày mới ${userProfile.name}! Hệ thống đã tự động dồn ${incompleteYesterday.length} việc chưa hoàn thành từ hôm qua sang lịch trình hôm nay cho bạn!`;

        setSchedule(newSchedule);
        setLastAiMessage(newAiMsg);
        setLastActiveDate(currentKey);
        saveStoredAppData(tasks, newSchedule, newAiMsg, customApiKey, currentKey);
      } else {
        setLastActiveDate(currentKey);
        saveStoredAppData(tasks, schedule, lastAiMessage, customApiKey, currentKey);
      }
    }
  }, [dateInfo.todayDateKey, lastActiveDate]);

  // Hàm lưu trạng thái đồng bộ vào LocalStorage
  const updateAndSaveState = (
    newTasks: Task[],
    newSchedule: ScheduleData,
    newMsg = lastAiMessage,
    newKey = customApiKey
  ) => {
    setTasks(newTasks);
    setSchedule(newSchedule);
    if (newMsg) setLastAiMessage(newMsg);
    if (newKey !== undefined) setCustomApiKey(newKey);

    saveStoredAppData(newTasks, newSchedule, newMsg, newKey, lastActiveDate);
  };

  // Cập nhật tên người dùng
  const handleUpdateUserName = (newName: string) => {
    const updated: UserProfile = { ...userProfile, name: newName, isConfigured: true };
    setUserProfile(updated);
    saveStoredProfile(updated);
  };

  // Cập nhật nhịp sinh hoạt
  const handleSaveRoutineSettings = (newRoutineSettings: RoutineSettings) => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      routineSettings: newRoutineSettings
    };
    setUserProfile(updatedProfile);
    saveStoredProfile(updatedProfile);

    // Xử lý bật/tắt hiển thị sinh hoạt trên lịch trình hiện tại
    if (!newRoutineSettings.showRoutinesOnSchedule) {
      // Tắt: ẩn các slot sinh hoạt
      const filteredSchedule: ScheduleData = {
        today: (schedule.today || []).filter((s) => !s.isRoutine && s.tag !== 'Sinh hoạt' && s.tag !== 'Nghỉ ngơi'),
        tomorrow: (schedule.tomorrow || []).filter((s) => !s.isRoutine && s.tag !== 'Sinh hoạt' && s.tag !== 'Nghỉ ngơi')
      };
      updateAndSaveState(tasks, filteredSchedule, 'Đã ẩn nhịp sinh hoạt khỏi Thời khóa biểu!');
    } else {
      // Bật: cập nhật hoặc bổ sung khung giờ ăn/nghỉ
      const ensureRoutines = (slots: typeof schedule.today) => {
        const withoutRoutines = slots.filter((s) => !s.isRoutine && s.tag !== 'Sinh hoạt' && s.tag !== 'Nghỉ ngơi');
        return [
          ...withoutRoutines,
          {
            id: 'routine-lunch-' + Date.now(),
            time: newRoutineSettings.lunchTime,
            title: 'Ăn trưa & Nghỉ ngơi',
            note: 'Khung giờ sinh hoạt cố định',
            tag: 'Sinh hoạt',
            tagColor: 'slate' as const,
            completed: false,
            isRoutine: true
          },
          {
            id: 'routine-dinner-' + Date.now(),
            time: newRoutineSettings.dinnerTime,
            title: 'Ăn tối & Thư giãn',
            note: 'Khung giờ sinh hoạt cố định',
            tag: 'Sinh hoạt',
            tagColor: 'slate' as const,
            completed: false,
            isRoutine: true
          }
        ];
      };

      const updatedSchedule: ScheduleData = {
        today: ensureRoutines(schedule.today || []),
        tomorrow: ensureRoutines(schedule.tomorrow || [])
      };
      updateAndSaveState(tasks, updatedSchedule, 'Đã cập nhật nhịp sinh hoạt vào Thời khóa biểu!');
    }
  };

  // Hoàn tất Onboarding lần đầu: Lưu tên người dùng & bảo toàn dữ liệu hiện có
  const handleCompleteOnboarding = (name: string) => {
    const updatedProfile: UserProfile = {
      name,
      isConfigured: true,
      routineSettings: routineSettings || DEFAULT_ROUTINE_SETTINGS
    };
    setUserProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    setShowOnboarding(false);

    // Nếu người dùng đã có công việc hoặc lịch trình sẵn có trong máy, giữ nguyên 100% không ghi đè!
    if (tasks.length > 0 || (schedule.today && schedule.today.length > 2)) {
      updateAndSaveState(
        tasks,
        schedule,
        `Chào mừng ${name}! Lịch trình hiện tại của bạn đã được bảo toàn nguyên vẹn.`
      );
    } else {
      const blankSchedule = createBlankScheduleWithRoutines(DEFAULT_ROUTINE_SETTINGS);
      updateAndSaveState(
        BLANK_TASKS,
        blankSchedule,
        `Chào mừng ${name}! Bảng làm việc cá nhân của bạn đã sẵn sàng. Hãy bấm nút thêm việc hoặc nhập yêu cầu để bắt đầu!`
      );
    }
  };

  // Làm mới về bảng trắng từ Cài đặt
  const handleClearToBlank = () => {
    const blankSchedule = createBlankScheduleWithRoutines(routineSettings);
    updateAndSaveState(BLANK_TASKS, blankSchedule, 'Đã xóa trắng lịch trình. Bạn có thể tự do lên kế hoạch mới!');
  };

  // Nút bấm "⚡ Đẩy việc chưa xong" thủ công
  const handleAutoCarryOver = () => {
    const incompleteTodaySlots = (schedule.today || []).filter(
      (s) => !s.completed && !s.isRoutine && s.tag !== 'Nghỉ ngơi' && s.tag !== 'Sinh hoạt'
    );

    const updatedTasks = tasks.map((t) => {
      if (!t.completed) {
        return {
          ...t,
          carryOver: t.carryOver || `Đẩy sang ${dateInfo.todayShort}`,
          urgentAlert: t.quadrant === 'q1'
        };
      }
      return { ...t, urgentAlert: false };
    });

    const existingTomorrowTitles = new Set((schedule.tomorrow || []).map((s) => s.title));
    const carriedSlotsForTomorrow = incompleteTodaySlots
      .filter((s) => !existingTomorrowTitles.has(s.title) && !s.title.includes('STEEP'))
      .map((s, idx) => ({
        ...s,
        id: 'sch-carry-' + Date.now() + '-' + idx,
        time: idx === 0 ? '14:00 - 15:30' : '16:00 - 17:30',
        note: `[Đẩy từ ${dateInfo.todayShort}] ${s.note || ''}`
      }));

    const updatedSchedule: ScheduleData = {
      ...schedule,
      tomorrow: [...(schedule.tomorrow || []), ...carriedSlotsForTomorrow]
    };

    updateAndSaveState(
      updatedTasks,
      updatedSchedule,
      `⚡ Chế độ "Kẻ bám đuổi" đã kích hoạt! Toàn bộ việc chưa hoàn thành đã được dồn vào lịch ${dateInfo.tomorrowShort} cho ${userProfile.name}!`
    );
  };

  // Xử lý khi quá giờ: [Làm bù tối nay]
  const handleRescheduleToday = (slotId: string) => {
    const targetSlot = (schedule.today || []).find((s) => s.id === slotId);
    if (!targetSlot) return;

    const updatedToday = (schedule.today || []).map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          time: '20:00 - 21:30',
          note: `[Làm bù tối nay] ${s.note || ''}`
        };
      }
      return s;
    });

    const updatedSchedule = { ...schedule, today: updatedToday };
    updateAndSaveState(
      tasks,
      updatedSchedule,
      `Đã chuyển công việc "${targetSlot.title}" xuống khung giờ 20:00 - 21:30 tối nay để ${userProfile.name} làm bù nhé!`
    );
  };

  // Xử lý khi quá giờ: [Đẩy sang mai]
  const handlePostponeToTomorrow = (slotId: string) => {
    const targetSlot = (schedule.today || []).find((s) => s.id === slotId);
    if (!targetSlot) return;

    const newToday = (schedule.today || []).filter((s) => s.id !== slotId);
    const movedSlot = {
      ...targetSlot,
      id: 'sch-postponed-' + Date.now(),
      time: '14:00 - 15:30',
      note: `[Đẩy sang từ ${dateInfo.todayShort}] ${targetSlot.note || ''}`
    };

    const updatedSchedule = {
      ...schedule,
      today: newToday,
      tomorrow: [...(schedule.tomorrow || []), movedSlot]
    };

    updateAndSaveState(
      tasks,
      updatedSchedule,
      `Đã dời công việc "${targetSlot.title}" sang khung giờ ngày mai cho ${userProfile.name}!`
    );
  };

  // AI Command Bar
  const handleExecuteAiCommand = async (customCommand?: string | null) => {
    const commandText = (customCommand || '').trim();
    if (!commandText || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiError(null);

    const payload = createAiPromptPayload(
      commandText,
      tasks,
      schedule,
      dateInfo,
      userProfile.name,
      routineSettings
    );

    try {
      const result = await callGeminiWithBackoff(payload, customApiKey);
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Không nhận được phản hồi từ AI.');

      const parsed = JSON.parse(rawText);
      updateAndSaveState(
        parsed.tasks || tasks,
        parsed.schedule || schedule,
        parsed.aiMessage || `Tui đã cập nhật xong bảng công việc theo ý ${userProfile.name}!`
      );
    } catch (error) {
      console.error('Lỗi xử lý AI:', error);
      setAiError(
        'Không thể kết nối AI. Bạn hãy bấm nút "Cài đặt & API Key" ở trên để dán mã Gemini API Key miễn phí nhé!'
      );
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Kéo thả giữa các Quadrant
  const handleMoveTaskToQuadrant = (taskId: string, targetQuadrantId: QuadrantId) => {
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || draggedTask.quadrant === targetQuadrantId) return;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, quadrant: targetQuadrantId } : t
    );
    const targetName = QUADRANT_CONFIG[targetQuadrantId].title;
    updateAndSaveState(
      updatedTasks,
      schedule,
      `Đã chuyển "${draggedTask.title}" sang mục ${targetName} theo thao tác kéo thả của ${userProfile.name}!`
    );
  };

  // Thêm việc thủ công
  const handleManualAddTask = (title: string, note: string, quadrant: QuadrantId) => {
    const newTask: Task = {
      id: 'task-' + Date.now(),
      title,
      note: note || `Thêm ngày ${dateInfo.todayShort}`,
      quadrant,
      completed: false,
      carryOver: '',
      urgentAlert: quadrant === 'q1'
    };
    const updated = [...tasks, newTask];
    updateAndSaveState(
      updated,
      schedule,
      `Đã thêm việc "${newTask.title}" vào ${QUADRANT_CONFIG[quadrant].title} cho ${userProfile.name}.`
    );
    setShowManualAddTask(false);
  };

  // Đổi trạng thái hoàn thành task
  const handleToggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const nextCompleted = target ? !target.completed : true;
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: nextCompleted, urgentAlert: nextCompleted ? false : t.urgentAlert } : t
    );

    let updatedSchedule = schedule;
    if (target && target.title.toLowerCase().includes('steep')) {
      updatedSchedule = {
        ...schedule,
        today: (schedule.today || []).map((slot) =>
          slot.title.toLowerCase().includes('steep') ? { ...slot, completed: nextCompleted } : slot
        )
      };
    }

    updateAndSaveState(
      updatedTasks,
      updatedSchedule,
      nextCompleted
        ? `Tuyệt vời ${userProfile.name}! Đã gạch bỏ "${target?.title}"!`
        : `Đã mở lại công việc "${target?.title}".`
    );
  };

  // Sửa task
  const handleSaveEditTask = (id: string, title: string, note: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, title, note } : t));
    updateAndSaveState(updated, schedule, `Đã cập nhật nội dung công việc cho ${userProfile.name}!`);
  };

  // Xóa task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    updateAndSaveState(updated, schedule);
  };

  // TKB: Toggle slot
  const handleToggleScheduleSlot = (day: 'today' | 'tomorrow', id: string) => {
    const updatedSchedule: ScheduleData = {
      ...schedule,
      [day]: schedule[day].map((slot) => (slot.id === id ? { ...slot, completed: !slot.completed } : slot))
    };
    updateAndSaveState(tasks, updatedSchedule);
  };

  // TKB: Thêm slot (Hỗ trợ isRoutine)
  const handleAddScheduleSlot = (
    day: 'today' | 'tomorrow',
    time: string,
    title: string,
    note: string,
    tag: string,
    tagColor: TagColor,
    isRoutine?: boolean
  ) => {
    const newSlot = {
      id: 'sch-' + Date.now(),
      time,
      title,
      note,
      tag,
      tagColor,
      completed: false,
      isRoutine: !!isRoutine
    };
    const updatedSchedule: ScheduleData = {
      ...schedule,
      [day]: [...schedule[day], newSlot]
    };
    updateAndSaveState(tasks, updatedSchedule);
  };

  // TKB: Xóa slot
  const handleDeleteScheduleSlot = (day: 'today' | 'tomorrow', id: string) => {
    const updatedSchedule: ScheduleData = {
      ...schedule,
      [day]: schedule[day].filter((slot) => slot.id !== id)
    };
    updateAndSaveState(tasks, updatedSchedule);
  };

  // Tiến độ: CHỈ TÍNH CÔNG VIỆC THỰC SỰ (tasks), KHÔNG TÍNH KHUNG GIỜ SINH HOẠT VÀO % TIẾN ĐỘ!
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const urgentTasks = tasks.filter((t) => t.quadrant === 'q1' && !t.completed);

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-16">
      {/* Neon Dark-Mode Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-36 -left-36 w-[420px] h-[420px] bg-rose-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-36 w-[420px] h-[420px] bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[380px] h-[380px] bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Onboarding Modal cho người dùng mới */}
      {showOnboarding && (
        <OnboardingModal
          currentName={userProfile.name}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          userName={userProfile.name}
          customApiKey={customApiKey}
          tasks={tasks}
          schedule={schedule}
          routineSettings={routineSettings}
          onChangeUserName={handleUpdateUserName}
          onSaveApiKey={(newKey) => updateAndSaveState(tasks, schedule, lastAiMessage, newKey)}
          onSaveRoutineSettings={handleSaveRoutineSettings}
          onImportJsonData={(parsed) =>
            updateAndSaveState(parsed.tasks, parsed.schedule, 'Đã khôi phục dữ liệu từ bản sao lưu JSON!')
          }
          onClearToBlank={handleClearToBlank}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Google Calendar Sync Modal */}
      {showGoogleCalendarModal && (
        <GoogleCalendarModal
          schedule={schedule}
          dateInfo={dateInfo}
          onClose={() => setShowGoogleCalendarModal(false)}
        />
      )}

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header & Live Clock */}
        <Header
          userName={userProfile.name}
          dateInfo={dateInfo}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          progressPercent={progressPercent}
          onChangeUserName={handleUpdateUserName}
          onAutoCarryOver={handleAutoCarryOver}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Cảnh báo P1 (Chỉ hiển thị khi thực sự có công việc P1) */}
        <UrgentAlertBanner urgentTasks={urgentTasks} dateInfo={dateInfo} />

        {/* AI Command Bar */}
        <AiCommandBar
          dateInfo={dateInfo}
          isAiProcessing={isAiProcessing}
          aiError={aiError}
          lastAiMessage={lastAiMessage}
          showManualAddTask={showManualAddTask}
          onToggleManualAddTask={() => setShowManualAddTask(!showManualAddTask)}
          onExecuteAiCommand={handleExecuteAiCommand}
        />

        {/* Form thêm việc tay (nếu bật) */}
        {showManualAddTask && <ManualAddTaskForm onAddTask={handleManualAddTask} />}

        {/* Phần 1: Ma trận Eisenhower 2x2 */}
        <EisenhowerMatrix
          tasks={tasks}
          onMoveTaskToQuadrant={handleMoveTaskToQuadrant}
          onToggleComplete={handleToggleTask}
          onDelete={handleDeleteTask}
          onSaveEdit={handleSaveEditTask}
        />

        {/* Phần 2: Thời khóa biểu thực chiến */}
        <TimelineSchedule
          schedule={schedule}
          dateInfo={dateInfo}
          onToggleScheduleSlot={handleToggleScheduleSlot}
          onDeleteScheduleSlot={handleDeleteScheduleSlot}
          onAddScheduleSlot={handleAddScheduleSlot}
          onRescheduleToday={handleRescheduleToday}
          onPostponeToTomorrow={handlePostponeToTomorrow}
          onOpenGoogleCalendarModal={() => setShowGoogleCalendarModal(true)}
        />
      </div>
    </div>
  );
}
