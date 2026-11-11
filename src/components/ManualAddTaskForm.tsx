import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { QuadrantId } from '../types';

interface ManualAddTaskFormProps {
  onAddTask: (title: string, note: string, quadrant: QuadrantId) => void;
}

export const ManualAddTaskForm: React.FC<ManualAddTaskFormProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantId>('q1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim(), note.trim(), quadrant);
    setTitle('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3">
      <div className="sm:col-span-5">
        <input
          type="text"
          placeholder="Nhập công việc mới cần làm..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>
      <div className="sm:col-span-3">
        <input
          type="text"
          placeholder="Ghi chú / Deadline"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <select
          value={quadrant}
          onChange={(e) => setQuadrant(e.target.value as QuadrantId)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
        >
          <option value="q1">🔥 Ưu tiên 1: Làm ngay</option>
          <option value="q2">🗓️ Ưu tiên 2: Lên lịch</option>
          <option value="q3">⚡ Ưu tiên 3: Xử lý nhanh</option>
          <option value="q4">🛋️ Ưu tiên 4: Để sau</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full h-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tay</span>
        </button>
      </div>
    </form>
  );
};
