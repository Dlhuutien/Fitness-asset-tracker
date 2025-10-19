import { useState } from "react";
import Notification from "./Notification";
import UserMenu from "./UserMenu";
import Logout from "./Logout";
import ThemeSwitch from "@/components/common/ThemeSwitch";
import Branch from "@/components/common/Branch";
import useAuthRole from "@/hooks/useAuthRole";

export default function Header() {
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Lấy thông tin người dùng & quyền từ hook
  const { username, branchId, isSuperAdmin } = useAuthRole();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 
                   flex h-16 items-center justify-between 
                   border-b border-gray-200 bg-white/70 
                   px-4 backdrop-blur-xl shadow-sm 
                   dark:border-gray-800 dark:bg-gray-900/70"
      >
        {/* Hiển thị branch hiện tại ở giữa (trừ super-admin) */}
        <div className="flex-1 flex justify-center items-center">
          {!isSuperAdmin && branchId && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm bg-emerald-100/60 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
              <span>🏢 Chi nhánh đang làm việc:</span>
              <Branch id={branchId} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <Notification />
          <UserMenu
            username={username || "Người dùng"}
            onLogoutClick={() => setLogoutOpen(true)}
          />
        </div>
      </header>

      <Logout open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}