import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BookOpen, Clock, Code2, Loader2, Star, Users } from 'lucide-react';
import type { Course, CourseLevel } from '../../types';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-black hover:bg-black/85 text-white border-transparent rounded-full',
  ghost: 'bg-transparent hover:bg-black/[0.05] text-ink-muted hover:text-ink border-transparent',
  outline: 'bg-transparent hover:bg-black/[0.03] text-ink-muted hover:text-ink border-black/10 hover:border-black/25',
  danger: 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 border-rose-500/20',
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
    className={`inline-flex items-center justify-center font-medium border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
        <label className="text-xs text-ink-muted font-medium">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-ink-faint">{prefix}</span>
        )}
        <input
          ref={ref}
          className={`input-field ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} ${error ? 'border-rose-500/50 focus:ring-rose-500/20' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-ink-faint">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
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
    className={`animate-spin text-ink-muted ${className}`}
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
  purple: 'bg-black/5 text-ink border-black/10',
  green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  red: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  gray: 'bg-black/[0.04] text-ink-muted border-black/10',
};

export const Badge: React.FC<BadgeProps> = ({
  color = 'purple',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badgeColorClasses[color]} ${className}`}
  >
    {children}
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
> = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`card ${hover ? 'hover:border-black/20 hover:shadow-glow transition-all duration-200 cursor-pointer' : ''} ${className}`}
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

// ─── Course Card (PR10 demo-fidelity) ─────────────────────────────────────────
const COURSE_ACCENTS = ['bg-[#d9f99d]', 'bg-[#f5d0fe]', 'bg-[#bfdbfe]', 'bg-[#fde68a]'];

const levelPillClass = (level?: CourseLevel) => {
  if (level === 'BEGINNER') return 'bg-[#d9f99d] text-black';
  if (level === 'INTERMEDIATE') return 'bg-[#f5d0fe] text-black';
  if (level === 'ADVANCED') return 'bg-[#bfdbfe] text-black';
  return 'bg-black text-white';
};

export const CourseCard: React.FC<{
  course: Course;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}> = ({ course, onClick, compact = false, className = '' }) => {
  const accent = COURSE_ACCENTS[(course.title?.length ?? 0) % COURSE_ACCENTS.length];
  const lessons = course.totalLessons ?? course.lessonCount ?? 0;
  const learners = course.totalEnrollments ?? course.enrollmentCount ?? 0;
  const duration = course.estimatedDuration;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`group block overflow-hidden rounded-lg border border-black/10 bg-white transition-all duration-200 motion-safe:hover:-translate-y-1 hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={`relative overflow-hidden ${compact ? 'aspect-[16/9] max-h-28' : 'aspect-video'} ${accent} p-4 sm:p-5`}>
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.03]"
          />
        ) : null}
        <div className={`relative flex h-full flex-col justify-between rounded-md bg-white/65 p-4 ${course.thumbnailUrl ? 'bg-white/80 backdrop-blur-[1px]' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <Code2 size={compact ? 20 : 26} className="text-ink shrink-0" />
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {course.level ? (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${levelPillClass(course.level)}`}>
                  {course.level.toLowerCase()}
                </span>
              ) : null}
              {course.isPremium ? (
                <span className="inline-flex rounded-full bg-black px-2.5 py-0.5 text-[10px] font-medium text-white">
                  Premium
                </span>
              ) : null}
              {!course.isPublished ? (
                <span className="inline-flex rounded-full bg-black/10 px-2.5 py-0.5 text-[10px] font-medium text-black/55">
                  Draft
                </span>
              ) : null}
            </div>
          </div>
          <div>
            {course.language ? (
              <p className="text-xs uppercase tracking-[0.18em] text-black/45">{course.language}</p>
            ) : null}
            <p className={`mt-1 font-semibold text-ink leading-snug line-clamp-2 ${compact ? 'text-base' : 'text-lg'}`}>
              {course.title}
            </p>
          </div>
        </div>
      </div>

      <div className={compact ? 'p-4' : 'p-5'}>
        {(course.shortDescription || course.description) ? (
          <p className="line-clamp-2 min-h-11 text-sm text-black/60">
            {course.shortDescription || course.description}
          </p>
        ) : null}

        {course.tags && course.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-black/[0.04] px-2 py-1 text-xs text-black/55">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4 text-xs text-black/50">
          <span className="flex items-center gap-1">
            <BookOpen size={13} />
            {lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {learners.toLocaleString()}
          </span>
          {duration != null && duration > 0 ? (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {duration} min
            </span>
          ) : course.averageRating != null ? (
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
              {course.averageRating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

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
      className={`rounded-full bg-brand-lime text-ink flex items-center justify-center font-medium ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`border-t border-black/10 ${className}`} />
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    {icon && <div className="text-ink-faint">{icon}</div>}
    <div>
      <p className="text-ink font-medium">{title}</p>
      {description && (
        <p className="text-ink-muted text-sm mt-1">{description}</p>
      )}
    </div>
    {action}
  </div>
);
