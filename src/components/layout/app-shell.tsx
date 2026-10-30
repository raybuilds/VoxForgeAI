import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AmbientBackground } from "@/components/visual/ambient-background";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-page text-text-primary relative selection:bg-aqua/20 selection:text-aqua">
      {/* Central Ambient Background Component */}
      <AmbientBackground />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header title={title} description={description} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
