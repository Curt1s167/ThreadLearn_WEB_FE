import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-100 border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-100 border-white/10 hover:border-violet-500/40',
  danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center font-mono font-medium rounded-lg border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Loader2 className="animate-spin" size={14} />}
    {children}
  </button>
);

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-400 font-mono">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-600">{prefix}</span>
        )}
        <input
          ref={ref}
          className={`input-field ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} ${error ? 'border-rose-500/50 focus:ring-rose-500/20' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-600">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <Loader2
    size={size}
    className={`animate-spin text-violet-400 ${className}`}
  />
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{
  className?: string;
  count?: number;
}> = ({ className = '', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`skeleton ${className}`} />
    ))}
  </>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'purple' | 'green' | 'amber' | 'red' | 'gray';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

const badgeColorClasses: Record<BadgeColor, string> = {
  purple: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  gray: 'bg-white/5 text-gray-400 border-white/10',
};

export const Badge: React.FC<BadgeProps> = ({
  color = 'purple',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${badgeColorClasses[color]} ${className}`}
  >
    {children}
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
> = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`card ${hover ? 'hover:border-violet-500/20 hover:shadow-glow transition-all duration-200 cursor-pointer' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar: React.FC<{
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, name = '?', size = 'md', className = '' }) => {
  const sizeMap = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-14 h-14 text-xl' };
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return src ? (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover ${sizeMap[size]} ${className}`}
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center font-mono font-medium text-white ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`border-t border-white/[0.06] ${className}`} />
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    {icon && <div className="text-gray-600">{icon}</div>}
    <div>
      <p className="text-gray-300 font-mono font-medium">{title}</p>
      {description && (
        <p className="text-gray-600 text-sm font-mono mt-1">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export { CodeEditor } from './CodeEditor';
