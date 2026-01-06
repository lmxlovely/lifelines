'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, Play, Pause, SkipForward, RotateCcw } from 'lucide-react'
import LineChart from '@/components/LineChart'
import ParticleEffects, { FloatingParticles, ReunionText } from '@/components/ParticleEffects'
import { predictStory } from '@/lib/api'
import { StoryResponse, StoryEvent } from '@/types'

export default function Home() {
  // 表单状态
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 故事状态
  const [storyData, setStoryData] = useState<StoryResponse | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // 特效状态
  const [showReunionText, setShowReunionText] = useState(false)
  const [triggerConfetti, setTriggerConfetti] = useState(false)

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name1.trim() || !name2.trim()) return

    setIsLoading(true)
    setError(null)
    setStoryData(null)
    setCurrentIndex(0)
    setIsPlaying(false)
    setShowReunionText(false)
    setTriggerConfetti(false)

    try {
      const data = await predictStory({ name1: name1.trim(), name2: name2.trim() })
      setStoryData(data)
      // 自动开始播放
      setTimeout(() => setIsPlaying(true), 500)
    } catch (err) {
      setError('无法连接到服务器，请稍后重试')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 自动播放逻辑
  useEffect(() => {
    if (!isPlaying || !storyData) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1
        if (next >= storyData.events.length) {
          setIsPlaying(false)
          // 如果是最后一个事件且是 special 模式且 distance 为 0，触发特效
          const lastEvent = storyData.events[storyData.events.length - 1]
          if (storyData.is_special && lastEvent.distance === 0) {
            setTimeout(() => {
              setShowReunionText(true)
              setTriggerConfetti(true)
            }, 500)
          }
          return prev
        }
        return next
      })
    }, 2500) // 每 2.5 秒推进一步

    return () => clearInterval(timer)
  }, [isPlaying, storyData])

  // 控制函数
  const togglePlay = () => setIsPlaying(!isPlaying)
  
  const skipToNext = () => {
    if (!storyData) return
    if (currentIndex < storyData.events.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }
  
  const reset = () => {
    setCurrentIndex(0)
    setIsPlaying(false)
    setShowReunionText(false)
    setTriggerConfetti(false)
  }

  const currentEvent: StoryEvent | undefined = storyData?.events[currentIndex]
  const isSpecial = storyData?.is_special ?? false
  const isDestinyTheme = storyData?.theme === 'destiny'

  return (
    <main
      className={`min-h-screen transition-all duration-1000 ${
        isDestinyTheme ? 'destiny-bg text-white' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
      }`}
    >
      {/* 浮动粒子背景 */}
      <FloatingParticles isActive={isDestinyTheme} theme={storyData?.theme || 'default'} />

      {/* 粒子特效 */}
      <ParticleEffects
        trigger={triggerConfetti}
        type="reunion"
        onComplete={() => setTriggerConfetti(false)}
      />

      {/* 重逢文字 */}
      <ReunionText
        show={showReunionText}
        onAnimationComplete={() => {
          setTimeout(() => setShowReunionText(false), 5000)
        }}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles
              className={`w-8 h-8 ${isDestinyTheme ? 'text-yellow-400' : 'text-purple-500'}`}
            />
            <h1
              className={`text-4xl md:text-6xl font-display font-bold ${
                isDestinyTheme ? 'text-gradient' : 'text-gray-800'
              }`}
            >
              LifeLines
            </h1>
            <Sparkles
              className={`w-8 h-8 ${isDestinyTheme ? 'text-yellow-400' : 'text-purple-500'}`}
            />
          </motion.div>
          <p
            className={`text-lg md:text-xl ${
              isDestinyTheme ? 'text-purple-200' : 'text-gray-600'
            }`}
          >
            人生轨迹 · 命运交织
          </p>
        </motion.header>

        {/* Input Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Name 1 Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder="第一个人的名字"
                className={`w-full px-6 py-4 rounded-2xl text-lg transition-all duration-300 input-breathing ${
                  isDestinyTheme
                    ? 'bg-white/10 border-2 border-purple-400/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:bg-white/15'
                    : 'bg-white border-2 border-purple-200 text-gray-800 placeholder-gray-400 focus:border-purple-500 shadow-lg'
                }`}
                disabled={isLoading}
              />
            </div>

            {/* Heart Icon */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Heart
                className={`w-8 h-8 ${
                  isDestinyTheme ? 'text-pink-400' : 'text-pink-500'
                } fill-current`}
              />
            </motion.div>

            {/* Name 2 Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="第二个人的名字"
                className={`w-full px-6 py-4 rounded-2xl text-lg transition-all duration-300 input-breathing ${
                  isDestinyTheme
                    ? 'bg-white/10 border-2 border-pink-400/30 text-white placeholder-pink-300/50 focus:border-pink-400 focus:bg-white/15'
                    : 'bg-white border-2 border-pink-200 text-gray-800 placeholder-gray-400 focus:border-pink-500 shadow-lg'
                }`}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !name1.trim() || !name2.trim()}
            className={`mt-6 w-full md:w-auto px-12 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 ${
              isDestinyTheme
                ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] disabled:opacity-50'
                : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl disabled:opacity-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ✨
                </motion.span>
                命运计算中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                探索命运轨迹
              </span>
            )}
          </motion.button>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Story Visualization */}
        <AnimatePresence>
          {storyData && (
            <motion.section
              className="max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Line Chart */}
              <div
                className={`rounded-3xl p-6 md:p-8 mb-8 ${
                  isDestinyTheme
                    ? 'bg-white/5 backdrop-blur-sm border border-purple-500/20'
                    : 'bg-white shadow-2xl'
                }`}
              >
                <LineChart
                  events={storyData.events}
                  isSpecial={isSpecial}
                  currentIndex={currentIndex}
                  name1={name1}
                  name2={name2}
                />

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <motion.button
                    onClick={reset}
                    className={`p-3 rounded-full transition-colors ${
                      isDestinyTheme
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="重新开始"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    onClick={togglePlay}
                    className={`p-4 rounded-full transition-colors ${
                      isDestinyTheme
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                        : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={isPlaying ? '暂停' : '播放'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </motion.button>

                  <motion.button
                    onClick={skipToNext}
                    disabled={currentIndex >= storyData.events.length - 1}
                    className={`p-3 rounded-full transition-colors ${
                      isDestinyTheme
                        ? 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-30'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="下一个"
                  >
                    <SkipForward className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  {storyData.events.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex
                          ? isDestinyTheme
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400 scale-125'
                            : 'bg-purple-600 scale-125'
                          : index <= currentIndex
                          ? isDestinyTheme
                            ? 'bg-purple-400/50'
                            : 'bg-purple-300'
                          : isDestinyTheme
                          ? 'bg-white/20'
                          : 'bg-gray-200'
                      }`}
                      whileHover={{ scale: 1.3 }}
                    />
                  ))}
                </div>
              </div>

              {/* Event Description */}
              <AnimatePresence mode="wait">
                {currentEvent && (
                  <motion.div
                    key={currentIndex}
                    className={`max-w-3xl mx-auto rounded-2xl p-8 text-center ${
                      isDestinyTheme
                        ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-400/20'
                        : 'bg-white shadow-xl'
                    }`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Year Badge */}
                    <motion.div
                      className={`inline-block px-6 py-2 rounded-full text-sm font-bold mb-4 ${
                        isDestinyTheme
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      {currentEvent.year}
                      {currentEvent.phase && ` · ${currentEvent.phase}`}
                    </motion.div>

                    {/* Event Text */}
                    <motion.p
                      className={`text-lg md:text-xl leading-relaxed ${
                        isDestinyTheme ? 'text-purple-100' : 'text-gray-700'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {currentEvent.event}
                    </motion.p>

                    {/* Distance Indicator */}
                    <motion.div
                      className={`mt-6 flex items-center justify-center gap-4 text-sm ${
                        isDestinyTheme ? 'text-purple-300' : 'text-gray-500'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span>心灵距离</span>
                      <div
                        className={`w-32 h-2 rounded-full overflow-hidden ${
                          isDestinyTheme ? 'bg-white/10' : 'bg-gray-200'
                        }`}
                      >
                        <motion.div
                          className={`h-full rounded-full ${
                            currentEvent.distance === 0
                              ? 'bg-gradient-to-r from-pink-500 to-red-500'
                              : currentEvent.distance < 30
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : currentEvent.distance < 60
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${100 - currentEvent.distance}%`,
                          }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <span>
                        {currentEvent.distance === 0
                          ? '❤️ 心心相印'
                          : currentEvent.distance < 30
                          ? '💕 亲密无间'
                          : currentEvent.distance < 60
                          ? '💛 若即若离'
                          : '💔 渐行渐远'}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Special Ending Message */}
              {isSpecial &&
                currentIndex === storyData.events.length - 1 &&
                currentEvent?.distance === 0 && (
                  <motion.div
                    className="text-center mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <motion.p
                      className="text-2xl font-display text-gradient font-bold"
                      animate={{
                        textShadow: [
                          '0 0 10px rgba(236,72,153,0.5)',
                          '0 0 20px rgba(236,72,153,0.8)',
                          '0 0 10px rgba(236,72,153,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💫 这是专属于你们的故事 💫
                    </motion.p>
                  </motion.div>
                )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          className={`text-center mt-16 py-8 ${
            isDestinyTheme ? 'text-purple-300/50' : 'text-gray-400'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm">
            Made with ❤️ for those who believe in destiny
          </p>
        </motion.footer>
      </div>
    </main>
  )
}
