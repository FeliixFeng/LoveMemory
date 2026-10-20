'use client';

import { useEffect, useState, useCallback } from 'react';
import { THEME } from '../app/lib/theme';
import { useAppData } from '../hooks/useAppData';
import { Event } from '../lib/types';
import { CITY_TO_PROVINCE, CITY_COORDS } from '../lib/map-data';

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

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}' },
    geo: {
      map: 'china', roam: true, zoom: 1.2,
      label: { show: false },
      itemStyle: { areaColor: THEME.map.areaLight, borderColor: THEME.map.areaMid, borderWidth: 0.5 },
      emphasis: { label: { show: true, fontSize: 10, color: THEME.ink, textBorderColor: '#fff', textBorderWidth: 2 }, itemStyle: { areaColor: THEME.map.areaDeep } },
      regions: Array.from(visitedProvinces).map(p => ({
        name: { '上海':'上海市','北京':'北京市','天津':'天津市','重庆':'重庆市','安徽':'安徽省','浙江':'浙江省','江苏':'江苏省','广东':'广东省','四川':'四川省','湖北':'湖北省','湖南':'湖南省','河南':'河南省','山东':'山东省','福建':'福建省','云南':'云南省','陕西':'陕西省','黑龙江':'黑龙江省','吉林':'吉林省','辽宁':'辽宁省','山西':'山西省','河北':'河北省','甘肃':'甘肃省','宁夏':'宁夏回族自治区','青海':'青海省','新疆':'新疆维吾尔自治区','广西':'广西壮族自治区','贵州':'贵州省','江西':'江西省','内蒙古':'内蒙古自治区','西藏':'西藏自治区','海南':'海南省','台湾':'台湾省' }[p] || p,
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
      itemStyle: { color: THEME.accent, borderColor: '#fff', borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(204,146,102,0.5)' },
      emphasis: { scale: 1.5 }
    }]
  };

  return <EChartsComponent option={option} style={{ height: '400px', width: '100%' }} />;
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
