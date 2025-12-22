import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { GlassButton } from './GlassButton';

export function NewsModal({ stock, onClose }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (!stock) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#050510]/95 border border-neon-cyan/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                            <span className="text-neon-cyan">{stock.ticker_symbol.replace('.BO', '')}</span>
                            <span className="text-xs font-mono px-2 py-0.5 border border-white/20 rounded text-white/50">INTEL_FEED</span>
                        </h2>
                        <p className="text-sm font-mono text-white/40 mt-1">{stock.company_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white hover:bg-white/10 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {stock.news_list && stock.news_list.length > 0 ? (
                        stock.news_list.map((item, i) => (
                            <AccordionItem
                                key={i}
                                item={item}
                                isOpen={i === expandedIndex}
                                toggle={() => setExpandedIndex(i === expandedIndex ? null : i)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-white/30 font-mono">
                            NO INTEL FOUND FOR ASSET
                        </div>
                    )}
                </div>

                {/* Footer decoration */}
                <div className="h-1 w-full bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-green" />
            </motion.div>
        </div>
    );
}

function AccordionItem({ item, isOpen, toggle }) {
    // Convert timestamp to date string if needed
    // yfinance provides providerPublishTime (unix timestamp)
    const dateStr = item.time ? new Date(item.time * 1000).toLocaleString() : 'Recent';

    return (
        <div className={`border border-white/10 rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white/5 border-neon-cyan/30' : 'hover:border-white/30 bg-black/40'}`}>
            <button
                onClick={toggle}
                className="w-full text-left p-4 flex justify-between items-start gap-4"
            >
                <div className="flex-1">
                    <h4 className={`text-sm font-bold leading-relaxed ${isOpen ? 'text-neon-cyan' : 'text-white'}`}>
                        {item.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/40 uppercase">
                        <span className="text-neon-pink">{item.publisher}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                    </div>
                </div>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-white/40 mt-1"
                >
                    ▼
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-4 pb-4 pt-0">
                            <div className="h-px w-full bg-white/10 mb-4" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono text-white/50">SOURCE_LINK_DETECTED</span>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-1.5 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded text-xs font-bold hover:bg-neon-green/20 hover:shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all flex items-center gap-2"
                                >
                                    DECRYPT_DATA (READ) ›
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
