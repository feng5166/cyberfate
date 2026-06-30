import * as Haptics from 'expo-haptics';

/**
 * 触感反馈封装：全部 fire-and-forget，在不支持的平台静默吞掉。
 * - light/medium：按压、命理仪式动作
 * - selection：切换类控件（性别/时辰/分段）
 * - success/warning：占卜出结果 / 失败
 */
export const haptics = {
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  selection: () => {
    Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
