// AI 模型 & API 配置（统一管理，改这里即可全局生效）
export const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api-sg.umodelverse.ai/v1';
// DeepSeek 官方模型名
export const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || 'deepseek-v4-pro';
// 备份模型（主力失败时的兜底，更快更省）
export const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'deepseek-v4-flash';

// ModelVerse 已下线官方短名，网关请求须使用自己的模型 ID。
export const MODELVERSE_MODEL = process.env.AI_MODELVERSE_MODEL || 'deepseek-v4-pro-sg';
export const MODELVERSE_FALLBACK_MODEL = process.env.AI_MODELVERSE_FALLBACK_MODEL || 'deepseek-v4-flash-sg';
