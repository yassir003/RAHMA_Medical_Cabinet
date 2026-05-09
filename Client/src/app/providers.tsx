"use client";

import ChatWidget from "@/components/ChatWidget";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Client-side providers wrapper.
 * This exists because the root layout is a Server Component (it exports metadata)
 * but AuthProvider needs to be a Client Component.
 */
export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <ChatWidget />
    </AuthProvider>
  );
}
