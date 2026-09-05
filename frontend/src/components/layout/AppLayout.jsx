import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div className="flex relative min-h-screen">
      {/* Ambient background blobs — these are what the frosted glass blurs.
          `fixed` keeps them still while content scrolls.
          `-z-10` puts them behind everything. `pointer-events-none` so
          they never block clicks. */}
      <div className="fixed inset-0 -z-10 bg-slate-50">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <Sidebar />
      <div className="flex-1 h-screen flex flex-col">
        <Topbar />
        <main className="relative z-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}