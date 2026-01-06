"""
LifeLines Backend - 人生轨迹 API
FastAPI 后端服务，提供人生轨迹预测
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import logging
from openai import OpenAI
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO)

# 加载环境变量
load_dotenv()

# ============ API 配置 ============
API_KEY = "sk-UADxiXLJiHHerZ4qXcimIT2Nve6s76EAouGrgZFfeccCXUjw"
BASE_URL = "https://aigc.x-see.cn/v1"

# 初始化 OpenAI 客户端
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

app = FastAPI(
    title="LifeLines API",
    description="预测并可视化两个人的人生轨迹",
    version="1.0.0"
)

# CORS 配置 - 允许前端域名访问
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",  # Vercel 部署的前端
    # 生产环境请替换为你的实际域名
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有，生产环境请限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 数据模型 ============
class StoryRequest(BaseModel):
    name1: str
    name2: str


class StoryEvent(BaseModel):
    year: int
    event: str
    distance: int  # 0-100, 0为在一起, 100为完全陌生
    emotion_score: int  # 0-10, 用于前端配色
    phase: Optional[str] = None  # 阶段名称


class StoryResponse(BaseModel):
    events: List[StoryEvent]
    is_special: bool  # 是否是彩蛋模式
    theme: str  # 主题: "destiny" | "default"


# ============ 彩蛋数据：李彦 & 李梦祥的真实故事 ============
SPECIAL_STORY_LY_LMX = [
    {
        "year": 2018,
        "event": "高一下学期的夏天，6月25日，这个平凡又特别的日子。李彦和李梦祥在那个闷热的奶茶店，确定了彼此的心意。没有轰轰烈烈的表白，只有两颗年轻的心，在青春里悄悄靠近。从此，校园里多了一对的身影。",
        "distance": 3,
        "emotion_score": 10,
        "phase": "💕 6.25 在一起"
    },
    {
        "year": 2019,
        "event": "高二高三的时光，是最纯粹懵懂的甜蜜。在同一层楼上课、有时一起吃饭、一起在公园漫步。小纸条，带的零食，晚自习后操场上的散步，都成了最珍贵的回忆。备战高考的日子里，彼此是最温暖的陪伴。那时候觉得，只要和你在一起，未来就什么都不怕。",
        "distance": 2,
        "emotion_score": 10,
        "phase": "🌸 青春正好"
    },
    {
        "year": 2020,
        "event": "高考结束，成绩揭晓。—李彦去了安阳，李梦祥去了南京。从河南到江苏，800多公里的距离，从此思念要跨越大半个中国。临别那天，两人都没哭，只是紧紧握着对方的手说：'等我'。",
        "distance": 35,
        "emotion_score": 7,
        "phase": "🚂 异地开始"
    },
    {
        "year": 2021,
        "event": "大一到大二，异地恋进入最难熬的阶段。安阳到南京，没有直达的高铁，每一次见面都要精心计划。视频通话从每天变成隔天，话题从分享日常变成了沉默。疫情让见面变得更加奢侈，思念在距离中慢慢发酵成焦虑。",
        "distance": 50,
        "emotion_score": 5,
        "phase": "📱 思念与等待"
    },
    {
        "year": 2022,
        "event": "大三，李梦祥开始准备考研，压力与日俱增。李彦试图理解和支持同时也在忙自己的事业，但两个人的生活节奏越来越不同步。他在图书馆刷题到深夜，她在等着那个越来越晚的晚安。交流变少了，争吵变多了，冷战也变多了。曾经无话不谈的两个人，开始不知道该说什么。",
        "distance": 60,
        "emotion_score": 4,
        "phase": "💔 裂痕渐生"
    },
    {
        "year": 2023,
        "event": "大四，李梦祥考研结束后的某天，积压已久的情感终于爆发。那些委屈、那些不理解、那些异地的心酸，全都化成了伤人的话。最后，两个人都沉默了。'我们...分开吧。' 五年的感情，在那个寒冷的冬夜画上了句号。",
        "distance": 95,
        "emotion_score": 1,
        "phase": "💔 分手"
    },
    {
        "year": 2024,
        "event": "李彦毕业后开始工作，李梦祥考上了研究生。两个人的生活，彻底变成了两条平行线。假装对方已经不存在。可是深夜失眠的时候，还是会忍不住点开那些舍不得删的聊天记录。",
        "distance": 85,
        "emotion_score": 2,
        "phase": "👤 各自天涯"
    },
    {
        "year": 2025,
        "event": "时间是最好的解药。李彦在工作中找到了自己的节奏，李梦祥的研究生生活也渐入佳境。曾经那些刻骨铭心的痛，慢慢变成了偶尔想起时嘴角的一丝苦笑。他们都在学着和过去和解，和自己和解。",
        "distance": 70,
        "emotion_score": 4,
        "phase": "🌱 各自成长"
    },
    {
        "year": 2026,
        "event": "2026年的某一天，一条微信消息打破了两年多的沉默。李彦鼓起的勇气，让两个人都红了眼眶。(这部分不太对)从小心翼翼的寒暄，到深夜里说不完的话。原来这些年，彼此都没有真正放下过。",
        "distance": 40,
        "emotion_score": 7,
        "phase": "💬 重新联系"
    },
    {
        "year": 2026,
        "event": "他们开始在网上分享各自的生活，聊工作、聊理想、聊这些年的成长与遗憾。虽然还没见面，但那种熟悉的感觉，那种只有对方才能给的安心，又悄悄回来了。命运的齿轮正在缓缓转动，故事还在继续... ✨",
        "distance": 25,
        "emotion_score": 8,
        "phase": "💫 命运重启"
    },
    {
        "year": 2027,
        "event": "也许有一天，他们会在某个城市重逢。也许会一起喝杯咖啡，聊聊这些年错过的时光。也许会再次牵起对方的手，也许只是相视一笑。但无论结局如何，这段故事都已经是彼此生命中，最特别的存在。",
        "distance": 15,
        "emotion_score": 9,
        "phase": "🌟 未完待续"
    },
    {
        "year": 2028,
        "event": "兜兜转转，还是你。那些年少时许下的承诺，那些以为再也回不去的过往，都在时间的沉淀中变成了命中注定。有些人走着走着就散了，有些人散了还会再相遇。而你，是我绑了一大圈，还是想要回到的原点。💕",
        "distance": 0,
        "emotion_score": 10,
        "phase": "💑 兜兜转转，还是你"
    }
]


def is_special_couple(name1: str, name2: str) -> bool:
    """检查是否是特殊彩蛋组合"""
    names = {name1.strip(), name2.strip()}
    # 支持多种写法
    special_variants = [
        {"李彦", "李梦祥"},
        {"李彦", "李夢祥"},
        {"liyan", "limengxiang"},
        {"LY", "LMX"},
        {"ly", "lmx"},
        {"彦", "梦祥"},
    ]
    # 不区分大小写比较
    names_lower = {n.lower() for n in names}
    for variant in special_variants:
        if {v.lower() for v in variant} == names_lower:
            return True
    return False


# ============ LLM 调用（通用模式） ============
def get_completion_from_gpt4(prompt: str, system_prompt: str, max_retries: int = 3, delay: int = 3):
    """
    使用 GPT-4 API 获取回答，带重试机制
    """
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=2000,
            )
            return response.choices[0].message.content
        except Exception as e:
            error_message = str(e).lower()
            logging.error(f"API call failed on attempt {attempt + 1}/{max_retries}: {e}")
            
            # 检查是否是额度或速率限制错误
            if "rate limit" in error_message or "quota" in error_message:
                logging.error("Quota or rate limit error detected.")
                return None
            
            if attempt < max_retries - 1:
                logging.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                logging.error("Max retries reached. Returning None.")
                return None
    return None


async def generate_story_with_llm(name1: str, name2: str) -> List[dict]:
    """
    使用 LLM 生成人生故事
    """
    system_prompt = """你是一位富有创意的命运叙述者。根据两个人的名字，创作一段人生交织的故事。

重要：关系类型可以是多样的！
- 可以是爱情（恋人、夫妻）
- 可以是友情（挚友、知己、发小）
- 可以是亲情（兄弟姐妹、父母子女）
- 可以是师生情、战友情、合作伙伴等
- 根据名字的感觉自由发挥，不要局限于爱情故事

时间设定：
- 可以从任何合理的年代开始（不必从2018年）
- 时间跨度可以是5-20年不等
- 可以设定在过去、现在或未来

故事结构要求：
1. 故事必须有起伏：相遇 -> 建立联系 -> 深入了解 -> 经历考验 -> 结局
2. 结局可以是圆满的重逢、深厚的情谊、遗憾的错过、或开放式结尾
3. distance 范围 0-100（0=关系最亲密，100=完全陌生/断联）
4. emotion_score 范围 0-10（10=最温暖幸福，0=最低落悲伤）
5. 包含 8-12 个事件节点
6. 故事要感人、有细节、有画面感

返回严格的 JSON 数组格式：
[
    {"year": 2020, "event": "描述...", "distance": 50, "emotion_score": 5, "phase": "阶段名"},
    ...
]

只返回 JSON 数组，不要其他任何文字或markdown标记。"""

    user_prompt = f"请为 {name1} 和 {name2} 创作一段命运交织的人生故事。自由选择合适的关系类型和时间背景。"

    try:
        result = get_completion_from_gpt4(user_prompt, system_prompt)
        if result:
            # 尝试解析 JSON，处理可能的 markdown 代码块
            clean_result = result.strip()
            if "```json" in clean_result:
                clean_result = clean_result.split("```json")[1].split("```")[0]
            elif "```" in clean_result:
                clean_result = clean_result.split("```")[1].split("```")[0]
            
            return json.loads(clean_result.strip())
    except json.JSONDecodeError as e:
        logging.error(f"JSON parse error: {e}")
    except Exception as e:
        logging.error(f"Error generating story: {e}")
    
    # 降级到默认故事
    return generate_default_story(name1, name2)


def generate_default_story(name1: str, name2: str) -> List[dict]:
    """生成默认的通用故事（无需 LLM）"""
    import random
    current_year = 2026
    
    # 随机选择一种关系类型
    story_types = [
        {
            "type": "friendship",
            "stories": [
                {
                    "year": current_year - 8,
                    "event": f"{name1}和{name2}在大学的社团活动中相识。一个是摄影社的骨干，一个是文学社的才子/才女。因为一次联合活动，两人开始有了交集。",
                    "distance": 65,
                    "emotion_score": 5,
                    "phase": "🤝 初识"
                },
                {
                    "year": current_year - 7,
                    "event": f"共同筹备校庆晚会的那段时间，{name1}和{name2}几乎形影不离。深夜的排练室，一起吃的泡面，成为了珍贵的回忆。",
                    "distance": 35,
                    "emotion_score": 7,
                    "phase": "👫 并肩"
                },
                {
                    "year": current_year - 6,
                    "event": "毕业季来临，两人才发现对方已经成为了生命中不可或缺的存在。那张毕业合影，至今还放在钱包里。",
                    "distance": 15,
                    "emotion_score": 9,
                    "phase": "🎓 挚友"
                },
                {
                    "year": current_year - 4,
                    "event": "各自工作后，见面的机会越来越少。但每次相聚，都能立刻回到从前无话不谈的状态。",
                    "distance": 40,
                    "emotion_score": 6,
                    "phase": "📱 牵挂"
                },
                {
                    "year": current_year - 2,
                    "event": f"{name1}遇到了人生低谷，第一个想到的人就是{name2}。那通深夜的电话，让一切阴霾都散去了。",
                    "distance": 20,
                    "emotion_score": 8,
                    "phase": "💪 支撑"
                },
                {
                    "year": current_year,
                    "event": f"时光荏苒，{name1}和{name2}的友情经受住了时间的考验。也许不常见面，但彼此都知道，那个人一直都在。",
                    "distance": 10,
                    "emotion_score": 9,
                    "phase": "✨ 知己"
                }
            ]
        },
        {
            "type": "family",
            "stories": [
                {
                    "year": current_year - 20,
                    "event": f"医院的产房里，{name2}的第一声啼哭，让{name1}的眼眶湿润了。从此，生命有了新的意义。",
                    "distance": 5,
                    "emotion_score": 10,
                    "phase": "👶 新生"
                },
                {
                    "year": current_year - 15,
                    "event": f"童年时光，{name1}陪着{name2}度过了无数个周末。公园里的秋千、动物园的长颈鹿、睡前的故事书...",
                    "distance": 8,
                    "emotion_score": 9,
                    "phase": "🎠 陪伴"
                },
                {
                    "year": current_year - 8,
                    "event": "青春期的叛逆来得猝不及防。争吵、冷战、摔门声...那段时间，两人之间仿佛隔着一堵墙。",
                    "distance": 60,
                    "emotion_score": 3,
                    "phase": "💢 冲突"
                },
                {
                    "year": current_year - 5,
                    "event": f"{name2}考上了理想的大学，离开家的那天，{name1}偷偷抹去了眼角的泪水。",
                    "distance": 45,
                    "emotion_score": 6,
                    "phase": "✈️ 远行"
                },
                {
                    "year": current_year - 2,
                    "event": "长大后才明白，那些曾经不理解的严厉，都是深沉的爱。一通电话，说出了迟到多年的'谢谢'。",
                    "distance": 25,
                    "emotion_score": 8,
                    "phase": "💝 理解"
                },
                {
                    "year": current_year,
                    "event": f"如今{name1}和{name2}的关系，更像是朋友。可以聊心事、可以开玩笑，血浓于水的羁绊，永远不会改变。",
                    "distance": 10,
                    "emotion_score": 9,
                    "phase": "👨‍👩‍👧 家人"
                }
            ]
        },
        {
            "type": "partners",
            "stories": [
                {
                    "year": current_year - 6,
                    "event": f"{name1}和{name2}在一次创业大赛上相遇。两人的想法不谋而合，一拍即合决定组队。",
                    "distance": 55,
                    "emotion_score": 6,
                    "phase": "🤝 结识"
                },
                {
                    "year": current_year - 5,
                    "event": "创业初期的艰辛超乎想象。资金短缺、技术瓶颈、市场冷淡...但两人互相打气，熬过了最难的日子。",
                    "distance": 25,
                    "emotion_score": 5,
                    "phase": "💪 坚持"
                },
                {
                    "year": current_year - 4,
                    "event": "关于公司发展方向，两人产生了严重的分歧。会议室里的争执，差点让合作走到尽头。",
                    "distance": 70,
                    "emotion_score": 3,
                    "phase": "⚔️ 分歧"
                },
                {
                    "year": current_year - 3,
                    "event": "冷静下来后，两人选择坦诚沟通。原来，分歧的背后是对公司同样的热爱。",
                    "distance": 30,
                    "emotion_score": 7,
                    "phase": "🤝 和解"
                },
                {
                    "year": current_year - 1,
                    "event": "公司终于迎来了突破。站在领奖台上，两人相视一笑——所有的付出都值得了。",
                    "distance": 15,
                    "emotion_score": 9,
                    "phase": "🏆 成功"
                },
                {
                    "year": current_year,
                    "event": f"如今{name1}和{name2}不仅是合作伙伴，更是彼此最信任的人。未来的路，继续并肩前行。",
                    "distance": 10,
                    "emotion_score": 9,
                    "phase": "🚀 未来"
                }
            ]
        }
    ]
    
    # 随机选择一个故事类型
    chosen = random.choice(story_types)
    return chosen["stories"]


# ============ API 端点 ============
@app.get("/")
async def root():
    """健康检查"""
    return {
        "message": "LifeLines API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/api/predict_story", response_model=StoryResponse)
async def predict_story(request: StoryRequest):
    """
    预测两个人的人生轨迹故事
    
    - **name1**: 第一个人的名字
    - **name2**: 第二个人的名字
    
    返回他们的命运故事时间线
    """
    
    name1 = request.name1.strip()
    name2 = request.name2.strip()
    
    if not name1 or not name2:
        raise HTTPException(status_code=400, detail="请输入两个人的名字")
    
    # 检查是否是特殊彩蛋
    if is_special_couple(name1, name2):
        return StoryResponse(
            events=[StoryEvent(**event) for event in SPECIAL_STORY_LY_LMX],
            is_special=True,
            theme="destiny"
        )
    
    # 通用模式：调用 LLM 生成故事
    try:
        story_data = await generate_story_with_llm(name1, name2)
        events = [StoryEvent(**event) for event in story_data]
        return StoryResponse(
            events=events,
            is_special=False,
            theme="default"
        )
    except Exception as e:
        print(f"Error generating story: {e}")
        # 降级到默认故事
        story_data = generate_default_story(name1, name2)
        events = [StoryEvent(**event) for event in story_data]
        return StoryResponse(
            events=events,
            is_special=False,
            theme="default"
        )


@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "lifelines-api"}


# ============ 本地开发启动 ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
