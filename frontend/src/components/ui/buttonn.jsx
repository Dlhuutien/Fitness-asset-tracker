import { cn } from "@/lib/utils";

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
