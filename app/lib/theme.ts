/**
 * 画布/echarts 不认 CSS 变量。要给它们配色，从这里取。
 *
 * 改色规则：与 app/globals.css 的 :root token 保持一致。
 * 改 :root 时同步改这里；想全站换色，只动这两个文件。
 */
export const THEME = {
  bg: '#FBF8F4',
  line: '#EFD8C3',
  ink: '#3D281C',
  inkStrong: '#2C2420',
  body: '#5C3D2A',
  muted: '#8C7E74',
  accent: '#CC9266',
  accentDeep: '#AD7C57',
  blush: '#F0C8A8',
  // 地图配色（与原 MapPage 等同）
  map: {
    areaLight: '#F5F0EB',
    areaMid: '#D4C4B0',
    areaDeep: '#E8D5C4',
  },
} as const;
