// AI 模型 & API 配置（统一管理，改这里即可全局生效）
export const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api-sg.umodelverse.ai/v1';
// 主力模型
export const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || 'deepseek-v4-pro';
// 备份模型（暂未接自动 fallback，预留一键切换）
// 注意：ModelVerse 上 V3.2 的正确 id 是带前缀的 'deepseek-ai/DeepSeek-V3.2'，裸 'deepseek-v3.2' 会 400
export const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'deepseek-ai/DeepSeek-V3.2';
