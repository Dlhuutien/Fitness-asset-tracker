import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full h-14 rounded-2xl border border-gray-300/50 bg-white/70 dark:bg-gray-900/50 px-4 text-base transition focus:border-green-400 focus:ring-2 focus:ring-green-300/40 outline-none",
        className
      )}
      {...props}
    />
  );
}
