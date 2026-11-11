import React, { useState } from 'react';
import {
  Calendar,
  X,
  Sparkles,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';
import { ScheduleData, DateInfo } from '../types';
import {
  getStoredGoogleClientId,
  saveStoredGoogleClientId,
  requestGoogleAccessToken,
  syncSlotsToGoogleCalendarApi,
  exportScheduleToIcsFile
} from '../services/googleCalendar';

interface GoogleCalendarModalProps {
  schedule: ScheduleData;
  dateInfo: DateInfo;
  onClose: () => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  schedule,
  dateInfo,
  onClose
}) => {
  const [clientId, setClientId] = useState(() => getStoredGoogleClientId());
  const [targetDay, setTargetDay] = useState<'today' | 'tomorrow' | 'both'>('today');
  const [includeRoutines, setIncludeRoutines] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Trạng thái đồng bộ
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFileProtocol = window.location.protocol === 'file:';

  const handleSaveClientId = () => {
    saveStoredGoogleClientId(clientId);
  };

  const handleStartSync = async () => {
    if (!clientId.trim()) {
      setErrorMessage('Vui lòng nhập Google OAuth Client ID trước khi đồng bộ.');
      return;
    }

    saveStoredGoogleClientId(clientId);
    setErrorMessage(null);
    setSyncResult(null);
    setIsSyncing(true);

    try {
      // 1. Lấy Access Token từ Google OAuth Popup
      const accessToken = await requestGoogleAccessToken(clientId.trim());

      // 2. Thu thập danh sách slots cần đồng bộ
      let slotsToSync: Array<{ slot: any; dateStr: string }> = [];

      const filterSlots = (slots: any[]) =>
        slots.filter((s) => !s.completed && (includeRoutines || (!s.isRoutine && s.tag !== 'Sinh hoạt' && s.tag !== 'Nghỉ ngơi')));

      if (targetDay === 'today' || targetDay === 'both') {
        const todaySlots = filterSlots(schedule.today || []).map((s) => ({
          slot: s,
          dateStr: dateInfo.todayDateKey
        }));
        slotsToSync = [...slotsToSync, ...todaySlots];
      }

      if (targetDay === 'tomorrow' || targetDay === 'both') {
        // Tính dateStr cho ngày mai
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const tomorrowKey = `${yyyy}-${mm}-${dd}`;

        const tomorrowSlots = filterSlots(schedule.tomorrow || []).map((s) => ({
          slot: s,
          dateStr: tomorrowKey
        }));
        slotsToSync = [...slotsToSync, ...tomorrowSlots];
      }

      if (slotsToSync.length === 0) {
        setIsSyncing(false);
        setErrorMessage('Không có khung giờ nào cần đồng bộ (hoặc các việc đều đã hoàn thành).');
        return;
      }

      setProgress({ current: 0, total: slotsToSync.length });

      // 3. Đẩy từng sự kiện lên Google Calendar
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < slotsToSync.length; i++) {
        const item = slotsToSync[i];
        const res = await syncSlotsToGoogleCalendarApi([item.slot], item.dateStr, accessToken);
        successCount += res.success;
        failedCount += res.failed;
        setProgress({ current: i + 1, total: slotsToSync.length });
      }

      setSyncResult({ success: successCount, failed: failedCount });
    } catch (err: any) {
      console.error('Lỗi khi đồng bộ Google Calendar:', err);
      setErrorMessage(
        err.message || 'Không thể kết nối với Google Calendar. Vui lòng kiểm tra lại Client ID và quyền cấp phép.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportIcs = () => {
    exportScheduleToIcsFile(schedule, dateInfo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Đồng Bộ Google Calendar</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  1-Click Direct
                </span>
              </h3>
              <p className="text-xs text-slate-400">Tự động đẩy toàn bộ lịch trình vào tài khoản Google của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cảnh báo nếu mở qua file:/// */}
        {isFileProtocol && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Lưu ý khi mở qua file cục bộ (file:///):</p>
              <p className="mt-0.5 text-[11px]">
                Google Calendar OAuth yêu cầu chạy trên tên miền web (như http://localhost hoặc https://). Nếu bạn đang mở trực tiếp file HTML từ ổ cứng, bạn có thể dùng nút <strong>Xuất file .ics</strong> ở dưới để đưa toàn bộ lịch vào Google Calendar trong 2 giây mà không cần cấu hình!
              </p>
            </div>
          </div>
        )}

        {/* Nhập Client ID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Google OAuth Client ID:</span>
            </label>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Ẩn hướng dẫn' : 'Cách lấy mã miễn phí (2p)'}</span>
              {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="xxxx-xxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              onBlur={handleSaveClientId}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono outline-none"
            />
          </div>

          {/* Hướng dẫn chi tiết */}
          {showGuide && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-2 animate-in fade-in duration-150">
              <p className="font-bold text-blue-300">3 bước tạo Google Client ID miễn phí:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  Truy cập{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline inline-flex items-center gap-0.5"
                  >
                    Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  và tạo 1 Project mới.
                </li>
                <li>
                  Bật thư viện <strong>Google Calendar API</strong> trong mục <em>APIs & Services &gt; Library</em>.
                </li>
                <li>
                  Vào <em>Credentials &gt; Create Credentials &gt; OAuth client ID</em> (chọn Web Application) và copy mã <strong>Client ID</strong> dán vào đây.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Tùy chọn phạm vi đồng bộ */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-200">Chọn lịch trình muốn đồng bộ:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetDay('today')}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                targetDay === 'today'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Hôm nay ({dateInfo.todayShort})
            </button>
            <button
              type="button"
              onClick={() => setTargetDay('tomorrow')}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                targetDay === 'tomorrow'
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Ngày mai ({dateInfo.tomorrowShort})
            </button>
            <button
              type="button"
              onClick={() => setTargetDay('both')}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                targetDay === 'both'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Cả 2 ngày
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeRoutines}
              onChange={(e) => setIncludeRoutines(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span>Đồng bộ cả khung giờ sinh hoạt cố định (Ăn trưa, Ăn tối)</span>
          </label>
        </div>

        {/* Thông báo kết quả / lỗi */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {syncResult && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Đã đồng bộ thành công {syncResult.success} sự kiện lên Google Calendar!</span>
            </div>
            {syncResult.failed > 0 && (
              <p className="text-[11px] text-amber-300">({syncResult.failed} sự kiện không thể đồng bộ)</p>
            )}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 underline pt-1"
            >
              <span>Mở Google Calendar để xem lịch ngay</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Thanh tiến trình khi đang chạy */}
        {isSyncing && progress && (
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Đang đẩy sự kiện lên Google Calendar...</span>
              </span>
              <span className="font-mono font-bold text-blue-400">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200 rounded-full"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Nút hành động chính */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleStartSync}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/50 transition cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý đồng bộ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Đồng bộ 1-Click vào Google Calendar</span>
              </>
            )}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider">
              Hoặc phương án dự phòng
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleExportIcs}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Xuất file .ics (Nhập nhanh cho Google Calendar không cần cài đặt)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
