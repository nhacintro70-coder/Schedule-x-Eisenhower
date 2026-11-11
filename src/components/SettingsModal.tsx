import React, { useState } from 'react';
import {
  Settings,
  X,
  Sparkles,
  Key,
  ExternalLink,
  Check,
  Download,
  Upload,
  User,
  Trash2,
  RotateCcw,
  Coffee,
  Calendar
} from 'lucide-react';
import { Task, ScheduleData, RoutineSettings } from '../types';
import { normalizeTimeString } from '../utils/timeUtils';
import { exportScheduleToIcsFile } from '../services/googleCalendar';

interface SettingsModalProps {
  userName: string;
  customApiKey: string;
  tasks: Task[];
  schedule: ScheduleData;
  routineSettings: RoutineSettings;
  onChangeUserName: (name: string) => void;
  onSaveApiKey: (newKey: string) => void;
  onSaveRoutineSettings: (settings: RoutineSettings) => void;
  onImportJsonData: (parsed: { tasks: Task[]; schedule: ScheduleData; userName?: string }) => void;
  onClearToBlank: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userName,
  customApiKey,
  tasks,
  schedule,
  routineSettings,
  onChangeUserName,
  onSaveApiKey,
  onSaveRoutineSettings,
  onImportJsonData,
  onClearToBlank,
  onClose
}) => {
  const [nameInput, setNameInput] = useState(userName);
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [savedToast, setSavedToast] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Cấu hình nhịp sinh hoạt (tự động chuẩn hóa nếu có lỗi giờ đảo ngược cũ)
  const [showRoutines, setShowRoutines] = useState(routineSettings.showRoutinesOnSchedule);
  const [lunchTime, setLunchTime] = useState(() => {
    const lt = routineSettings.lunchTime;
    return lt.includes('23:') || lt.startsWith('23') ? '11:30 - 13:30' : lt;
  });
  const [dinnerTime, setDinnerTime] = useState(routineSettings.dinnerTime);
  const [routineSavedToast, setRoutineSavedToast] = useState(false);

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ userName, tasks, schedule, routineSettings, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eisenhower-schedule-${userName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(jsonImportText);
      if (parsed.tasks && parsed.schedule) {
        onImportJsonData(parsed);
        if (parsed.userName) onChangeUserName(parsed.userName);
        if (parsed.routineSettings) onSaveRoutineSettings(parsed.routineSettings);
        setJsonImportText('');
        setShowJsonImport(false);
        onClose();
      } else {
        setImportError('Dữ liệu JSON thiếu trường tasks hoặc schedule.');
      }
    } catch {
      setImportError('Định dạng JSON không hợp lệ, bạn kiểm tra lại nhé!');
    }
  };

  const handleSaveProfileAndKey = () => {
    if (nameInput.trim()) onChangeUserName(nameInput.trim());
    onSaveApiKey(apiKeyInput);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleSaveRoutines = () => {
    const updated = {
      ...routineSettings,
      showRoutinesOnSchedule: showRoutines,
      lunchTime: normalizeTimeString(lunchTime),
      dinnerTime: normalizeTimeString(dinnerTime)
    };
    onSaveRoutineSettings(updated);
    setRoutineSavedToast(true);
    setTimeout(() => setRoutineSavedToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cài Đặt & API Key</h3>
              <p className="text-xs text-slate-400">Lưu độc lập trên máy của bạn (LocalStorage)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Tên người dùng */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tên của bạn:</span>
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
            />
          </div>

          {/* Ô nhập Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Gemini API Key Cá Nhân (Tùy chọn cho AI Command):</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 underline"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy... (Nếu muốn ra lệnh AI bằng giọng văn tự nhiên)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                onClick={handleSaveProfileAndKey}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {savedToast ? <Check className="w-4 h-4" /> : null}
                <span>{savedToast ? 'Đã lưu!' : 'Lưu'}</span>
              </button>
            </div>
          </div>

          {/* Cài đặt Nhịp Sinh Hoạt (Ăn uống / Nghỉ ngơi) */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-purple-400" />
                <span>Nhịp Sinh Hoạt Cố Định (Ăn uống, Nghỉ ngơi):</span>
              </p>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRoutines}
                  onChange={(e) => setShowRoutines(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>Hiện trên TKB</span>
              </label>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <p className="text-[11px] text-slate-400">
                💡 Các khung giờ này đóng vai trò mỏ neo sinh hoạt, được <strong>miễn nhiễm</strong> với cảnh báo quá giờ và không gây tiến độ ảo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Giờ ăn & nghỉ trưa:</label>
                  <input
                    type="text"
                    value={lunchTime}
                    onChange={(e) => setLunchTime(e.target.value)}
                    onBlur={() => setLunchTime(normalizeTimeString(lunchTime))}
                    placeholder="12:00 - 13:00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Giờ ăn tối & thư giãn:</label>
                  <input
                    type="text"
                    value={dinnerTime}
                    onChange={(e) => setDinnerTime(e.target.value)}
                    onBlur={() => setDinnerTime(normalizeTimeString(dinnerTime))}
                    placeholder="18:30 - 19:30"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveRoutines}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  {routineSavedToast ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{routineSavedToast ? 'Đã lưu nhịp sinh hoạt!' : 'Lưu Nhịp Sinh Hoạt'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Làm mới Bảng làm việc */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Làm mới Bảng làm việc:</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Dọn sạch toàn bộ công việc cũ để bắt đầu ngày mới hoặc chu kỳ kế hoạch mới.
            </p>
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn dọn sạch bảng để bắt đầu lại từ bảng trắng không?')) {
                  onClearToBlank();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-rose-300 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Xóa sạch công việc (Về Bảng trắng)</span>
            </button>
          </div>

          {/* Sao lưu / Khôi phục file JSON */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <p className="text-xs font-semibold text-slate-200">📦 Sao lưu & Chuyển dữ liệu sang máy khác:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tải file Backup (.json)</span>
              </button>
              <button
                onClick={() => setShowJsonImport(!showJsonImport)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nhập dữ liệu từ JSON</span>
              </button>
              <button
                onClick={() =>
                  exportScheduleToIcsFile(schedule, {
                    todayDateKey: new Date().toISOString().slice(0, 10)
                  } as any)
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Xuất file Lịch (.ics)</span>
              </button>
            </div>

            {showJsonImport && (
              <div className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  placeholder="Dán nội dung file JSON backup vào đây..."
                  value={jsonImportText}
                  onChange={(e) => setJsonImportText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono outline-none"
                />
                {importError && <p className="text-xs text-rose-400">{importError}</p>}
                <button
                  onClick={handleImportJson}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Xác nhận Khôi phục
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
