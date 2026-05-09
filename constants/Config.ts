export const API_IP = '10.22.133.139';
export const BASE_URL = `http://${API_IP}:8000/api`;
export const SERVER_URL = `http://${API_IP}:8000`;

// ZegoCloud Configuration
export const ZEGO_APP_ID = Number(process.env.EXPO_PUBLIC_ZEGO_APP_ID) || 0;
export const ZEGO_APP_SIGN = process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || '';
