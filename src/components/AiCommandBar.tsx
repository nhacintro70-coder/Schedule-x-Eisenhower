import React, { useState } from 'react';
import { Wand2, Send, Loader2, Bot, AlertCircle } from 'lucide-react';
import { QUICK_PROMPTS } from '../constants/initialData';
import { DateInfo } from '../types';

interface AiCommandBarProps {
  dateInfo: DateInfo;
  isAiProcessing: boolean;
  aiError: string | null;
  lastAiMessage: string;
  showManualAddTask: boolean;
  onToggleManualAddTask: () => void;
  onExecuteAiCommand: (command?: string | null) => Promise<void>;
}

export const AiCommandBar: React.FC<AiCommandBarProps> = ({
  dateInfo,
  isAiProcessing,
  aiError,
  lastAiMessage,
  showManualAddTask,
  onToggleManualAddTask,
  onExecuteAiCommand
}) => {
  const [commandInput, setCommandInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isAiProcessing) return;
    const cmd = commandInput;
    setCommandInput('');
    onExecuteAiCommand(cmd);
  };

  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-purple-950/30 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-inner space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-semibold text-cyan-300 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          <span>
            Ra lệnh giọng văn tự nhiên (AI tự nhận biết hôm nay là {dateInfo.todayShort} để xếp việc & dời TKB):
          </span>
        </label>
        <button
          type="button"
          onClick={onToggleManualAddTask}
          className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
        >
          {showManualAddTask ? 'Ẩn form nhập tay' : '+ Nhập thủ công'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            disabled={isAiProcessing}
            placeholder="Ví dụ: Tui làm xong bài tập rồi nha, tối mai 20:00 thêm lịch học Tiếng Trung..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 rounded-xl pl-4 pr-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isAiProcessing || !commandInput.trim()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition cursor-pointer flex-shrink-0"
        >
          {isAiProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI đang xếp việc...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi lệnh AI</span>
            </>
          )}
        </button>
      </form>

      {/* Gợi ý 1-click */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] text-slate-400 font-medium">Thử bấm nhanh:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isAiProcessing}
            onClick={() => onExecuteAiCommand(prompt)}
            className="text-xs bg-slate-900/90 hover:bg-indigo-950/80 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Lỗi AI nếu có */}
      {aiError && (
        <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/30 px-3.5 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Phản hồi từ AI */}
      {lastAiMessage && (
        <div className="flex items-start gap-3 bg-slate-900/90 border border-indigo-500/20 px-4 py-3 rounded-xl">
          <Bot className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{lastAiMessage}</p>
        </div>
      )}
    </div>
  );
};
