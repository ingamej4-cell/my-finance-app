import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api, getAuthHeaders } from './api/client';

const expenseCategories = [
  { key: 'food', emoji: '🍔', label: 'Еда' },
  { key: 'transport', emoji: '🚗', label: 'Транспорт' },
  { key: 'housing', emoji: '🏠', label: 'Жильё' },
  { key: 'utilities', emoji: '⚡', label: 'Коммуналка' },
  { key: 'fun', emoji: '🎵', label: 'Развлечения' },
  { key: 'shopping', emoji: '📦', label: 'Покупки' },
  { key: 'health', emoji: '❤️', label: 'Здоровье' },
  { key: 'education', emoji: '📚', label: 'Образование' },
  { key: 'savings', emoji: '🐷', label: 'Накопления' },
  { key: 'pets', emoji: '🐾', label: 'Питомцы' },
];

const incomeCategories = [
  { key: 'salary', emoji: '💼', label: 'Зарплата' },
  { key: 'freelance', emoji: '💻', label: 'Фриланс' },
  { key: 'investments', emoji: '📈', label: 'Инвестиции' },
  { key: 'gifts', emoji: '🎁', label: 'Подарки' },
  { key: 'other_income', emoji: '➕', label: 'Прочее' },
];

export default function AddTransaction({ onBack }: { onBack: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleSave = async () => {
    if (!amount || !category) return;
    setIsLoading(true);
    try {
      await api.post('/transactions/', {
        type: type,
        amount: parseFloat(amount),
        currency: 'EUR',
        category_key: category,
        description: description
      }, {
        headers: getAuthHeaders()
      });
      onBack();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось сохранить. Проверь, запущен ли Питон-сервер.");
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
        <h1 className="text-xl font-bold">Новая операция</h1>
      </header>

      <div className="px-4 mb-6">
        <div className="flex bg-tg-secondary p-1 rounded-xl">
          <button
            onClick={() => { setType('expense'); setCategory(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'expense' ? 'bg-tg-red text-white' : 'text-tg-hint'}`}
          >
            Расход
          </button>
          <button
            onClick={() => { setType('income'); setCategory(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'income' ? 'bg-tg-green text-white' : 'text-tg-hint'}`}
          >
            Доход
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2 mb-8">
        <span className="text-3xl font-bold text-tg-hint">€</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="bg-transparent text-5xl font-bold outline-none w-40 text-center"
        />
      </div>

      <div className="px-4 flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              category === cat.key ? 'bg-[#2f2f38] border-[#7b61ff]' : 'bg-tg-secondary border-transparent'
            }`}
          >
            <span>{cat.emoji}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4 mb-6">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="w-full bg-tg-secondary p-4 rounded-xl outline-none text-sm placeholder:text-tg-hint"
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tg-bg">
        <button
          onClick={handleSave}
          disabled={!amount || !category || isLoading}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            (!amount || !category) ? 'bg-[#7b61ff]/50 text-white/50' : 'bg-[#7b61ff] text-white'
          }`}
        >
          {isLoading ? 'Сохранение...' : 'Добавить'}
        </button>
      </div>
    </div>
  );
}