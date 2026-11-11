import React, { useState } from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';

interface TimeWheelPickerProps {
  value: string;
  onChange: (formattedTime: string) => void;
  onClose: () => void;
}

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({ value, onChange, onClose }) => {
  // Parse initial values or default to current hour + 1
  const now = new Date();
  const currentHour = now.getHours();

  const [startHour, setStartHour] = useState<number>(() => {
    const match = value.match(/(\d{1,2})[:h]/);
    return match ? parseInt(match[1], 10) : currentHour;
  });

  const [startMinute, setStartMinute] = useState<number>(() => {
    const match = value.match(/[:h](\d{2})/);
    return match ? Math.round(parseInt(match[1], 10) / 5) * 5 : 0;
  });

  const [endHour, setEndHour] = useState<number>(() => {
    const matches = value.match(/(\d{1,2})[:h]/g);
    if (matches && matches.length > 1) {
      return parseInt(matches[1].replace(/[:h]/, ''), 10);
    }
    return (currentHour + 1) % 24;
  });

  const [endMinute, setEndMinute] = useState<number>(() => {
    const matches = value.match(/[:h](\d{2})/g);
    if (matches && matches.length > 1) {
      return Math.round(parseInt(matches[1].replace(/[:h]/, ''), 10) / 5) * 5;
    }
    return 0;
  });

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleApply = (sH = startHour, sM = startMinute, eH = endHour, eM = endMinute) => {
    const formatted = `${pad(sH)}:${pad(sM)} - ${pad(eH)}:${pad(eM)}`;
    onChange(formatted);
    onClose();
  };

  // Nút cộng thời lượng nhanh
  const addDuration = (minutesToAdd: number) => {
    const totalMinutes = startHour * 60 + startMinute + minutesToAdd;
    const newEndHour = Math.floor(totalMinutes / 60) % 24;
    const newEndMinute = totalMinutes % 60;
    setEndHour(newEndHour);
    setEndMinute(newEndMinute);
  };

  // Chọn khung giờ mẫu
  const applyPreset = (sH: number, sM: number, eH: number, eM: number) => {
    setStartHour(sH);
    setStartMinute(sM);
    setEndHour(eH);
    setEndMinute(eM);
    handleApply(sH, sM, eH, eM);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Đồng Hồ Chọn Giờ Điện Tử</span>
        </div>
        <span className="font-mono text-sm font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          {pad(startHour)}:{pad(startMinute)} ➔ {pad(endHour)}:{pad(endMinute)}
        </span>
      </div>

      {/* Bộ cuộn chọn Giờ bắt đầu & Giờ kết thúc */}
      <div className="grid grid-cols-2 gap-3">
        {/* Giờ bắt đầu */}
        <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
            <span>Bắt đầu lúc:</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Giờ</label>
              <select
                value={startHour}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setStartHour(val);
                  if (endHour <= val) setEndHour((val + 1) % 24);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-sm font-mono font-bold text-white outline-none cursor-pointer"
              >
                {hoursList.map((h) => (
                  <option key={h} value={h}>
                    {pad(h)}h
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Phút</label>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-sm font-mono font-bold text-white outline-none cursor-pointer"
              >
                {minutesList.map((m) => (
                  <option key={m} value={m}>
                    {pad(m)}p
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Giờ kết thúc */}
        <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
            <span>Kết thúc lúc:</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Giờ</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-sm font-mono font-bold text-white outline-none cursor-pointer"
              >
                {hoursList.map((h) => (
                  <option key={h} value={h}>
                    {pad(h)}h
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-0.5">Phút</label>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-sm font-mono font-bold text-white outline-none cursor-pointer"
              >
                {minutesList.map((m) => (
                  <option key={m} value={m}>
                    {pad(m)}p
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Nút cộng thời lượng nhanh */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Thời lượng nhanh:</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => addDuration(30)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-cyan-300 border border-slate-700 cursor-pointer"
          >
            +30 phút
          </button>
          <button
            type="button"
            onClick={() => addDuration(60)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-cyan-300 border border-slate-700 cursor-pointer"
          >
            +1 tiếng
          </button>
          <button
            type="button"
            onClick={() => addDuration(90)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-cyan-300 border border-slate-700 cursor-pointer"
          >
            +1.5 tiếng
          </button>
          <button
            type="button"
            onClick={() => addDuration(120)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-cyan-300 border border-slate-700 cursor-pointer"
          >
            +2 tiếng
          </button>
        </div>
      </div>

      {/* Khung giờ quen thuộc 1 chạm */}
      <div className="space-y-1 pt-1 border-t border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Gợi ý khung giờ phổ biến (1 chạm):</span>
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset(8, 30, 10, 30)}
            className="px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 cursor-pointer"
          >
            Sáng: 08:30 - 10:30
          </button>
          <button
            type="button"
            onClick={() => applyPreset(14, 0, 16, 0)}
            className="px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 cursor-pointer"
          >
            Chiều: 14:00 - 16:00
          </button>
          <button
            type="button"
            onClick={() => applyPreset(20, 0, 21, 30)}
            className="px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 cursor-pointer"
          >
            Tối: 20:00 - 21:30
          </button>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
        >
          Đóng
        </button>
        <button
          type="button"
          onClick={() => handleApply()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md shadow-cyan-600/30 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Chọn giờ này</span>
        </button>
      </div>
    </div>
  );
};
