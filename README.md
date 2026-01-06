# LifeLines - 人生轨迹 💫

一个精美的 Web 应用，用于可视化两个人的命运交织。输入两个名字，观看他们的人生轨迹在时间轴上起伏、交汇、分离、重逢。

## ✨ 特性

- 🎨 **精美动画** - 使用 Framer Motion 实现电影级丝滑动画
- 📈 **动态曲线** - SVG 贝塞尔曲线实时展示两人的距离变化
- 🎭 **彩蛋模式** - 特定名字组合触发专属剧本和华丽特效
- 🌟 **粒子特效** - 重逢时刻触发全屏粒子爆炸和爱心雨
- 🤖 **AI 生成** - 支持调用 GPT-4 生成个性化故事
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔗 **可分享** - 部署后任何人都可以访问体验

## 🏗️ 项目结构

```
lifelines/
├── backend/                 # FastAPI 后端
│   ├── main.py             # 主应用程序
│   ├── requirements.txt    # Python 依赖
│   └── .env.example        # 环境变量示例
│
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx    # 主页面
│   │   │   ├── layout.tsx  # 布局组件
│   │   │   └── globals.css # 全局样式
│   │   ├── components/
│   │   │   ├── LineChart.tsx       # 核心曲线图组件
│   │   │   └── ParticleEffects.tsx # 粒子特效组件
│   │   ├── lib/
│   │   │   └── api.ts      # API 调用封装
│   │   └── types/
│   │       └── index.ts    # TypeScript 类型定义
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── README.md
```

## 🚀 快速开始

### 前提条件

- Node.js 18+
- Python 3.9+
- pnpm / npm / yarn

### 本地开发

#### 1. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt

# 复制环境变量文件并配置
copy .env.example .env
# 编辑 .env 文件，填入你的 API Key（可选）

# 启动服务
python main.py
# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 http://localhost:8000 运行，API 文档在 http://localhost:8000/docs

#### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install
# 或 pnpm install

# 创建环境变量文件
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 运行

## 🌐 部署指南

### 后端部署到 Render

1. **创建 Render 账户** 并新建 Web Service

2. **连接 Git 仓库**
   - 选择你的 GitHub/GitLab 仓库
   - 选择 `backend` 文件夹作为根目录

3. **配置构建设置**
   ```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **设置环境变量**
   ```
   FRONTEND_URL=https://your-app.vercel.app
   OPENAI_API_KEY=sk-xxx (可选)
   ANTHROPIC_API_KEY=sk-ant-xxx (可选)
   ```

5. **部署** - Render 会自动构建和部署

### 前端部署到 Vercel

1. **创建 Vercel 账户** 并导入项目

2. **配置项目**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **设置环境变量**
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   ```

4. **部署** - 点击 Deploy，等待构建完成

### 部署后检查

1. 访问你的 Vercel 域名
2. 输入两个名字测试
3. 尝试输入 "李彦" 和 "李梦祥" 查看彩蛋效果 ✨

## 🎯 API 文档

### POST /api/predict_story

预测两个人的人生轨迹

**请求体**
```json
{
  "name1": "张三",
  "name2": "李四"
}
```

**响应**
```json
{
  "events": [
    {
      "year": 2020,
      "event": "两人在咖啡店相遇...",
      "distance": 70,
      "emotion_score": 5,
      "phase": "初遇"
    }
  ],
  "is_special": false,
  "theme": "default"
}
```

## 💝 彩蛋

当输入名字为 **"李彦"** 和 **"李梦祥"** 时（不分顺序），将触发专属的"命运主题"：

- 🌌 深邃星空背景
- ✨ 发光粒子特效
- 💫 渐变彩色轨迹线
- 🎆 重逢时刻的粒子爆炸
- 💕 "兜兜转转，还是你" 的浪漫结语

**真实故事时间线：**
- 2018.6.25：高一下学期在一起
- 2020：高考后异地（安阳 ↔ 南京）
- 2023：大四考研后分手
- 2024：各自生活（工作 / 读研）
- 2026：重新联系，命运重启...

## 🛠️ 技术栈

**Frontend**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- canvas-confetti

**Backend**
- FastAPI
- Pydantic
- OpenAI SDK (GPT-4)

## 📄 许可证

MIT License

---

Made with ❤️ for 李彦 & 李梦祥
