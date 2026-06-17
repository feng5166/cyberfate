import type { BaziAnalysis } from '../bazi/types';

export function formatAnalysis(analysis: BaziAnalysis): string {
  return `【日主分析】
${analysis.dayMasterAnalysis}

【性格特点】
${analysis.personality}

【事业运势】
${analysis.career}

【财运分析】
${analysis.wealth}

【感情运势】
${analysis.relationship}

【健康提示】
${analysis.health}

【大运流年】
${analysis.dayunAnalysis || '当前大运阶段宜稳健行事，结合命局五行特点，关注事业节奏与健康管理，把握流年机遇。'}`;
}
