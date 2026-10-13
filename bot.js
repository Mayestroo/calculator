const { Bot, InlineKeyboard, Keyboard } = require('grammy');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.log('⚠️ TELEGRAM BOT: BOT_TOKEN aniqlanmadi.');
  console.log('👉 .env fayliga BOT_TOKEN=sizning_tokeningiz ni kiriting.');
  console.log('💡 Hozircha Mini App veb interfeysi brauzerda to\'liq ishlayveradi!');
  module.exports = { startBot: () => {} };
  return;
}

const bot = new Bot(BOT_TOKEN);

// /start command
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('⚡ Hisoblagichni ochish', WEBAPP_URL);

  const replyKeyboard = new Keyboard()
    .webApp('💡 LED Tannarx Mini App', WEBAPP_URL)
    .resized();

  await ctx.reply(
    `Assalomu alaykum, <b>${ctx.from.first_name || 'Hurmatli mijoz'}</b>!\n\n` +
    `💡 <b>LED Chiroq Tannarxini Hisoblash</b> Telegram Mini App tizimiga xush kelibsiz.\n\n` +
    `Ushbu ilova orqali siz:\n` +
    `• Korpus, LED lenta, quvvat bloklari va qo'shimcha xarajatlarni hisoblashingiz;\n` +
    `• 1 dona va butun partiya uchun tannarx hamda sotish narxini chiqarishingiz;\n` +
    `• Tayyor hisob-kitobni mijoz yoki rahbariyatga Telegram orqali yuborishingiz mumkin.\n\n` +
    `Quyidagi tugmani bosib Mini App'ni ishga tushiring:`,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard
    }
  );

  // Also set persistent menu button for quick access
  try {
    await ctx.api.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: 'web_app',
        text: 'Tannarx App',
        web_app: { url: WEBAPP_URL }
      }
    });
  } catch (err) {
    console.error('Menu button set error:', err.message);
  }
});

// Handle data sent from Telegram WebApp
bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    await ctx.reply(
      `📋 <b>Hisob-kitob saqlandi:</b>\n\n` +
      `<b>Model:</b> ${data.title || 'Noma\'lum'}\n` +
      `💵 <b>Tannarx:</b> $${data.tannarx_usd} (${Number(data.tannarx_uzs).toLocaleString()} so'm)\n` +
      `🏷️ <b>Sotish narxi:</b> $${data.sotish_usd} (${Number(data.sotish_uzs).toLocaleString()} so'm)\n` +
      `📦 <b>Partiya (${data.settings_data?.batch_quantity || 1} dona):</b> $${data.partiya_tushum_usd}\n` +
      `📈 <b>Sof foyda:</b> $${data.partiya_foyda_usd}\n\n` +
      `<i>Hisob-kitob bazaga muvaffaqiyatli saqlandi.</i>`,
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    console.error('Web app data error:', e);
  }
});

function startBot() {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
    }
  }).catch((err) => {
    console.error('Telegram bot xatosi:', err.message);
  });
}

module.exports = { startBot, bot };
