'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Event, Photo, AppData } from '../lib/types';
import { HERO_SLIDES, type HeroSlide } from '../lib/constants';
import { apiFetch, ApiError } from '../app/lib/api-client';
import type { SettingsPatch } from '../app/lib/schemas';

const EMPTY_DATA: AppData = {
  startDate: '', heroImage: '', customCovers: [], hiddenDefaultCovers: [],
  events: [], photos: [], expenses: [], loveQuotes: [], countdowns: [], wishes: [], capsules: []
};

function normalizeAppData(d: Partial<AppData>): AppData {
  return {
    ...EMPTY_DATA,
    ...d,
    events: (d.events || []).slice().sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    photos: (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url })),
    expenses: d.expenses || [], loveQuotes: d.loveQuotes || [],
    customCovers: d.customCovers || [], hiddenDefaultCovers: d.hiddenDefaultCovers || [],
    countdowns: d.countdowns || [], wishes: d.wishes || [], capsules: d.capsules || []
  };
}

export type MutateOptions<T> = {
  successMsg?: string;
  errorMsg?: string;
  /* 401 时由调用方弹 PIN，验完自动重放同一次变更 */
  onAuthRequired?: (op: () => void | Promise<void>) => void;
  onSuccess?: (result: T) => void;
};

type AppDataContextValue = {
  data: AppData;
  setData: (updater: (prev: AppData) => AppData) => void;
  /* 统一的写路径：乐观更新 → 请求 → 失败回滚 + 提示 → 401 弹 PIN 后重放 */
  mutate: <T>(
    optimistic: (prev: AppData) => AppData,
    request: () => Promise<T>,
    opts?: MutateOptions<T>
  ) => Promise<T | null>;
  loading: boolean;
  loadError: boolean;
  toast: string;
  setToast: (msg: string) => void;
  loadData: (retryCount?: number) => void;
  saveSettings: (patch: SettingsPatch, msg?: string) => Promise<void>;
  days: number;
  nextDays: number;
  heroImages: (string | HeroSlide)[];
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children, initialData }: { children: ReactNode; initialData?: AppData }) {
  const [data, setData] = useState<AppData>(() => (initialData ? normalizeAppData(initialData) : EMPTY_DATA));
  const [loading, setLoading] = useState(!initialData);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState('');

  /* 快照要用「调用那一刻」的 data，不能等 React 批处理 */
  const dataRef = useRef(data);
  dataRef.current = data;

  const mutate = useCallback(async function mutate<T>(
    optimistic: (prev: AppData) => AppData,
    request: () => Promise<T>,
    opts: MutateOptions<T> = {}
  ): Promise<T | null> {
    const snapshot = dataRef.current;
    setData(optimistic);

    try {
      const result = await request();
      if (opts.successMsg) setToast(opts.successMsg);
      opts.onSuccess?.(result);
      return result;
    } catch (err) {
      setData(() => snapshot);

      if (err instanceof ApiError && err.isAuthError && opts.onAuthRequired) {
        opts.onAuthRequired(() => { void mutate(optimistic, request, opts); });
        return null;
      }

      setToast(opts.errorMsg || (err instanceof Error ? err.message : '操作失败'));
      return null;
    }
  }, []);

  function loadData(retryCount = 0) {
    setLoadError(false);
    fetch('/api/data', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        setData(normalizeAppData(d));
      })
      .catch(() => {
        if (retryCount < 1) setTimeout(() => loadData(retryCount + 1), 2000);
        else setLoadError(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (!initialData) loadData(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);

  async function saveSettings(patch: SettingsPatch, msg?: string): Promise<void> {
    await mutate(
      prev => ({ ...prev, ...patch }),
      () => apiFetch('/api/data', { method: 'POST', body: patch }),
      { successMsg: msg, errorMsg: '保存失败' }
    );
  }

  const days = useMemo(() => data.startDate ? Math.max(0, Math.floor((Date.now() - new Date(`${data.startDate}T00:00:00`).getTime()) / 86400000)) : 0, [data.startDate]);
  const nextDays = useMemo(() => {
    if (!data.startDate) return 0;
    const s = new Date(`${data.startDate}T00:00:00`), n = new Date(), nx = new Date(n.getFullYear(), s.getMonth(), s.getDate());
    if (nx.getTime() < n.getTime()) nx.setFullYear(n.getFullYear() + 1);
    return Math.ceil((nx.getTime() - n.getTime()) / 86400000);
  }, [data.startDate]);
  const visibleDefaults = HERO_SLIDES.filter(s => !data.hiddenDefaultCovers.includes(s.web) && !data.hiddenDefaultCovers.includes(s.mobile));
  const heroImages: (string | HeroSlide)[] = [...data.customCovers, ...visibleDefaults];

  const value: AppDataContextValue = {
    data, setData, mutate, loading, loadError, toast, setToast,
    loadData, saveSettings, days, nextDays, heroImages
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
