import { Calendar, HeartHandshake } from "lucide-react";

import { cn } from "./ui/utils";

export type VolunteerAreaTab = "patients" | "hours";

interface VolunteerAreaTabsProps {
  activeTab: VolunteerAreaTab;
  onChange: (tab: VolunteerAreaTab) => void;
}

const tabs: Array<{
  id: VolunteerAreaTab;
  label: string;
  description: string;
  icon: typeof HeartHandshake;
}> = [
  {
    id: "patients",
    label: "Pacientes",
    description: "Encaminhamentos e acompanhamento",
    icon: HeartHandshake,
  },
  {
    id: "hours",
    label: "Atividades voluntárias",
    description: "Agenda e registro de horas",
    icon: Calendar,
  },
];

export function VolunteerAreaTabs({
  activeTab,
  onChange,
}: VolunteerAreaTabsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3 rounded-3xl border border-pink-100 bg-white p-3 shadow-sm shadow-pink-100/40">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex min-w-[220px] flex-1 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
              isActive
                ? "border-pink-200 bg-pink-50 text-[var(--primary)]"
                : "border-transparent bg-white text-[var(--muted-foreground)] hover:border-pink-100 hover:bg-pink-50/60",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl",
                isActive ? "bg-white text-[var(--primary)]" : "bg-pink-50 text-pink-400",
              )}
            >
              <Icon size={18} />
            </span>
            <span className="block">
              <span className="block text-sm font-semibold text-[var(--foreground)]">
                {tab.label}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                {tab.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
