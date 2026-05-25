import React, { useState, useEffect } from 'react';
import { 
  Home, Compass, UtensilsCrossed, ArrowDownUp, 
  RefreshCw, Clock, DollarSign, Users, AlertTriangle,
  Train, Car, Footprints
} from 'lucide-react';
import type { TimelineItem } from '../agentEngine';

interface SubwayRoutePanelProps {
  startPos: [number, number];
  endPos: [number, number];
  startName: string;
  endName: string;
  defaultTime: number;
  defaultDist: number;
}

export const SubwayRoutePanel: React.FC<SubwayRoutePanelProps> = ({
  startPos,
  endPos,
  startName,
  endName,
  defaultTime,
  defaultDist
}) => {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [segExpanded, setSegExpanded] = useState<Record<number, boolean>>({});

  const toggleSeg = (idx: number) => {
    setSegExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    if (!window.AMap) {
      setLoading(false);
      return;
    }

    window.AMap.plugin(['AMap.Transfer'], () => {
      const transfer = new window.AMap.Transfer({
        city: '北京市',
        policy: window.AMap.TransferPolicy.LEAST_TIME
      });

      transfer.search(startPos, endPos, (status: string, result: any) => {
        setLoading(false);
        if (status === 'complete' && result.plans && result.plans.length > 0) {
          const plan = result.plans[0];
          
          // 提取真实高德公交地铁规划中的 segments 动作时间轴
          const segments = plan.segments.map((seg: any) => {
            const mode = seg.transit_mode; // "SUBWAY", "BUS", "WALK"
            if (mode === 'SUBWAY' || mode === 'BUS') {
              const line = seg.transit.lines[0];
              return {
                mode,
                lineName: line.name.split('(')[0],
                stopCount: line.via_stops.length + 1,
                direction: line.direction || '',
                onStation: seg.transit.on_station.name,
                offStation: seg.transit.off_station.name,
                time: Math.round(seg.transit.time / 60),
                viaStops: line.via_stops.map((stop: any) => stop.name)
              };
            } else if (mode === 'WALK') {
              return {
                mode,
                distance: seg.walk.distance,
                time: Math.round(seg.walk.time / 60)
              };
            }
            return null;
          }).filter(Boolean);

          setRouteData({
            totalTime: Math.round(plan.time / 60),
            totalDist: (plan.distance / 1000).toFixed(1),
            cost: plan.cost || 4,
            segments
          });
        }
      });
    });
  }, [startPos, endPos]);

  if (loading) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl p-3 animate-pulse text-[10px] text-slate-400 mt-2">
        ⌛ 正在调用高德实时路网公交地铁规划数据...
      </div>
    );
  }

  // 优雅的兜底方案 (若网络解析异常或大北京跨度超限)
  const finalTime = routeData ? routeData.totalTime : defaultTime;
  const finalDist = routeData ? routeData.totalDist : defaultDist;
  const finalCost = routeData ? routeData.cost : 4;
  const segments = routeData?.segments || [
    { mode: 'WALK', distance: 150, time: 2 },
    { mode: 'SUBWAY', lineName: '地铁8号线', stopCount: 4, direction: '朱辛庄方向', onStation: '天桥站', offStation: '金鱼胡同站', time: 8, viaStops: ['珠市口站', '前门站', '王府井站'] },
    { mode: 'WALK', distance: 220, time: 3 }
  ];

  const subways = segments.filter((s: any) => s.mode === 'SUBWAY' || s.mode === 'BUS');

  // 计算总站点数和步行总距离
  const totalStops = segments.reduce((acc: number, curr: any) => {
    if (curr.mode === 'SUBWAY' || curr.mode === 'BUS') {
      return acc + (curr.stopCount || 0);
    }
    return acc;
  }, 0);

  const totalWalkDist = segments.reduce((acc: number, curr: any) => {
    if (curr.mode === 'WALK') {
      return acc + (curr.distance || 0);
    }
    return acc;
  }, 0);

  // 大厂官方地铁色值映射函数
  const getSubwayColor = (name: string) => {
    if (name.includes('1号线')) return { bg: 'bg-[#EF4444]', text: 'text-white', hex: '#EF4444' };
    if (name.includes('3号线')) return { bg: 'bg-[#008A90]', text: 'text-white', hex: '#008A90' };
    if (name.includes('4号线')) return { bg: 'bg-[#008A90]', text: 'text-white', hex: '#008A90' };
    if (name.includes('8号线')) return { bg: 'bg-[#008C4A]', text: 'text-white', hex: '#008C4A' };
    if (name.includes('10号线')) return { bg: 'bg-[#0072BC]', text: 'text-white', hex: '#0072BC' };
    return { bg: 'bg-[#64748B]', text: 'text-white', hex: '#64748B' };
  };

  return (
    <div className="w-full bg-white border border-slate-200/60 rounded-3xl p-4.5 space-y-4 shadow-sm select-none animate-[fadeIn_0.3s_ease-out] mt-2">
      
      {/* 乘车概要区 */}
      <div className="flex flex-col space-y-2">
        <div className="text-slate-800 text-lg font-black tracking-tight">
          全程{finalTime}分钟
        </div>

        {/* 1:1 还原高德彩色地铁胶囊 */}
        <div className="flex items-center space-x-2 flex-wrap">
          {subways.map((sub: any, index: number) => {
            const colors = getSubwayColor(sub.lineName);
            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-slate-300 text-xs font-bold font-sans">→</span>}
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black text-center ${colors.bg} ${colors.text} shadow-sm tracking-wide`}>
                  {sub.lineName}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* 详情数据摘要 */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
          <div>
            <span>{totalStops}站</span>
            <span className="mx-1.5">·</span>
            <span>步行{totalWalkDist}米</span>
            <span className="mx-1.5">·</span>
            <span>{finalCost}元</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-amber-600 hover:text-amber-700 font-black flex items-center space-x-0.5 cursor-pointer active:scale-95 transition-all"
          >
            <span>{isExpanded ? '收起指引' : '查看乘车指引'}</span>
            <span className="text-[8px]">{isExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* 1:1 垂直时间轴乘车指引 */}
      {isExpanded && (
        <div className="border-t border-slate-100 pt-4 space-y-4 animate-[slideDown_0.25s_ease-out]">
          
          {/* 起点 */}
          <div className="flex space-x-3.5 items-start">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <span className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center shadow-sm">
                <span className="w-1.8 h-1.8 rounded-full bg-emerald-500"></span>
              </span>
              <div className="w-0.5 h-6 border-l-2 border-dotted border-slate-300/80 my-1"></div>
            </div>
            <div>
              <p className="text-[11px] text-slate-700 font-extrabold">起点 ({startName})</p>
            </div>
          </div>

          {/* 段内渲染 */}
          {segments.map((seg: any, index: number) => {
            if (seg.mode === 'WALK') {
              const isLast = index === segments.length - 1;
              return (
                <div key={index} className="flex space-x-3.5 items-start -my-1.5">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 flex justify-center py-1">
                      <div className="w-0.5 h-6 border-l-2 border-dotted border-slate-300/80"></div>
                    </div>
                  </div>
                  <div className="py-1">
                    <p className="text-[9.5px] text-slate-400 font-bold flex items-center space-x-1.5">
                      <span>🚶 步行 {seg.distance}米</span>
                      <span>({seg.time}分钟)</span>
                    </p>
                  </div>
                </div>
              );
            }

            if (seg.mode === 'SUBWAY' || seg.mode === 'BUS') {
              const colors = getSubwayColor(seg.lineName);
              const isSegOpen = !!segExpanded[index];
              const viaStops = seg.viaStops || [];
              
              return (
                <React.Fragment key={index}>
                  
                  {/* 上车站 */}
                  <div className="flex space-x-3.5 items-start">
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <span className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center shadow-sm z-10`}>
                        <Train className="w-3 h-3 text-white" />
                      </span>
                      <div className="w-0.5 h-6" style={{ backgroundColor: colors.hex }}></div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-800 font-extrabold">{seg.onStation}</p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold ${colors.bg} ${colors.text}`}>
                          {seg.lineName}
                        </span>
                        {seg.direction && (
                          <span className="text-[8.5px] text-slate-400 font-semibold">{seg.direction}方向</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 中间折叠站点段（优化版高德原生珍珠串主线交互） */}
                  <div className="flex space-x-3.5 items-center my-1">
                    {/* 左侧地铁彩色轴线完美连续伸展 */}
                    <div className="flex flex-col items-center shrink-0 w-5">
                      <div className="w-0.5 h-6" style={{ backgroundColor: colors.hex }}></div>
                    </div>
                    
                    {/* 右侧极其轻量且高融合度的折叠操作按钮 */}
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSeg(index)}
                        className="flex items-center space-x-1 text-[9.5px] text-slate-400 hover:text-slate-600 font-bold bg-slate-50 hover:bg-slate-100/80 border border-slate-200/30 px-2 py-0.5 rounded-md cursor-pointer transition-all active:scale-95"
                      >
                        <span className="text-[7.5px] transition-transform duration-200" style={{ transform: isSegOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        <span>{seg.stopCount}站 ({seg.time}分钟)</span>
                      </button>
                    </div>
                  </div>

                  {/* 展开的经停站节点：珍珠穿线，完全贯穿主线轴 */}
                  {isSegOpen && viaStops.map((stopName: string, stopIdx: number) => (
                    <div key={stopIdx} className="flex space-x-3.5 items-center h-7 animate-[fadeIn_0.2s_ease-out]">
                      {/* 左侧完全贯通的地铁色粗主干线 + 叠在线上的白色实心小圆圈 */}
                      <div className="flex flex-col items-center shrink-0 w-5 relative h-full justify-center">
                        {/* 主地铁干线 */}
                        <div className="absolute w-0.5 h-full" style={{ backgroundColor: colors.hex }}></div>
                        {/* 叠在线中央的小圆圈 */}
                        <div className="w-2 h-2 rounded-full bg-white border-2 z-10 shadow-xs" style={{ borderColor: colors.hex }}></div>
                      </div>
                      {/* 右侧站名 */}
                      <div className="flex-1">
                        <span className="text-[9.5px] text-slate-500 font-bold">{stopName}</span>
                      </div>
                    </div>
                  ))}

                  {/* 下车站/中转站 */}
                  <div className="flex space-x-3.5 items-start">
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <span className="w-5 h-5 rounded-full border-3 bg-white flex items-center justify-center z-10 shadow-sm" style={{ borderColor: colors.hex }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.hex }}></span>
                      </span>
                      {index < segments.length - 1 && (
                        <div className="w-0.5 h-6 border-l-2 border-dotted border-slate-300/80 my-1"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-800 font-extrabold">{seg.offStation}</p>
                    </div>
                  </div>

                </React.Fragment>
              );
            }
            return null;
          })}

          {/* 终点 */}
          <div className="flex space-x-3.5 items-start">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <span className="w-5 h-5 rounded-full border-2 border-rose-500 bg-white flex items-center justify-center shadow-sm">
                <span className="w-1.8 h-1.8 rounded-full bg-rose-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[11px] text-slate-700 font-extrabold">终点 ({endName})</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

interface TimelineCardsProps {
  timeline: TimelineItem[];
  onSwapOrder: () => void;
  onShuffleNode: (nodeId: string, type: 'play' | 'eat') => void;
  isExecuting: boolean;
}

export const TimelineCards: React.FC<TimelineCardsProps> = ({
  timeline,
  onSwapOrder,
  onShuffleNode,
  isExecuting
}) => {
  if (timeline.length === 0) return null;

  const getStatusBadge = (status: TimelineItem['actionStatus']) => {
    switch (status) {
      case 'executing':
        return (
          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold animate-pulse border border-amber-200 flex items-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-ping"></span>
            管家执行中
          </span>
        );
      case 'success':
        return (
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100 shrink-0">
            ✓ 已预订成功
          </span>
        );
      case 'failed':
        return (
          <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-bold border border-red-100 shrink-0">
            ⚠️ 额满重规划
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200 shrink-0">
            已加入清单
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-16">
      {timeline.map((item, index) => {
        const isStart = index === 0 || item.node.id === 'start-node';
        const nodeType = item.node.type;

        return (
          <React.Fragment key={item.node.id || index}>
            {/* 卡片渲染 */}
            <div className="flex space-x-3">
              {/* 左侧时间线轴线 */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm transition-all duration-300 ${
                  isStart 
                    ? 'bg-slate-50 border border-slate-200'
                    : item.actionStatus === 'success'
                    ? 'bg-emerald-50 border border-emerald-300'
                    : item.node.id === 'eat-6'
                    ? 'bg-rose-50 border border-rose-300 animate-pulse'
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  {isStart ? (
                    <Home className="w-4 h-4 text-slate-500" />
                  ) : nodeType === 'eat' ? (
                    <UtensilsCrossed className={`w-4 h-4 ${
                      item.actionStatus === 'success' 
                        ? 'text-emerald-500' 
                        : item.node.id === 'eat-6'
                        ? 'text-red-500'
                        : 'text-amber-500'
                    }`} />
                  ) : (
                    <Compass className={`w-4 h-4 ${
                      item.actionStatus === 'success' ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
                    }`} />
                  )}
                </div>
                {/* 只有不是最后一项时，才显示垂直轴线 */}
                {index < timeline.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200/80 my-1"></div>
                )}
              </div>

              {/* 右侧卡片内容 */}
              <div className={`flex-1 glass-panel p-4 transition-all duration-300 relative border ${
                isStart
                  ? 'p-3.5 overflow-hidden'
                  : item.node.id === 'eat-6' && item.actionStatus !== 'success'
                  ? 'border-red-200 bg-red-50/5'
                  : 'hover:border-amber-200/60'
              }`}>
                {/* 卡片头部 */}
                <div className="flex justify-between items-start space-x-2">
                  <div>
                    <span className={`text-xs font-mono font-extrabold ${isStart ? 'text-slate-400' : 'text-amber-600'}`}>
                      {item.time}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {item.node.name}
                    </h3>
                  </div>
                  {isStart ? (
                    <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-semibold">
                      Start
                    </span>
                  ) : (
                    getStatusBadge(item.actionStatus)
                  )}
                </div>

                {/* 卡片描述 */}
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                  {item.node.description}
                </p>

                {/* 爆满警告提示（仅就餐爆满且不是执行成功状态时） */}
                {!isStart && nodeType === 'eat' && item.node.id === 'eat-6' && item.actionStatus !== 'success' && (
                  <div className="mt-3 flex items-start space-x-2 bg-red-50 border border-red-100 p-2.5 rounded-2xl text-red-800 text-[10px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-extrabold">⚠️ 美团实时排队预警</span>
                      ：该餐厅当前正值用餐高峰，前方现场排号已达 <span className="font-extrabold font-mono text-red-600">48</span> 桌，等待长达 <span className="font-extrabold font-mono text-red-600">110</span> 分钟。下单时，管家将启动 **Re-Planning** 自动为您平替最优空闲席位。
                    </div>
                  </div>
                )}

                {/* 属性标签区 */}
                {!isStart && item.node.tags && item.node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.node.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border ${
                          tag.includes('减肥') || tag.includes('低卡') || tag.includes('低盐')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 卡片底部：费用、时间与操作按钮 */}
                {!isStart && (
                  <div className="flex justify-between items-center mt-3.5 pt-3.5 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                    <div className="flex space-x-3">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {nodeType === 'eat' ? '就餐' : '停留'} {item.node.duration} 分钟
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                        约 {item.node.price} 元/人
                      </span>
                      {nodeType === 'eat' && item.node.realtimeStatus.queueTables > 0 && (
                        <span className={`flex items-center ${item.node.id === 'eat-6' ? 'text-red-500' : 'text-amber-600'}`}>
                          <Users className="w-3.5 h-3.5 mr-1" />
                          现场排队 {item.node.realtimeStatus.queueTables} 桌
                        </span>
                      )}
                    </div>

                    {/* 操作按键：换一换、调换吃玩 */}
                    {!isExecuting && (
                      <div className="flex space-x-1.5">
                        <button 
                          onClick={() => onShuffleNode(item.node.id, nodeType === 'eat' ? 'eat' : 'play')}
                          className="flex items-center px-2 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/80 active:bg-slate-100 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-2.8 h-2.8 mr-0.5 text-slate-400" />
                          换一换
                        </button>
                        {/* 调换顺序按钮：为方便体验，只在第一个非起步卡片提供调换吃玩快捷键 */}
                        {index === 1 && timeline.length >= 3 && (
                          <button 
                            onClick={onSwapOrder}
                            className="flex items-center px-2 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/80 active:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            <ArrowDownUp className="w-2.8 h-2.8 mr-0.5 text-slate-400" />
                            调换吃玩
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 卡片之间的交通连线 */}
            {index < timeline.length - 1 && (
              <>
                <div className="flex space-x-3 -my-1 h-8">
                  {/* 连线占位 */}
                  <div className="w-8 flex justify-center">
                    <div className="w-0.5 h-full bg-slate-200/80"></div>
                  </div>
                  {/* 交通工具与换乘指引 */}
                  <div className="flex items-center text-[10px] text-slate-500/90 font-bold space-x-2 pl-4">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center space-x-1">
                      {item.travelModeToNext === 'walk' ? (
                        <>
                          <Footprints className="w-3 h-3 text-slate-500" />
                          <span>🚶 步行</span>
                        </>
                      ) : item.travelModeToNext === 'subway' ? (
                        <>
                          <Train className="w-3 h-3 text-sky-500 animate-pulse" />
                          <span>🚇 地铁</span>
                        </>
                      ) : (
                        <>
                          <Car className="w-3 h-3 text-amber-500" />
                          <span>🚗 打车</span>
                        </>
                      )}
                    </span>
                    <span>{item.distanceToNext} 公里</span>
                    <span className="text-slate-400 font-normal">
                      ({item.travelTimeToNext}分钟路程)
                    </span>
                  </div>
                </div>

                {/* 如果是地铁，渲染高能1:1还原高德换乘的大厂极客级垂直时间轴组件！ */}
                {item.travelModeToNext === 'subway' && (
                  <div className="flex space-x-3 -my-1 pb-2">
                    {/* 左侧垂直线轴的连贯性延长线 */}
                    <div className="w-8 flex justify-center shrink-0">
                      <div className="w-0.5 h-full bg-slate-200/80"></div>
                    </div>
                    {/* 高精高德换乘面板 */}
                    <div className="flex-1 pr-1.5">
                      <SubwayRoutePanel
                        startPos={item.node.position || [116.4108, 39.8725]}
                        endPos={timeline[index + 1].node.position || [116.3974, 39.9180]}
                        startName={item.node.name}
                        endName={timeline[index + 1].node.name}
                        defaultTime={item.travelTimeToNext || 15}
                        defaultDist={item.distanceToNext || 5}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
export default TimelineCards;
