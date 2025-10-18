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
      {/* ✅ Header cố định */}
      <header
        className="fixed top-0 left-0 right-0 z-40 
                   flex h-16 items-center justify-between 
                   border-b border-gray-200 bg-white/70 
                   px-4 backdrop-blur-xl shadow-sm 
                   dark:border-gray-800 dark:bg-gray-900/70"
      >
        <div />
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
// import { useState } from "react";
// import Notification from "./Notification";
// import UserMenu from "./UserMenu";
// import Logout from "./Logout";
// import ThemeSwitch from "@/components/common/ThemeSwitch";

// export default function Header({ username = "Admin" }) {
//   const [logoutOpen, setLogoutOpen] = useState(false);

//   return (
//     <>
//       {/* ✅ Header cố định */}
//       <header
//         className="fixed top-0 left-0 right-0 z-40
//                    flex h-16 items-center justify-between
//                    border-b border-gray-200 bg-white/70
//                    px-4 backdrop-blur-xl shadow-sm
//                    dark:border-gray-800 dark:bg-gray-900/70"
//       >
//         <div />
//         <div className="flex items-center gap-3">
//           <ThemeSwitch />
//           <Notification />
//           <UserMenu
//             username={username}
//             onLogoutClick={() => setLogoutOpen(true)}
//           />
//         </div>
//       </header>

//       <Logout open={logoutOpen} onClose={() => setLogoutOpen(false)} />
//     </>
//   );
// }
