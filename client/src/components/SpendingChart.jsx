import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function SpendingChart({ income = 145800, expense = 38450 }) {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  
  const data = [
    { month: 'May', income: 110000, expense: 32000 },
    { month: 'Jun', income: 115000, expense: 41000 },
    { month: 'Jul', income: 120000, expense: 35000 },
    { month: 'Aug', income: 140000, expense: 52000 },
    { month: 'Sep', income: 135000, expense: 48000 },
    { month: 'Oct', income: income, expense: expense },
  ];

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense])) * 1.15 || 150000;

  return (
    <div className="bg-slate-850 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Cash Flow & Monthly Inflow (INR)</span>
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Credits vs Debits across past 6 months
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Credits (+{formatINR(income, false)})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">Debits (-{formatINR(expense, false)})</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="mt-6 h-52 flex items-end justify-between gap-2 sm:gap-6 pt-4 px-2">
        {data.map((item, idx) => {
          const incHeight = Math.max(12, (item.income / maxVal) * 100);
          const expHeight = Math.max(12, (item.expense / maxVal) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Bars Pair */}
              <div className="w-full flex items-end justify-center space-x-1.5 h-full">
                {/* Income Bar */}
                <div 
                  style={{ height: `${incHeight}%` }}
                  className="w-1/2 max-w-[18px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md relative group-hover:brightness-110 transition-all duration-300"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-30 font-mono">
                    +{formatINR(item.income, false)}
                  </div>
                </div>

                {/* Expense Bar */}
                <div 
                  style={{ height: `${expHeight}%` }}
                  className="w-1/2 max-w-[18px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md relative group-hover:brightness-110 transition-all duration-300"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-30 font-mono">
                    -{formatINR(item.expense, false)}
                  </div>
                </div>
              </div>

              {/* Month Label */}
              <span className="mt-3 text-[11px] font-medium text-slate-400 group-hover:text-white transition">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Average Net Savings Rate: <strong className="text-emerald-400">73.6%</strong></span>
        <span className="text-slate-500 text-[11px]">Synced with Core Ledger</span>
      </div>
    </div>
  );
}
