import { Heart, Check, Loader2 } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import { CASHIER_COPY } from '../../constants/uiCopy';

const c = CASHIER_COPY;

export function CashierModal() {
  const { showCashierModal, setShowCashierModal, plan, isPaying, handlePaymentSubmit } = usePlanning();
  if (!showCashierModal || !plan) return null;
  const bill = plan.businessBill;
  const yen = '¥';
  const node1 = plan.timeline[1]?.node.name ?? '';
  const node2 = plan.timeline[2]?.node.name ?? '';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 space-y-5 shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto lg:hidden" />
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-meituan flex items-center justify-center">
              <Heart className="w-4 h-4 text-slate-800 fill-slate-800" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{c.title}</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">SECURE</span>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-700 font-bold">{c.savingsTag}</p>
            <p className="text-sm font-extrabold text-amber-950">{c.savingsDesc}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-600">{c.savingsLabel}</p>
            <p className="text-xl font-extrabold text-amber-600 font-mono">{yen}{bill.savingsTotal}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bill.ticketPrice && (
            <BillRow
              title={`${c.ticketPrefix} ${node1} ${c.ticketSuffix}`}
              label={bill.ticketPrice.label}
              original={bill.ticketPrice.original}
              current={bill.ticketPrice.current}
            />
          )}
          {bill.mealPrice && (
            <BillRow
              title={`${c.mealPrefix} ${node2} ${c.mealSuffix}`}
              label={bill.mealPrice.label}
              original={bill.mealPrice.original}
              current={bill.mealPrice.current}
              showStrike={bill.mealPrice.couponDeducted > 0}
            />
          )}
          {bill.retailPrice && (
            <BillRow
              title={c.retailTitle}
              label={bill.retailPrice.label}
              original={bill.retailPrice.cost + 5}
              current={bill.retailPrice.cost}
            />
          )}
          {bill.hotelPrice && (
            <BillRow
              title={c.hotelTitle}
              label={bill.hotelPrice.label}
              original={bill.hotelPrice.original}
              current={bill.hotelPrice.current}
            />
          )}
          {bill.taxiPrice && (
            <BillRow title={c.taxiTitle} label={bill.taxiPrice.label} current={bill.taxiPrice.estimated} />
          )}
          {bill.subwayPrice && (
            <BillRow
              title="绿色交通 (公交/地铁)"
              label={bill.subwayPrice.label}
              current={bill.subwayPrice.cost}
            />
          )}
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-100 pt-4">
          <span className="text-sm font-bold text-slate-600">{c.totalLabel}</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900">{yen}{plan.totalCost}</span>
        </div>
        <div className="flex gap-3">
          <button
            disabled={isPaying}
            onClick={handlePaymentSubmit}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-70"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {c.paying}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> {c.confirmPay} {yen}{plan.totalCost}
              </>
            )}
          </button>
          <button
            disabled={isPaying}
            onClick={() => setShowCashierModal(false)}
            className="px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-500 text-sm font-bold hover:bg-slate-200 disabled:opacity-70"
          >
            {c.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillRow({
  title,
  label,
  original,
  current,
  showStrike = true,
}: {
  title: string;
  label: string;
  original?: number;
  current?: number;
  showStrike?: boolean;
}) {
  const yen = '¥';
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-sm">
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{label}</span>
      </div>
      <div className="text-right">
        {original != null && showStrike && (
          <span className="text-xs text-slate-400 line-through block">
            {yen}{original}
          </span>
        )}
        {current != null && <span className="font-bold font-mono">{yen}{current}</span>}
      </div>
    </div>
  );
}
