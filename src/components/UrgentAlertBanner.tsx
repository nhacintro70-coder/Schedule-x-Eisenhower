import React from 'react';
import { AlertTriangle, Flame } from 'lucide-react';
import { Task, DateInfo } from '../types';

interface UrgentAlertBannerProps {
  urgentTasks: Task[];
  dateInfo: DateInfo;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  urgentTasks,
  dateInfo
}) => {
  if (!urgentTasks || urgentTasks.length === 0) return null;

  const count = urgentTasks.length;
  const taskTitles = urgentTasks.map((t) => t.title).join('  •  ');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-950/90 via-rose-900/40 to-slate-900 border border-rose-500/50 rounded-xl px-4 py-3 shadow-lg shadow-rose-950/40 animate-in fade-in duration-300">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500 text-white">
              BÁO ĐỘNG ĐỎ • P1 ({count} VIỆC)
            </span>
            <span className="text-sm font-bold text-rose-200">
              {count === 1
                ? `Hôm nay là ${dateInfo.todayShort} — Bạn có 1 công việc khẩn cấp cần giải quyết ngay!`
                : `Hôm nay là ${dateInfo.todayShort} — Bạn có ${count} công việc khẩn cấp cần dồn lực xử lý!`}
            </span>
          </div>
          <p className="text-xs text-rose-200/90 mt-1 line-clamp-1 font-medium">
            🎯 {taskTitles}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-lg">
          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Ưu tiên làm ngay hôm nay</span>
        </span>
      </div>
    </div>
  );
};
