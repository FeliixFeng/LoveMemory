'use client';

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { NavBar } from './NavBar';
import { BottomTabBar } from './BottomTabBar';
import { PinModal } from './modals/PinModal';
import { ErrorBoundary } from './ErrorBoundary';
import { AppDataProvider, useAppData } from '../hooks/useAppData';
import { SideOrnaments } from './SideOrnaments';

type AuthCtx = {
  token: string;
  tokenRef: React.RefObject<string>;
  showPin: boolean;
  setShowPin: (v: boolean) => void;
  pendingOp: React.MutableRefObject<(() => void | Promise<void>) | null>;
  withAuth: (action: () => void | Promise<void>) => void;
  onPinVerified: (token: string) => void;
  floatingButton: ReactNode;
  setFloatingButton: (node: ReactNode) => void;
};

const AuthContext = createContext<AuthCtx>({
  token: '',
  tokenRef: { current: '' },
  showPin: false,
  setShowPin: () => {},
  pendingOp: { current: null },
  withAuth: (a) => { void a(); },
  onPinVerified: () => {},
  floatingButton: null,
  setFloatingButton: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function SiteLayoutClient({ children, initialData }: { children: ReactNode; initialData?: import('../lib/types').AppData }) {
  const [floatingButton, setFloatingButton] = useState<ReactNode>(null);
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
    <AuthContext.Provider value={{ token, tokenRef, showPin, setShowPin, pendingOp, withAuth, onPinVerified, floatingButton, setFloatingButton }}>
      <AppDataProvider initialData={initialData}>
        <NavBarWithData isAuthenticated={!!token} onPin={() => {
          if (token) {
            setToken('');
            tokenRef.current = '';
            try { localStorage.removeItem('lm_token'); } catch {}
          } else {
            setShowPin(true);
          }
        }} />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <SideOrnaments />
      </AppDataProvider>
      <BottomTabBar />
      {floatingButton}
      {showPin && (
        <PinModal
          onVerify={onPinVerified}
          onClose={() => { setShowPin(false); pendingOp.current = null; }}
        />
      )}
    </AuthContext.Provider>
  );
}

/* NavBar 原本在 AppDataProvider 外层拿不到数据；挪进 Provider 后用薄壳把名字喂给它 */
function NavBarWithData(props: { isAuthenticated: boolean; onPin: () => void }) {
  const { data } = useAppData();
  return <NavBar {...props} coupleNames={data.coupleNames} />;
}
