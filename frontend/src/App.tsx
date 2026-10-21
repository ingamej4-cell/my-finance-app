import { useState, useEffect } from 'react';
import { Plus, Settings, ShoppingCart, Briefcase } from 'lucide-react';
import { api, getAuthHeaders } from './api/client';
import AddTransaction from './AddTransaction';
import SettingsScreen from './SettingsScreen';

export default function App() {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [transactions, setTransactions] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSettings, setIsSettings] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get('/dashboard/', { headers: getAuthHeaders() });
      setBalance(response.data.balance);
      setIncome(response.data.income);
      setExpense(response.data.expense);
      setCurrency(response.data.currency);
      setTransactions(response.data.recent_transactions || []);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdding, isSettings]);

  if (isAdding) return <AddTransaction onBack={() => setIsAdding(false)} />;
  if (isSettings) return <SettingsScreen onBack={() => setIsSettings(false)} />;

  const today = new Date().toLocaleDateString('ru-RU');
  const todayTransactions = transactions.filter(t => new Date(t.date).toLocaleDateString('ru-RU') === today);
  const pastTransactions = transactions.filter(t => new Date(t.date).toLocaleDateString('ru-RU') !== today);

  return (
    <div className="min-h-screen pb-20">
      <header className="flex justify-between items-center p-4">
        <div className="w-8" />
        <h1 className="text-lg font-medium text-tg-hint">ФИНАНСЫ</h1>
        <button onClick={() => setIsSettings(true)} className="text-tg-hint hover:text-white transition-colors">
          <Settings size={24} />
        </button>
      </header>

      <div className="flex flex-col items-center mt-2 mb-6">
        <span className="text-sm text-tg-hint mb-1">Баланс</span>
        <div className={`text-5xl font-bold flex items-center gap-1 ${balance >= 0 ? 'text-tg-green' : 'text-tg-red'}`}>
          {balance.toLocaleString('ru-RU')} <span className="text-4xl">{currency === 'EUR' ? '€' : '₽'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mb-8">
        <div className="bg-tg-secondary p-3 rounded-2xl">
          <div className="text-xs text-tg-hint mb-1 uppercase">Доходы</div>
          <div className="text-tg-green font-medium">{income} {currency}</div>
        </div>
        <div className="bg-tg-secondary p-3 rounded-2xl">
          <div className="text-xs text-tg-hint mb-1 uppercase">Расходы</div>
          <div className="text-tg-red font-medium">{expense} {currency}</div>
        </div>
        <div className="bg-tg-secondary p-3 rounded-2xl">
          <div className="text-xs text-tg-hint mb-1 uppercase">Экономия</div>
          <div className="text-tg-green font-medium">
            {income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Сегодня</h2>
          <span className="text-tg-hint font-medium">
            {todayTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0)} {currency}
          </span>
        </div>

        {todayTransactions.length === 0 && (
          <div className="text-center text-tg-hint py-6">За сегодня операций нет</div>
        )}

        {todayTransactions.map(t => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tg-secondary flex items-center justify-center">
                {t.category === 'food' && <ShoppingCart size={18} className="text-tg-hint" />}
                {t.category === 'salary' && <Briefcase size={18} className="text-[#a07040]" />}
                {(!['food', 'salary'].includes(t.category)) && <span>💸</span>}
              </div>
              <span className="font-medium">{t.category === 'food' ? 'Еда' : t.category === 'salary' ? 'Зарплата' : t.category}</span>
            </div>
            <span className={`font-medium ${t.type === 'income' ? 'text-tg-green' : 'text-tg-red'}`}>
              {t.type === 'income' ? '+' : '-'}{t.amount}
            </span>
          </div>
        ))}

        {pastTransactions.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mt-6 mb-3">Последние операции</h2>
            {pastTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tg-secondary flex items-center justify-center">
                    {t.category === 'food' && <ShoppingCart size={18} className="text-tg-hint" />}
                    {t.category === 'salary' && <Briefcase size={18} className="text-[#a07040]" />}
                    {(!['food', 'salary'].includes(t.category)) && <span>💸</span>}
                  </div>
                  <div>
                    <div className="font-medium">{t.category === 'food' ? 'Еда' : t.category === 'salary' ? 'Зарплата' : t.category}</div>
                    <div className="text-xs text-tg-hint">{new Date(t.date).toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>
                <span className={`font-medium ${t.type === 'income' ? 'text-tg-green' : 'text-tg-red'}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#7b61ff] hover:bg-[#6a52db] rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <Plus size={28} className="text-white" />
      </button>
    </div>
  );
}