'use client';

import { useEffect, useState } from 'react';
import { THEME } from '../app/lib/theme';
import { useAppData } from '../hooks/useAppData';
import { CITY_COORDS, PROVINCE_FULL_NAMES } from '../lib/map-data';
import { resolvePlace, type ResolvedPlace } from '../lib/place';

// Lazy load the ECharts map component
function MapChart({ visitedProvinces, visitedCities }: { visitedProvinces: Set<string>; visitedCities: { city: string; province: string }[] }) {
  const [ready, setReady] = useState(false);
  const [echarts, setEcharts] = useState<any>(null);
  const [EChartsComponent, setEChartsComponent] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    Promise.all([
      import('echarts'),
      fetch('/china.json').then(r => r.json())
    ]).then(([echartsMod, chinaMap]) => {
      echartsMod.registerMap('china', chinaMap);
      setEcharts(echartsMod);
      setReady(true);
    }).catch(err => console.error('Map load error:', err));
  }, []);

  useEffect(() => {
    import('echarts-for-react').then(mod => setEChartsComponent(() => mod.default));
  }, []);

  if (!ready || !EChartsComponent) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lm-accent/20 border-t-lm-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-lm-body/40">地图加载中...</p>
        </div>
      </div>
    );
  }

  const cityCountByProvince = new Map<string, Set<string>>();
  visitedCities.forEach(({ city, province }) => {
    if (!cityCountByProvince.has(province)) cityCountByProvince.set(province, new Set());
    cityCountByProvince.get(province)!.add(city);
  });
  const provinceShortByFull = new Map(Object.entries(PROVINCE_FULL_NAMES).map(([short, full]) => [full, short]));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.seriesType === 'scatter') return params.name;
        const short = provinceShortByFull.get(params.name) ?? params.name;
        const count = cityCountByProvince.get(short)?.size ?? 0;
        return count > 0 ? `${params.name} · 去过 ${count} 个地方` : params.name;
      }
    },
    geo: {
      map: 'china', roam: true, zoom: 1.2,
      label: { show: false },
      itemStyle: { areaColor: THEME.map.areaLight, borderColor: THEME.map.areaMid, borderWidth: 0.5 },
      emphasis: { label: { show: true, fontSize: 10, color: THEME.ink, textBorderColor: '#fff', textBorderWidth: 2 }, itemStyle: { areaColor: THEME.map.areaDeep } },
      regions: Array.from(visitedProvinces).map(p => ({
        name: PROVINCE_FULL_NAMES[p] || p,
        label: { show: false },
        itemStyle: { areaColor: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: THEME.accent }, { offset: 1, color: THEME.accentDeep }] }, borderColor: THEME.accentDeep, borderWidth: 1 }
      }))
    },
    series: [{
      name: '城市', type: 'scatter', coordinateSystem: 'geo', symbol: 'pin', symbolSize: 14,
      data: (() => {
        const seen = new Set<string>();
        return visitedCities.filter(c => { if (seen.has(c.city)) return false; seen.add(c.city); return true; }).map(c => {
          const coords = CITY_COORDS[c.city];
          if (!coords) return null;
          return { name: c.city, value: [...coords, 10] };
        }).filter(Boolean);
      })(),
      label: { show: true, position: 'bottom', formatter: '{b}', fontSize: 9, color: THEME.ink, distance: 5 },
      labelLayout: { hideOverlap: true },
      itemStyle: { color: THEME.accent, borderColor: '#fff', borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(204,146,102,0.5)' },
      emphasis: { scale: 1.5 }
    }]
  };

  return (
    <div className="relative">
      <EChartsComponent key={resetKey} option={option} style={{ height: '400px', width: '100%' }} />
      <button
        type="button"
        onClick={() => setResetKey(k => k + 1)}
        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-lm-line/50 text-sm shadow-sm active:scale-95 transition-transform"
        title="回到初始视角"
      >
        🎯
      </button>
    </div>
  );
}

export function MapPage() {
  const { data, loading } = useAppData();

  /* 只认 resolvePlace 的结果：能定位的才上图。
     「家里」「公司」这类解析不出的，不再靠黑名单硬塞，也不会丢 pin */
  const resolved = data.events
    .map(e => resolvePlace(e.location))
    .filter((p): p is ResolvedPlace => p !== null);

  const visitedProvinces = new Set(resolved.map(p => p.province));
  const visitedCities = [...new Map(
    resolved.map(p => [p.city, { city: p.city, province: p.province }])
  ).values()];

  const uniqueCities = visitedCities.map(c => c.city);
  if (loading) return <div className="space-y-4"><div className="h-64 bg-lm-line/20 rounded-2xl animate-pulse" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>🗺️ 足迹</h1>
      <div className="lm-card rounded-2xl overflow-hidden">
        <MapChart visitedProvinces={visitedProvinces} visitedCities={visitedCities} />
      </div>
      <div className="lm-card rounded-2xl px-4 py-3">
        <div className="flex justify-center gap-6 text-xs text-lm-body/55">
          <div className="flex items-center gap-1.5"><span>📍</span><span className="font-bold text-lm-ink">{visitedProvinces.size}</span><span>个省份</span></div>
          <div className="flex items-center gap-1.5"><span>🏙️</span><span className="font-bold text-lm-ink">{uniqueCities.length}</span><span>个地方</span></div>
        </div>
      </div>
      {uniqueCities.length > 0 && (
        <div className="lm-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-lm-ink mb-3">📍 去过的地方</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCities.map(city => (<span key={city} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-lm-accent/10 to-lm-accent-deep/10 text-xs text-lm-accent-deep font-medium">{city}</span>))}
          </div>
        </div>
      )}
      {uniqueCities.length === 0 && (
        <div className="lm-card rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">🗺️</span>
          <p className="text-sm text-lm-body/50">还没有记录足迹</p>
        </div>
      )}
    </div>
  );
}
