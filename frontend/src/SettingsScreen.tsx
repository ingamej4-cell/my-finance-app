import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, getAuthHeaders } from './api/client';

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [currency, setCurrency] = useState('EUR');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userRes = await api.get('/users/me', { headers: getAuthHeaders() });
        setCurrency(userRes.data.base_currency);
        const budgetsRes = await api.get('/budgets/', { headers: getAuthHeaders() });
        setBudgets(budgetsRes.data || []);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await api.patch('/users/settings', { base_currency: newCurrency }, { headers: getAuthHeaders() });
    } catch (error) {
      alert("Не удалось сохранить валюту");
    }
  };

  const handleAddBudget = async () => {
    if (!newCategory || !newLimit) return;
    setIsLoading(true);
    try {
      await api.post('/budgets/', {
        category_key: newCategory,
        monthly_limit: parseFloat(newLimit),
        daily_limit: parseFloat(newLimit) / 30
      }, { headers: getAuthHeaders() });

      const res = await api.get('/budgets/', { headers: getAuthHeaders() });
      setBudgets(res.data || []);
      setNewCategory('');
      setNewLimit('');
    } catch (error) {
      alert("Ошибка при создании конверта");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="flex items-center p-4 gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-tg-secondary rounded-full flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Настройки</h1>
      </header>

      <div className="px-4 space-y-6">
        <div className="bg-tg-secondary p-4 rounded-xl">
          <label className="block text-sm text-tg-hint mb-2">Базовая валюта</label>
          <select
            value={currency}
            onChange={(e) => handleSaveCurrency(e.target.value)}
            className="w-full bg-transparent text-lg font-medium outline-none"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="UAH">UAH (₴)</option>
            <option value="RUB">RUB (₽)</option>
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Мои конверты</h2>

          {budgets.map((b, i) => (
            <div key={i} className="bg-tg-secondary p-4 rounded-xl mb-3 flex justify-between items-center">
              <span className="text-sm">📦 {b.category_key}</span>
              <span className="font-medium">{b.monthly_limit} {currency}</span>
            </div>
          ))}

          <div className="bg-tg-secondary p-4 rounded-xl mt-4">
            <p className="text-sm text-tg-hint mb-2">Новый конверт</p>
            <input
              type="text" placeholder="Название (напр. Одежда)"
              value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-transparent border-b border-gray-600 pb-2 mb-3 outline-none text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number" placeholder="Лимит"
                value={newLimit} onChange={(e) => setNewLimit(e.target.value)}
                className="w-1/2 bg-transparent border-b border-gray-600 pb-2 outline-none text-sm"
              />
              <button
                onClick={handleAddBudget}
                disabled={isLoading || !newCategory || !newLimit}
                className="w-1/2 bg-[#7b61ff] text-white rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Plus size={16} /> Добавить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tg-bg">
        <button onClick={onBack} className="w-full py-4 rounded-xl font-semibold text-lg bg-[#7b61ff] text-white flex justify-center items-center gap-2">
          <Save size={20} /> Готово
        </button>
      </div>
    </div>
  );
}