import { useState, useEffect } from 'react';
import { X, ShoppingBag, Coffee, Flower2, CheckCircle2, Loader2, ExternalLink, MapPin } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';

const FALLBACK_ITEMS = [
  { id: 'bwcj', type: 'drink', icon: Coffee, name: '霸王茶姬', desc: '系统推荐周边好店 · 免配送费', price: 38, keyword: '霸王茶姬' },
  { id: 'rose', type: 'gift', icon: Flower2, name: '浪漫红玫瑰', desc: '同城极速闪送 · 送至餐厅', price: 99, keyword: '红玫瑰' },
];

const GAODE_KEY = 'f65930892bcd9198afe9afff66e74e85';

export function CashierModal() {
  const { plan, showCashierModal, setShowCashierModal, constraints } = usePlanning();
  const [step, setStep] = useState<'cart' | 'paying' | 'tracking'>('cart');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [upsellItems, setUpsellItems] = useState(FALLBACK_ITEMS);
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  useEffect(() => {
    if (showCashierModal && plan) {
      setStep('cart');
      fetchRealShops();
    }
  }, [showCashierModal, plan]);

  const fetchRealShops = async () => {
    if (!plan || plan.timeline.length === 0) return;
    
    setIsLoadingShops(true);
    try {
      const firstNodeName = plan.timeline[0].node.name;
      const targetCity = plan.targetCity || '北京';
      const searchKeywords = constraints?.deliveryRequests && constraints.deliveryRequests.length > 0 
        ? constraints.deliveryRequests.join('|') 
        : '奶茶|鲜花';
      
      // 搜索目标节点周边的需求
      const url = `https://restapi.amap.com/v3/place/text?key=${GAODE_KEY}&keywords=${encodeURIComponent(firstNodeName + ' ' + searchKeywords)}&city=${encodeURIComponent(targetCity)}&offset=2&page=1&extensions=base`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === '1' && data.pois && data.pois.length > 0) {
        const realItems = data.pois.slice(0, 2).map((poi: any, index: number) => {
          const isDrink = poi.type.includes('饮') || poi.type.includes('茶') || poi.type.includes('咖啡');
          return {
            id: poi.id || `real_${index}`,
            type: isDrink ? 'drink' : 'gift',
            icon: isDrink ? Coffee : Flower2,
            name: poi.name,
            desc: `高德真实数据 · ${poi.address || '周边推荐'}`,
            price: isDrink ? 35 : 128,
            keyword: poi.name
          };
        });
        
        // 如果搜不到两个，就用 fallback 补齐
        if (realItems.length === 1) {
          realItems.push(FALLBACK_ITEMS[1]);
        }
        
        setUpsellItems(realItems);
        setSelectedItems([realItems[0].id]); // 默认选中第一个
      } else {
        setUpsellItems(FALLBACK_ITEMS);
        setSelectedItems([FALLBACK_ITEMS[0].id]);
      }
    } catch (err) {
      console.error("高德 API 请求失败，使用兜底假数据:", err);
      setUpsellItems(FALLBACK_ITEMS);
      setSelectedItems([FALLBACK_ITEMS[0].id]);
    } finally {
      setIsLoadingShops(false);
    }
  };

  if (!showCashierModal || !plan) return null;

  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalUpsell = upsellItems.filter(i => selectedItems.includes(i.id)).reduce((acc, curr) => acc + curr.price, 0);
  const finalTotal = totalUpsell;

  const handleCheckout = () => {
    setStep('paying');
    setTimeout(() => {
      setStep('tracking');
    }, 1500);
  };

  const jumpToMeituan = (keyword: string) => {
    const dianpingSearchUrl = `https://www.dianping.com/search/keyword/1/0_${encodeURIComponent(keyword)}`;
    window.open(dianpingSearchUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => { if (step !== 'paying') setShowCashierModal(false); }}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            {step === 'tracking' ? '订单实时追踪' : '专属附加需求确认'}
          </h2>
          {step !== 'paying' && (
            <button 
              onClick={() => setShowCashierModal(false)}
              className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {step === 'cart' && (
          <div className="p-5 space-y-6">
            <div>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 高德实时探索周边好店
              </p>
              
              {isLoadingShops ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-500">正在调用高德 API 获取真实商户...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upsellItems.map(item => {
                    const Icon = item.icon;
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected ? 'border-meituan bg-meituan/10' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-meituan text-slate-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5 truncate font-medium">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-800">+¥{item.price}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-meituan bg-meituan' : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-800" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCheckout}
                disabled={isLoadingShops}
                className={`w-full py-4 rounded-2xl font-extrabold flex items-center justify-between px-6 shadow-md transition-all ${
                  isLoadingShops ? 'bg-slate-200 text-slate-400' : 'bg-meituan text-slate-800 hover:bg-meituan-light active:scale-[0.98]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  确认并支付
                </span>
                <span className="text-lg">¥{finalTotal}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'paying' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-meituan animate-spin" />
            <p className="text-slate-600 font-bold">正在为您锁定座位并呼叫骑手...</p>
          </div>
        )}

        {step === 'tracking' && (
          <div className="p-6 space-y-6">
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="w-16 h-16 bg-white rounded-full shadow-md mx-auto flex items-center justify-center mb-3 border-4 border-amber-100 z-10 relative">
                <span className="text-3xl">🚴‍♂️</span>
              </div>
              <h3 className="text-lg font-black text-slate-800 relative z-10">骑手已接单</h3>
              <p className="text-sm text-slate-600 mt-2 font-medium relative z-10">
                美团骑手 <b>王师傅</b> 正在前往真实商铺取件。<br/>
                预计将在您到达第一站时准时送达！
              </p>
            </div>

            <div className="space-y-3">
              {upsellItems.filter(i => selectedItems.includes(i.id)).map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">商家正在制作中...</p>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">极速派送中</span>
                  </div>
                  
                  <button
                    onClick={() => jumpToMeituan(item.keyword)}
                    className="w-full py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-meituan hover:text-slate-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    在大众点评中查看真实商品 <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {selectedItems.length === 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-slate-800">未选择任何商品</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCashierModal(false)}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
            >
              返回我的行程
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
