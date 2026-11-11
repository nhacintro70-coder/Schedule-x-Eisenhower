import React from 'react';
import { Task, QuadrantConfigItem, QuadrantId } from '../../types';
import { TaskCard } from './TaskCard';

interface QuadrantColumnProps {
  config: QuadrantConfigItem;
  tasks: Task[];
  dragOverQuadrant: QuadrantId | null;
  draggedTaskId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, qId: QuadrantId) => void;
  onDragLeave: (e: React.DragEvent, qId: QuadrantId) => void;
  onDrop: (e: React.DragEvent, qId: QuadrantId) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, title: string, note: string) => void;
}

export const QuadrantColumn: React.FC<QuadrantColumnProps> = ({
  config,
  tasks,
  dragOverQuadrant,
  draggedTaskId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleComplete,
  onDelete,
  onSaveEdit
}) => {
  const isDragOver = dragOverQuadrant === config.id;

  return (
    <div
      onDragOver={(e) => onDragOver(e, config.id)}
      onDragLeave={(e) => onDragLeave(e, config.id)}
      onDrop={(e) => onDrop(e, config.id)}
      className={`flex flex-col rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-200 shadow-xl ${
        isDragOver ? config.dragOverBorder : `${config.border} ${config.bg}`
      }`}
    >
      {/* Header của mỗi Mức Ưu Tiên */}
      <div className={`p-4 ${config.headerBg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${config.badge}`}>
              {config.code}
            </span>
            <h3 className="font-bold text-base text-white tracking-wide">{config.title}</h3>
          </div>
          <span className="text-xs font-medium text-slate-400">{config.subtitle}</span>
        </div>
        <p className="text-xs text-slate-300/90 italic bg-slate-950/40 px-3 py-2 rounded-lg border border-white/5">
          💡 {config.strategy}
        </p>
      </div>

      {/* Danh sách công việc */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5 min-h-[160px]">
        {tasks.length === 0 ? (
          <div
            className={`my-auto py-8 text-center rounded-xl border border-dashed transition-colors ${
              isDragOver ? 'border-white/40 bg-white/5' : 'border-slate-800/60'
            }`}
          >
            <p className="text-slate-500 text-xs sm:text-sm italic">
              {isDragOver
                ? `📥 Thả công việc vào đây để chuyển sang ${config.title}`
                : '*(Hiện tại trống)* — Kéo thả công việc vào đây nếu cần!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                checkboxColor={config.checkboxColor}
                isBeingDragged={draggedTaskId === task.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onSaveEdit={onSaveEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
