export default function PageContainer({ title, children }) {
  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
      {children}
    </div>
  )
}
