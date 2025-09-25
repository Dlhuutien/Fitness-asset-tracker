import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function StaffCard({ staff }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <Card className="p-4 rounded-2xl shadow-md bg-white hover:shadow-lg transition">
        <div className="flex items-center gap-4">
          {/* Avatar ảo bằng chữ cái đầu */}
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-white text-xl font-bold">
            {staff.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{staff.name}</h2>
            <p className="text-sm text-gray-500">{staff.role}</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p>
            <b>Email:</b> {staff.email}
          </p>
          <p>
            <b>SĐT:</b> {staff.phone}
          </p>
          <p>
            <b>Ngày vào làm:</b> {staff.startDate}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
