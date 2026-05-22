import { SectionHeaderProps } from "@repo/types";

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-[1px] bg-neutral-800" />
          <span className="text-[10px] tracking-widest uppercase text-neutral-500 font-medium">
            Collection
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-serif text-neutral-900">
          {title}
        </h2>
      </div>
    </div>
  );
}