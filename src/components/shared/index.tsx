import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2, Users } from 'lucide-react';
import type { Course, CourseLevel } from '../../types';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-accent-600 hover:bg-accent-500 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-100 border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-100 border-white/10 hover:border-accent-500/40',
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
    className={`inline-flex items-center justify-center font-mono font-medium rounded-lg border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
    className={`animate-spin text-accent-400 ${className}`}
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
  purple: 'bg-accent-500/10 text-accent-300 border-accent-500/20',
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
    className={`card ${hover ? 'hover:border-accent-500/20 hover:shadow-glow transition-all duration-200 cursor-pointer' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ─── Count Up Number ──────────────────────────────────────────────────────────
export const CountUpNumber: React.FC<{
  value: number;
  suffix?: string;
  className?: string;
  durationMs?: number;
}> = ({ value, suffix = '', className = '', durationMs = 260 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      displayValueRef.current = value;
      return;
    }

    let frameId = 0;
    const start = performance.now();
    const from = displayValueRef.current;
    const delta = value - from;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(from + delta * eased);
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, value]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────
const courseLevelColors: Record<CourseLevel, 'green' | 'amber' | 'red'> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'amber',
  ADVANCED: 'red',
};

const getCourseLevelColor = (level?: CourseLevel): 'green' | 'amber' | 'red' | 'gray' => {
  if (!level) return 'gray';
  return courseLevelColors[level] ?? 'gray';
};

export const CourseCard: React.FC<{
  course: Course;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}> = ({ course, onClick, compact = false, className = '' }) => (
  <Card
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    }}
    className={`group overflow-hidden transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-accent-500/30 hover:shadow-glow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    <div className={`${compact ? 'h-24' : 'h-28'} bg-gradient-to-br from-accent-900/30 to-surface-muted flex items-center justify-center border-b border-white/[0.05] relative overflow-hidden`}>
      {course.thumbnailUrl ? (
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          unoptimized
          className="w-full h-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.03]"
        />
      ) : (
        <BookOpen size={compact ? 24 : 28} className="text-accent-500/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface/70 to-transparent" />
      <div className="absolute top-2 left-2 flex gap-1.5">
        <Badge color={getCourseLevelColor(course.level)}>{course.level?.slice(0, 3) ?? 'N/A'}</Badge>
        {course.isPremium && <Badge color="amber">Premium</Badge>}
      </div>
      {!course.isPublished && (
        <div className="absolute top-2 right-2">
          <Badge color="gray">Draft</Badge>
        </div>
      )}
    </div>

    <div className={compact ? 'p-3' : 'p-4'}>
      <h3 className="font-mono font-semibold text-gray-300 text-sm leading-tight line-clamp-2 transition-colors group-hover:text-accent-300">
        {course.title}
      </h3>
      {course.description && (
        <p className="text-xs text-gray-500 font-mono line-clamp-2 mt-2">
          {course.shortDescription || course.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-3">
        <span className="flex items-center gap-1">
          <BookOpen size={11} />
          {course.totalLessons ?? course.lessonCount ?? 0} lessons
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {course.totalEnrollments ?? course.enrollmentCount ?? 0}
        </span>
        {course.language && <span className="tag">{course.language}</span>}
      </div>

      {course.tags && course.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {course.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  </Card>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar: React.FC<{
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, name = '?', size = 'md', className = '' }) => {
  const sizeMap = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-14 h-14 text-xl' };
  const widthHeightMap = { sm: 24, md: 32, lg: 40, xl: 56 };
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return src ? (
    <Image
      src={src}
      alt={name}
      width={widthHeightMap[size]}
      height={widthHeightMap[size]}
      className={`rounded-full object-cover ${className}`}
      unoptimized
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center font-mono font-medium text-white ${sizeMap[size]} ${className}`}
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
    {icon && <div className="text-gray-500">{icon}</div>}
    <div>
      <p className="text-gray-300 font-mono font-medium">{title}</p>
      {description && (
        <p className="text-gray-500 text-sm font-mono mt-1">{description}</p>
      )}
    </div>
    {action}
  </div>
);
