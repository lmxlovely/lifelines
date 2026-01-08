'use client'

import React, { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

interface ParticleEffectsProps {
  trigger: boolean
  type: 'reunion' | 'celebration' | 'sparkle'
  onComplete?: () => void
}

// 彩带爆炸效果
const fireConfetti = () => {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  let interval: any;

// 2. 再进行赋值
  interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        // 3. 现在在这里调用它是安全的，因为变量已经声明过了
        return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration)

    // 从两侧发射
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'],
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'],
    })
  }, 250)

  return () => clearInterval(interval)
}

// 爱心粒子效果
const fireHearts = () => {
  const heartShape = confetti.shapeFromPath({
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  })

  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 20,
    shapes: [heartShape],
    colors: ['#EC4899', '#F472B6', '#F9A8D4', '#8B5CF6', '#F59E0B'],
    scalar: 2,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(100 * particleRatio),
      zIndex: 1000,
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 1.5 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 2.5 })
  fire(0.1, { spread: 120, startVelocity: 45 })
}

// 星星闪烁效果
const fireStars = () => {
  const starShape = confetti.shapeFromPath({
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  })

  confetti({
    particleCount: 80,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    shapes: [starShape],
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'],
    scalar: 1.5,
    ticks: 150,
    gravity: 0.3,
    zIndex: 1000,
  })
}

const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  trigger,
  type,
  onComplete,
}) => {
  const triggerEffect = useCallback(() => {
    let cleanup: (() => void) | undefined

    switch (type) {
      case 'reunion':
        // 重逢效果：爱心 + 彩带组合
        fireHearts()
        cleanup = fireConfetti()
        break
      case 'celebration':
        cleanup = fireConfetti()
        break
      case 'sparkle':
        fireStars()
        break
    }

    // 3秒后调用完成回调
    const timer = setTimeout(() => {
      onComplete?.()
    }, 3000)

    return () => {
      cleanup?.()
      clearTimeout(timer)
    }
  }, [type, onComplete])

  useEffect(() => {
    if (trigger) {
      return triggerEffect()
    }
  }, [trigger, triggerEffect])

  return null
}

// 浮动粒子背景组件
export const FloatingParticles: React.FC<{
  isActive: boolean
  theme: 'destiny' | 'default'
}> = ({ isActive, theme }) => {
  if (!isActive) return null

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            background:
              theme === 'destiny'
                ? `radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.4))`
                : `radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.3))`,
            boxShadow:
              theme === 'destiny'
                ? `0 0 ${particle.size * 2}px rgba(236, 72, 153, 0.5)`
                : `0 0 ${particle.size * 2}px rgba(59, 130, 246, 0.4)`,
          }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// 重逢文字动画组件 - 优化移动端适配
export const ReunionText: React.FC<{
  show: boolean
  onAnimationComplete?: () => void
}> = ({ show, onAnimationComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={onAnimationComplete}
        >
          {/* 背景遮罩 */}
          <motion.div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          
          <motion.div
            className="text-center relative z-10 max-w-sm sm:max-w-md md:max-w-lg"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
          >
            {/* 主标题 */}
            <motion.h2
              className="text-2xl sm:text-4xl md:text-6xl font-display font-bold reunion-text mb-2 sm:mb-4 px-2"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.5))',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              兜兜转转，还是你
            </motion.h2>
            
            {/* 日期 */}
            <motion.p
              className="text-base sm:text-xl md:text-2xl text-white/90 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              ✨ 2018.6.25 - 永远 ✨
            </motion.p>
            
            {/* 副标题 */}
            <motion.p
              className="text-sm sm:text-lg text-pink-300/80 mt-2 sm:mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              有些人散了还会再相遇
            </motion.p>
            
            {/* 装饰心形 */}
            <motion.div
              className="mt-4 sm:mt-6 flex justify-center gap-2 sm:gap-4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: 'spring' }}
            >
              {['💕', '✨', '💕'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="text-xl sm:text-2xl md:text-3xl"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: i === 1 ? [0, 360] : [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: i === 1 ? 3 : 2, 
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ParticleEffects
