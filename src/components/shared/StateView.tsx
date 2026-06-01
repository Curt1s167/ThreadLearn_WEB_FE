import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, FileSearch, Lock, Loader2, RefreshCw, ServerCrash,
} from 'lucide-react';
import { Button } from './index';

interface BaseProps {
  title?:       string;
  description?: string;
  action?:      React.ReactNode;
  className?:   string;
}

const Wrapper: React.FC<{
  children: React.ReactNode; tone: 'violet' | 'amber' | 'rose' | 'gray'; className?: string;
}> = ({ children, tone, className }) => {
  const ring: Record<typeof tone, string> = {
    violet: 'from-violet-500/[0.06] to-transparent',
    amber:  'from-amber-500/[0.06] to-transparent',
    rose:   'from-rose-500/[0.06] to-transparent',
    gray:   'from-white/[0.04] to-transparent',
  } as const;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6
                  rounded-2xl border border-white/[0.06] bg-gradient-to-br ${ring[tone]} ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
};

/** Generic page-level loading shell. Use Skeleton for inline list/table loading. */
export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Đang tải…' }) => (
  <Wrapper tone="gray">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
    >
      <Loader2 size={28} className="text-violet-400" />
    </motion.div>
    <p className="text-sm font-mono text-gray-500">{label}</p>
  </Wrapper>
);

export const EmptyView: React.FC<BaseProps & { icon?: React.ReactNode }> = ({
  icon = <FileSearch size={28} />,
  title = 'Chưa có dữ liệu',
  description = 'Khi có dữ liệu mới, nó sẽ hiển thị ở đây.',
  action,
  className,
}) => (
  <Wrapper tone="gray" className={className}>
    <div className="text-gray-600">{icon}</div>
    <div>
      <p className="text-sm font-mono font-medium text-gray-200">{title}</p>
      <p className="text-xs font-mono text-gray-600 mt-1 max-w-sm">{description}</p>
    </div>
    {action}
  </Wrapper>
);

export const ErrorView: React.FC<BaseProps & { onRetry?: () => void }> = ({
  title = 'Có lỗi xảy ra',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  action,
  className,
}) => (
  <Wrapper tone="rose" className={className}>
    <div className="text-rose-400"><ServerCrash size={28} /></div>
    <div>
      <p className="text-sm font-mono font-medium text-gray-100">{title}</p>
      <p className="text-xs font-mono text-gray-500 mt-1 max-w-sm">{description}</p>
    </div>
    {action ?? (onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw size={12}/> Thử lại
      </Button>
    ))}
  </Wrapper>
);

export const UnauthorizedView: React.FC<BaseProps> = ({
  title = 'Cần đăng nhập',
  description = 'Bạn cần đăng nhập để truy cập trang này.',
  action,
  className,
}) => (
  <Wrapper tone="amber" className={className}>
    <div className="text-amber-400"><Lock size={28} /></div>
    <div>
      <p className="text-sm font-mono font-medium text-gray-100">{title}</p>
      <p className="text-xs font-mono text-gray-500 mt-1 max-w-sm">{description}</p>
    </div>
    {action}
  </Wrapper>
);

export const NotFoundView: React.FC<BaseProps> = ({
  title = 'Không tìm thấy',
  description = 'Nội dung bạn tìm không tồn tại hoặc đã bị xóa.',
  action,
  className,
}) => (
  <Wrapper tone="gray" className={className}>
    <div className="text-gray-500"><AlertCircle size={28} /></div>
    <div>
      <p className="text-sm font-mono font-medium text-gray-100">{title}</p>
      <p className="text-xs font-mono text-gray-500 mt-1 max-w-sm">{description}</p>
    </div>
    {action}
  </Wrapper>
);
