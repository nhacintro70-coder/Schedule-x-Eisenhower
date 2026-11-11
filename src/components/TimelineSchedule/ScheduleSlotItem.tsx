import React from 'react';
import { CheckCircle2, Circle, Clock, Trash2, AlertCircle, FastForward, CalendarPlus, Coffee, Calendar } from 'lucide-react';
import { ScheduleSlot, DateInfo } from '../../types';
import { getTagBadgeStyle } from '../../utils/styleUtils';
import { getSlotStatus, getSlotCountdown } from '../../utils/timeUtils';
import { createGoogleCalendarWebIntentUrl } from '../../services/googleCalendar';

interface ScheduleSlotItemProps {
  slot: ScheduleSlot;
  isToday: boolean;
  dateInfo: DateInfo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onRescheduleToday: (id: string) => void;
  onPostponeToTomorrow: (id: string) => void;
}

export const ScheduleSlotItem: React.FC<ScheduleSlotItemProps> = ({
  slot,
  isToday,
  dateInfo,
  onToggleComplete,
  onDelete,
  onRescheduleToday,
  onPostponeToTomorrow
}) => {
  const isRoutine =
    slot.isRoutine ||
    slot.tag === 'Sinh hoạt' ||
    slot.tag === 'Nghỉ ngơi' ||
    slot.title.toLowerCase().includes('ăn trưa') ||
    slot.title.toLowerCase().includes('ăn tối') ||
    slot.title.toLowerCase().includes('nghỉ ngơi');

  const status = getSlotStatus(slot.time, slot.completed, isToday, isRoutine, new Date());
  const slotCountdown = getSlotCountdown(slot.time, isToday, new Date());

  return (
    <div
      className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-all ${
        slot.completed
          ? 'opacity-50 bg-slate-950/30'
          : status === 'routine-past'
          ? 'opacity-40 bg-slate-950/20 hover:opacity-75'
          : status === 'routine-current'
          ? 'bg-purple-950/30 border border-purple-500/50 shadow-lg shadow-purple-950/30'
          : status === 'current'
          ? 'bg-emerald-950/40 border border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
          : status === 'overdue'
          ? 'bg-rose-950/30 border border-rose-500/40 shadow-sm'
          : slot.isUrgentCountdown
          ? 'bg-rose-950/30 border border-rose-500/30 my-1'
          : 'hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <button
          onClick={() => onToggleComplete(slot.id)}
          className="mt-0.5 sm:mt-0 flex-shrink-0 cursor-pointer"
          title={slot.completed ? 'Mở lại khung giờ này' : 'Đánh dấu đã hoàn thành'}
        >
          {slot.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle
              className={`w-5 h-5 ${
                status === 'routine-current'
                  ? 'text-purple-400 animate-pulse'
                  : status === 'current'
                  ? 'text-emerald-400 animate-pulse'
                  : status === 'overdue'
                  ? 'text-rose-400'
                  : 'text-slate-500 hover:text-cyan-400'
              }`}
            />
          )}
        </button>

        {/* Khung giờ & Trạng thái Real-Time */}
        <div className="flex flex-col gap-1 flex-shrink-0 w-36">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              status === 'routine-current'
                ? 'text-purple-200 bg-purple-950/90 border-purple-500/50'
                : status === 'current'
                ? 'text-emerald-200 bg-emerald-950/90 border-emerald-500/50'
                : status === 'overdue' && !slot.completed
                ? 'text-rose-200 bg-rose-950/90 border-rose-500/50'
                : status === 'routine-past'
                ? 'text-slate-400 bg-slate-900/60 border-slate-800'
                : slot.isUrgentCountdown && !slot.completed
                ? 'text-rose-200 bg-rose-950/90 border-rose-500/40'
                : 'text-cyan-300 bg-cyan-950/60 border-cyan-500/20'
            }`}
          >
            <Clock className="w-3 h-3" />
            {slot.time}
          </span>

          {/* Badge trạng thái thời gian thực */}
          {status === 'routine-current' && !slot.completed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400">
              <Coffee className="w-3 h-3 animate-bounce" />
              GIỜ NGHỈ NGƠI
            </span>
          )}

          {status === 'current' && !slot.completed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ĐANG DIỄN RA
            </span>
          )}

          {status === 'overdue' && !slot.completed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
              <AlertCircle className="w-3 h-3" />
              ĐÃ QUÁ GIỜ
            </span>
          )}

          {status === 'routine-past' && !slot.completed && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              ĐÃ QUA
            </span>
          )}
        </div>

        {/* Nội dung hoạt động */}
        <div onClick={() => onToggleComplete(slot.id)} className="cursor-pointer flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold ${
                slot.completed || status === 'routine-past' ? 'text-slate-400' : 'text-white'
              }`}
            >
              {slot.title}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${getTagBadgeStyle(
                isRoutine ? 'slate' : slot.tagColor
              )}`}
            >
              {isRoutine ? '☕ Sinh hoạt' : slot.tag}
            </span>
            {(slot.isUrgentCountdown || slot.tag === 'Ưu tiên 1') && !slot.completed && slotCountdown && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                ⏳ {slotCountdown}
              </span>
            )}
          </div>
          {slot.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{slot.note}</p>}
        </div>
      </div>

      {/* Hành động khi quá giờ: CHỈ HIỆN CHO CÔNG VIỆC THỰC SỰ, KHÔNG HIỆN CHO SINH HOẠT! */}
      <div className="flex items-center justify-end gap-2 flex-shrink-0">
        {!isRoutine && status === 'overdue' && !slot.completed && isToday && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRescheduleToday(slot.id)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
              title="Dời xuống khung giờ tối nay để làm bù"
            >
              <CalendarPlus className="w-3 h-3 text-amber-400" />
              <span>Làm bù tối nay</span>
            </button>

            <button
              onClick={() => onPostponeToTomorrow(slot.id)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
              title="Đẩy việc này sang lịch trình ngày mai"
            >
              <FastForward className="w-3 text-purple-400" />
              <span>Đẩy sang mai</span>
            </button>
          </div>
        )}

        <a
          href={createGoogleCalendarWebIntentUrl(
            slot,
            isToday
              ? dateInfo.todayDateKey
              : (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return `${yyyy}-${mm}-${dd}`;
                })()
          )}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Mở thêm vào Google Calendar"
        >
          <Calendar className="w-4 h-4" />
        </a>

        <button
          onClick={() => onDelete(slot.id)}
          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Xóa khung giờ này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
