import { motion } from "framer-motion"

export default function PageContainer({ children }) {
  return (
    <div className="max-w-8xl mx-auto w-full">
      <div className="rounded-xl border bg-white shadow-md p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}
