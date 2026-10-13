'use client';
// Client Component: ใช้ state, useEffect และ Context ซึ่งทำงานได้เฉพาะฝั่ง client

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type AuthUser = { name: string; email: string } | null;

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  refresh: (signal?: AbortSignal) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refresh = useCallback((signal?: AbortSignal) =>
    fetch('/api/me', { cache: 'no-store', signal })
      .then(res => {
        if (!res.ok) throw new Error('Session unavailable');
        return res.json();
      })
      .then(data => { if (!signal?.aborted) setUser(data.user); })
      .catch(() => { if (!signal?.aborted) setUser(null); })
      .finally(() => { if (!signal?.aborted) setLoading(false); }), []);

  // ดึงใหม่ทุกครั้งที่เปลี่ยนหน้า เพื่อให้ Navbar อัปเดตหลัง login/logout
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [pathname, refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
