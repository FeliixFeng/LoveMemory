'use client';

import { useEffect, useState, useCallback } from 'react';
import { Event } from '../lib/types';

const CITY_TO_PROVINCE: Record<string, string> = {
  '上海': '上海', '北京': '北京', '天津': '天津', '重庆': '重庆',
  '合肥': '安徽', '杭州': '浙江', '宁波': '浙江', '温州': '浙江', '嘉兴': '浙江', '绍兴': '浙江', '金华': '浙江', '台州': '浙江', '湖州': '浙江', '丽水': '浙江',
  '南京': '江苏', '苏州': '江苏', '无锡': '江苏', '常州': '江苏', '徐州': '江苏', '南通': '江苏', '连云港': '江苏', '淮安': '江苏', '盐城': '江苏', '扬州': '江苏', '镇江': '江苏', '泰州': '江苏', '宿迁': '江苏',
  '广州': '广东', '深圳': '广东', '东莞': '广东', '佛山': '广东', '珠海': '广东', '惠州': '广东', '中山': '广东', '江门': '广东', '汕头': '广东', '湛江': '广东', '茂名': '广东', '揭阳': '广东', '梅州': '广东', '清远': '广东', '韶关': '广东', '河源': '广东', '潮州': '广东', '阳江': '广东',
  '成都': '四川', '绵阳': '四川', '德阳': '四川', '宜宾': '四川', '南充': '四川', '达州': '四川', '泸州': '四川', '乐山': '四川', '眉山': '四川', '攀枝花': '四川',
  '武汉': '湖北', '宜昌': '湖北', '襄阳': '湖北', '荆州': '湖北', '黄冈': '湖北', '十堰': '湖北', '孝感': '湖北', '荆门': '湖北', '鄂州': '湖北', '黄石': '湖北', '咸宁': '湖北', '随州': '湖北', '恩施': '湖北', '利川': '湖北',
  '长沙': '湖南', '株洲': '湖南', '湘潭': '湖南', '衡阳': '湖南', '岳阳': '湖南', '常德': '湖南', '张家界': '湖南', '郴州': '湖南', '湘西': '湖南',
  '郑州': '河南', '洛阳': '河南', '开封': '河南', '南阳': '河南', '新乡': '河南', '焦作': '河南', '许昌': '河南', '安阳': '河南', '信阳': '河南', '商丘': '河南',
  '济南': '山东', '青岛': '山东', '烟台': '山东', '潍坊': '山东', '临沂': '山东', '济宁': '山东', '淄博': '山东', '威海': '山东', '德州': '山东', '泰安': '山东', '菏泽': '山东',
  '福州': '福建', '厦门': '福建', '泉州': '福建', '漳州': '福建', '莆田': '福建', '龙岩': '福建', '三明': '福建', '南平': '福建', '宁德': '福建',
  '昆明': '云南', '大理': '云南', '丽江': '云南', '西双版纳': '云南', '曲靖': '云南', '玉溪': '云南', '保山': '云南', '昭通': '云南', '普洱': '云南', '临沧': '云南', '楚雄': '云南', '红河': '云南', '文山': '云南', '德宏': '云南',
  '西安': '陕西', '咸阳': '陕西', '宝鸡': '陕西', '渭南': '陕西', '汉中': '陕西', '安康': '陕西', '延安': '陕西', '榆林': '陕西',
  '哈尔滨': '黑龙江', '齐齐哈尔': '黑龙江', '大庆': '黑龙江', '佳木斯': '黑龙江', '牡丹江': '黑龙江',
  '长春': '吉林', '吉林市': '吉林', '四平': '吉林', '通化': '吉林', '松原': '吉林', '延边': '吉林',
  '沈阳': '辽宁', '大连': '辽宁', '鞍山': '辽宁', '抚顺': '辽宁', '丹东': '辽宁', '锦州': '辽宁', '营口': '辽宁', '辽阳': '辽宁', '盘锦': '辽宁', '铁岭': '辽宁',
  '太原': '山西', '大同': '山西', '长治': '山西', '运城': '山西', '临汾': '山西', '吕梁': '山西',
  '石家庄': '河北', '唐山': '河北', '秦皇岛': '河北', '邯郸': '河北', '保定': '河北', '沧州': '河北', '廊坊': '河北',
  '兰州': '甘肃', '天水': '甘肃', '酒泉': '甘肃', '张掖': '甘肃', '武威': '甘肃',
  '银川': '宁夏', '西宁': '青海', '乌鲁木齐': '新疆', '喀什': '新疆', '伊犁': '新疆',
  '南宁': '广西', '柳州': '广西', '桂林': '广西', '北海': '广西', '百色': '广西',
  '贵阳': '贵州', '遵义': '贵州', '安顺': '贵州', '毕节': '贵州',
  '南昌': '江西', '赣州': '江西', '九江': '江西', '宜春': '江西', '上饶': '江西', '景德镇': '江西',
  '呼和浩特': '内蒙古', '包头': '内蒙古', '鄂尔多斯': '内蒙古', '赤峰': '内蒙古', '呼伦贝尔': '内蒙古',
  '拉萨': '西藏', '海口': '海南', '三亚': '海南',
  '香港': '香港', '澳门': '澳门', '台北': '台湾',
  '武功山': '江西', '庐山': '江西', '莫干山': '浙江', '外滩': '上海',
  '泰山': '山东', '华山': '陕西', '峨眉山': '四川', '九寨沟': '四川',
  '凤凰古城': '湖南', '五台山': '山西', '平遥古城': '山西',
  '故宫': '北京', '长城': '北京', '西湖': '浙江', '乌镇': '浙江',
  '武夷山': '福建', '阳朔': '广西', '香格里拉': '云南', '泸沽湖': '云南',
  '敦煌': '甘肃', '青海湖': '青海', '喀纳斯': '新疆',
  '黄果树瀑布': '贵州', '布达拉宫': '西藏',
};

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
          <div className="w-8 h-8 border-2 border-[#d48b60]/20 border-t-[#d48b60] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#5c3d2a]/40">地图加载中...</p>
        </div>
      </div>
    );
  }

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}' },
    geo: {
      map: 'china', roam: true, zoom: 1.2,
      label: { show: false },
      itemStyle: { areaColor: '#f5f0eb', borderColor: '#d4c4b0', borderWidth: 0.5 },
      emphasis: { label: { show: true, fontSize: 10, color: '#3d281c', textBorderColor: '#fff', textBorderWidth: 2 }, itemStyle: { areaColor: '#e8d5c4' } },
      regions: Array.from(visitedProvinces).map(p => ({
        name: { '上海':'上海市','北京':'北京市','天津':'天津市','重庆':'重庆市','安徽':'安徽省','浙江':'浙江省','江苏':'江苏省','广东':'广东省','四川':'四川省','湖北':'湖北省','湖南':'湖南省','河南':'河南省','山东':'山东省','福建':'福建省','云南':'云南省','陕西':'陕西省','黑龙江':'黑龙江省','吉林':'吉林省','辽宁':'辽宁省','山西':'山西省','河北':'河北省','甘肃':'甘肃省','宁夏':'宁夏回族自治区','青海':'青海省','新疆':'新疆维吾尔自治区','广西':'广西壮族自治区','贵州':'贵州省','江西':'江西省','内蒙古':'内蒙古自治区','西藏':'西藏自治区','海南':'海南省','台湾':'台湾省' }[p] || p,
        label: { show: false },
        itemStyle: { areaColor: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#d48b60' }, { offset: 1, color: '#aa6f4d' }] }, borderColor: '#aa6f4d', borderWidth: 1 }
      }))
    },
    series: [{
      name: '城市', type: 'scatter', coordinateSystem: 'geo', symbol: 'pin', symbolSize: 14,
      data: (() => {
        const seen = new Set<string>();
        return visitedCities.filter(c => { if (seen.has(c.city)) return false; seen.add(c.city); return true; }).map(c => {
          const provinceCoords: Record<string, [number, number]> = {
            '上海':[121.47,31.23],'北京':[116.40,39.90],'天津':[117.20,39.12],'重庆':[106.55,29.56],
            '安徽':[117.28,31.86],'浙江':[120.15,30.28],'江苏':[118.78,32.06],'广东':[113.26,23.13],
            '四川':[104.07,30.57],'湖北':[114.30,30.59],'湖南':[112.94,28.23],'河南':[113.65,34.76],
            '山东':[117.00,36.67],'福建':[119.30,26.08],'云南':[102.83,24.88],'陕西':[108.94,34.26],
            '黑龙江':[126.63,45.75],'吉林':[125.32,43.90],'辽宁':[123.43,41.80],'山西':[112.55,37.87],
            '河北':[114.51,38.04],'甘肃':[103.83,36.06],'青海':[101.74,36.56],'新疆':[87.62,43.83],
            '广西':[108.37,22.82],'贵州':[106.63,26.65],'江西':[115.89,28.68],'内蒙古':[111.75,40.84],
            '西藏':[91.11,29.65],'海南':[110.35,20.02],'宁夏':[106.23,38.49],
          };
          const coords = provinceCoords[c.province];
          if (!coords) return null;
          return { name: c.city, value: [...coords, 10] };
        }).filter(Boolean);
      })(),
      label: { show: true, position: 'bottom', formatter: '{b}', fontSize: 9, color: '#3d281c', distance: 5 },
      itemStyle: { color: '#d48b60', borderColor: '#fff', borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(212,139,96,0.5)' },
      emphasis: { scale: 1.5 }
    }]
  };

  return <EChartsComponent option={option} style={{ height: '400px', width: '100%' }} />;
}

export function MapPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => setEvents(d.events || [])).finally(() => setLoading(false));
  }, []);

  const excludedWords = ['家里', '待定', '内', '附近', '门口', '学校', '公司'];
  const visitedProvinces = new Set<string>();
  const visitedCities: { city: string; province: string }[] = [];

  events.forEach(e => {
    if (!e.location || excludedWords.some(w => e.location.includes(w))) return;
    const province = getProvinceFromCity(e.location);
    if (province) { visitedProvinces.add(province); visitedCities.push({ city: e.location, province }); }
  });

  const uniqueCities = [...new Set(visitedCities.map(c => c.city))];
  if (loading) return <div className="space-y-4"><div className="h-64 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>🗺️ 足迹</h1>
      <div className="lm-card rounded-2xl overflow-hidden">
        <MapChart visitedProvinces={visitedProvinces} visitedCities={visitedCities} />
      </div>
      <div className="lm-card rounded-2xl px-4 py-3">
        <div className="flex justify-center gap-6 text-xs text-[#5c3d2a]/55">
          <div className="flex items-center gap-1.5"><span>📍</span><span className="font-bold text-[#3d281c]">{visitedProvinces.size}</span><span>个省份</span></div>
          <div className="flex items-center gap-1.5"><span>🏙️</span><span className="font-bold text-[#3d281c]">{uniqueCities.length}</span><span>座城市</span></div>
        </div>
      </div>
      {uniqueCities.length > 0 && (
        <div className="lm-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-[#3d281c] mb-3">📍 去过的城市</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCities.map(city => (<span key={city} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d48b60]/10 to-[#aa6f4d]/10 text-xs text-[#aa6f4d] font-medium">{city}</span>))}
          </div>
        </div>
      )}
      {uniqueCities.length === 0 && (
        <div className="lm-card rounded-2xl p-8 text-center">
          <span className="text-4xl mb-3 block">🗺️</span>
          <p className="text-sm text-[#5c3d2a]/50">还没有记录足迹</p>
        </div>
      )}
    </div>
  );
}
