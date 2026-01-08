"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Skip check for Login page
    if (pathname === "/admin") {
      setIsAuthorized(true);
      return;
    }

    // 2. Check for Token
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      // Not logged in, redirect to login
      router.replace("/admin");
    } else {
      // Logged in, allow access
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Show nothing or loader while checking (prevents flash of protected content)
  if (!isAuthorized && pathname !== "/admin") {
     return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Memverifikasi Sesi...</p>
            </div>
        </div>
     );
  }

  return <>{children}</>;
}
