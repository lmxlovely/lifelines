// API 响应类型定义
export interface StoryEvent {
  year: number
  event: string
  distance: number // 0-100, 0为在一起, 100为完全陌生
  emotion_score: number // 0-10, 用于前端配色
  phase?: string
}

export interface StoryResponse {
  events: StoryEvent[]
  is_special: boolean
  theme: 'destiny' | 'default'
}

export interface StoryRequest {
  name1: string
  name2: string
  password?: string  // 彩蛋密码验证
}
