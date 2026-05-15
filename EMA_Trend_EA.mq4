//+------------------------------------------------------------------+
//|                                               EMA_Trend_EA.mq4   |
//|          Советник на основе EMA (8/21) + RSI + ADX + ATR         |
//|          Стратегия: торговля по тренду с риск-менеджментом        |
//+------------------------------------------------------------------+
#property copyright "EMA Trend EA"
#property link      ""
#property version   "1.00"
#property strict

//====================================================================
//  ВНЕШНИЕ ПАРАМЕТРЫ
//====================================================================

// --- Основные настройки ---
extern string    s0                  = "====== Основные настройки ======";
extern string    TradingSymbol       = "EURUSD";    // Торговая пара
extern int       MagicNumber         = 20240101;    // Magic Number советника
extern string    OrderComment        = "EMA_EA";    // Комментарий к ордерам

// --- Параметры индикаторов ---
extern string    s1                  = "====== Индикаторы ======";
extern int       EMA_Fast            = 8;           // Период быстрой EMA
extern int       EMA_Slow            = 21;          // Период медленной EMA
extern int       RSI_Period          = 14;          // Период RSI
extern int       ATR_Period          = 14;          // Период ATR
extern int       ADX_Period          = 14;          // Период ADX
extern double    ADX_MinLevel        = 25.0;        // Минимальный ADX для торговли

// --- Риск-менеджмент ---
extern string    s2                  = "====== Риск-менеджмент ======";
extern double    RiskPercent         = 1.0;         // Риск на сделку (% от баланса)
extern double    SL_ATR_Mult         = 1.5;         // Множитель ATR для Stop Loss
extern double    TP_ATR_Mult         = 3.0;         // Множитель ATR для Take Profit
extern double    Trail_ATR_Trigger   = 1.0;         // ATR для активации трейлинга
extern double    Trail_ATR_Distance  = 1.5;         // ATR-дистанция трейлинг-стопа
extern bool      UseTrailingStop     = true;        // Включить трейлинг-стоп
extern double    LotMin              = 0.01;        // Минимальный лот
extern double    LotMax              = 100.0;       // Максимальный лот
extern int       MaxSlippage         = 3;           // Максимальное проскальзывание (пп)

// --- Временные фильтры ---
extern string    s3                  = "====== Временные фильтры ======";
extern bool      NewsFilterEnabled   = false;       // Включить паузу перед/после новостей
extern int       NewsFilterMinutes   = 30;          // Пауза (мин) до/после новостей
extern int       FridayNoTradeHour   = 18;          // Запрет торговли в пятницу с этого часа
extern int       MondayStartHour     = 10;          // Разрешение торговли в понедельник с этого часа

//====================================================================
//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
//====================================================================

static datetime g_lastBarTime = 0;   // Время последней обработанной свечи
const  int      RETRY_COUNT   = 3;   // Кол-во попыток при торговых ошибках
const  int      RETRY_SLEEP   = 500; // Пауза между попытками (мс)

//+------------------------------------------------------------------+
//| Инициализация советника                                           |
//+------------------------------------------------------------------+
int OnInit()
{
   // Проверка корректности параметров
   if (EMA_Fast >= EMA_Slow)
   {
      Alert("ОШИБКА: Период быстрой EMA (", EMA_Fast, ") должен быть меньше медленной EMA (", EMA_Slow, ")");
      return INIT_PARAMETERS_INCORRECT;
   }
   if (RiskPercent <= 0.0 || RiskPercent > 100.0)
   {
      Alert("ОШИБКА: Некорректный параметр RiskPercent = ", RiskPercent);
      return INIT_PARAMETERS_INCORRECT;
   }
   if (SL_ATR_Mult <= 0.0 || TP_ATR_Mult <= 0.0)
   {
      Alert("ОШИБКА: Множители ATR должны быть положительными");
      return INIT_PARAMETERS_INCORRECT;
   }

   Print("╔══════════════════════════════════════╗");
   Print("║   EMA Trend EA — инициализация       ║");
   Print("╚══════════════════════════════════════╝");
   Print("Торговая пара  : ", TradingSymbol);
   Print("Magic Number   : ", MagicNumber);
   Print("EMA быстрая/мед: ", EMA_Fast, " / ", EMA_Slow);
   Print("RSI период     : ", RSI_Period);
   Print("ATR период     : ", ATR_Period);
   Print("ADX мин. уровень: ", ADX_MinLevel);
   Print("Риск на сделку : ", RiskPercent, "%");
   Print("SL × ATR       : ", SL_ATR_Mult);
   Print("TP × ATR       : ", TP_ATR_Mult);
   Print("Трейлинг-стоп  : ", (UseTrailingStop ? "включён" : "отключён"));
   Print("Фильтр новостей: ", (NewsFilterEnabled ? "включён" : "отключён"));

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Деинициализация советника                                         |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EMA Trend EA остановлен. Код причины: ", reason);
}

//+------------------------------------------------------------------+
//| Основная функция — выполняется на каждом тике                    |
//+------------------------------------------------------------------+
void OnTick()
{
   // Работаем только на нужном инструменте
   if (Symbol() != TradingSymbol)
      return;

   // Управление трейлинг-стопом на каждом тике
   if (UseTrailingStop)
      ManageTrailingStop();

   // Логика входа — только на открытии новой H1-свечи
   if (!IsNewBar())
      return;

   // Временные фильтры: пятница/понедельник и новости
   if (!IsTimeAllowed())
      return;

   // Не открываем новые позиции если уже есть открытая
   if (CountOpenPositions() > 0)
      return;

   // Читаем значения индикаторов на закрытой свече [1]
   double emaFastCurr = iMA(TradingSymbol, PERIOD_H1, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 1);
   double emaFastPrev = iMA(TradingSymbol, PERIOD_H1, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 2);
   double emaSlowCurr = iMA(TradingSymbol, PERIOD_H1, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 1);
   double emaSlowPrev = iMA(TradingSymbol, PERIOD_H1, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 2);
   double rsiCurr     = iRSI(TradingSymbol, PERIOD_H1, RSI_Period, PRICE_CLOSE, 1);
   double adxCurr     = iADX(TradingSymbol, PERIOD_H1, ADX_Period, PRICE_CLOSE, MODE_MAIN, 1);
   double atrCurr     = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);

   // Проверяем что данные индикаторов загружены
   if (emaFastCurr == 0 || emaSlowCurr == 0 || atrCurr == 0)
   {
      Print("ПРЕДУПРЕЖДЕНИЕ: Индикаторы ещё не рассчитаны, пропускаем тик");
      return;
   }

   // Фильтр тренда: ADX должен быть выше порога
   if (adxCurr < ADX_MinLevel)
   {
      Print("Фильтр ADX: значение = ", DoubleToStr(adxCurr, 2),
            " < ", ADX_MinLevel, " — торговля не разрешена");
      return;
   }

   // Определяем пересечение EMA
   bool crossUp   = (emaFastPrev <= emaSlowPrev) && (emaFastCurr > emaSlowCurr);
   bool crossDown = (emaFastPrev >= emaSlowPrev) && (emaFastCurr < emaSlowCurr);

   // Сигнал на покупку
   if (crossUp && rsiCurr > 50.0)
   {
      Print(">>> Сигнал LONG | EMA пересечение снизу вверх | RSI=",
            DoubleToStr(rsiCurr, 2), " | ADX=", DoubleToStr(adxCurr, 2));
      OpenPosition(OP_BUY, atrCurr);
   }
   // Сигнал на продажу
   else if (crossDown && rsiCurr < 50.0)
   {
      Print(">>> Сигнал SHORT | EMA пересечение сверху вниз | RSI=",
            DoubleToStr(rsiCurr, 2), " | ADX=", DoubleToStr(adxCurr, 2));
      OpenPosition(OP_SELL, atrCurr);
   }
}

//+------------------------------------------------------------------+
//| Открытие позиции (покупка или продажа)                           |
//+------------------------------------------------------------------+
void OpenPosition(int orderType, double atr)
{
   RefreshRates();

   int    digits   = (int)MarketInfo(TradingSymbol, MODE_DIGITS);
   double point    = MarketInfo(TradingSymbol, MODE_POINT);
   double slDist   = atr * SL_ATR_Mult;
   double tpDist   = atr * TP_ATR_Mult;

   double price, sl, tp;

   if (orderType == OP_BUY)
   {
      price = MarketInfo(TradingSymbol, MODE_ASK);
      sl    = NormalizeDouble(price - slDist, digits);
      tp    = NormalizeDouble(price + tpDist, digits);
   }
   else // OP_SELL
   {
      price = MarketInfo(TradingSymbol, MODE_BID);
      sl    = NormalizeDouble(price + slDist, digits);
      tp    = NormalizeDouble(price - tpDist, digits);
   }

   // Проверяем минимально допустимое расстояние стопа у брокера
   double minStop = MarketInfo(TradingSymbol, MODE_STOPLEVEL) * point;
   if (MathAbs(price - sl) < minStop)
   {
      sl = (orderType == OP_BUY)
           ? NormalizeDouble(price - minStop, digits)
           : NormalizeDouble(price + minStop, digits);
      Print("ПРЕДУПРЕЖДЕНИЕ: SL скорректирован до минимального уровня брокера: ", sl);
   }

   double lot = CalculateLot(price, sl);
   if (lot <= 0)
   {
      Print("ОШИБКА: Не удалось рассчитать размер лота");
      return;
   }

   string dir = (orderType == OP_BUY) ? "BUY" : "SELL";
   Print("Попытка открыть ", dir,
         " | Цена=", price,
         " | SL=", sl,
         " | TP=", tp,
         " | Лот=", lot,
         " | ATR=", DoubleToStr(atr, digits));

   for (int attempt = 1; attempt <= RETRY_COUNT; attempt++)
   {
      RefreshRates();
      price = (orderType == OP_BUY)
              ? MarketInfo(TradingSymbol, MODE_ASK)
              : MarketInfo(TradingSymbol, MODE_BID);

      int ticket = OrderSend(
         TradingSymbol,
         orderType,
         lot,
         price,
         MaxSlippage,
         sl,
         tp,
         OrderComment,
         MagicNumber,
         0,
         (orderType == OP_BUY) ? clrDodgerBlue : clrOrangeRed
      );

      if (ticket > 0)
      {
         Print("✓ Позиция открыта. Тикет=", ticket,
               " | ", dir,
               " | Пара=", TradingSymbol,
               " | Цена=", price,
               " | Лот=", lot,
               " | SL=", sl,
               " | TP=", tp,
               " | Баланс=", AccountBalance());
         return;
      }

      int err = GetLastError();
      Print("✗ Ошибка OrderSend (попытка ", attempt, "/", RETRY_COUNT, "): ",
            ErrorToString(err), " (код ", err, ")");
      HandleTradeError(err);
      Sleep(RETRY_SLEEP);
   }

   Print("КРИТИЧЕСКАЯ ОШИБКА: Не удалось открыть ", dir,
         " после ", RETRY_COUNT, " попыток");
}

//+------------------------------------------------------------------+
//| Управление трейлинг-стопом                                       |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   double atr = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);
   if (atr <= 0) return;

   double triggerDist = atr * Trail_ATR_Trigger;
   double trailDist   = atr * Trail_ATR_Distance;
   int    digits      = (int)MarketInfo(TradingSymbol, MODE_DIGITS);
   double tickSize    = MarketInfo(TradingSymbol, MODE_TICKSIZE);

   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      if (OrderSymbol() != TradingSymbol || OrderMagicNumber() != MagicNumber)
         continue;

      if (OrderType() == OP_BUY)
      {
         double bid         = MarketInfo(TradingSymbol, MODE_BID);
         double profitDist  = bid - OrderOpenPrice();

         // Активируем трейлинг только после прохождения trigger-расстояния
         if (profitDist < triggerDist)
            continue;

         double newSL = NormalizeDouble(bid - trailDist, digits);

         // Двигаем стоп только вперёд (вверх для BUY)
         if (newSL > OrderStopLoss() + tickSize)
         {
            if (!OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrCornflowerBlue))
            {
               int err = GetLastError();
               Print("ОШИБКА трейлинг BUY (тикет ", OrderTicket(), "): ",
                     ErrorToString(err), " (", err, ")");
            }
            else
            {
               Print("Трейлинг BUY обновлён. Тикет=", OrderTicket(),
                     " | Новый SL=", newSL, " | Bid=", bid);
            }
         }
      }
      else if (OrderType() == OP_SELL)
      {
         double ask         = MarketInfo(TradingSymbol, MODE_ASK);
         double profitDist  = OrderOpenPrice() - ask;

         if (profitDist < triggerDist)
            continue;

         double newSL = NormalizeDouble(ask + trailDist, digits);

         // Двигаем стоп только вперёд (вниз для SELL)
         if (OrderStopLoss() == 0 || newSL < OrderStopLoss() - tickSize)
         {
            if (!OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrCornflowerBlue))
            {
               int err = GetLastError();
               Print("ОШИБКА трейлинг SELL (тикет ", OrderTicket(), "): ",
                     ErrorToString(err), " (", err, ")");
            }
            else
            {
               Print("Трейлинг SELL обновлён. Тикет=", OrderTicket(),
                     " | Новый SL=", newSL, " | Ask=", ask);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Расчёт размера лота через риск в % от баланса                    |
//+------------------------------------------------------------------+
double CalculateLot(double entryPrice, double slPrice)
{
   double balance   = AccountBalance();
   double riskMoney = balance * RiskPercent / 100.0;
   double slDist    = MathAbs(entryPrice - slPrice);

   if (slDist <= 0)
   {
      Print("ОШИБКА расчёта лота: SL-расстояние равно нулю");
      return 0;
   }

   double tickValue = MarketInfo(TradingSymbol, MODE_TICKVALUE);
   double tickSize  = MarketInfo(TradingSymbol, MODE_TICKSIZE);

   if (tickValue <= 0 || tickSize <= 0)
   {
      Print("ОШИБКА расчёта лота: некорректные данные инструмента");
      return 0;
   }

   // Стоимость 1 лота при движении на slDist
   double lossPerLot = (slDist / tickSize) * tickValue;
   double lot        = riskMoney / lossPerLot;

   // Приводим к шагу лота брокера
   double lotStep = MarketInfo(TradingSymbol, MODE_LOTSTEP);
   double minLot  = MathMax(MarketInfo(TradingSymbol, MODE_MINLOT), LotMin);
   double maxLot  = MathMin(MarketInfo(TradingSymbol, MODE_MAXLOT), LotMax);

   lot = MathFloor(lot / lotStep) * lotStep;
   lot = MathMax(lot, minLot);
   lot = MathMin(lot, maxLot);
   lot = NormalizeDouble(lot, 2);

   Print("Расчёт лота: Баланс=", DoubleToStr(balance, 2),
         " | Риск=", DoubleToStr(riskMoney, 2),
         " | SL-дист=", DoubleToStr(slDist, (int)MarketInfo(TradingSymbol, MODE_DIGITS)),
         " | Лот=", lot);

   return lot;
}

//+------------------------------------------------------------------+
//| Подсчёт открытых позиций этого советника                         |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      if (OrderSymbol() == TradingSymbol && OrderMagicNumber() == MagicNumber)
         count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Проверка временных ограничений для торговли                      |
//+------------------------------------------------------------------+
bool IsTimeAllowed()
{
   datetime now   = TimeCurrent();
   int dow        = TimeDayOfWeek(now);  // 0=вс, 1=пн, ..., 5=пт, 6=сб
   int hour       = TimeHour(now);
   int minute     = TimeMinute(now);

   // Выходные дни — рынок закрыт
   if (dow == 0 || dow == 6)
      return false;

   // Пятница: не торгуем с FridayNoTradeHour:00
   if (dow == 5 && hour >= FridayNoTradeHour)
      return false;

   // Понедельник: не торгуем до MondayStartHour:00
   if (dow == 1 && hour < MondayStartHour)
      return false;

   // Фильтр новостей (NewsFilterEnabled управляется вручную)
   if (NewsFilterEnabled)
   {
      // Заглушка: параметр переключается вручную перед важными новостями.
      // Для автоматизации потребуется внешний источник новостного календаря
      // (DLL, веб-сервис или файл). При NewsFilterEnabled=true торговля заблокирована.
      Print("Фильтр новостей активен — торговля заблокирована");
      return false;
   }

   return true;
}

//+------------------------------------------------------------------+
//| Определение новой свечи H1                                        |
//+------------------------------------------------------------------+
bool IsNewBar()
{
   datetime barTime = iTime(TradingSymbol, PERIOD_H1, 0);
   if (barTime != g_lastBarTime)
   {
      g_lastBarTime = barTime;
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Первичная обработка торговых ошибок (повторы / паузы)            |
//+------------------------------------------------------------------+
void HandleTradeError(int err)
{
   switch (err)
   {
      case ERR_SERVER_BUSY:
      case ERR_NO_CONNECTION:
      case ERR_TRADE_TIMEOUT:
         Sleep(3000);
         break;
      case ERR_PRICE_CHANGED:
      case ERR_REQUOTE:
         RefreshRates();
         break;
      case ERR_OFF_QUOTES:
         Sleep(2000);
         RefreshRates();
         break;
      case ERR_NOT_ENOUGH_MONEY:
         Print("КРИТИЧНО: Недостаточно средств — новые позиции не открываются");
         break;
      case ERR_TRADE_DISABLED:
         Print("Автоторговля отключена в терминале или на сервере брокера");
         break;
      case ERR_INVALID_STOPS:
         Print("Некорректные уровни SL/TP — проверьте минимальные стопы брокера");
         break;
      case ERR_MARKET_CLOSED:
         Print("Рынок закрыт");
         break;
      default:
         break;
   }
}

//+------------------------------------------------------------------+
//| Текстовое описание кода ошибки MQL4                              |
//+------------------------------------------------------------------+
string ErrorToString(int err)
{
   switch (err)
   {
      case 0:   return "Нет ошибки";
      case 2:   return "Общая ошибка";
      case 3:   return "Некорректные параметры";
      case 4:   return "Торговый сервер занят";
      case 6:   return "Нет связи с сервером";
      case 8:   return "Слишком частые запросы";
      case 128: return "Таймаут торгового запроса";
      case 129: return "Неверная цена";
      case 130: return "Неверные стопы";
      case 131: return "Неверный объём";
      case 132: return "Рынок закрыт";
      case 133: return "Торговля запрещена";
      case 134: return "Недостаточно средств";
      case 135: return "Цена изменилась";
      case 136: return "Нет котировок";
      case 137: return "Брокер занят";
      case 138: return "Реквота";
      case 139: return "Ордер заблокирован";
      case 141: return "Слишком много запросов";
      case 145: return "Модификация запрещена";
      case 146: return "Торговый контекст занят";
      case 148: return "Достигнут лимит ордеров";
      default:  return "Ошибка " + IntegerToString(err);
   }
}
//+------------------------------------------------------------------+
