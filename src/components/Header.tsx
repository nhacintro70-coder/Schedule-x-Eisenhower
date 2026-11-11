import React, { useState } from 'react';
import { Clock, HardDrive, FastForward, Settings, RotateCcw, Edit3, Check } from 'lucide-react';
import { DateInfo } from '../types';

interface HeaderProps {
  userName: string;
  dateInfo: DateInfo;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  onChangeUserName: (newName: string) => void;
  onAutoCarryOver: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  dateInfo,
  totalTasks,
  completedTasks,
  progressPercent,
  onChangeUserName,
  onAutoCarryOver,
  onOpenSettings
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onChangeUserName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Top Bar: Live Clock + Storage Indicator + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Đồng hồ Thời gian thực */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold shadow-sm shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIVE: {dateInfo.fullClock}</span>
          </div>

          {/* LocalStorage Offline Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Bộ nhớ máy cá nhân (Riêng tư 100%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAutoCarryOver}
            title="Đẩy toàn bộ việc chưa xong sang lịch mới nhất"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 text-xs font-semibold transition cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-rose-400" />
            <span>⚡ Đẩy việc chưa xong</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cài đặt & API Key</span>
          </button>
        </div>
      </div>

      {/* Main Title with Inline Name Edit & Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>🎯 Bảng Lịch Trình Của</span>
              {isEditingName ? (
                <span className="inline-flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="bg-slate-950 border border-cyan-400 rounded-lg px-2 py-0.5 text-xl font-bold text-cyan-300 outline-none w-44"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </span>
              ) : (
                <span
                  onClick={() => setIsEditingName(true)}
                  className="text-cyan-400 hover:text-cyan-300 underline decoration-dashed underline-offset-4 cursor-pointer inline-flex items-center gap-1.5"
                  title="Bấm để đổi tên của bạn"
                >
                  <span>{userName}</span>
                  <Edit3 className="w-4 h-4 opacity-70" />
                </span>
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thời khóa biểu cá nhân hóa cho <strong className="text-cyan-300">{dateInfo.todayLabel}</strong> &{' '}
            <strong className="text-purple-300">{dateInfo.tomorrowLabel}</strong>
          </p>
        </div>

        {/* Thanh tiến độ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl min-w-[280px]">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Tiến độ hoàn thành</span>
              <span className="text-cyan-400 font-bold">
                {completedTasks}/{totalTasks} việc ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
