## 1. 架构设计

```mermaid
flowchart TD
    "浏览器" --> "前端应用 React+Vite+TS+Tailwind"
    "前端应用 React+Vite+TS+Tailwind" --> "客户端路由 客户端竖屏"
    "前端应用 React+Vite+TS+Tailwind" --> "管理端路由 管理端桌面"
    "客户端路由 客户端竖屏" --> "首页/备考冲刺/学情看板/我的"
    "管理端路由 管理端桌面" --> "登录/用户管理/题库管理/数据统计"
    "首页/备考冲刺/学情看板/我的" --> "Zustand 状态管理"
    "登录/用户管理/题库管理/数据统计" --> "Zustand 状态管理"
    "Zustand 状态管理" --> "本地 Mock 数据 教材配置/题目/用户/学情"
```

纯前端架构，使用 Mock 数据模拟后端，便于 Netlify 快速部署。数据持久化使用 localStorage。

## 2. 技术说明

- **前端**：React@18 + TypeScript + Vite + TailwindCSS@3
- **路由**：react-router-dom@6
- **状态管理**：Zustand
- **图表**：recharts（学情柱状图、环形图）
- **图标**：lucide-react
- **初始化工具**：vite-init（react-ts 模板）
- **后端**：无（Mock 数据，localStorage 持久化）
- **字体**：Google Fonts 在线加载（马善政毛笔楷书/霞鹜文楷/Noto Serif SC/DM Serif Display）
- **部署**：Netlify 静态托管

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 系统选择入口（客户端/管理端） |
| `/app` | 客户端主页（含底部Tab，默认重定向到 /app/home） |
| `/app/home` | 客户端-首页 |
| `/app/exam` | 客户端-备考冲刺 |
| `/app/dashboard` | 客户端-学情看板 |
| `/app/profile` | 客户端-我的 |
| `/app/practice/:subject` | 刷题训练页 |
| `/app/simulate` | 全真模拟考试 |
| `/admin` | 管理端登录页 |
| `/admin/users` | 用户管理 |
| `/admin/questions` | 题库管理 |
| `/admin/stats` | 数据统计 |

## 4. 数据模型

### 4.1 核心数据结构

```typescript
// 用户
interface User {
  id: string;
  nickname: string;
  avatar: string;
  grade: string;        // 年级，如 "七年级上册"
  createdAt: number;
  stats: {
    streakDays: number;      // 坚持学习天数
    todayAnswered: number;   // 今日答题数
    accuracy: number;        // 正确率 0-100
    todayMinutes: number;    // 今日学习分钟
    errorRate: number;       // 错题率
    mastery: number;         // 综合掌握百分比
    rank: number;            // 排名
  };
}

// 题目
interface Question {
  id: string;
  subject: Subject;          // 学科
  grade: string;             // 年级
  version: string;           // 教材版本
  type: 'single' | 'multiple' | 'judge';
  stem: string;              // 题干
  options: string[];         // 选项
  answer: string | string[];
  analysis: string;          // 解析
  mastered: boolean;         // 是否已掌握
  collected: boolean;        // 是否收藏
}

// 学科
type Subject = 'biology' | 'politics' | 'history' | 'geography' | 'science';

// 教材配置
interface TextbookConfig {
  grade: string;
  subject: Subject;
  subjectName: string;
  versions: string[];        // 教材版本列表
}

// 学情记录
interface StudyRecord {
  date: string;              // YYYY-MM-DD
  minutes: number;
  answered: number;
  correct: number;
}
```

### 4.2 教材版本配置数据

按 PRD 2.4 节定义的年级-学科-版本映射，作为静态配置数据存于 `src/data/textbooks.ts`。
