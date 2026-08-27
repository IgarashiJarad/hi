import { Crown, Code2, Zap } from "lucide-react";

const ICONS = { crown: Crown, code: Code2, zap: Zap };

export function RolePills({ roles = [] }) {
  if (!roles.length) return null;
  return (
    <span data-testid="role-pills" className="inline-flex flex-wrap items-center gap-1.5">
      {roles.map((r) => {
        const Icon = ICONS[r.icon] || Zap;
        return (
          <span
            key={r.id}
            data-testid={`role-pill-${r.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={{ borderColor: `${r.color}44`, backgroundColor: `${r.color}14`, color: r.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
            {r.label}
            <Icon size={11} />
          </span>
        );
      })}
    </span>
  );
}
