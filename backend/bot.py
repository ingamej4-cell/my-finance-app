import asyncio
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Твоя ссылка от Vercel
WEB_APP_URL = "https://my-finance-lime-tau.vercel.app"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text="🚀 Открыть приложение",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )
    )

    await message.answer(
        text="Привет! Я бот «Мои Финансы». Открой приложение — там все внутри.",
        reply_markup=builder.as_markup()
    )


async def main():
    print("Бот запущен и ждет сообщений!")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())