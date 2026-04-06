'use client';
import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export function Button({ variant = 'secondary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const v = { primary: 'bg-blue-600 text-white hover:bg-blue-700', secondary: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50', danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100', success: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100', ghost: 'text-slate-500 hover:bg-slate-100' };
  const s = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
  return (
    <button className={cn('inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed', v[variant], s[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}{children}
    </button>
  );
}

// Badge
interface BadgeProps { variant?: 'default' | 'red' | 'green' | 'amber' | 'blue' | 'gray'; children: React.ReactNode; className?: string; }
export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const v = { default: 'bg-slate-100 text-slate-600 border-slate-200', red: 'bg-red-50 text-red-700 border-red-200', green: 'bg-green-50 text-green-700 border-green-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', gray: 'bg-slate-100 text-slate-500 border-slate-200' };
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border font-mono-custom', v[variant], className)}>{children}</span>;
}

// Card
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-white border border-slate-100 rounded-xl', className)} {...props}>{children}</div>;
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between px-5 py-3.5 border-b border-slate-100', className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-[13px] font-medium text-slate-800', className)}>{children}</h3>;
}

// Input
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono-custom">{label}</label>}
      <input ref={ref} className={cn('w-full px-3 py-2 text-sm bg-white border rounded-md outline-none transition-colors text-slate-800 border-slate-200 focus:border-blue-500', error && 'border-red-400', className)} {...props} />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

// Select
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono-custom">{label}</label>}
      <select ref={ref} className={cn('w-full px-3 py-2 text-sm bg-white border rounded-md outline-none transition-colors text-slate-800 border-slate-200 focus:border-blue-500', error && 'border-red-400', className)} {...props}>{children}</select>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

// Textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ label, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono-custom">{label}</label>}
      <textarea ref={ref} className={cn('w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500 resize-none text-slate-800', className)} {...props} />
    </div>
  ),
);
Textarea.displayName = 'Textarea';

// Modal
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string; }
export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn('bg-white rounded-xl shadow-2xl w-full mx-4 overflow-hidden', width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900 font-display">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100", className)}>{children}</div>;
}

// StatCard
export function StatCard({ label, value, sub, accent = '#2563eb', valueClass, icon: Icon }: { label: string; value: string | number; sub?: string; accent?: string; valueClass?: string; icon?: any }) {
  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] font-mono-custom">{label}</p>
          {Icon && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/20" style={{ background: accent }}>
               <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className={cn('font-bold leading-none mb-1.5 font-display tracking-tight', valueClass || 'text-slate-900 text-3xl')}>{value}</p>
            {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// QtyBar
export function QtyBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  const color = value <= min ? '#dc2626' : value <= min * 1.5 ? '#d97706' : '#16a34a';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 rounded-full overflow-hidden bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-medium min-w-[28px] text-right font-mono-custom" style={{ color }}>{value}</span>
    </div>
  );
}

// PageHeader
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight font-display">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 font-mono-custom">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// PageLoading
export function PageLoading() {
  return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
}

// InfoBanner
interface InfoBannerProps { type?: 'info' | 'warning' | 'success'; children: React.ReactNode; className?: string; }
export function InfoBanner({ type = 'info', children, className }: InfoBannerProps) {
  const s = { info: 'bg-blue-50 border-blue-200 text-blue-700', warning: 'bg-amber-50 border-amber-200 text-amber-700', success: 'bg-green-50 border-green-200 text-green-700' };
  return <div className={cn('px-4 py-3 rounded-lg border text-[12px]', s[type], className)}>{children}</div>;
}
