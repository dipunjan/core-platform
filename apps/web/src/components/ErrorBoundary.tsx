import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorPanel } from './ErrorPanel';

type Props = {
  children: ReactNode;
  homeHref: string;
  homeLabel: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPanel
          error={this.state.error}
          homeHref={this.props.homeHref}
          homeLabel={this.props.homeLabel}
        />
      );
    }
    return this.props.children;
  }
}
