import React, { useEffect, useRef, useState } from 'react';
import { Home, Compass, UtensilsCrossed, Truck, MapPin } from 'lucide-react';
import type { TimelineItem } from '../agentEngine';

interface MapContainerProps {
  timeline: TimelineItem[];
  isExecuting: boolean;
}

declare global {
  interface Window {
    AMap?: any;
  }
}

export const MapContainer: React.FC<MapContainerProps> = ({ timeline, isExecuting }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]);
  const [hasRealMap, setHasRealMap] = useState<boolean>(false);

  // 1. 过滤出除闪送(retail)之外的所有实体行程节点，用作常规 Marker 以及连线
  const activeItems = timeline.filter(item => item.node.type !== 'retail');

  // 计算中心点用于高德地图初始化
  const getCenterPos = () => {
    if (activeItems.length === 0) return [116.4000, 39.9000];
    const positions = activeItems.map(item => item.node.position || [116.473551, 39.957018]);
    const sumLng = positions.reduce((sum, pos) => sum + pos[0], 0);
    const sumLat = positions.reduce((sum, pos) => sum + pos[1], 0);
    return [sumLng / positions.length, sumLat / positions.length];
  };

  // 零售点坐标 (美团闪送/买药)
  const retailItem = timeline.find(item => item.node.type === 'retail');
  // 如果没有明确坐标，则在第二个常规节点附近偏移动态插针
  const firstDestPos = activeItems[1]?.node?.position || [116.4108, 39.8725];
  const retailPos = retailItem?.node?.position || [firstDestPos[0] - 0.005, firstDestPos[1] + 0.005];

  // 闪送的目的地 (我们找出行程里第一个餐饮点作为闪送的目标点)
  const eatItemForDelivery = activeItems.find(item => item.node.type === 'eat') || activeItems[1] || activeItems[0];
  const eatPosForDelivery = eatItemForDelivery?.node?.position || [116.4153, 39.8732];

  // 自定义 AMap Marker HTML Content 生成器 (图二对应)
  const getMarkerContent = (item: TimelineItem, index: number) => {
    const name = item.node.name.length > 7 ? item.node.name.slice(0, 6) + '..' : item.node.name;
    
    if (index === 0) {
      // 起点 (灰色，带家/南站精致小房子)
      return `
        <div class="flex flex-col items-center select-none">
          <div class="w-8 h-8 rounded-full bg-white border-2 border-slate-400 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="px-1.5 py-0.5 rounded-md bg-white/90 border border-slate-200 text-[9px] font-bold text-slate-600 shadow-sm mt-0.5 whitespace-nowrap">${name}</span>
        </div>
      `;
    }
    
    if (item.node.type === 'eat') {
      // 餐饮点
      const isEatFull = item.node.id === 'eat-6';
      return `
        <div class="flex flex-col items-center select-none">
          <div class="w-8 h-8 rounded-full bg-white border-2 ${isEatFull ? 'border-red-500 animate-pulse' : 'border-yellow-400'} shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isEatFull ? '#EF4444' : '#EAB308'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span class="px-1.5 py-0.5 rounded-md ${isEatFull ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-yellow-50 border border-yellow-200 text-amber-800'} text-[9px] font-bold shadow-sm mt-0.5 whitespace-nowrap">${name}</span>
        </div>
      `;
    }
    
    if ((item.node.type as string) === 'hotel') {
      // 酒店住宿点
      return `
        <div class="flex flex-col items-center select-none">
          <div class="w-8 h-8 rounded-full bg-white border-2 border-indigo-500 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/><path d="M19 17V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12"/><path d="M11 7h2"/><path d="M11 11h2"/></svg>
          </div>
          <span class="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[9px] font-bold text-indigo-700 shadow-sm mt-0.5 whitespace-nowrap">${name}</span>
        </div>
      `;
    }
    
    // 默认游玩点 (play)
    return `
      <div class="flex flex-col items-center select-none">
        <div class="w-8 h-8 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-[spin_40s_linear_infinite]"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>
        <span class="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 shadow-sm mt-0.5 whitespace-nowrap">${name}</span>
      </div>
    `;
  };

  // 2. 检测高德地图 AMap 并挂载 3D 实景与导航线条
  useEffect(() => {
    if (window.AMap && activeItems.length > 0) {
      setHasRealMap(true);
      try {
        if (!mapRef.current) {
          const map = new window.AMap.Map('amap-container', {
            zoom: 12.8,
            center: getCenterPos(),
            viewMode: '3D',
            pitch: 35, // 3D微倾斜
            theme: 'light'
          });
          mapRef.current = map;
        } else {
          // 清理之前绘制的 Marker 和折线
          markersRef.current.forEach(m => m.setMap(null));
          markersRef.current = [];
          routesRef.current.forEach(r => {
            if (r.clear) r.clear();
            else if (r.setMap) r.setMap(null);
          });
          routesRef.current = [];
        }

        const mapInstance = mapRef.current;

        // A. 动态绘制所有 Marker
        activeItems.forEach((item, index) => {
          const pos = item.node.position || [116.473551, 39.957018];
          const marker = new window.AMap.Marker({
            position: pos,
            offset: new window.AMap.Pixel(-16, -16),
            content: getMarkerContent(item, index)
          });
          marker.setMap(mapInstance);
          markersRef.current.push(marker);
        });

        // B. 动态绘制美团闪送骑手 (仅在购买时)
        if (isExecuting) {
          const riderMarker = new window.AMap.Marker({
            position: retailPos,
            offset: new window.AMap.Pixel(-14, -14),
            content: `
              <div class="flex flex-col items-center select-none animate-bounce">
                <div class="w-7 h-7 rounded-full bg-meituan border border-meituan-dark shadow-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D2D2D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <span class="px-1 py-0.2 rounded bg-meituan border border-meituan-dark text-[7px] font-bold text-slate-800 mt-0.5 whitespace-nowrap">美团骑手</span>
              </div>
            `
          });
          riderMarker.setMap(mapInstance);
          markersRef.current.push(riderMarker);

          let progress = 0;
          const interval = setInterval(() => {
            progress += 0.02;
            if (progress >= 1.0) {
              clearInterval(interval);
              riderMarker.setPosition(eatPosForDelivery);
            } else {
              const currentLng = retailPos[0] + (eatPosForDelivery[0] - retailPos[0]) * progress;
              const currentLat = retailPos[1] + (eatPosForDelivery[1] - retailPos[1]) * progress;
              riderMarker.setPosition([currentLng, currentLat]);
            }
          }, 100);
        }

        // C. 使用“两阶段高鲁棒画线引擎”遍历两点连线
        window.AMap.plugin(['AMap.Walking', 'AMap.Riding'], () => {
          for (let i = 0; i < activeItems.length - 1; i++) {
            const startPos = activeItems[i].node.position || [116.473551, 39.957018];
            const endPos = activeItems[i + 1].node.position || [116.479133, 39.953049];
            
            // 第一阶段：绘制高能流光原生虚线 (保底，防超长跨区报错)
            const fallbackLine = new window.AMap.Polyline({
              path: [startPos, endPos],
              strokeColor: i % 2 === 0 ? '#F59E0B' : '#EAB308',
              strokeWeight: 4.5,
              strokeOpacity: 0.85,
              strokeStyle: 'dashed',
              strokeDasharray: [10, 5],
              outlineColor: '#E2DED5',
              isOutline: true,
              borderWeight: 1.2
            });
            fallbackLine.setMap(mapInstance);
            routesRef.current.push(fallbackLine);

            // 第二阶段：如果是短距离同城（如5公里内），尝试调用高德真实物理路网进行沿马路高精度覆盖
            const dist = Math.sqrt(Math.pow(startPos[0] - endPos[0], 2) + Math.pow(startPos[1] - endPos[1], 2)) * 100; // 粗略转换公里
            if (dist < 6) {
              const isWalking = activeItems[i].travelModeToNext === 'walk';
              if (isWalking) {
                const walking = new window.AMap.Walking({
                  map: mapInstance,
                  hideMarkers: true,
                  autoFitView: false,
                  outlineColor: '#E2DED5',
                  isOutline: true
                });
                walking.search(startPos, endPos, (status: string) => {
                  if (status === 'complete') {
                    fallbackLine.setMap(null); // 隐藏直连线，显示真实路网
                    routesRef.current.push(walking);
                  }
                });
              } else {
                const riding = new window.AMap.Riding({
                  map: mapInstance,
                  hideMarkers: true,
                  autoFitView: false,
                  outlineColor: '#F59E0B',
                  isOutline: true
                });
                riding.search(startPos, endPos, (status: string) => {
                  if (status === 'complete') {
                    fallbackLine.setMap(null);
                    routesRef.current.push(riding);
                  }
                });
              }
            }
          }

          // 闪送物理轨迹绘制 (仅在执行时)
          if (isExecuting) {
            const deliveryRiding = new window.AMap.Riding({
              map: mapInstance,
              hideMarkers: true,
              autoFitView: false,
              outlineColor: '#FFD100',
              isOutline: true
            });
            deliveryRiding.search(retailPos, eatPosForDelivery, (status: string) => {
              if (status === 'complete') {
                routesRef.current.push(deliveryRiding);
              }
            });
          }
        });

        // 自适应最佳视野，包揽全部 Marker
        setTimeout(() => {
          mapInstance.setFitView();
        }, 300);

      } catch (err) {
        console.warn("Initializing AMap failed:", err);
      }
    }
  }, [timeline, isExecuting]);

  // D. 降级 SVG 沙盘布局算法：将多节点呈优雅 S 曲线或网格起伏优雅分层，实现多节点完美适应
  const getVirtualCoords = (index: number, total: number) => {
    const item = activeItems[index];
    if (item?.node?.coords) return item.node.coords;

    // 根据节点总数将 15-85 范围等分，确保视觉舒张
    const segment = 70 / (total - 1 || 1);
    const x = 15 + index * segment;
    
    // 正弦波交错，上下波折，像是一张手绘藏宝图
    const y = 45 + Math.sin((index * Math.PI) / 1.5) * 18 + (index % 2 === 0 ? 3 : -3);
    return { x, y };
  };

  const getSvgNodeIcon = (type: string) => {
    switch (type) {
      case 'eat':
        return <UtensilsCrossed className="w-full h-full text-amber-800" />;
      case 'hotel':
        return <Home className="w-full h-full text-indigo-600" />;
      case 'play':
      default:
        return <Compass className="w-full h-full text-amber-500 animate-[spin_25s_linear_infinite]" />;
    }
  };

  const getSvgNodeColors = (type: string, index: number, id?: string) => {
    if (index === 0) {
      return { stroke: '#8E8A83', fill: '#FFFFFF', text: '#8E8A83' };
    }
    switch (type) {
      case 'eat':
        const isEatFull = id === 'eat-6';
        return { 
          stroke: isEatFull ? '#EF4444' : '#FFD100', 
          fill: '#FFFFFF', 
          text: isEatFull ? '#EF4444' : '#92400E' 
        };
      case 'hotel':
        return { stroke: '#6366F1', fill: '#FFFFFF', text: '#4F46E5' };
      case 'play':
      default:
        return { stroke: '#F59E0B', fill: '#FFFFFF', text: '#B45309' };
    }
  };

  const retailVirtualCoords = { x: 45, y: 75 };

  return (
    <div className="glass-panel rounded-3xl p-3 flex flex-col h-[230px] relative overflow-hidden select-none">
      
      {/* 1. 真实高德 3D 地图容器 */}
      <div 
        id="amap-container" 
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
          hasRealMap ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      ></div>

      {/* 2. 优雅降级 100% 动态沙盘 (当真实高德不可用时双重保障) */}
      <div className="flex-1 w-full relative grid-bg flex flex-col z-0">
        
        <div className="w-full flex items-center justify-between border-b border-darkbg-border/60 pb-1 px-1">
          <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-meituan-dark" />
            <span>高德 API 温馨拓扑沙盘 (自适应)</span>
          </span>
          <div className="flex items-center space-x-1.5 text-[8px] font-semibold">
            <span className="flex items-center text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1 animate-pulse"></span>
              路网规划折线
            </span>
            {isExecuting && (
              <span className="flex items-center text-meituan-dark">
                <span className="w-1.5 h-1.5 rounded-full bg-meituan mr-1 animate-pulse"></span>
                闪送骑手
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex items-center justify-center relative mt-1">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[145px]">
            <defs>
              <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD100" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <filter id="gentleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#FFD100" floodOpacity="0.4"/>
              </filter>
            </defs>

            {/* A. 循环画线：连接所有实体行程节点 */}
            {activeItems.map((_, i) => {
              if (i === activeItems.length - 1) return null;
              const p1 = getVirtualCoords(i, activeItems.length);
              const p2 = getVirtualCoords(i + 1, activeItems.length);
              return (
                <g key={`route-${i}`}>
                  <path
                    d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="#E2DED5"
                    strokeWidth="1.2"
                  />
                  <path
                    d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="url(#warmGrad)"
                    strokeWidth="1.25"
                    strokeDasharray="3,3"
                    className="animate-[dash_12s_linear_infinite]"
                  />
                </g>
              );
            })}

            {/* B. 闪送跑腿路线绘制 */}
            {isExecuting && activeItems.length > 1 && (() => {
              const targetCoords = getVirtualCoords(
                activeItems.findIndex(item => item.node.type === 'eat') !== -1 
                  ? activeItems.findIndex(item => item.node.type === 'eat') 
                  : 1, 
                activeItems.length
              );
              return (
                <>
                  <path
                    d={`M ${retailVirtualCoords.x} ${retailVirtualCoords.y} L ${targetCoords.x} ${targetCoords.y}`}
                    fill="none"
                    stroke="#FFD100"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    className="animate-[dash_5s_linear_infinite]"
                    filter="url(#gentleGlow)"
                  />
                  <circle r="1.5" fill="#FFD100">
                    <animateMotion 
                      path={`M ${retailVirtualCoords.x} ${retailVirtualCoords.y} L ${targetCoords.x} ${targetCoords.y}`} 
                      dur="4s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </>
              );
            })()}

            {/* C. 循环渲染 Marker 节点 */}
            {activeItems.map((item, index) => {
              const p = getVirtualCoords(index, activeItems.length);
              const colors = getSvgNodeColors(item.node.type, index, item.node.id);
              const name = item.node.name.length > 7 ? item.node.name.slice(0, 6) + '..' : item.node.name;
              
              return (
                <g key={`marker-${index}`}>
                  <g transform={`translate(${p.x - 3.5}, ${p.y - 3.5})`}>
                    <circle 
                      cx="3.5" 
                      cy="3.5" 
                      r="4.5" 
                      fill="#FFFFFF" 
                      stroke={colors.stroke} 
                      strokeWidth="1.2"
                      className={item.node.id === 'eat-6' ? 'animate-pulse' : ''}
                    />
                    <foreignObject x="2.0" y="2.0" width="3" height="3">
                      {index === 0 ? <Home className="w-full h-full text-slate-500" /> : getSvgNodeIcon(item.node.type)}
                    </foreignObject>
                  </g>
                  <text 
                    x={p.x} 
                    y={p.y - 5} 
                    textAnchor="middle" 
                    fill={colors.text} 
                    fontSize="4.5" 
                    fontWeight="extrabold"
                  >
                    {name}
                  </text>
                </g>
              );
            })}

            {/* 零售点图标 */}
            {isExecuting && (
              <g transform={`translate(${retailVirtualCoords.x - 3}, ${retailVirtualCoords.y - 3})`}>
                <circle cx="3" cy="3" r="3.8" fill="#FFFFFF" stroke="#FFD100" strokeWidth="1" />
                <foreignObject x="1.5" y="1.5" width="3" height="3">
                  <Truck className="w-full h-full text-meituan animate-bounce" />
                </foreignObject>
              </g>
            )}
          </svg>
        </div>

        <div className="w-full text-center text-[7.5px] font-semibold text-slate-400 pb-0.5 tracking-wide">
          <span>AMap 接口加载中... 离线状态下将无缝降级为美团数字商圈孪生</span>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -30;
          }
        }
      `}</style>
    </div>
  );
};

export default MapContainer;
