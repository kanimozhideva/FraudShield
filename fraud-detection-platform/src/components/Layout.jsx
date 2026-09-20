import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children, title = 'Dashboard' }) {
  return (
    <div className="min-h-screen bg-[#0F1B2B] text-[#F4EFE6] flex">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar title={title} />
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
