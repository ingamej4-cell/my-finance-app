import axios from 'axios';

// Твоя ссылка от ngrok
const API_URL = 'https://specimen-recliner-upgrade.ngrok-free.dev/api';

export const api = axios.create({
  baseURL: API_URL,
  // Добавляем заголовок, чтобы ngrok пропускал запросы
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

export const getAuthHeaders = () => {
  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData || 'test_data_for_browser';
  return {
    Authorization: initData,
    'ngrok-skip-browser-warning': 'true', // На всякий случай дублируем
  };
};