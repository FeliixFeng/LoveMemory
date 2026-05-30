'use client';

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { NavBar } from './NavBar';
import { BottomTabBar } from './BottomTabBar';
import { FallingHearts } from './FallingHearts';
import { PinModal } from './modals/PinModal';
import { SettingsModal } from './modals/SettingsModal';

type AuthCtx = {
  token: string;
  tokenRef: React.RefObject<string>;
  showPin: boolean;
  setShowPin: (v: boolean) => void;
  pendingOp: React.MutableRefObject<(() => void | Promise<void>) | null>;
  withAuth: (action: () => void | Promise<void>) => void;
  onPinVerified: (token: string) => void;
};

const AuthContext = createContext<AuthCtx>({
  token: '',
  tokenRef: { current: '' },
  showPin: false,
  setShowPin: () => {},
  pendingOp: { current: null },
  withAuth: (a) => { void a(); },
  onPinVerified: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function SiteLayoutClient({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('lm_token') || ''; } catch { return ''; }
  });
  const [showPin, setShowPin] = useState(false);
  const tokenRef = useRef(token);
  const pendingOp = useRef<(() => void | Promise<void>) | null>(null);

  const onPinVerified = useCallback((newToken: string) => {
    setToken(newToken);
    tokenRef.current = newToken;
    try { localStorage.setItem('lm_token', newToken); } catch {}
    setShowPin(false);
    const op = pendingOp.current;
    pendingOp.current = null;
    if (op) void op();
  }, []);

  const withAuth = useCallback((action: () => void | Promise<void>) => {
    if (!tokenRef.current) {
      pendingOp.current = () => { void action(); };
      setShowPin(true);
      return;
    }
    void action();
  }, []);

  return (
    <AuthContext.Provider value={{ token, tokenRef, showPin, setShowPin, pendingOp, withAuth, onPinVerified }}>
      <FallingHearts />
      <NavBar isAuthenticated={!!token} />
      {children}
      <BottomTabBar />
      {showPin && (
        <PinModal
          onVerify={onPinVerified}
          onClose={() => { setShowPin(false); pendingOp.current = null; }}
        />
      )}
    </AuthContext.Provider>
  );
}
