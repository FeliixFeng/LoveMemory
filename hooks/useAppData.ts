'use client';

import { useEffect, useMemo, useState } from 'react';
import { Event, Photo, AppData } from '../lib/types';
import { HERO_IMAGES } from '../lib/constants';
import { apiFetch } from '../app/lib/api-client';
import type { SettingsPatch } from '../app/lib/schemas';

const EMPTY_DATA: AppData = {
  startDate: '', heroImage: '', customCovers: [], hiddenDefaultCovers: [],
  events: [], photos: [], expenses: [], loveQuotes: [], countdowns: [], wishes: [], capsules: []
};

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState('');

  function loadData(retryCount = 0) {
    setLoadError(false);
    fetch('/api/data', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        const events = (d.events || []).sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const photos = (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url }));
        setData({ ...d, events, photos, expenses: d.expenses || [], loveQuotes: d.loveQuotes || [], customCovers: d.customCovers || [], hiddenDefaultCovers: d.hiddenDefaultCovers || [], countdowns: d.countdowns || [], wishes: d.wishes || [], capsules: d.capsules || [] });
      })
      .catch(() => {
        if (retryCount < 1) setTimeout(() => loadData(retryCount + 1), 2000);
        else setLoadError(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);

  async function saveSettings(patch: SettingsPatch, msg?: string): Promise<void> {
    setData(prev => ({ ...prev, ...patch }));
    if (msg) setToast(msg);
    await apiFetch('/api/data', { method: 'POST', body: patch });
  }

  // Derived data
  const days = useMemo(() => data.startDate ? Math.max(0, Math.floor((Date.now() - new Date(`${data.startDate}T00:00:00`).getTime()) / 86400000)) : 0, [data.startDate]);
  const nextDays = useMemo(() => {
    if (!data.startDate) return 0;
    const s = new Date(`${data.startDate}T00:00:00`), n = new Date(), nx = new Date(n.getFullYear(), s.getMonth(), s.getDate());
    if (nx.getTime() < n.getTime()) nx.setFullYear(n.getFullYear() + 1);
    return Math.ceil((nx.getTime() - n.getTime()) / 86400000);
  }, [data.startDate]);
  const visibleDefaults = HERO_IMAGES.filter(u => !data.hiddenDefaultCovers.includes(u));
  const heroImages = [...data.customCovers, ...visibleDefaults];

  return {
    data, setData, loading, loadError, toast, setToast,
    loadData, saveSettings, days, nextDays, heroImages
  };
}
