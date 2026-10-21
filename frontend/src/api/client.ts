import axios from 'axios';

// Твой новый сервер на Render
const API_URL = 'https://my-finance-app-1.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getAuthHeaders = () => {
  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData || 'test_data_for_browser';
  return { Authorization: initData };
};
