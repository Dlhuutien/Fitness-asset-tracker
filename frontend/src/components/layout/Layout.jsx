import { Button } from "@/components/ui/Button";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between p-4 shadow bg-white">
        <h1 className="font-bold text-xl text-primary">Fitness Tracker</h1>
        <nav className="space-x-2">
          <Button>Home</Button>
          <Button variant="secondary">About</Button>
        </nav>
      </header>
      <main className="p-6">{children}</main>
      <footer className="p-4 text-center text-sm text-slate-500">
        © 2025 Fitness Tracker
      </footer>
    </div>
  );
}
