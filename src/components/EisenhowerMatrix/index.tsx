import React, { useState } from 'react';
import { Target, GripVertical } from 'lucide-react';
import { Task, QuadrantId } from '../../types';
import { QUADRANT_CONFIG } from '../../constants/quadrantConfig';
import { QuadrantColumn } from './QuadrantColumn';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onMoveTaskToQuadrant: (taskId: string, targetQuadrant: QuadrantId) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, title: string, note: string) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onMoveTaskToQuadrant,
  onToggleComplete,
  onDelete,
  onSaveEdit
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantId | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
  };

  const handleDragOverQuadrant = (e: React.DragEvent, quadrantId: QuadrantId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverQuadrant !== quadrantId) {
      setDragOverQuadrant(quadrantId);
    }
  };

  const handleDragLeaveQuadrant = (e: React.DragEvent, quadrantId: QuadrantId) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverQuadrant === quadrantId) {
        setDragOverQuadrant(null);
      }
    }
  };

  const handleDropOnQuadrant = (e: React.DragEvent, targetQuadrantId: QuadrantId) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    setDraggedTaskId(null);
    setDragOverQuadrant(null);

    if (!taskId) return;
    onMoveTaskToQuadrant(taskId, targetQuadrantId);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-rose-400" />
          <span>1. Ma Trận Phân Loại Mức Độ Ưu Tiên (Eisenhower 2x2)</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-medium">
            <GripVertical className="w-3.5 h-3.5" />
            <span>Mẹo: Nắm kéo & thả thẻ công việc để đổi mức ưu tiên</span>
          </span>
        </div>
      </div>

      {/* Lưới 2x2 hỗ trợ Drop Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(Object.keys(QUADRANT_CONFIG) as QuadrantId[]).map((qId) => {
          const qConfig = QUADRANT_CONFIG[qId];
          const quadrantTasks = tasks.filter((t) => t.quadrant === qId);

          return (
            <QuadrantColumn
              key={qId}
              config={qConfig}
              tasks={quadrantTasks}
              dragOverQuadrant={dragOverQuadrant}
              draggedTaskId={draggedTaskId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOverQuadrant}
              onDragLeave={handleDragLeaveQuadrant}
              onDrop={handleDropOnQuadrant}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onSaveEdit={onSaveEdit}
            />
          );
        })}
      </div>
    </section>
  );
};
