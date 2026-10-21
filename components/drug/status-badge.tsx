import type { DrugStatus } from "@/lib/data/types";

const STATUS = {
  active: { label: "فعال", className: "bg-[#eaf7f0] text-[#1c825f] ring-[#d3eee2]", dot: "bg-[#2ba57c]" },
  transitional: {
    label: "انتقالی",
    className: "bg-[#fdf4e6] text-[#a86e19] ring-[#f1e1c7]",
    dot: "bg-[#d79a3c]",
  },
  discontinued: {
    label: "توقف تولید",
    className: "bg-[#fdeef1] text-[#b84a63] ring-[#f3d7de]",
    dot: "bg-[#cf5570]",
  },
} satisfies Record<DrugStatus, { label: string; className: string; dot: string }>;

export function StatusBadge({ status, small = false }: { status: DrugStatus; small?: boolean }) {
  const config = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ring-1 ${config.className} ${
        small ? "px-1.5 py-[1px] text-[9px]" : "px-2 py-0.5 text-[9.5px]"
      }`}
    >
      <span className={`h-1 w-1 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
