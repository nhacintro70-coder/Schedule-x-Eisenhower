export const getTagBadgeStyle = (color: string): string => {
  switch (color) {
    case 'rose':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'indigo':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'amber':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'emerald':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
  }
};
