// API 调用包装工具 - 环境变量降级策略

type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export async function callExternalAPI<T>(
  apiCall: () => Promise<T>,
  options: {
    serviceName: string;
    fallback?: T;
  }
): Promise<ApiResult<T>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    console.warn(`[${options.serviceName}] API 调用失败:`, error);
    
    if (options.fallback !== undefined) {
      return { success: true, data: options.fallback };
    }
    
    return { 
      success: false, 
      error: `${options.serviceName}服务暂时不可用，请稍后重试` 
    };
  }
}

export function getEnvVar(name: string): string | null {
  const value = process.env[name];
  if (!value || value.includes('placeholder') || value.includes('your_')) {
    return null;
  }
  return value;
}
