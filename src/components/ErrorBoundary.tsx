import { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#0a0e17] flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              
              <h2 className="text-lg font-semibold text-slate-200 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                An error occurred while rendering the application. This usually happens with certain file types or very large files.
              </p>
              
              {this.state.error && (
                <div className="bg-[#0a0e17] rounded-lg p-4 mb-6 text-left overflow-hidden">
                  <p className="text-xs font-mono text-red-400/80 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
