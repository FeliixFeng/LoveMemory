'use client';

import { useEffect, useState, useCallback } from 'react';
import { THEME } from '../app/lib/theme';
import { useAppData } from '../hooks/useAppData';
import { Event } from '../lib/types';
import { CITY_TO_PROVINCE, CITY_COORDS, PROVINCE_FULL_NAMES } from '../lib/map-data';

function getProvinceFromCity(location: string): string | null {
  if (CITY_TO_PROVINCE[location]) return CITY_TO_PROVINCE[location];
  for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
    if (location.includes(city)) return province;
  }
  for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
    if (location.split(/[,，、\s]+/).some(part => part.includes(city))) return province;
  }
  return null;
}

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
        return count > 0 ? `${params.name} · 去过 ${count} 座城市` : params.name;
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
        className="absolute top-2 right-2 z-10 px-2.5 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-lm-line/60 text-[11px] text-lm-body/70 shadow-sm active:scale-95 transition-transform"
        title="回到初始视角"
      >
        🎯 归位
      </button>
    </div>
  );
}

export function MapPage() {
  const { data, loading } = useAppData();
  const events = data.events;

  const excludedWords = ['家里', '待定', '内', '附近', '门口', '学校', '公司'];
  const visitedProvinces = new Set<string>();
  const visitedCities: { city: string; province: string }[] = [];
  const unmappedCities: string[] = [];

  events.forEach(e => {
    if (!e.location || excludedWords.some(w => e.location.includes(w))) return;
    const province = getProvinceFromCity(e.location);
    if (province) {
      visitedProvinces.add(province);
      visitedCities.push({ city: e.location, province });
      if (!CITY_COORDS[e.location] && !unmappedCities.includes(e.location)) {
        unmappedCities.push(e.location);
      }
    } else if (!unmappedCities.includes(e.location)) {
      unmappedCities.push(e.location);
    }
  });

  const uniqueCities = [...new Set(visitedCities.map(c => c.city))];
  if (loading) return <div className="space-y-4"><div className="h-64 bg-lm-line/20 rounded-2xl animate-pulse" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>🗺️ 足迹</h1>
      <div className="lm-card rounded-2xl overflow-hidden">
        <MapChart visitedProvinces={visitedProvinces} visitedCities={visitedCities} />
        {unmappedCities.length > 0 && (
          <p className="px-4 pb-3 text-[11px] text-lm-body/40">以下地点暂未收录坐标，仅计入统计未标点：{unmappedCities.join('、')}</p>
        )}
      </div>
      <div className="lm-card rounded-2xl px-4 py-3">
        <div className="flex justify-center gap-6 text-xs text-lm-body/55">
          <div className="flex items-center gap-1.5"><span>📍</span><span className="font-bold text-lm-ink">{visitedProvinces.size}</span><span>个省份</span></div>
          <div className="flex items-center gap-1.5"><span>🏙️</span><span className="font-bold text-lm-ink">{uniqueCities.length}</span><span>座城市</span></div>
        </div>
      </div>
      {uniqueCities.length > 0 && (
        <div className="lm-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-lm-ink mb-3">📍 去过的城市</h3>
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
