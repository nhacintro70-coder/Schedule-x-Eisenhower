import React, { useState } from 'react';
import { Clock, Coffee } from 'lucide-react';
import { TagColor } from '../../types';
import { normalizeTimeString } from '../../utils/timeUtils';
import { TimeWheelPicker } from './TimeWheelPicker';

interface AddSlotFormProps {
  onAddSlot: (
    time: string,
    title: string,
    note: string,
    tag: string,
    tagColor: TagColor,
    isRoutine?: boolean
  ) => void;
}

export const AddSlotForm: React.FC<AddSlotFormProps> = ({ onAddSlot }) => {
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('Ưu tiên 1');
  const [isRoutine, setIsRoutine] = useState(false);
  const [showWheelPicker, setShowWheelPicker] = useState(false);

  const tagColorMap: Record<string, TagColor> = {
    'Ưu tiên 1': 'rose',
    'Ưu tiên 2': 'indigo',
    'Ưu tiên 3': 'amber',
    'Ưu tiên 4': 'emerald',
    'Nghỉ ngơi': 'slate',
    'Sinh hoạt': 'slate'
  };

  const handleBlurTime = () => {
    if (time.trim()) {
      const normalized = normalizeTimeString(time);
      setTime(normalized);
    }
  };

  const handleSelectTag = (selectedTag: string) => {
    setTag(selectedTag);
    if (selectedTag === 'Nghỉ ngơi' || selectedTag === 'Sinh hoạt') {
      setIsRoutine(true);
    } else {
      setIsRoutine(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time.trim() || !title.trim()) return;

    // Chuẩn hóa lần cuối trước khi lưu
    const formattedTime = normalizeTimeString(time);

    onAddSlot(
      formattedTime,
      title.trim(),
      note.trim(),
      isRoutine ? 'Sinh hoạt' : tag,
      tagColorMap[isRoutine ? 'Sinh hoạt' : tag] || 'indigo',
      isRoutine
    );

    setTime('');
    setTitle('');
    setNote('');
    setIsRoutine(false);
  };

  return (
    <div className="space-y-3">
      {showWheelPicker && (
        <TimeWheelPicker
          value={time}
          onChange={(formatted) => setTime(formatted)}
          onClose={() => setShowWheelPicker(false)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        {/* Ô nhập giờ + nút mở đồng hồ cuộn */}
        <div className="sm:col-span-3">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Giờ (vd: 20h, 8-9h, 21:00)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={handleBlurTime}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => setShowWheelPicker(!showWheelPicker)}
              title="Mở đồng hồ điện tử chọn giờ dạng cuộn"
              className="absolute right-2 text-cyan-400 hover:text-cyan-300 p-1 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block pl-1">
            Gõ tắt: 21h, 20-21, 8-9h...
          </span>
        </div>

        <div className="sm:col-span-4">
          <input
            type="text"
            placeholder="Hoạt động trong khung giờ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <input
            type="text"
            placeholder="Ghi chú chi tiết..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={isRoutine ? 'Sinh hoạt' : tag}
            onChange={(e) => handleSelectTag(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="Ưu tiên 1">Ưu tiên 1 (Đỏ)</option>
            <option value="Ưu tiên 2">Ưu tiên 2 (Xanh)</option>
            <option value="Ưu tiên 3">Ưu tiên 3 (Vàng)</option>
            <option value="Ưu tiên 4">Ưu tiên 4 (Lục)</option>
            <option value="Sinh hoạt">☕ Sinh hoạt / Nghỉ (Miễn nhiễm)</option>
          </select>
        </div>

        {/* Dòng tùy chọn Miễn nhiễm */}
        <div className="sm:col-span-10 flex items-center gap-2 pt-1">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={isRoutine}
              onChange={(e) => {
                setIsRoutine(e.target.checked);
                if (e.target.checked) setTag('Sinh hoạt');
              }}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <Coffee className="w-3.5 h-3.5 text-purple-400" />
            <span>Đây là khung sinh hoạt (Ăn uống, nghỉ ngơi — Không tính tiến độ ảo, không báo quá giờ)</span>
          </label>
        </div>

        <div className="sm:col-span-2 flex items-center justify-end">
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg py-2 transition cursor-pointer shadow-md shadow-cyan-600/20"
          >
            Thêm Khung Giờ
          </button>
        </div>
      </form>
    </div>
  );
};
