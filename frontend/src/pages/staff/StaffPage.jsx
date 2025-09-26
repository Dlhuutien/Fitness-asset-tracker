import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";

const staffData = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "vana@example.com",
    role: "Quản lý",
    status: "active",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "thib@example.com",
    role: "Nhân viên",
    status: "inactive",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "vanc@example.com",
    role: "Kỹ thuật viên",
    status: "active",
  },
];

export default function StaffListPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>
        <Button>+ Thêm nhân viên</Button>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Tên nhân viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Chức vụ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData.map((staff, idx) => (
              <TableRow key={staff.id} className="hover:bg-gray-50">
                <TableCell>{idx + 1}</TableCell>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>
                  {staff.status === "active" ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Ngưng</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="icon" variant="outline">
                    <Pencil size={16} />
                  </Button>
                  <Button size="icon" variant="destructive">
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
