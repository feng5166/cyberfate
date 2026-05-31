// API 调用包装工具 - 环境变量降级策略

type ApiResult<T> =
  | { success: true; data: T; fromFallback: boolean }
  | { success: false; error: string; userMessage: string; fromFallback: false };

const USER_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  TIMEOUT: '请求超时，请稍后重试',
  AUTH_ERROR: '服务认证失败，请联系客服',
  RATE_LIMIT: '请求过于频繁，请稍后再试',
  SERVER_ERROR: '服务暂时不可用，请稍后重试',
};

function classifyError(error: unknown): { code: string; userMessage: string } {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { code: 'NETWORK_ERROR', userMessage: USER_MESSAGES.NETWORK_ERROR };
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('aborted')) {
      return { code: 'TIMEOUT', userMessage: USER_MESSAGES.TIMEOUT };
    }
    if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
      return { code: 'AUTH_ERROR', userMessage: USER_MESSAGES.AUTH_ERROR };
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
      return { code: 'RATE_LIMIT', userMessage: USER_MESSAGES.RATE_LIMIT };
    }
    if (msg.includes('5') && (msg.includes('500') || msg.includes('502') || msg.includes('503'))) {
      return { code: 'SERVER_ERROR', userMessage: USER_MESSAGES.SERVER_ERROR };
    }
  }
  return { code: 'UNKNOWN', userMessage: USER_MESSAGES.SERVER_ERROR };
}

export async function callExternalAPI<T>(
  apiCall: () => Promise<T>,
  options: {
    serviceName: string;
    fallback?: T;
  }
): Promise<ApiResult<T>> {
  try {
    const data = await apiCall();
    return { success: true, data, fromFallback: false };
  } catch (error) {
    const { code, userMessage } = classifyError(error);
    console.warn(`[${options.serviceName}] API 调用失败: ${code}`, error instanceof Error ? error.message : error);

    if (options.fallback !== undefined) {
      return { success: true, data: options.fallback, fromFallback: true };
    }

    return {
      success: false,
      error: `${options.serviceName}服务暂时不可用`,
      userMessage,
      fromFallback: false,
    };
  }
}

export function getEnvVar(name: string): string | null {
  const value = process.env[name];
  if (!value || value.includes('placeholder') || value.includes('your_')) {
    return null;
  }
  return value.replace(/\\n$/, '').trim();
}
