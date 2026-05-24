import React from 'react';
import { 
  Home, Compass, UtensilsCrossed, ArrowDownUp, 
  RefreshCw, Clock, DollarSign, Users, AlertTriangle,
  Train, Car, Footprints
} from 'lucide-react';
import type { TimelineItem } from '../agentEngine';

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
                  {item.travelLineDetails && (
                    <span className="text-slate-400 font-normal text-[9px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[200px]" title={item.travelLineDetails}>
                      {item.travelLineDetails.includes('🚇 乘坐') 
                        ? item.travelLineDetails.substring(item.travelLineDetails.indexOf('🚇 乘坐') + 4, item.travelLineDetails.indexOf('，票价'))
                        : item.travelLineDetails.includes('🚗 呼叫美团打车') 
                        ? '美团打车' 
                        : item.travelLineDetails.includes('🚶 步行')
                        ? '直接步行'
                        : item.travelLineDetails}
                    </span>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
export default TimelineCards;
