'use client';

import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Event } from '../lib/types';

const CITY_TO_PROVINCE: Record<string, string> = {
  '合肥': '安徽', '上海': '上海', '北京': '北京', '天津': '天津', '重庆': '重庆',
  '杭州': '浙江', '宁波': '浙江', '温州': '浙江', '嘉兴': '浙江', '绍兴': '浙江', '金华': '浙江', '台州': '浙江',
  '南京': '江苏', '苏州': '江苏', '无锡': '江苏', '常州': '江苏', '徐州': '江苏', '南通': '江苏',
  '广州': '广东', '深圳': '广东', '东莞': '广东', '佛山': '广东', '珠海': '广东', '惠州': '广东',
  '成都': '四川', '武汉': '湖北', '宜昌': '湖北', '襄阳': '湖北',
  '长沙': '湖南', '郑州': '河南', '洛阳': '河南', '开封': '河南',
  '济南': '山东', '青岛': '山东', '烟台': '山东',
  '福州': '福建', '厦门': '福建', '泉州': '福建',
  '昆明': '云南', '大理': '云南', '丽江': '云南', '西双版纳': '云南',
  '西安': '陕西', '哈尔滨': '黑龙江', '长春': '吉林', '沈阳': '辽宁', '大连': '辽宁',
  '太原': '山西', '石家庄': '河北', '兰州': '甘肃', '银川': '宁夏', '西宁': '青海',
  '乌鲁木齐': '新疆', '南宁': '广西', '桂林': '广西', '贵阳': '贵州',
  '南昌': '江西', '呼和浩特': '内蒙古', '拉萨': '西藏', '海口': '海南', '三亚': '海南',
  '香港': '香港', '澳门': '澳门', '台北': '台湾',
  '外滩': '上海', '西湖': '浙江',
};

const CITY_COORDS: Record<string, [number, number]> = {
  '合肥': [117.28, 31.86], '上海': [121.47, 31.23], '北京': [116.40, 39.90],
  '杭州': [120.15, 30.28], '南京': [118.78, 32.06], '苏州': [120.62, 31.30],
  '广州': [113.26, 23.13], '深圳': [114.07, 22.55], '成都': [104.07, 30.57],
  '武汉': [114.30, 30.59], '长沙': [112.94, 28.23], '郑州': [113.65, 34.76],
  '济南': [117.00, 36.67], '青岛': [120.38, 36.07], '福州': [119.30, 26.08],
  '厦门': [118.09, 24.48], '昆明': [102.83, 24.88], '大理': [100.23, 25.59],
  '西安': [108.94, 34.26], '重庆': [106.55, 29.56], '哈尔滨': [126.63, 45.75],
  '沈阳': [123.43, 41.80], '大连': [121.62, 38.91], '太原': [112.55, 37.87],
  '石家庄': [114.51, 38.04], '兰州': [103.83, 36.06], '南宁': [108.37, 22.82],
  '贵阳': [106.63, 26.65], '南昌': [115.89, 28.68], '海口': [110.35, 20.02],
  '三亚': [109.51, 18.25], '呼和浩特': [111.75, 40.84], '乌鲁木齐': [87.62, 43.83],
  '拉萨': [91.11, 29.65], '银川': [106.23, 38.49], '西宁': [101.74, 36.56],
  '丽江': [100.23, 26.88], '珠海': [113.58, 22.27], '东莞': [113.75, 23.05],
  '佛山': [113.12, 23.02], '温州': [120.70, 28.00], '宁波': [121.55, 29.87],
  '绍兴': [120.58, 30.00], '嘉兴': [120.76, 30.75], '金华': [119.65, 29.08],
  '常州': [119.97, 31.81], '无锡': [120.31, 31.57], '徐州': [117.18, 34.26],
  '南通': [120.89, 31.98], '烟台': [121.45, 37.46], '泉州': [118.68, 24.87],
  '西双版纳': [100.80, 22.01], '洛阳': [112.45, 34.62], '开封': [114.35, 34.79],
  '宜昌': [111.29, 30.69], '襄阳': [112.14, 32.04], '桂林': [110.29, 25.27],
  '香港': [114.17, 22.28], '澳门': [113.55, 22.20], '台北': [121.56, 25.03],
};

const PROVINCE_NAME_MAP: Record<string, string> = {
  '上海': '上海市', '北京': '北京市', '天津': '天津市', '重庆': '重庆市',
  '安徽': '安徽省', '浙江': '浙江省', '江苏': '江苏省', '广东': '广东省',
  '四川': '四川省', '湖北': '湖北省', '湖南': '湖南省', '河南': '河南省',
  '山东': '山东省', '福建': '福建省', '云南': '云南省', '陕西': '陕西省',
  '黑龙江': '黑龙江省', '吉林': '吉林省', '辽宁': '辽宁省', '山西': '山西省',
  '河北': '河北省', '甘肃': '甘肃省', '宁夏': '宁夏回族自治区', '青海': '青海省',
  '新疆': '新疆维吾尔自治区', '广西': '广西壮族自治区', '贵州': '贵州省',
  '江西': '江西省', '内蒙古': '内蒙古自治区', '西藏': '西藏自治区',
  '海南': '海南省', '香港': '香港特别行政区', '澳门': '澳门特别行政区', '台湾': '台湾省',
};

function getProvinceFromCity(location: string): string | null {
  if (CITY_TO_PROVINCE[location]) return CITY_TO_PROVINCE[location];
  for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
    if (location.includes(city)) return province;
  }
  return null;
}

function getEChartsName(province: string): string {
  return PROVINCE_NAME_MAP[province] || province;
}

export function MapPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, []);

  const excludedWords = ['家里', '待定', '内', '附近', '门口', '学校', '公司'];
  const visitedProvinces = new Set<string>();
  const visitedCities: { city: string; province: string }[] = [];

  events.forEach(e => {
    if (!e.location || excludedWords.some(w => e.location.includes(w))) return;
    const province = getProvinceFromCity(e.location);
    if (province) {
      visitedProvinces.add(province);
      visitedCities.push({ city: e.location, province });
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    async function loadMap() {
      try {
        const echarts = await import('echarts');
        const chinaMap = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json').then(r => r.json());
        echarts.registerMap('china', chinaMap);
        setMapReady(true);
      } catch (err) {
        console.error('Failed to load map:', err);
      }
    }
    loadMap();
  }, []);

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}' },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      label: { show: false },
      itemStyle: { areaColor: '#f5f0eb', borderColor: '#d4c4b0', borderWidth: 0.5 },
      emphasis: {
        label: { show: true, fontSize: 10, color: '#3d281c' },
        itemStyle: { areaColor: '#e8d5c4', borderColor: '#aa6f4d' }
      },
      regions: Array.from(visitedProvinces).map(p => ({
        name: getEChartsName(p),
        itemStyle: {
          areaColor: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#d48b60' }, { offset: 1, color: '#aa6f4d' }] },
          borderColor: '#aa6f4d', borderWidth: 1
        }
      }))
    },
    series: [
      {
        name: '城市',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: visitedCities.filter(c => CITY_COORDS[c.city]).map(c => ({
          name: c.city,
          value: [...CITY_COORDS[c.city], 10]
        })),
        symbolSize: 8,
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
        label: {
          show: true, position: 'right', formatter: '{b}',
          fontSize: 10, color: '#3d281c',
          textShadowColor: '#fff', textShadowBlur: 3
        },
        itemStyle: { color: '#d48b60', shadowBlur: 10, shadowColor: 'rgba(212,139,96,0.4)' }
      }
    ]
  };

  if (loading) return <div className="space-y-4"><div className="h-64 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>🗺️ 足迹</h1>

      <div className="lm-card rounded-2xl overflow-hidden">
        {mapReady ? (
          <ReactECharts option={option} style={{ height: '400px', width: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#d48b60]/20 border-t-[#d48b60] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#5c3d2a]/40">地图加载中...</p>
            </div>
          </div>
        )}
      </div>

      <div className="lm-card rounded-2xl px-4 py-3">
        <div className="flex justify-center gap-6 text-xs text-[#5c3d2a]/55">
          <div className="flex items-center gap-1.5"><span>📍</span><span className="font-bold text-[#3d281c]">{visitedProvinces.size}</span><span>个省份</span></div>
          <div className="flex items-center gap-1.5"><span>🏙️</span><span className="font-bold text-[#3d281c]">{visitedCities.length}</span><span>座城市</span></div>
        </div>
      </div>

      {visitedCities.length > 0 && (
        <div className="lm-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-[#3d281c] mb-3">📍 去过的城市</h3>
          <div className="flex flex-wrap gap-2">
            {visitedCities.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d48b60]/10 to-[#aa6f4d]/10 text-xs text-[#aa6f4d] font-medium">{c.city}</span>
            ))}
          </div>
        </div>
      )}

      {visitedCities.length === 0 && (
        <div className="lm-card rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">🗺️</span>
          <p className="text-sm text-[#5c3d2a]/50">还没有记录足迹</p>
          <p className="text-xs text-[#5c3d2a]/30 mt-1">在事件中添加地点信息，地图会自动点亮</p>
        </div>
      )}
    </div>
  );
}
