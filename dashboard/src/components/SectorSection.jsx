import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
}
export function SectorSection({ sector, stocks }) {
    if (!stocks || stocks.length === 0) return null;

    return (
        <div className="mb-16 relative">
            <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold tracking-wider text-neon-cyan mb-8 border-b border-white/10 pb-2 uppercase flex items-center justify-between"
            >
                <span>{`> ${sector}`}</span>
                <span className="text-sm font-mono text-white/30">{stocks.length} ASSETS</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stocks.map((stock) => (
                    <StockCard
                        key={stock.ticker_symbol}
                        stock={stock}
                    />
                ))}
            </div>
        </div>
    );
}

function StockCard({ stock }) {
    // Status Logic
    const statusColors = {
        'BUY': 'border-neon-green text-neon-green bg-green-900/20',
        'SELL': 'border-neon-pink text-neon-pink bg-pink-900/20',
        'HOLD': 'border-yellow-500 text-yellow-500 bg-yellow-900/20'
    };
    const statusStyle = statusColors[stock.status] || 'border-gray-500 text-gray-400';

    return (
        <GlassCard className="flex flex-col border-l-4 hover:border-l-neon-cyan transition-all duration-300 group">
            <div className="flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-widest group-hover:text-neon-cyan transition-colors">{stock.ticker_symbol.replace('.BO', '')}</h3>
                        <p className="text-xs text-white/40 truncate max-w-[150px] font-mono mt-1">{stock.company_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold border ${statusStyle} shadow-[0_0_10px_rgba(0,0,0,0.5)] tracking-widest`}>
                        {stock.status}
                    </span>
                </div>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white tracking-tighter shadow-neon-sm">₹{stock.price?.toFixed(2)}</span>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-sm font-mono mb-6">
                    <MetricBox label="RSI" value={stock.rsi?.toFixed(2)}
                        color={stock.rsi > 70 ? 'text-neon-pink' : (stock.rsi < 30 ? 'text-neon-green' : 'text-white')}
                    />
                    <MetricBox
                        label="MACD"
                        value={stock.macd_signal?.replace(' Crossover', '').toUpperCase()}
                        isBadge={true}
                    />
                    <MetricBox
                        label="SENTIMENT"
                        value={stock.sentiment_score !== null ?
                            `${stock.sentiment_score > 0 ? 'BULLISH' : stock.sentiment_score < 0 ? 'BEARISH' : 'NEUTRAL'} ${stock.sentiment_score > 0 ? '+' : ''}${(stock.sentiment_score / 10).toFixed(1)}`
                            : 'N/A'
                        }
                        isBadge={stock.sentiment_score !== null}
                    />
                </div>

                {/* Ownership Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <span className="block text-[11px] font-bold text-white/40 mb-1">FII</span>
                        <span className="text-sm font-black text-neon-cyan">{stock.fii_pct ? stock.fii_pct + '%' : '-'}</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <span className="block text-[11px] font-bold text-white/40 mb-1">DII</span>
                        <span className="text-sm font-black text-neon-cyan">{stock.dii_pct ? stock.dii_pct + '%' : '-'}</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <span className="block text-[11px] font-bold text-white/40 mb-1">SHP</span>
                        <span className="text-sm font-black text-neon-cyan">{stock.held_pct_insiders ? stock.held_pct_insiders + '%' : '-'}</span>
                    </div>
                </div>
            </div>

            {/* News Links Section */}
            <div className="mt-2 pt-4 border-t border-white/10">
                <div className="text-[11px] font-mono text-white/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    Neural Intel Feed
                </div>
                <div className="space-y-2.5">
                    {stock.news_list && stock.news_list.length > 0 ? (
                        stock.news_list.slice(0, 5).map((news, idx) => (
                            <a
                                key={idx}
                                href={news.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-white/70 hover:text-neon-cyan transition-all truncate font-mono bg-white/5 px-3 py-2 rounded-md border border-white/5 hover:border-neon-cyan/30 hover:bg-neon-cyan/5"
                            >
                                {`> `}{news.title}
                            </a>
                        ))
                    ) : (
                        <div className="text-xs text-white/20 font-mono italic px-2">NO DATA DETECTED</div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}

function MetricBox({ label, value, color, smallText, isBadge }) {
    return (
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-center min-h-[60px]">
            <span className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</span>
            {isBadge ? (
                <div className={cn(
                    "px-2 py-0.5 text-[10px] font-black border rounded-sm tracking-widest uppercase text-center inline-block w-fit mx-auto whitespace-nowrap",
                    value.startsWith('BULLISH') ? "border-neon-green text-neon-green bg-green-950/30 shadow-[0_0_8px_rgba(57,255,20,0.3)]" :
                        value.startsWith('BEARISH') ? "border-neon-pink text-neon-pink bg-pink-950/30 shadow-[0_0_8px_rgba(255,0,111,0.3)]" :
                            "border-white/20 text-white/40 bg-white/5"
                )}>
                    {value}
                </div>
            ) : (
                <span className={cn(
                    "font-black block leading-none",
                    smallText ? "text-xs" : "text-lg",
                    color
                )}>
                    {value}
                </span>
            )}
        </div>
    );
}
