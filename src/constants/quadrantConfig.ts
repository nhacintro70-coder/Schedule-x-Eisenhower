import { Flame, CalendarClock, Zap, Coffee } from 'lucide-react';
import { QuadrantId, QuadrantConfigItem } from '../types';

export const QUADRANT_CONFIG: Record<QuadrantId, QuadrantConfigItem> = {
  q1: {
    id: 'q1',
    code: 'P1',
    title: '🔥 ƯU TIÊN 1: LÀM NGAY',
    subtitle: 'Quan trọng & Khẩn cấp',
    strategy: 'Cách xử lý: Dồn toàn lực giải quyết dứt điểm ngay',
    icon: Flame,
    border: 'border-rose-500/40 hover:border-rose-500/70',
    dragOverBorder: 'border-rose-400 ring-2 ring-rose-500/50 bg-rose-950/60 scale-[1.01]',
    bg: 'bg-rose-950/25',
    headerBg: 'bg-rose-500/15 border-b border-rose-500/25',
    badge: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
    accentText: 'text-rose-400',
    checkboxColor: 'text-rose-400'
  },
  q2: {
    id: 'q2',
    code: 'P2',
    title: '🗓️ ƯU TIÊN 2: LÊN LỊCH',
    subtitle: 'Quan trọng & Không khẩn cấp',
    strategy: 'Cách xử lý: Chia nhỏ và xếp khung giờ cố định vào TKB',
    icon: CalendarClock,
    border: 'border-cyan-500/35 hover:border-cyan-400/60',
    dragOverBorder: 'border-cyan-400 ring-2 ring-cyan-500/50 bg-cyan-950/60 scale-[1.01]',
    bg: 'bg-cyan-950/20',
    headerBg: 'bg-cyan-500/15 border-b border-cyan-500/25',
    badge: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40',
    accentText: 'text-cyan-400',
    checkboxColor: 'text-cyan-400'
  },
  q3: {
    id: 'q3',
    code: 'P3',
    title: '⚡ ƯU TIÊN 3: XỬ LÝ NHANH',
    subtitle: 'Không quan trọng & Khẩn cấp',
    strategy: 'Cách xử lý: Giải quyết nhanh lúc nghỉ giải lao',
    icon: Zap,
    border: 'border-amber-500/35 hover:border-amber-400/60',
    dragOverBorder: 'border-amber-400 ring-2 ring-amber-500/50 bg-amber-950/60 scale-[1.01]',
    bg: 'bg-amber-950/20',
    headerBg: 'bg-amber-500/15 border-b border-amber-500/25',
    badge: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
    accentText: 'text-amber-400',
    checkboxColor: 'text-amber-400'
  },
  q4: {
    id: 'q4',
    code: 'P4',
    title: '🛋️ ƯU TIÊN 4: ĐỂ SAU',
    subtitle: 'Không quan trọng & Không khẩn cấp',
    strategy: 'Cách xử lý: Chỉ làm vào cuối ngày hoặc khi thật sự rảnh',
    icon: Coffee,
    border: 'border-purple-500/35 hover:border-purple-400/60',
    dragOverBorder: 'border-purple-400 ring-2 ring-purple-500/50 bg-purple-950/60 scale-[1.01]',
    bg: 'bg-purple-950/20',
    headerBg: 'bg-purple-500/15 border-b border-purple-500/25',
    badge: 'bg-purple-500/25 text-purple-200 border-purple-400/40',
    accentText: 'text-purple-400',
    checkboxColor: 'text-purple-400'
  }
};
