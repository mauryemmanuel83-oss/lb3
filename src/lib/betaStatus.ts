import { BetaStatus } from '../types';

export interface StatusMeta {
  label: string;
  icon: string; // material symbol
  emoji: string;
  // clases tailwind para el chip
  chip: string;
  banner: string;
  message: string;
}

export const STATUS_META: Record<BetaStatus, StatusMeta> = {
  active: {
    label: 'Activa',
    icon: 'check_circle',
    emoji: '✅',
    chip: 'text-green-300 border-green-600/50 bg-green-950/40',
    banner: '',
    message: ''
  },
  holds_changed: {
    label: 'Presas cambiadas',
    icon: 'warning',
    emoji: '⚠️',
    chip: 'text-amber-300 border-amber-500/60 bg-amber-950/50',
    banner: 'border-amber-500/60 bg-amber-950/40 text-amber-200',
    message:
      'Esta Beta fue reportada porque el route setter modificó las presas. La secuencia puede que ya no sea válida.'
  },
  removed: {
    label: 'Ruta removida',
    icon: 'cancel',
    emoji: '❌',
    chip: 'text-red-300 border-red-600/60 bg-red-950/50',
    banner: 'border-red-600/60 bg-red-950/40 text-red-200',
    message: 'Esta ruta fue removida del muro. Se conserva como histórico del gym.'
  }
};
