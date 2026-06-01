import React, { Component, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State { hasError: boolean; error: Error | null }
interface Props { children: React.ReactNode; fallback?: React.ReactNode }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[40vh] gap-5 p-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={26} className="text-rose-400" />
          </div>
          <div className="text-center max-w-sm">
            <p className="font-mono font-semibold text-gray-100">Đã có lỗi xảy ra</p>
            <p className="text-sm text-gray-500 font-mono mt-1">
              {this.state.error?.message ?? 'Lỗi không mong muốn. Vui lòng thử tải lại.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 btn-outline text-sm font-mono"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}
