import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function GlassButton({ children, className, onClick, disabled, ...props }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={twMerge(
                "group relative px-8 py-3 rounded-full font-medium text-white shadow-lg",
                "bg-white/20 border border-white/30 backdrop-blur-md",
                "hover:bg-white/30 transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {children}
        </motion.button>
    );
}
