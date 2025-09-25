import StaffHeader from "./StaffHeader"
import StaffCard from "./StaffCard"
import { motion } from "framer-motion"

export default function StaffList() {
  // demo data
  const staffList = [
    {
      id: 1,
      name: "Đặng Lê Hữu Tiến",
      role: "Quản lý",
      email: "danglehuutien@gmail.com",
      phone: "0386474747",
      startDate: "16/01/2025",
    },
    {
      id: 2,
      name: "Nguyễn Văn A",
      role: "Huấn luyện viên",
      email: "nguyenvana@example.com",
      phone: "0912345678",
      startDate: "05/02/2025",
    },
  ]

  return (
    <div className="p-6">
      <StaffHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {staffList.map((s) => (
          <StaffCard key={s.id} staff={s} />
        ))}
      </motion.div>
    </div>
  )
}
