import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    // 프로덕션에서는 Sentry 등 외부 로거로 전송 가능
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', _error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-boundary" role="alert">
          <p className="error-boundary__msg">화면을 불러오는 중 오류가 발생했습니다.</p>
          <button className="error-boundary__btn" onClick={this.handleReset}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
