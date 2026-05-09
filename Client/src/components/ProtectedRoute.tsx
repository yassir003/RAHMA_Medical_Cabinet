"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side route guard.
 * - While auth is loading → shows a centered spinner
 * - If not authenticated → redirects to /login
 * - Otherwise → renders children
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/dashboard/patient/chat") return;
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!isLoading && isAuthenticated && user?.passwordChanged === false) {
      router.replace("/change-password");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e2e8f0",
            borderTopColor: "var(--primary, #2fb5fc)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/dashboard/patient/chat") {
    return null; // Will redirect via the useEffect above
  }

  if (user?.passwordChanged === false) {
    return null; // Will redirect to /change-password via the useEffect above
  }

  return <>{children}</>;
}
