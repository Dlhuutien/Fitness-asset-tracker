export function Card({ className, children }) {
  return (
    <div
      className={`p-10 rounded-3xl bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 
                  border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,255,180,0.15)] 
                  transition-transform hover:scale-[1.01] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="mb-6">{children}</div>;
}

export function CardTitle({ children }) {
  return (
    <h2 className="text-center text-4xl font-extrabold 
                   bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 
                   bg-clip-text text-transparent drop-shadow-md">
      {children}
    </h2>
  );
}

export function CardContent({ className, children }) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={`flex justify-between text-sm text-gray-400 ${className}`}>{children}</div>;
}
