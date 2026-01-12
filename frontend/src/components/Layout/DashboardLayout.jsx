import Topbar from "./Topbar";

export default function DashboardLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar title={title} />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
