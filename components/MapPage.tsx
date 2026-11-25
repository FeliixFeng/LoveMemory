'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { THEME } from '../app/lib/theme';
import { useAppData } from '../hooks/useAppData';
import type { Event, Photo } from '../lib/types';
import { PROVINCE_FULL_NAMES } from '../lib/map-data';
import { isPlaceholderLocation, resolveEventPlace } from '../lib/place';
import { calcTripDays, formatCurrency, fmtRange, getEmoji, getMoodEmoji } from '../lib/utils';
import { PinIcon, CameraIcon } from './NavIcons';
import { SafeImage } from './SafeImage';
import { EventBadge } from './EventBadge';
import { Lightbox } from './Lightbox';

const DAILY_BUCKET_ID = '__daily__';
const DEFAULT_ZOOM = 1.06;

type CityBucket = {
  id: string;
  title: string;
  subtitle: string;
  province: string;
  coords: [number, number] | null;
  isHome: boolean;
  isDaily: boolean;
  events: Event[];
  photos: Photo[];
  coverPhoto: string;
  totalSpent: number;
};

type MapChartProps = {
  visitedProvinces: Set<string>;
  cityBuckets: CityBucket[];
  selectedCityId: string | null;
  onSelectCity: (city: string) => void;
};

function MapChart({
  visitedProvinces,
  cityBuckets,
  selectedCityId,
  onSelectCity,
}: MapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const defaultCenterRef = useRef<[number, number] | null>(null);
  const bucketsRef = useRef(cityBuckets);
  const onSelectRef = useRef(onSelectCity);
  bucketsRef.current = cityBuckets;
  onSelectRef.current = onSelectCity;

  const [ready, setReady] = useState(false);
  const [isMoved, setIsMoved] = useState(false);

  const seriesPayload = useMemo(() => {
    const normalCities = cityBuckets
      .filter(b => !b.isDaily && b.coords && b.id !== selectedCityId)
      .map(b => ({
        name: b.id,
        value: [...b.coords!, b.events.length],
        isHome: b.isHome,
        symbolSize: b.isHome ? 13 : 10,
        itemStyle: b.isHome
          ? {
              color: THEME.accentDeep,
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: 'rgba(173,124,87,0.55)',
            }
          : {
              color: THEME.accent,
              borderColor: '#fff',
              borderWidth: 1.5,
              shadowBlur: 5,
              shadowColor: 'rgba(204,146,102,0.4)',
            },
      }));

    const selectedBucket = cityBuckets.find(b => !b.isDaily && b.coords && b.id === selectedCityId);
    const activeData = selectedBucket
      ? [{
          name: selectedBucket.id,
          value: [...selectedBucket.coords!, selectedBucket.events.length],
          isHome: selectedBucket.isHome,
        }]
      : [];

    return [
      {
        name: '城市',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'circle',
        data: normalCities,
        label: {
          show: true,
          position: 'bottom',
          formatter: (p: any) => (p.data?.isHome ? `🏠 ${p.name}` : p.name),
          fontSize: 9.5,
          color: THEME.ink,
          textBorderColor: 'rgba(255,255,255,0.88)',
          textBorderWidth: 2,
          distance: 4,
        },
        labelLayout: { hideOverlap: true },
        emphasis: { scale: 1.35 },
        z: 2,
      },
      {
        name: '选中城市',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        symbol: 'circle',
        symbolSize: 14,
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 3.6, period: 3.6 },
        data: activeData,
        label: {
          show: true,
          position: 'bottom',
          formatter: (p: any) => (p.data?.isHome ? `🏠 ${p.name}` : p.name),
          fontSize: 11,
          fontWeight: 'bold',
          color: THEME.inkStrong,
          textBorderColor: '#fff',
          textBorderWidth: 2.5,
          distance: 6,
        },
        itemStyle: {
          color: THEME.accentDeep,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(173,124,87,0.65)',
        },
        z: 3,
      },
    ];
  }, [cityBuckets, selectedCityId]);

  const geoRegions = useMemo(() => {
    return Array.from(visitedProvinces).map(p => ({
      name: PROVINCE_FULL_NAMES[p] || p,
      label: { show: false },
      itemStyle: {
        areaColor: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(204,146,102,0.52)' },
            { offset: 1, color: 'rgba(173,124,87,0.72)' },
          ],
        },
        borderColor: THEME.accentDeep,
        borderWidth: 0.8,
      },
    }));
  }, [visitedProvinces]);

  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let instance: any = null;

    Promise.all([
      import('echarts'),
      fetch('/china.json').then(r => {
        if (!r.ok) throw new Error('Failed to load map data');
        return r.json();
      }),
    ]).then(([echartsMod, chinaMap]) => {
      if (!mounted || !chartBoxRef.current) return;

      echartsMod.registerMap('china', chinaMap);
      instance = echartsMod.init(chartBoxRef.current);
      chartRef.current = instance;

      const provinceShortByFull = new Map(Object.entries(PROVINCE_FULL_NAMES).map(([short, full]) => [full, short]));

      instance.setOption({
        animationDurationUpdate: 260,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 252, 248, 0.95)',
          borderColor: 'rgba(173, 124, 87, 0.2)',
          borderWidth: 1,
          textStyle: { color: THEME.ink, fontSize: 11 },
          formatter: (params: any) => {
            if (params.seriesType === 'scatter' || params.seriesType === 'effectScatter') {
              const count = params.data?.value?.[2] ?? 1;
              const homeTag = params.data?.isHome ? ' · 常驻' : '';
              return `${params.name}${homeTag}（${count} 段回忆）`;
            }
            const short = provinceShortByFull.get(params.name) ?? params.name;
            const count = bucketsRef.current.filter(b => !b.isDaily && b.province === short).length;
            return count > 0 ? `${params.name} · 点亮 ${count} 座城` : params.name;
          },
        },
        geo: {
          map: 'china',
          roam: true,
          roamTrigger: 'global',
          // 不设 clip: true，防止放大时被内部小矩形裁切；由外层 rounded-3xl overflow-hidden 自然裁切
          layoutCenter: ['49%', '51%'],
          layoutSize: '92%',
          zoom: DEFAULT_ZOOM,
          scaleLimit: { min: 1, max: 6 },
          label: { show: false },
          itemStyle: { areaColor: THEME.map.areaLight, borderColor: THEME.map.areaMid, borderWidth: 0.5 },
          emphasis: {
            label: { show: true, fontSize: 10, color: THEME.ink, textBorderColor: '#fff', textBorderWidth: 2 },
            itemStyle: { areaColor: THEME.map.areaDeep },
          },
          regions: geoRegions,
        },
        series: seriesPayload,
      });

      const initGeo = (instance.getOption() as any)?.geo?.[0];
      if (initGeo?.center && Array.isArray(initGeo.center)) {
        defaultCenterRef.current = [initGeo.center[0], initGeo.center[1]];
      }

      instance.on('click', (params: any) => {
        if (params.seriesType === 'scatter' || params.seriesType === 'effectScatter') {
          if (params.name) onSelectRef.current(params.name);
          return;
        }
        if (params.componentType === 'geo' && params.name) {
          const short = provinceShortByFull.get(params.name) ?? params.name;
          const hit = bucketsRef.current.find(b => !b.isDaily && b.province === short);
          if (hit) onSelectRef.current(hit.id);
        }
      });

      instance.on('georoam', () => {
        if (!mounted || !instance || instance.isDisposed()) return;
        const geoOpt = (instance.getOption() as any)?.geo?.[0];
        if (!geoOpt) return;
        const z = Number(geoOpt.zoom ?? DEFAULT_ZOOM);
        const c = geoOpt.center;
        const dc = defaultCenterRef.current;
        const centerMoved = dc && Array.isArray(c)
          ? Math.abs(c[0] - dc[0]) > 0.5 || Math.abs(c[1] - dc[1]) > 0.5
          : false;
        setIsMoved(Math.abs(z - DEFAULT_ZOOM) > 0.05 || centerMoved);
      });

      resizeObserver = new ResizeObserver(() => {
        if (!mounted || !instance || instance.isDisposed()) return;
        const dom = chartBoxRef.current;
        if (!dom || dom.clientWidth === 0 || dom.clientHeight === 0) return;
        try {
          instance.resize();
        } catch {
          // 忽略卸载竞态期间的 resize
        }
      });
      resizeObserver.observe(chartBoxRef.current);

      setReady(true);
    }).catch(err => {
      console.error('Map load error:', err);
    });

    return () => {
      mounted = false;
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (instance && !instance.isDisposed()) {
        instance.dispose();
      }
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = chartRef.current;
    if (!instance || !ready || instance.isDisposed()) return;
    instance.setOption({
      geo: { regions: geoRegions },
      series: seriesPayload,
    });
  }, [ready, geoRegions, seriesPayload]);

  // 阻尼平滑滚轮缩放
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      const instance = chartRef.current;
      if (!instance || instance.isDisposed()) return;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const rawFactor = Math.exp(-delta * 0.0025);
      const factor = Math.min(1.14, Math.max(0.88, rawFactor));

      const rect = el!.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;

      instance.dispatchAction({
        type: 'geoRoam',
        componentType: 'geo',
        zoom: factor,
        originX,
        originY,
      });
    }

    el.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

  function zoomBy(factor: number) {
    const instance = chartRef.current;
    if (!instance || instance.isDisposed()) return;
    const geoOpt = (instance.getOption() as any)?.geo?.[0];
    const curZoom = Number(geoOpt?.zoom ?? DEFAULT_ZOOM);
    const nextZoom = Math.min(6, Math.max(1, Number((curZoom * factor).toFixed(3))));
    instance.setOption({ geo: { zoom: nextZoom } });
    setIsMoved(Math.abs(nextZoom - DEFAULT_ZOOM) > 0.05);
  }

  function resetView() {
    const instance = chartRef.current;
    if (!instance || instance.isDisposed()) return;
    instance.setOption({
      geo: {
        zoom: DEFAULT_ZOOM,
        ...(defaultCenterRef.current ? { center: defaultCenterRef.current } : {}),
      },
    });
    setIsMoved(false);
  }

  return (
    <div ref={containerRef} className="relative select-none touch-none">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-lm-bg/40">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-lm-accent/20 border-t-lm-accent rounded-full animate-spin mx-auto mb-2.5" />
            <p className="text-xs text-lm-body/40">地图展开中...</p>
          </div>
        </div>
      )}

      <div ref={chartBoxRef} className="h-[310px] sm:h-[380px] lg:h-[430px] w-full" />

      {/* 右下角极简缩放微控制组 */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col bg-white/80 backdrop-blur-md border border-lm-border/70 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => zoomBy(1.45)}
          aria-label="放大"
          className="w-8 h-8 flex items-center justify-center text-lm-ink/75 hover:text-lm-accent-deep hover:bg-white/60 active:scale-90 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span className="h-px bg-lm-line/50 mx-1.5" />
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.45)}
          aria-label="缩小"
          className="w-8 h-8 flex items-center justify-center text-lm-ink/75 hover:text-lm-accent-deep hover:bg-white/60 active:scale-90 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </button>
        {isMoved && (
          <>
            <span className="h-px bg-lm-line/50 mx-1.5" />
            <button
              type="button"
              onClick={resetView}
              aria-label="重置视角"
              title="回到中国全景"
              className="w-8 h-8 flex items-center justify-center text-lm-accent-deep hover:bg-white/60 active:scale-90 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function MapPage() {
  const { data, loading } = useAppData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const homeCity = (data.homeCity || '').trim();

  const { orderedBuckets, visitedProvinces, mapCityCount } = useMemo(() => {
    const cityMap = new Map<string, CityBucket>();
    const dailyEvents: Event[] = [];
    const provinces = new Set<string>();

    const photosByEvent = new Map<string, Photo[]>();
    for (const p of data.photos) {
      if (!p.eventId) continue;
      const list = photosByEvent.get(p.eventId) || [];
      list.push(p);
      photosByEvent.set(p.eventId, list);
    }

    const expenseByEvent = new Map<string, number>();
    for (const ex of data.expenses) {
      expenseByEvent.set(ex.eventId, (expenseByEvent.get(ex.eventId) || 0) + ex.amount);
    }

    const sortedEvents = data.events.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const ev of sortedEvents) {
      const resolved = resolveEventPlace(ev);
      if (resolved) {
        provinces.add(resolved.province);
        let bucket = cityMap.get(resolved.city);
        if (!bucket) {
          bucket = {
            id: resolved.city,
            title: resolved.city,
            subtitle: resolved.province,
            province: resolved.province,
            coords: resolved.coords,
            isHome: Boolean(homeCity && resolved.city === homeCity),
            isDaily: false,
            events: [],
            photos: [],
            coverPhoto: '',
            totalSpent: 0,
          };
          cityMap.set(resolved.city, bucket);
        }
        bucket.events.push(ev);
        const evPhotos = photosByEvent.get(String(ev.id)) || [];
        bucket.photos.push(...evPhotos);
        bucket.totalSpent += expenseByEvent.get(String(ev.id)) || 0;
        if (!bucket.coverPhoto) {
          bucket.coverPhoto = ev.coverPhoto || evPhotos[0]?.thumbUrl || evPhotos[0]?.displayUrl || evPhotos[0]?.url || '';
        }
      } else if (!isPlaceholderLocation(ev.location)) {
        dailyEvents.push(ev);
      }
    }

    const cityBuckets = Array.from(cityMap.values());
    const farCities = cityBuckets
      .filter(b => !b.isHome)
      .sort((a, b) => (b.photos.length > 0 ? 1 : 0) - (a.photos.length > 0 ? 1 : 0) || b.events.length - a.events.length);
    const homeBuckets = cityBuckets.filter(b => b.isHome);

    const ordered: CityBucket[] = [...farCities, ...homeBuckets];

    if (dailyEvents.length > 0) {
      const dailyPhotos = dailyEvents.flatMap(ev => photosByEvent.get(String(ev.id)) || []);
      const dailySpent = dailyEvents.reduce((sum, ev) => sum + (expenseByEvent.get(String(ev.id)) || 0), 0);
      const cover = dailyEvents.find(ev => ev.coverPhoto)?.coverPhoto
        || dailyPhotos[0]?.thumbUrl
        || dailyPhotos[0]?.displayUrl
        || dailyPhotos[0]?.url
        || '';
      ordered.push({
        id: DAILY_BUCKET_ID,
        title: '日常角落',
        subtitle: '家里与身边的烟火气',
        province: '',
        coords: null,
        isHome: false,
        isDaily: true,
        events: dailyEvents,
        photos: dailyPhotos,
        coverPhoto: cover,
        totalSpent: dailySpent,
      });
    }

    return {
      orderedBuckets: ordered,
      visitedProvinces: provinces,
      mapCityCount: cityBuckets.length,
    };
  }, [data.events, data.photos, data.expenses, homeCity]);

  useEffect(() => {
    if (orderedBuckets.length === 0) return;
    if (selectedId && orderedBuckets.some(b => b.id === selectedId)) return;

    const farWithPhotos = orderedBuckets.filter(b => !b.isHome && !b.isDaily && b.photos.length > 0);
    const anyWithPhotos = orderedBuckets.filter(b => b.photos.length > 0);
    const pool = farWithPhotos.length > 0 ? farWithPhotos : anyWithPhotos.length > 0 ? anyWithPhotos : orderedBuckets;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (picked) setSelectedId(picked.id);
  }, [orderedBuckets, selectedId]);

  useEffect(() => {
    if (!selectedId || !stripRef.current) return;
    // 仅在横向滚动条模式（移动端）下按需把隐藏卡片拉进视野，避免把第一张卡半截推出视口
    if (window.innerWidth >= 640) return;
    const target = stripRef.current.querySelector<HTMLElement>(`[data-city-id="${selectedId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [selectedId]);

  function handleRandomRoam() {
    if (orderedBuckets.length <= 1) return;
    const candidates = orderedBuckets.filter(b => b.id !== selectedId);
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    if (picked) setSelectedId(picked.id);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-lm-line/20 rounded-xl animate-pulse" />
        <div className="h-[310px] bg-lm-line/20 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const selectedBucket = orderedBuckets.find(b => b.id === selectedId) || orderedBuckets[0] || null;

  return (
    <div className="space-y-4">
      {/* 顶栏一体化：左侧标题 + 省市数量，右侧单一干净的漫游胶囊 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="w-4 h-px bg-lm-accent/70 shrink-0" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-lm-accent font-display shrink-0">FOOTPRINT</span>
          <h1 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn shrink-0">足迹</h1>
          {mapCityCount > 0 && (
            <span className="text-[11px] text-lm-body/50 font-display truncate">
              · {visitedProvinces.size} 省 {mapCityCount} 城
            </span>
          )}
        </div>

        {orderedBuckets.length > 1 && (
          <button
            type="button"
            onClick={handleRandomRoam}
            className="lm-glass-chip px-3 py-1 rounded-full text-xs font-medium text-lm-accent-deep inline-flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            <span>随机漫游</span>
          </button>
        )}
      </div>

      {orderedBuckets.length === 0 ? (
        <div className="lm-card rounded-3xl p-10 text-center space-y-2">
          <span className="text-3xl block">🗺️</span>
          <p className="text-sm font-bold text-lm-ink font-serif-cn">还没有记录足迹</p>
          <p className="text-xs text-lm-body/50">在首页记录一次出行或日常瞬间，地图和回忆就会在这里生长</p>
        </div>
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0 lg:items-start">
          {/* 左列：纯净地图 + 城市明信片（移动端横滑、桌面端整齐网格不裁切） */}
          <div className="space-y-3 lg:col-span-6 lg:sticky lg:top-20">
            <div className="lm-glass-panel rounded-3xl overflow-hidden">
              <MapChart
                visitedProvinces={visitedProvinces}
                cityBuckets={orderedBuckets}
                selectedCityId={selectedBucket?.id || null}
                onSelectCity={setSelectedId}
              />
            </div>

            <div
              ref={stripRef}
              className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar lm-scroll-contain sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0"
            >
              {orderedBuckets.map(bucket => {
                const active = bucket.id === selectedBucket?.id;
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    data-city-id={bucket.id}
                    onClick={() => setSelectedId(bucket.id)}
                    className={`w-[122px] sm:w-auto shrink-0 rounded-2xl overflow-hidden text-left transition-all duration-300 border ${
                      active
                        ? 'lm-glass-pill border-lm-accent/60 shadow-sm'
                        : 'bg-white/65 border-lm-border/70 hover:bg-white/90'
                    }`}
                  >
                    <div className="relative h-14 w-full bg-lm-line/20 overflow-hidden">
                      {bucket.coverPhoto ? (
                        <SafeImage
                          src={bucket.coverPhoto}
                          alt={bucket.title}
                          fill
                          sizes="(max-width: 640px) 122px, 160px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lm-bg to-lm-line/40 text-lm-accent/70">
                          {bucket.isDaily ? (
                            <span className="text-base">🕯️</span>
                          ) : bucket.isHome ? (
                            <span className="text-base">🏠</span>
                          ) : (
                            <PinIcon className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      {(bucket.isHome || bucket.isDaily) && (
                        <span className="absolute top-1 left-1.5 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[9px]">
                          {bucket.isHome ? '常驻' : '日常'}
                        </span>
                      )}
                    </div>

                    <div className="px-2.5 py-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold font-serif-cn truncate ${active ? 'text-lm-accent-deep' : 'text-lm-ink'}`}>
                          {bucket.title}
                        </span>
                        {bucket.subtitle && !bucket.isDaily && (
                          <span className="text-[9px] text-lm-body/40 shrink-0">{bucket.subtitle}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-lm-body/50 mt-0.5 truncate tabular-nums">
                        {bucket.events.length} 段回忆{bucket.photos.length > 0 ? ` · ${bucket.photos.length}图` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右列：选中城市的专属回忆画卷 */}
          {selectedBucket && (
            <div className="space-y-3 lg:col-span-6">
              <div className="lm-card rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="w-4 h-px bg-lm-accent/60" />
                    <span className="text-[9.5px] tracking-[0.28em] uppercase text-lm-accent font-display">
                      {selectedBucket.isDaily
                        ? 'DAILY MOMENTS'
                        : selectedBucket.isHome
                          ? `HOME BASE · ${selectedBucket.subtitle}`
                          : `FOOTPRINT · ${selectedBucket.subtitle}`}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-lm-ink font-serif-cn mt-1 flex items-center gap-2">
                    <span>{selectedBucket.title}</span>
                    {selectedBucket.isHome && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-lm-accent/10 text-lm-accent-deep">大本营</span>}
                  </h2>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-lm-ink tabular-nums">
                    {selectedBucket.events.length} 段回忆 · {selectedBucket.photos.length} 张照片
                  </div>
                  {selectedBucket.totalSpent > 0 && (
                    <div className="text-[11px] text-lm-body/50 mt-0.5 tabular-nums">
                      累计花费 {formatCurrency(selectedBucket.totalSpent)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {selectedBucket.events.map(ev => {
                  const evPhotos = data.photos.filter(p => p.eventId === String(ev.id));
                  const evSpent = data.expenses
                    .filter(ex => ex.eventId === String(ev.id))
                    .reduce((sum, ex) => sum + ex.amount, 0);
                  const daysCount = calcTripDays(ev.date, ev.endDate);
                  const moodEmoji = getMoodEmoji(ev.mood);

                  return (
                    <article
                      key={ev.id}
                      className="lm-card rounded-3xl p-4 space-y-3 border border-lm-border/60"
                    >
                      <div className="flex items-start gap-3">
                        <EventBadge emoji={getEmoji(ev.icon)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-lm-ink font-serif-cn truncate flex items-center gap-1.5">
                              <span>{ev.title}</span>
                              {moodEmoji && <span className="text-sm font-normal">{moodEmoji}</span>}
                            </h3>
                            {daysCount > 1 && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-lm-accent/12 text-lm-accent-deep text-[10px] font-medium">
                                {daysCount} 天
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-lm-body/50">
                            <span className="tabular-nums">{fmtRange(ev.date, ev.endDate)}</span>
                            {ev.location && ev.location !== selectedBucket.title && (
                              <span className="inline-flex items-center gap-0.5 text-lm-accent-deep/85">
                                <PinIcon className="w-2.5 h-2.5" />
                                {ev.location}
                              </span>
                            )}
                            {evSpent > 0 && (
                              <span className="tabular-nums">· {formatCurrency(evSpent)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {ev.desc && (
                        <p className="text-xs leading-relaxed text-lm-body/80 pl-1">
                          {ev.desc}
                        </p>
                      )}

                      {evPhotos.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lm-scroll-contain">
                          {evPhotos.map((p, idx) => (
                            <button
                              key={p.url}
                              type="button"
                              onClick={() => setViewPhoto({ photos: evPhotos, index: idx })}
                              className="relative w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-lm-line/20 group active:scale-[0.98] transition-transform shadow-2xs"
                            >
                              <SafeImage
                                src={p.thumbUrl || p.displayUrl || p.url}
                                alt=""
                                fill
                                sizes="112px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-lm-line/15 border border-dashed border-lm-line/60 px-3 py-2.5 flex items-center gap-2 text-[11px] text-lm-body/45">
                          <CameraIcon className="w-3.5 h-3.5 text-lm-accent/60 shrink-0" />
                          <span>那次在{ev.location || selectedBucket.title}还没有上传照片</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 大图灯箱（带预加载） */}
      {viewPhoto && (
        <Lightbox
          photos={viewPhoto.photos}
          index={viewPhoto.index}
          onClose={() => setViewPhoto(null)}
          onPrev={() => setViewPhoto(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
          onNext={() => setViewPhoto(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
        />
      )}
    </div>
  );
}
