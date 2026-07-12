'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8">
          <span className="text-4xl mb-4">😥</span>
          <h2 className="text-base font-bold text-[#3d281c] mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            出了点问题
          </h2>
          <p className="text-xs text-[#5c3d2a]/50 mb-4">页面加载出错了</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2 bg-[#aa6f4d] text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
