
import { Outlet } from 'react-router-dom';

import components from '../components/components';
import BackToTop from '../components/BackToTop';

const ConsumerLayout = () => {

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <components.Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <components.Footer />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default ConsumerLayout;