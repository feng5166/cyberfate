/**
 * API 基址。
 * - 默认指向生产环境 https://www.cyberfate.me/api
 * - 本地联调时通过 EXPO_PUBLIC_API_BASE 覆盖为局域网地址，例如：
 *     EXPO_PUBLIC_API_BASE=http://192.168.1.10:3000/api npx expo start
 *   （手机与电脑需在同一 Wi-Fi；不能用 localhost，真机访问不到）
 */
const fallback = 'https://www.cyberfate.me/api';

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || fallback).replace(/\/$/, '');
