'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';

export function LoadingOverlay() {
  const { isLoading } = useVisualizationStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] bg-viz-bg flex items-center justify-center"
        >
          <div className="text-center">
            {/* Animated logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="relative w-24 h-24 mx-auto">
                {/* Outer ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-viz-cyan/30"
                  style={{
                    borderTopColor: 'var(--viz-cyan)',
                  }}
                />

                {/* Middle ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-3 rounded-full border-2 border-viz-purple/30"
                  style={{
                    borderTopColor: 'var(--viz-purple)',
                  }}
                />

                {/* Inner ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-6 rounded-full border-2 border-viz-amber/30"
                  style={{
                    borderTopColor: 'var(--viz-amber)',
                  }}
                />

                {/* Center dot */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-viz-cyan"
                  style={{
                    boxShadow: '0 0 20px var(--viz-cyan), 0 0 40px var(--viz-cyan)',
                  }}
                />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                Building your city
              </h2>
              <p className="text-white/50 text-sm">
                Parsing repository structure...
              </p>
            </motion.div>

            {/* Progress dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-1 mt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 rounded-full bg-viz-cyan"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
