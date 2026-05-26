import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ConfettiLayer } from '../planner/ConfettiLayer';

export function AppShell() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-darkbg">
      <ConfettiLayer />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
