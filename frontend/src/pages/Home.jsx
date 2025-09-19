import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-primary">
        Welcome to Fitness Tracker
      </h2>
      <p className="text-slate-600">
        Đây là demo UI với shadcn + Tailwind + React JSX.
      </p>
      <div className="space-x-2">
        <Button>Default</Button>
        <Button className="bg-primary text-primary-foreground">Primary</Button>
        <Button className="bg-secondary text-secondary-foreground">
          Secondary
        </Button>
      </div>
    </div>
  );
}
