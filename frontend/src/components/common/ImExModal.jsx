import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ImExModal({ open, onClose, title = "Xem trước file", rows = [] }) {
  if (!open) return null;
  if (!rows || rows.length === 0) return null;

  const headers = Object.keys(rows[0] ?? {});
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl">
        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Đóng
            </button>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[70vh]">
            <table className="w-full text-xs border border-gray-200 dark:border-gray-700">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-2 py-1 text-left border-b dark:border-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t dark:border-gray-700">
                    {headers.map((h) => (
                      <td key={h} className="px-2 py-1">
                        {String(r?.[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-center text-gray-500 mt-2">
              Hiển thị trước {rows.length} dòng
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
