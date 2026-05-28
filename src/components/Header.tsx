import type { ViewName } from "../types";

interface HeaderProps {
  activeView: ViewName;
  onChangeView: (view: ViewName) => void;
}

const tabs: Array<{ id: ViewName; label: string }> = [
  { id: "today", label: "Today" },
  { id: "calendar", label: "Calendar & Analysis" },
  { id: "settings", label: "Settings" },
];

export function Header({ activeView, onChangeView }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">Go with your flow</p>
        <h1 className="text-3xl font-semibold tracking-normal text-ink">Flux</h1>
      </div>
      <nav className="grid grid-cols-3 rounded-lg border border-white/80 bg-paper/75 p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeView(tab.id)}
            className={`min-h-11 rounded-md px-2 text-center text-sm font-medium transition ${
              activeView === tab.id ? "bg-sageSoft text-ink shadow-sm" : "text-muted hover:bg-white/55"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
