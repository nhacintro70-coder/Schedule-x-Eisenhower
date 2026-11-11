import React, { useState } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  currentName: string;
  onComplete: (name: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ currentName, onComplete }) => {
  const [name, setName] = useState(currentName === 'Master Thiên' || currentName === 'Bạn' ? '' : currentName);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = name.trim() || 'Bạn';
    onComplete(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Chào Mừng Đến Với Eisenhower Schedule!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống quản lý thời gian cá nhân hóa & Ma trận Eisenhower 4 mức độ ưu tiên theo thời gian thực.
          </p>
        </div>

        {/* Nhập tên cá nhân hóa */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tên của bạn là gì? (Để trợ lý AI xưng hô):</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Hoàng Thiên, Minh Anh, Tuấn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 transition cursor-pointer"
          >
            <span>Bắt đầu Lịch trình cá nhân</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
