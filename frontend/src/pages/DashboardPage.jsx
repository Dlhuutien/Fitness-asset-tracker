import PageContainer from "@/components/common/PageContainer"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Dumbbell, Truck, BarChart3 } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts"

const dataBar = [
  { name: "T1", thiết_bị: 40, nhân_viên: 15 },
  { name: "T2", thiết_bị: 48, nhân_viên: 18 },
  { name: "T3", thiết_bị: 55, nhân_viên: 22 },
  { name: "T4", thiết_bị: 60, nhân_viên: 25 },
]

const dataLine = [
  { name: "Tuần 1", doanh_thu: 1200 },
  { name: "Tuần 2", doanh_thu: 1800 },
  { name: "Tuần 3", doanh_thu: 1500 },
  { name: "Tuần 4", doanh_thu: 2100 },
]

export default function DashboardPage() {
  return (
    <PageContainer title="👋 Xin chào, Admin!" username="Admin">
      <p className="text-gray-500 mb-6">
        Chào mừng bạn đến với hệ thống quản lý FitX Gym
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border shadow-sm rounded-lg hover:shadow-md transition bg-gradient-to-br from-emerald-50 to-emerald-100/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thiết bị</CardTitle>
            <Dumbbell className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-gray-600">+12 so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-lg hover:shadow-md transition bg-gradient-to-br from-blue-50 to-blue-100/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-gray-600">+3 trong tháng này</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-lg hover:shadow-md transition bg-gradient-to-br from-indigo-50 to-indigo-100/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nhà cung cấp</CardTitle>
            <Truck className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">Ổn định</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-lg hover:shadow-md transition bg-gradient-to-br from-yellow-50 to-yellow-100/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <BarChart3 className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21.5M ₫</div>
            <p className="text-xs text-gray-600">+15% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle>Thiết bị & Nhân viên theo tháng</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBar} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="thiết_bị" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="nhân_viên" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle>Doanh thu theo tuần</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataLine}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="doanh_thu"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
