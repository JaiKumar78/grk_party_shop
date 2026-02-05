import React from 'react';

class CategoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Category section crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="py-12 bg-red-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong rendering this section.</h2>
            <p className="text-red-600">Please refresh the page or try again later.</p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default CategoryErrorBoundary;






