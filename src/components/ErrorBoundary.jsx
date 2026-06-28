import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
          <div className="max-w-sm space-y-4">
            <h1 className="text-2xl font-black text-slate-950">Une erreur est survenue</h1>
            <p className="text-sm font-semibold text-slate-500">
              Recharge la page pour continuer. Si le probleme persiste, reessaie plus tard.
            </p>
            <button
              onClick={this.handleReload}
              className="min-h-12 w-full rounded-lg bg-blue-700 px-5 font-black text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
