import React, { useState } from 'react';
import { GripVertical, CheckCircle2, Circle, Edit3, Trash2, Clock } from 'lucide-react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  checkboxColor: string;
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, title: string, note: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  checkboxColor,
  isBeingDragged,
  onDragStart,
  onDragEnd,
  onToggleComplete,
  onDelete,
  onSaveEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNote, setEditNote] = useState(task.note || '');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onSaveEdit(task.id, editTitle.trim(), editNote.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditNote(task.note || '');
    setIsEditing(false);
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group flex items-start justify-between gap-2.5 p-3.5 rounded-xl border transition-all ${
        !isEditing ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isBeingDragged
          ? 'opacity-40 scale-95 border-cyan-400 bg-slate-800'
          : task.completed
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
          : task.urgentAlert
          ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/30 shadow-md shadow-rose-950/50'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 shadow-sm'
      }`}
    >
      {/* Biểu tượng nắm kéo */}
      <div
        className="mt-0.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0"
        title="Nắm kéo để chuyển sang ô ưu tiên khác"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <button
        onClick={() => onToggleComplete(task.id)}
        className="mt-0.5 flex-shrink-0 focus:outline-none cursor-pointer"
        title={task.completed ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã hoàn thành'}
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className={`w-5 h-5 ${checkboxColor} opacity-80 hover:opacity-100`} />
        )}
      </button>

      {isEditing ? (
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
          />
          <input
            type="text"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Ghi chú / Deadline"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div onClick={() => onToggleComplete(task.id)} className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {task.urgentAlert && !task.completed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                {(() => {
                  const note = task.note || '';
                  const deadlineMatch = note.match(/(?:deadline|hạn|ngày|trước)?\s*(\d{1,2}[\/:]\d{1,2})/i);
                  if (deadlineMatch && deadlineMatch[1]) {
                    return `🚨 Hạn: ${deadlineMatch[1]}`;
                  }
                  return '🚨 LÀM NGAY';
                })()}
              </span>
            )}
            {task.carryOver && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏪ {task.carryOver}
              </span>
            )}
          </div>
          <p
            className={`text-sm font-medium leading-snug transition-all ${
              task.completed ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {task.title}
          </p>
          {task.note && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="truncate">{task.note}</span>
            </p>
          )}
        </div>
      )}

      {/* Nút sửa & xóa */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            title="Sửa nội dung"
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Xóa công việc"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
