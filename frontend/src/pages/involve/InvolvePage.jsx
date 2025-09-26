import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const dataBar = [
  { name: "Th1", staff: 12, equipment: 30 },
  { name: "Th2", staff: 18, equipment: 42 },
  { name: "Th3", staff: 25, equipment: 38 },
  { name: "Th4", staff: 20, equipment: 50 },
  { name: "Th5", staff: 28, equipment: 60 },
];

const dataLine = [
  { name: "Tuần 1", usage: 200 },
  { name: "Tuần 2", usage: 320 },
  { name: "Tuần 3", usage: 280 },
  { name: "Tuần 4", usage: 400 },
];

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">📊 Thống kê hệ thống</h1>

      {/* Card 1: Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Nhân viên & Thiết bị theo tháng</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataBar} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="staff" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="equipment" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Card 2: Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tần suất sử dụng thiết bị (theo tuần)</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
