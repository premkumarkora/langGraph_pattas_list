import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
}

export function StockTable({ stocks }) {
    const [sortConfig, setSortConfig] = useState({ key: 'ticker_symbol', direction: 'asc' });

    // Flatten the sector grouped data if needed, or handle flat list
    const flatStocks = useMemo(() => {
        if (Array.isArray(stocks)) return stocks;
        // If grouped by sector
        return Object.values(stocks).flat();
    }, [stocks]);

    const sortedStocks = useMemo(() => {
        let sortableItems = [...flatStocks];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle nulls
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [flatStocks, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="mb-12 overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                        <Th label="SECTOR" sortKey="sector" onSort={requestSort} icon={getSortIcon('sector')} />
                        <Th label="ASSET" sortKey="ticker_symbol" onSort={requestSort} icon={getSortIcon('ticker_symbol')} />
                        <Th label="COMPANY" sortKey="company_name" onSort={requestSort} icon={getSortIcon('company_name')} />
                        <Th label="SIGNAL" sortKey="status" onSort={requestSort} icon={getSortIcon('status')} />
                        <Th label="PRICE" sortKey="price" onSort={requestSort} icon={getSortIcon('price')} />
                        <Th label="RSI" sortKey="rsi" onSort={requestSort} icon={getSortIcon('rsi')} />
                        <Th label="MACD" sortKey="macd_signal" onSort={requestSort} icon={getSortIcon('macd_signal')} />
                        <Th label="SENTIMENT" sortKey="sentiment_score" onSort={requestSort} icon={getSortIcon('sentiment_score')} />
                        <Th label="FII" sortKey="fii_pct" onSort={requestSort} icon={getSortIcon('fii_pct')} />
                        <Th label="DII" sortKey="dii_pct" onSort={requestSort} icon={getSortIcon('dii_pct')} />
                        <Th label="SHP" sortKey="held_pct_insiders" onSort={requestSort} icon={getSortIcon('held_pct_insiders')} />
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedStocks.map((stock) => (
                        <tr
                            key={stock.ticker_symbol}
                            className="hover:bg-neon-cyan/5 transition-colors group border-b border-white/5 last:border-0"
                        >
                            <td className="px-4 py-4 text-xs font-mono text-white/40 uppercase">{stock.sector}</td>
                            <td className="px-4 py-4 text-base font-bold text-neon-cyan">{stock.ticker_symbol.replace('.BO', '')}</td>
                            <td className="px-4 py-4 text-xs font-mono text-white/60 truncate max-w-[150px]">{stock.company_name}</td>
                            <td className="px-4 py-4">
                                <span className={cn(
                                    "px-3 py-1 text-[11px] font-bold border rounded-sm tracking-widest uppercase",
                                    stock.status === 'BUY' ? 'border-neon-green/50 text-neon-green bg-green-950/30' :
                                        stock.status === 'SELL' ? 'border-neon-pink/50 text-neon-pink bg-pink-950/30' :
                                            'border-yellow-500/50 text-yellow-500 bg-yellow-950/30'
                                )}>
                                    {stock.status}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-base font-bold text-white">₹{stock.price?.toFixed(2)}</td>
                            <td className={cn(
                                "px-4 py-4 text-sm font-mono font-bold",
                                stock.rsi > 70 ? 'text-neon-pink' : stock.rsi < 30 ? 'text-neon-green' : 'text-white/80'
                            )}>
                                {stock.rsi?.toFixed(1)}
                            </td>
                            <td className="px-4 py-4">
                                {stock.macd_signal && (
                                    <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold border rounded-sm tracking-widest uppercase inline-block",
                                        stock.macd_signal.includes('Bullish') ? "border-neon-green/50 text-neon-green bg-green-950/30" :
                                            "border-neon-pink/50 text-neon-pink bg-pink-950/30"
                                    )}>
                                        {stock.macd_signal.replace(' Crossover', '')}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-4">
                                {stock.sentiment_score !== null ? (
                                    <span className={cn(
                                        "px-3 py-1 text-[11px] font-bold border rounded-sm tracking-widest uppercase inline-block",
                                        stock.sentiment_score > 0 ? "border-neon-green text-neon-green bg-green-950/30" :
                                            stock.sentiment_score < 0 ? "border-neon-pink text-neon-pink bg-pink-950/30" :
                                                "border-white/20 text-white/40 bg-white/5"
                                    )}>
                                        {stock.sentiment_score > 0 ? 'BULLISH' : stock.sentiment_score < 0 ? 'BEARISH' : 'NEUTRAL'}
                                        {" "}{stock.sentiment_score > 0 ? '+' : ''}{(stock.sentiment_score / 10).toFixed(1)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-white/20 font-mono italic">NO DATA</span>
                                )}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-white/70 font-bold">{stock.fii_pct ? stock.fii_pct + '%' : '-'}</td>
                            <td className="px-4 py-4 text-sm font-mono text-white/70 font-bold">{stock.dii_pct ? stock.dii_pct + '%' : '-'}</td>
                            <td className="px-4 py-4 text-sm font-mono text-white/70 font-bold">{stock.held_pct_insiders ? stock.held_pct_insiders + '%' : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Th({ label, sortKey, onSort, icon }) {
    return (
        <th
            className="px-4 py-4 text-xs font-bold text-white/50 uppercase tracking-[0.2em] cursor-pointer hover:text-neon-cyan transition-colors"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                <span className="text-[8px] font-normal opacity-50">{icon}</span>
            </div>
        </th>
    );
}
