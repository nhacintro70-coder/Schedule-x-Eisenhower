import { Task, ScheduleData } from '../types';

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SCHEDULE: ScheduleData = {
  today: [
    {
      id: 'routine-lunch-today',
      time: '11:30 - 13:30',
      title: 'Ăn trưa & Nghỉ ngơi',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate',
      completed: false,
      isRoutine: true
    },
    {
      id: 'routine-dinner-today',
      time: '18:30 - 19:30',
      title: 'Ăn tối & Thư giãn',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate',
      completed: false,
      isRoutine: true
    }
  ],
  tomorrow: [
    {
      id: 'routine-lunch-tomorrow',
      time: '11:30 - 13:30',
      title: 'Ăn trưa & Nghỉ ngơi',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate',
      completed: false,
      isRoutine: true
    },
    {
      id: 'routine-dinner-tomorrow',
      time: '18:30 - 19:30',
      title: 'Ăn tối & Thư giãn',
      note: 'Khung giờ sinh hoạt cố định',
      tag: 'Sinh hoạt',
      tagColor: 'slate',
      completed: false,
      isRoutine: true
    }
  ]
};

export const INITIAL_AI_MESSAGE =
  'Chào mừng bạn đến với Eisenhower Schedule! Bảng công việc và thời khóa biểu cá nhân của bạn đã sẵn sàng. Hãy nhập yêu cầu vào ô bên dưới hoặc bấm các câu mẫu gợi ý để bắt đầu nhé!';

export const QUICK_PROMPTS = [
  '🔥 Thêm việc gấp: Hoàn thành hạn nộp bài / tài liệu trong ngày (Ưu tiên 1)',
  '📅 Lên lịch: Học Tiếng Trung từ 19:30 đến 20:30 tối nay',
  '👥 Họp nhóm: Thảo luận dự án tối mai từ 20:00 đến 21:30',
  '⚡ Dời lịch: Chưa kịp tập thể dục hôm nay, dời sang chiều mai 17:00',
  '✅ Báo xong: Đã hoàn thành công việc ưu tiên sáng nay!'
];
