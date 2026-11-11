import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { ScheduleData, DateInfo, TagColor } from '../../types';
import { ScheduleSlotItem } from './ScheduleSlotItem';
import { AddSlotForm } from './AddSlotForm';

interface TimelineScheduleProps {
  schedule: ScheduleData;
  dateInfo: DateInfo;
  onToggleScheduleSlot: (day: 'today' | 'tomorrow', id: string) => void;
  onDeleteScheduleSlot: (day: 'today' | 'tomorrow', id: string) => void;
  onAddScheduleSlot: (
    day: 'today' | 'tomorrow',
    time: string,
    title: string,
    note: string,
    tag: string,
    tagColor: TagColor,
    isRoutine?: boolean
  ) => void;
  onRescheduleToday: (id: string) => void;
  onPostponeToTomorrow: (id: string) => void;
  onOpenGoogleCalendarModal: () => void;
}

export const TimelineSchedule: React.FC<TimelineScheduleProps> = ({
  schedule,
  dateInfo,
  onToggleScheduleSlot,
  onDeleteScheduleSlot,
  onAddScheduleSlot,
  onRescheduleToday,
  onPostponeToTomorrow,
  onOpenGoogleCalendarModal
}) => {
  const [activeDayTab, setActiveDayTab] = useState<'today' | 'tomorrow'>('today');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const handleAddSlot = (
    time: string,
    title: string,
    note: string,
    tag: string,
    tagColor: TagColor,
    isRoutine?: boolean
  ) => {
    onAddScheduleSlot(activeDayTab, time, title, note, tag, tagColor, isRoutine);
    setShowAddSchedule(false);
  };

  const currentSlots = schedule[activeDayTab] || [];

  return (
    <section className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>2. Thời Khóa Biểu Thực Chiến ({dateInfo.todayShort} & {dateInfo.tomorrowShort})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tự động theo dõi theo giờ thực tế — Đang diễn ra (🟢), Đã quá giờ (🔴), Sắp tới (⚪)
          </p>
        </div>

        {/* Nút chuyển Tab & Thêm giờ */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveDayTab('today')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDayTab === 'today'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {dateInfo.todayLabel}
            </button>
            <button
              onClick={() => setActiveDayTab('tomorrow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDayTab === 'tomorrow'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {dateInfo.tomorrowLabel}
            </button>
          </div>

          <button
            onClick={onOpenGoogleCalendarModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-md shadow-blue-950/40 border border-blue-400/30 transition cursor-pointer"
            title="Đồng bộ trực tiếp lịch trình vào Google Calendar của bạn"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Đồng bộ Google Calendar</span>
          </button>

          <button
            onClick={() => setShowAddSchedule(!showAddSchedule)}
            className="flex items-center gap-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm khung giờ</span>
          </button>
        </div>
      </div>

      {/* Form thêm khung giờ mới vào TKB */}
      {showAddSchedule && <AddSlotForm onAddSlot={handleAddSlot} />}

      {/* Danh sách khung giờ theo ngày */}
      {currentSlots.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-slate-800/80">
          <p className="text-slate-500 text-sm">
            Chưa có khung giờ nào cho {activeDayTab === 'today' ? 'Hôm nay' : 'Ngày mai'}.
          </p>
          <button
            onClick={() => setShowAddSchedule(true)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
          >
            + Bấm vào đây để tạo khung giờ đầu tiên của bạn
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/70">
          {currentSlots.map((slot) => (
            <ScheduleSlotItem
              key={slot.id}
              slot={slot}
              isToday={activeDayTab === 'today'}
              dateInfo={dateInfo}
              onToggleComplete={(id) => onToggleScheduleSlot(activeDayTab, id)}
              onDelete={(id) => onDeleteScheduleSlot(activeDayTab, id)}
              onRescheduleToday={onRescheduleToday}
              onPostponeToTomorrow={onPostponeToTomorrow}
            />
          ))}
        </div>
      )}
    </section>
  );
};
