export const API_IP = 'astro.90skalyanam.com';
export const BASE_URL = `https://${API_IP}/api`;
export const SERVER_URL = `https://${API_IP}`;

// ZegoCloud Configuration
export const ZEGO_APP_ID = Number(process.env.EXPO_PUBLIC_ZEGO_APP_ID) || 0;
export const ZEGO_APP_SIGN = process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || '';
