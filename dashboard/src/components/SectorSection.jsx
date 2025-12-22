import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NewsModal } from './NewsModal';

export function SectorSection({ sector, stocks }) {
    const [selectedStock, setSelectedStock] = useState(null);

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
                        onViewNews={() => setSelectedStock(stock)}
                    />
                ))}
            </div>

            <AnimatePresence>
                {selectedStock && (
                    <NewsModal
                        stock={selectedStock}
                        onClose={() => setSelectedStock(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StockCard({ stock, onViewNews }) {
    // Status Logic
    const statusColors = {
        'BUY': 'border-neon-green text-neon-green bg-green-900/20',
        'SELL': 'border-neon-pink text-neon-pink bg-pink-900/20',
        'HOLD': 'border-yellow-500 text-yellow-500 bg-yellow-900/20'
    };
    const statusStyle = statusColors[stock.status] || 'border-gray-500 text-gray-400';

    return (
        <GlassCard className="flex flex-col justify-between border-l-4 hover:border-l-neon-cyan transition-all duration-300 group">
            <div>
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
                    <span className="text-3xl font-bold text-white tracking-tighter">₹{stock.price?.toFixed(2)}</span>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-sm font-mono mb-4">
                    {/* RSI */}
                    <MetricBox label="RSI" value={stock.rsi?.toFixed(2)}
                        color={stock.rsi > 70 ? 'text-neon-pink' : (stock.rsi < 30 ? 'text-neon-green' : 'text-white')}
                    />

                    {/* MACD */}
                    <MetricBox label="MACD" value={stock.macd_signal?.replace(' Crossover', '')}
                        color={stock.macd_signal?.includes('Bullish') ? 'text-neon-green' : 'text-neon-pink'}
                        smallText
                    />

                    {/* Sentiment */}
                    <MetricBox label="SENTIMENT" value={stock.sentiment_score !== null ? stock.sentiment_score : 'N/A'}
                        color={stock.sentiment_score > 0 ? 'text-neon-green' : (stock.sentiment_score < 0 ? 'text-neon-pink' : 'text-white/60')}
                    />
                </div>

                {/* Ownership Metrics (Promoted) */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-white/5 rounded p-1 border border-white/5">
                        <span className="block text-[10px] text-white/40">FII</span>
                        <span className="text-xs font-bold text-neon-cyan">{stock.fii_pct ? stock.fii_pct + '%' : '-'}</span>
                    </div>
                    <div className="bg-white/5 rounded p-1 border border-white/5">
                        <span className="block text-[10px] text-white/40">DII</span>
                        <span className="text-xs font-bold text-neon-cyan">{stock.dii_pct ? stock.dii_pct + '%' : '-'}</span>
                    </div>
                    <div className="bg-white/5 rounded p-1 border border-white/5">
                        <span className="block text-[10px] text-white/40">SHP</span>
                        <span className="text-xs font-bold text-neon-cyan">{stock.held_pct_insiders ? stock.held_pct_insiders + '%' : '-'}</span>
                    </div>
                </div>
            </div>

            {/* News Button Footer */}
            <div className="mt-2 pt-3 border-t border-white/10">
                <button
                    onClick={onViewNews}
                    className="block w-full text-center text-xs font-bold text-neon-cyan/80 border border-neon-cyan/20 bg-neon-cyan/5 py-2 rounded hover:bg-neon-cyan/10 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] tracking-wider"
                >
                    VIEW INTEL &gt;
                </button>
            </div>
        </GlassCard>
    );
}

function MetricBox({ label, value, color, smallText }) {
    return (
        <div className="bg-white/5 p-2 rounded border border-white/5 flex flex-col justify-center">
            <span className="block text-[10px] text-white/40 mb-1">{label}</span>
            <span className={`font-bold block ${smallText ? 'text-[10px] leading-tight' : 'text-sm'} ${color}`}>
                {value}
            </span>
        </div>
    );
}
