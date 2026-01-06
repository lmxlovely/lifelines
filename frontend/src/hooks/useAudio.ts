'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

interface UseAudioOptions {
  volume?: number
  loop?: boolean
}

export function useAudio(src: string, options: UseAudioOptions = {}) {
  const { volume = 0.5, loop = false } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 在客户端创建 Audio 对象
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(src)
      audioRef.current.volume = volume
      audioRef.current.loop = loop
      
      audioRef.current.addEventListener('canplaythrough', () => {
        setIsLoaded(true)
      })
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })

      audioRef.current.addEventListener('error', (e) => {
        console.warn('Audio load error:', e)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, volume, loop])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => {
        console.warn('Audio play failed:', err)
      })
      setIsPlaying(true)
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))
    }
  }, [])

  return { play, pause, stop, setVolume, isPlaying, isLoaded }
}

export default useAudio
