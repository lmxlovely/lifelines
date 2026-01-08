'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { StoryEvent } from '@/types'

interface LineChartProps {
  events: StoryEvent[]
  isSpecial: boolean
  currentIndex: number
  name1: string
  name2: string
}

// 将 distance 映射到 Y 坐标
// distance 0 = 两条线重合（中心）, distance 100 = 两条线分开最远
const mapDistanceToY = (distance: number, isLine1: boolean, centerY: number, maxOffset: number) => {
  const offset = (distance / 100) * maxOffset
  return isLine1 ? centerY - offset : centerY + offset
}

// 根据 emotion_score 获取颜色
const getEmotionColor = (score: number, isSpecial: boolean): string => {
  if (isSpecial) {
    // Destiny Theme: 紫色到粉色到金色
    if (score >= 8) return '#F59E0B' // 金色 - 最幸福
    if (score >= 6) return '#EC4899' // 粉色 - 温暖
    if (score >= 4) return '#8B5CF6' // 紫色 - 平静
    return '#6366F1' // 靛蓝 - 忧伤
  }
  // Default Theme: 蓝色系
  if (score >= 8) return '#10B981' // 绿色
  if (score >= 6) return '#3B82F6' // 蓝色
  if (score >= 4) return '#8B5CF6' // 紫色
  return '#6B7280' // 灰色
}

// 生成平滑的贝塞尔曲线路径
const generateSmoothPath = (
  points: { x: number; y: number }[],
  tension: number = 0.3
): string => {
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    
    // 计算控制点
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  
  return path
}

// 发光粒子组件
const GlowingParticle: React.FC<{
  x: number
  y: number
  color: string
  delay: number
}> = ({ x, y, color, delay }) => {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={3}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: [y, y - 20, y - 40],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
      }}
      style={{
        filter: `drop-shadow(0 0 6px ${color})`,
      }}
    />
  )
}

const LineChart: React.FC<LineChartProps> = ({
  events,
  isSpecial,
  currentIndex,
  name1,
  name2,
}) => {
  const controls = useAnimation()
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth
      const mobile = screenWidth < 640
      setIsMobile(mobile)
      
      const width = Math.min(screenWidth - 32, 1200)
      // 移动端高度更小一些
      const height = mobile ? Math.min(280, width * 0.6) : Math.min(400, width * 0.5)
      setDimensions({ width, height })
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  const { width, height } = dimensions
  // 移动端减小 padding
  const padding = isMobile 
    ? { top: 25, right: 15, bottom: 45, left: 15 }
    : { top: 40, right: 60, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const centerY = height / 2
  const maxOffset = chartHeight / 2 - 10

  // 计算可见事件（到当前索引为止）
  const visibleEvents = useMemo(() => {
    return events.slice(0, currentIndex + 1)
  }, [events, currentIndex])

  // 计算点位置
  const points = useMemo(() => {
    if (events.length === 0) return { line1: [], line2: [] }
    
    const xStep = chartWidth / Math.max(events.length - 1, 1)
    
    const line1: { x: number; y: number; event: StoryEvent }[] = []
    const line2: { x: number; y: number; event: StoryEvent }[] = []
    
    visibleEvents.forEach((event, index) => {
      const x = padding.left + index * xStep
      const y1 = mapDistanceToY(event.distance, true, centerY, maxOffset)
      const y2 = mapDistanceToY(event.distance, false, centerY, maxOffset)
      
      line1.push({ x, y: y1, event })
      line2.push({ x, y: y2, event })
    })
    
    return { line1, line2 }
  }, [visibleEvents, events.length, chartWidth, centerY, maxOffset, padding.left])

  // 生成路径
  const paths = useMemo(() => {
    return {
      line1: generateSmoothPath(points.line1),
      line2: generateSmoothPath(points.line2),
    }
  }, [points])

  // 当前事件
  const currentEvent = events[currentIndex]
  const currentColor = currentEvent 
    ? getEmotionColor(currentEvent.emotion_score, isSpecial) 
    : '#8B5CF6'

  // 生成粒子位置（用于发光效果）
  const particles = useMemo(() => {
    if (!isSpecial || points.line1.length === 0) return []
    
    const allParticles: { x: number; y: number; color: string; delay: number }[] = []
    
    points.line1.forEach((point, i) => {
      const color = getEmotionColor(point.event.emotion_score, true)
      allParticles.push({ x: point.x, y: point.y, color, delay: i * 0.1 })
    })
    
    points.line2.forEach((point, i) => {
      const color = getEmotionColor(point.event.emotion_score, true)
      allParticles.push({ x: point.x, y: point.y, color, delay: i * 0.1 + 0.5 })
    })
    
    return allParticles
  }, [points, isSpecial])

  // 路径动画
  useEffect(() => {
    controls.start({
      pathLength: 1,
      transition: { duration: 1.5, ease: 'easeInOut' },
    })
  }, [currentIndex, controls])

  return (
    <div className="relative w-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* 背景网格 */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isSpecial ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="1"
            />
          </pattern>
          
          {/* 发光滤镜 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* 强发光滤镜 */}
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 渐变定义 */}
          <linearGradient id="line1Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          
          <linearGradient id="line2Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>

        <rect width={width} height={height} fill="url(#grid)" />

        {/* 中心线（命运交汇线） */}
        <motion.line
          x1={padding.left}
          y1={centerY}
          x2={width - padding.right}
          y2={centerY}
          stroke={isSpecial ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
          strokeWidth="1"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {/* 年份标签 - 移动端优化 */}
        {events.map((event, index) => {
          const xStep = chartWidth / Math.max(events.length - 1, 1)
          const x = padding.left + index * xStep
          const isVisible = index <= currentIndex
          
          // 移动端只显示部分年份（每隔一个或当前/首尾）
          const showYear = !isMobile || index === 0 || index === events.length - 1 || index === currentIndex || index % 2 === 0
          // 移动端不显示 phase 文字，避免重叠
          const showPhase = !isMobile && event.phase && isVisible
          
          return (
            <motion.g
              key={event.year}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0.3, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {showYear && (
                <text
                  x={x}
                  y={height - (isMobile ? 8 : 15)}
                  textAnchor="middle"
                  className={isMobile ? "text-[8px] font-medium" : "text-xs font-medium"}
                  fill={isSpecial ? '#A78BFA' : '#6B7280'}
                >
                  {isMobile ? String(event.year).slice(-2) : event.year}
                </text>
              )}
              {showPhase && (
                <text
                  x={x}
                  y={height - 35}
                  textAnchor="middle"
                  className="text-[10px]"
                  fill={isSpecial ? '#EC4899' : '#9CA3AF'}
                >
                  {event.phase}
                </text>
              )}
            </motion.g>
          )
        })}

        {/* Line 1 (第一个人) - 发光效果背景 */}
        {isSpecial && paths.line1 && (
          <motion.path
            d={paths.line1}
            fill="none"
            stroke="url(#line1Gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#strongGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Line 1 (第一个人) - 主线条 */}
        {paths.line1 && (
          <motion.path
            d={paths.line1}
            fill="none"
            stroke={isSpecial ? 'url(#line1Gradient)' : '#8B5CF6'}
            strokeWidth={isSpecial ? 4 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={isSpecial ? 'url(#glow)' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Line 2 (第二个人) - 发光效果背景 */}
        {isSpecial && paths.line2 && (
          <motion.path
            d={paths.line2}
            fill="none"
            stroke="url(#line2Gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#strongGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
          />
        )}

        {/* Line 2 (第二个人) - 主线条 */}
        {paths.line2 && (
          <motion.path
            d={paths.line2}
            fill="none"
            stroke={isSpecial ? 'url(#line2Gradient)' : '#EC4899'}
            strokeWidth={isSpecial ? 4 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={isSpecial ? 'url(#glow)' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
          />
        )}

        {/* 数据点 */}
        {points.line1.map((point, index) => (
          <motion.g key={`point1-${index}`}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={isSpecial ? 6 : 5}
              fill={getEmotionColor(point.event.emotion_score, isSpecial)}
              stroke="white"
              strokeWidth="2"
              filter={isSpecial ? 'url(#glow)' : undefined}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.3 }}
            />
            {/* 脉冲动画（仅当前点） */}
            {index === currentIndex && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill="transparent"
                stroke={currentColor}
                strokeWidth="2"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.g>
        ))}

        {points.line2.map((point, index) => (
          <motion.g key={`point2-${index}`}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={isSpecial ? 6 : 5}
              fill={getEmotionColor(point.event.emotion_score, isSpecial)}
              stroke="white"
              strokeWidth="2"
              filter={isSpecial ? 'url(#glow)' : undefined}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.3 }}
            />
            {index === currentIndex && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill="transparent"
                stroke={currentColor}
                strokeWidth="2"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            )}
          </motion.g>
        ))}

        {/* 发光粒子（仅 Special 模式） */}
        {isSpecial && particles.map((particle, index) => (
          <GlowingParticle
            key={`particle-${index}`}
            x={particle.x}
            y={particle.y}
            color={particle.color}
            delay={particle.delay}
          />
        ))}

        {/* 连接线（当 distance 为 0 时显示爱心） */}
        {currentEvent && currentEvent.distance === 0 && points.line1.length > 0 && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <text
              x={points.line1[currentIndex]?.x || 0}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl"
              fill="#EC4899"
              filter="url(#strongGlow)"
            >
              ❤️
            </text>
          </motion.g>
        )}

        {/* 名字标签 - 移动端优化位置 */}
        <motion.text
          x={isMobile ? padding.left + 5 : padding.left - 10}
          y={isMobile ? padding.top - 8 : padding.top}
          textAnchor={isMobile ? "start" : "end"}
          className={isMobile ? "text-xs font-medium" : "text-sm font-medium"}
          fill={isSpecial ? '#EC4899' : '#8B5CF6'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {name1}
        </motion.text>
        
        <motion.text
          x={isMobile ? padding.left + 5 : padding.left - 10}
          y={isMobile ? height - padding.bottom + 15 : height - padding.bottom}
          textAnchor={isMobile ? "start" : "end"}
          className={isMobile ? "text-xs font-medium" : "text-sm font-medium"}
          fill={isSpecial ? '#8B5CF6' : '#EC4899'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          {name2}
        </motion.text>

        {/* Distance 标注 - 移动端隐藏或简化 */}
        {!isMobile && (
          <>
            <motion.text
              x={width - padding.right + 10}
              y={padding.top}
              textAnchor="start"
              className="text-xs"
              fill={isSpecial ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              远离
            </motion.text>
            
            <motion.text
              x={width - padding.right + 10}
              y={centerY}
              textAnchor="start"
              className="text-xs"
              fill={isSpecial ? '#F59E0B' : '#10B981'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              重合 ✨
            </motion.text>
            
            <motion.text
              x={width - padding.right + 10}
              y={height - padding.bottom}
              textAnchor="start"
              className="text-xs"
              fill={isSpecial ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              远离
            </motion.text>
          </>
        )}
      </svg>
    </div>
  )
}

export default LineChart
