//+------------------------------------------------------------------+
//|                                          EMA_Trend_EA_Pro.mq4    |
//|     Советник v2.0: EMA + RSI + ADX + ATR + HTF + Паттерны       |
//|     Мультитаймфреймовый анализ, частичное закрытие, дэшборд      |
//+------------------------------------------------------------------+
#property copyright "EMA Trend EA Pro"
#property link      ""
#property version   "2.00"
#property strict

//====================================================================
// СЕКЦИЯ 1 — ОСНОВНЫЕ НАСТРОЙКИ
//====================================================================
extern string  _s0_               = "===== Основные настройки =====";
extern string  TradingSymbol      = "EURUSD";     // Торговая пара
extern int     MagicNumber        = 20240201;     // Уникальный ID советника
extern string  OrderComment       = "EMA_Pro";    // Комментарий к ордерам

//====================================================================
// СЕКЦИЯ 2 — ИНДИКАТОРЫ H1
//====================================================================
extern string  _s1_               = "===== Индикаторы H1 =====";
extern int     EMA_Fast           = 8;            // Период быстрой EMA
extern int     EMA_Slow           = 21;           // Период медленной EMA
extern int     RSI_Period         = 14;           // Период RSI
extern double  RSI_BullLevel      = 50.0;         // RSI > уровня для Long
extern double  RSI_BearLevel      = 50.0;         // RSI < уровня для Short
extern int     ATR_Period         = 14;           // Период ATR
extern int     ADX_Period         = 14;           // Период ADX
extern double  ADX_MinLevel       = 25.0;         // Мин. уровень ADX (фильтр флэта)

//====================================================================
// СЕКЦИЯ 3 — СТАРШИЙ ТАЙМФРЕЙМ (HTF)
//====================================================================
extern string  _s2_               = "===== HTF-подтверждение =====";
extern bool    UseHTF             = true;         // Требовать совпадение тренда на HTF
extern int     HTF_EMA_Fast       = 8;            // Быстрая EMA на HTF
extern int     HTF_EMA_Slow       = 21;           // Медленная EMA на HTF
extern int     HTF_Timeframe      = PERIOD_H4;    // Таймфрейм подтверждения
extern bool    UseGlobalTrend     = true;         // Фильтр по глобальному тренду
extern int     GlobalTrend_EMA    = 200;          // EMA глобального тренда на D1

//====================================================================
// СЕКЦИЯ 4 — ПАТТЕРНЫ СВЕЧЕЙ
//====================================================================
extern string  _s3_               = "===== Паттерны свечей =====";
extern bool    UseCandlePattern   = true;         // Требовать подтверждающий паттерн
extern double  PinBarRatio        = 0.60;         // Мин. доля тени к диапазону (пин-бар)
extern double  EngulfingRatio     = 1.10;         // Тело поглощающей / тело поглощённой

//====================================================================
// СЕКЦИЯ 5 — ОБЪЁМНЫЙ ФИЛЬТР
//====================================================================
extern string  _s4_               = "===== Объёмный фильтр =====";
extern bool    UseVolumeFilter    = true;         // Включить фильтр объёма
extern int     Volume_MA_Period   = 20;           // Период MA объёма для сравнения

//====================================================================
// СЕКЦИЯ 6 — РИСК-МЕНЕДЖМЕНТ
//====================================================================
extern string  _s5_               = "===== Риск-менеджмент =====";
extern double  RiskPercent        = 1.0;          // Риск на сделку (% от баланса)
extern double  SL_ATR_Mult        = 1.5;          // SL = ATR × множитель
extern double  TP_ATR_Mult        = 3.0;          // TP = ATR × множитель (RR 1:2)
extern bool    UsePartialClose    = true;         // Частичное закрытие позиции
extern double  PartialClosePct    = 50.0;         // % объёма для частичного закрытия
extern double  PartialClose_R     = 1.0;          // Закрывать при прибыли = 1R
extern bool    UseTrailingStop    = true;         // Включить трейлинг-стоп
extern double  Trail_ATR_Trigger  = 1.0;          // Активировать трейлинг после X ATR
extern double  Trail_ATR_Distance = 1.5;          // Дистанция трейлинга в ATR
extern double  LotMin             = 0.01;         // Минимальный лот (ограничение)
extern double  LotMax             = 100.0;        // Максимальный лот (ограничение)

//====================================================================
// СЕКЦИЯ 7 — ДНЕВНЫЕ ЛИМИТЫ
//====================================================================
extern string  _s6_               = "===== Дневные лимиты =====";
extern double  MaxDailyDrawdown   = 3.0;          // Стоп торговли при просадке > X%
extern int     MaxTradesPerDay    = 5;            // Максимум входов за день

//====================================================================
// СЕКЦИЯ 8 — ФИЛЬТРЫ И ЗАЩИТА
//====================================================================
extern string  _s7_               = "===== Фильтры и защита =====";
extern double  MaxSpread          = 3.0;          // Макс. спред в пунктах
extern int     MaxSlippage        = 3;            // Макс. проскальзывание (пунктов)
extern double  MinMarginLevel     = 200.0;        // Мин. уровень маржи (%)
extern double  ATR_Min_Spread_Mult = 0.5;         // Мин. ATR = спред × коэф.
extern double  ATR_Max_Spread_Mult = 5.0;         // Макс. ATR = спред × коэф.
extern bool    NewsFilterEnabled  = false;        // Ручная блокировка на время новостей
extern bool    UseTimeFilter      = true;         // Включить торговое окно
extern int     TimeFrom           = 8;            // Торговать с (час сервера)
extern int     TimeTo             = 20;           // Торговать до (час сервера)
extern int     FridayNoTradeHour  = 18;           // Запрет торговли в пятницу с часа
extern int     MondayStartHour    = 10;           // Начало торговли в понедельник

//====================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
//====================================================================

double   g_dailyStartBalance   = 0;
int      g_dailyTradeCount     = 0;
datetime g_currentDayOpen      = 0;
datetime g_lastBarTime         = 0;

// Массив тикетов с выполненным частичным закрытием
int      g_partialClosedTickets[200];
int      g_partialClosedCount  = 0;

const int RETRY_COUNT = 3;
const int RETRY_SLEEP = 500;

//+------------------------------------------------------------------+
//| Инициализация                                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   if (!ValidateParams()) return INIT_PARAMETERS_INCORRECT;

   ResetDailyStats();
   ArrayInitialize(g_partialClosedTickets, -1);

   PrintSettings();
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Деинициализация                                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Comment("");
   Print("EMA Trend EA Pro остановлен. Причина: ", reason);
}

//+------------------------------------------------------------------+
//| Главная функция — каждый тик                                     |
//+------------------------------------------------------------------+
void OnTick()
{
   if (Symbol() != TradingSymbol) return;

   // Сброс дневных счётчиков при смене дня
   UpdateDailyStats();

   // Управление открытыми позициями (каждый тик)
   if (UseTrailingStop)  ManageTrailingStop();
   if (UsePartialClose)  ManagePartialClose();

   // Обновление дэшборда (каждый тик)
   UpdateDashboard();

   // Сигнальная логика — только на новой H1 свече
   if (!IsNewBar()) return;

   // Проверяем все фильтры
   string blockReason = "";
   if (!PassAllFilters(blockReason))
   {
      static string prevReason = "";
      if (blockReason != prevReason)
      {
         Print("Торговля заблокирована: ", blockReason);
         prevReason = blockReason;
      }
      return;
   }

   // Только одна позиция одновременно
   if (CountOpenPositions() > 0) return;

   // Читаем индикаторы на закрытой свече [1]
   double emaFastCurr = iMA(TradingSymbol, PERIOD_H1, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 1);
   double emaFastPrev = iMA(TradingSymbol, PERIOD_H1, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 2);
   double emaSlowCurr = iMA(TradingSymbol, PERIOD_H1, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 1);
   double emaSlowPrev = iMA(TradingSymbol, PERIOD_H1, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 2);
   double rsiCurr     = iRSI(TradingSymbol, PERIOD_H1, RSI_Period, PRICE_CLOSE, 1);
   double adxCurr     = iADX(TradingSymbol, PERIOD_H1, ADX_Period, PRICE_CLOSE, MODE_MAIN, 1);
   double atrCurr     = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);

   // Защита от незагруженных данных
   if (emaFastCurr == 0 || emaSlowCurr == 0 || atrCurr == 0)
   {
      Print("Индикаторы ещё не рассчитаны — пропуск");
      return;
   }

   // ADX-фильтр (нет тренда — нет входа)
   if (adxCurr < ADX_MinLevel)
   {
      Print("ADX=", DoubleToStr(adxCurr, 2), " < ", ADX_MinLevel, " — флэт, пропуск");
      return;
   }

   // Пересечение EMA
   bool crossUp   = (emaFastPrev <= emaSlowPrev) && (emaFastCurr > emaSlowCurr);
   bool crossDown = (emaFastPrev >= emaSlowPrev) && (emaFastCurr < emaSlowCurr);
   if (!crossUp && !crossDown) return;

   int direction = crossUp ? OP_BUY : OP_SELL;

   // RSI-фильтр
   if (direction == OP_BUY  && rsiCurr <= RSI_BullLevel) return;
   if (direction == OP_SELL && rsiCurr >= RSI_BearLevel)  return;

   // HTF-подтверждение
   if (UseHTF && !CheckHTFConfirmation(direction)) return;

   // Глобальный тренд (EMA 200 на D1)
   if (UseGlobalTrend && !CheckGlobalTrend(direction)) return;

   // Свечной паттерн (пин-бар или поглощение)
   if (UseCandlePattern && !CheckCandlePattern(direction)) return;

   // Объёмный фильтр
   if (UseVolumeFilter && !CheckVolumeFilter()) return;

   // Формируем строку причины входа для журнала
   string reason = StringFormat(
      "EMA cross %s | RSI=%.1f | ADX=%.1f | ATR=%.5f",
      (direction == OP_BUY ? "UP" : "DOWN"),
      rsiCurr, adxCurr, atrCurr
   );

   OpenPosition(direction, atrCurr, reason);
}

//+------------------------------------------------------------------+
//| OnTester — кастомный критерий оптимизации                        |
//| Формула: (Profit / MaxDrawdown) × WinRate                        |
//+------------------------------------------------------------------+
double OnTester()
{
   double profit      = TesterStatistics(STAT_PROFIT);
   double maxDD       = TesterStatistics(STAT_EQUITY_DD);
   double totalTrades = TesterStatistics(STAT_TRADES);
   double wonTrades   = TesterStatistics(STAT_PROFIT_TRADES);

   if (maxDD <= 0 || totalTrades <= 0) return 0;

   double winRate = wonTrades / totalTrades;
   return (profit / maxDD) * winRate;
}

//====================================================================
// БЛОК ФИЛЬТРОВ
//====================================================================

//+------------------------------------------------------------------+
//| Сводная проверка всех фильтров                                   |
//+------------------------------------------------------------------+
bool PassAllFilters(string &reason)
{
   if (!IsTimeAllowed(reason))        return false;
   if (NewsFilterEnabled)             { reason = "Фильтр новостей (вручную)"; return false; }
   if (!CheckDailyDrawdown(reason))   return false;
   if (!CheckDailyTradeLimit(reason)) return false;
   if (!CheckSpread(reason))          return false;
   if (!CheckMargin(reason))          return false;
   if (!CheckVolatility(reason))      return false;
   return true;
}

//+------------------------------------------------------------------+
//| Временной фильтр                                                  |
//+------------------------------------------------------------------+
bool IsTimeAllowed(string &reason)
{
   datetime now = TimeCurrent();
   int dow      = TimeDayOfWeek(now);
   int hour     = TimeHour(now);

   if (dow == 0 || dow == 6)
      { reason = "Выходной день"; return false; }
   if (dow == 5 && hour >= FridayNoTradeHour)
      { reason = "Пятница закрыта с " + IntegerToString(FridayNoTradeHour) + ":00"; return false; }
   if (dow == 1 && hour < MondayStartHour)
      { reason = "Понедельник открывается в " + IntegerToString(MondayStartHour) + ":00"; return false; }

   if (UseTimeFilter && (hour < TimeFrom || hour >= TimeTo))
   {
      reason = StringFormat("Вне окна %d:00-%d:00", TimeFrom, TimeTo);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Дневная просадка                                                  |
//+------------------------------------------------------------------+
bool CheckDailyDrawdown(string &reason)
{
   if (g_dailyStartBalance <= 0) return true;
   double ddPct = (g_dailyStartBalance - AccountEquity()) / g_dailyStartBalance * 100.0;
   if (ddPct >= MaxDailyDrawdown)
   {
      reason = StringFormat("Дневная просадка %.2f%% >= %.2f%%", ddPct, MaxDailyDrawdown);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Лимит сделок за день                                              |
//+------------------------------------------------------------------+
bool CheckDailyTradeLimit(string &reason)
{
   if (g_dailyTradeCount >= MaxTradesPerDay)
   {
      reason = StringFormat("Лимит сделок %d/%d", g_dailyTradeCount, MaxTradesPerDay);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Фильтр спреда                                                     |
//+------------------------------------------------------------------+
bool CheckSpread(string &reason)
{
   double spreadPts = MarketInfo(TradingSymbol, MODE_SPREAD);
   if (spreadPts > MaxSpread)
   {
      reason = StringFormat("Спред %.1f пп > %.1f пп", spreadPts, MaxSpread);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Проверка уровня маржи                                             |
//+------------------------------------------------------------------+
bool CheckMargin(string &reason)
{
   double margin = AccountMargin();
   double level  = (margin > 0) ? AccountEquity() / margin * 100.0 : 999999.0;
   if (level < MinMarginLevel)
   {
      reason = StringFormat("Маржа %.1f%% < %.1f%%", level, MinMarginLevel);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Фильтр волатильности через ATR                                    |
//+------------------------------------------------------------------+
bool CheckVolatility(string &reason)
{
   double atr    = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);
   double spread = MarketInfo(TradingSymbol, MODE_SPREAD) *
                   MarketInfo(TradingSymbol, MODE_POINT);
   if (spread <= 0) return true;

   double atrMin = spread * ATR_Min_Spread_Mult;
   double atrMax = spread * ATR_Max_Spread_Mult;

   if (atr < atrMin)
   {
      reason = StringFormat("ATR=%.5f слишком мал (мин %.5f)", atr, atrMin);
      return false;
   }
   if (atr > atrMax)
   {
      reason = StringFormat("ATR=%.5f слишком высок (макс %.5f)", atr, atrMax);
      return false;
   }
   return true;
}

//====================================================================
// БЛОК ПОДТВЕРЖДЕНИЙ СИГНАЛА
//====================================================================

//+------------------------------------------------------------------+
//| HTF-подтверждение: направление EMA на старшем ТФ                 |
//+------------------------------------------------------------------+
bool CheckHTFConfirmation(int direction)
{
   double htfFast = iMA(TradingSymbol, HTF_Timeframe, HTF_EMA_Fast, 0, MODE_EMA, PRICE_CLOSE, 1);
   double htfSlow = iMA(TradingSymbol, HTF_Timeframe, HTF_EMA_Slow, 0, MODE_EMA, PRICE_CLOSE, 1);

   // При отсутствии данных пропускаем фильтр (не блокируем)
   if (htfFast == 0 || htfSlow == 0) return true;

   if (direction == OP_BUY && htfFast <= htfSlow)
   {
      Print("HTF фильтр: на HTF нет бычьего тренда");
      return false;
   }
   if (direction == OP_SELL && htfFast >= htfSlow)
   {
      Print("HTF фильтр: на HTF нет медвежьего тренда");
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Глобальный тренд: цена vs EMA(200) на D1                         |
//+------------------------------------------------------------------+
bool CheckGlobalTrend(int direction)
{
   double closeD1 = iClose(TradingSymbol, PERIOD_D1, 1);
   double ema200  = iMA(TradingSymbol, PERIOD_D1, GlobalTrend_EMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   if (ema200 == 0) return true;

   if (direction == OP_BUY && closeD1 <= ema200)
   {
      Print("Глоб. тренд: цена ниже EMA200 D1 — Long запрещён");
      return false;
   }
   if (direction == OP_SELL && closeD1 >= ema200)
   {
      Print("Глоб. тренд: цена выше EMA200 D1 — Short запрещён");
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Свечные паттерны: пин-бар и бар поглощения                       |
//+------------------------------------------------------------------+
bool CheckCandlePattern(int direction)
{
   double o1 = iOpen (TradingSymbol, PERIOD_H1, 1);
   double h1 = iHigh (TradingSymbol, PERIOD_H1, 1);
   double l1 = iLow  (TradingSymbol, PERIOD_H1, 1);
   double c1 = iClose(TradingSymbol, PERIOD_H1, 1);

   double o2 = iOpen (TradingSymbol, PERIOD_H1, 2);
   double h2 = iHigh (TradingSymbol, PERIOD_H1, 2);
   double l2 = iLow  (TradingSymbol, PERIOD_H1, 2);
   double c2 = iClose(TradingSymbol, PERIOD_H1, 2);

   double range1 = h1 - l1;
   double body1  = MathAbs(c1 - o1);
   double body2  = MathAbs(c2 - o2);

   if (range1 == 0) return false;

   // --- Бычий пин-бар: нижняя тень >= PinBarRatio × диапазон ---
   if (direction == OP_BUY)
   {
      double lowerShadow = MathMin(o1, c1) - l1;
      if (lowerShadow / range1 >= PinBarRatio)
      {
         Print("Паттерн: Бычий пин-бар (тень/диапазон=",
               DoubleToStr(lowerShadow / range1, 2), ")");
         return true;
      }
   }

   // --- Медвежий пин-бар: верхняя тень >= PinBarRatio × диапазон ---
   if (direction == OP_SELL)
   {
      double upperShadow = h1 - MathMax(o1, c1);
      if (upperShadow / range1 >= PinBarRatio)
      {
         Print("Паттерн: Медвежий пин-бар (тень/диапазон=",
               DoubleToStr(upperShadow / range1, 2), ")");
         return true;
      }
   }

   // --- Бычье поглощение: бычья свеча [1] поглощает медвежью [2] ---
   if (direction == OP_BUY)
   {
      bool prevBear = c2 < o2;
      bool currBull = c1 > o1;
      bool engulfs  = (c1 >= o2) && (o1 <= c2);
      bool sizeCond = body2 > 0 && body1 >= body2 * EngulfingRatio;

      if (prevBear && currBull && engulfs && sizeCond)
      {
         Print("Паттерн: Бычье поглощение");
         return true;
      }
   }

   // --- Медвежье поглощение: медвежья свеча [1] поглощает бычью [2] ---
   if (direction == OP_SELL)
   {
      bool prevBull = c2 > o2;
      bool currBear = c1 < o1;
      bool engulfs  = (o1 >= c2) && (c1 <= o2);
      bool sizeCond = body2 > 0 && body1 >= body2 * EngulfingRatio;

      if (prevBull && currBear && engulfs && sizeCond)
      {
         Print("Паттерн: Медвежье поглощение");
         return true;
      }
   }

   Print("Паттерн не подтверждён для ", (direction == OP_BUY ? "BUY" : "SELL"));
   return false;
}

//+------------------------------------------------------------------+
//| Объёмный фильтр: тек. объём > среднего за Volume_MA_Period свечей|
//+------------------------------------------------------------------+
bool CheckVolumeFilter()
{
   long currVol = iVolume(TradingSymbol, PERIOD_H1, 1);
   double avgVol = 0;
   for (int i = 1; i <= Volume_MA_Period; i++)
      avgVol += (double)iVolume(TradingSymbol, PERIOD_H1, i);
   avgVol /= Volume_MA_Period;

   if (avgVol <= 0) return true;

   if ((double)currVol <= avgVol)
   {
      Print("Объём: ", currVol, " <= среднего ", DoubleToStr(avgVol, 0), " — пропуск");
      return false;
   }
   return true;
}

//====================================================================
// БЛОК УПРАВЛЕНИЯ ПОЗИЦИЯМИ
//====================================================================

//+------------------------------------------------------------------+
//| Открытие позиции с полным логированием                           |
//+------------------------------------------------------------------+
void OpenPosition(int orderType, double atr, string entryReason)
{
   RefreshRates();

   int    digits  = (int)MarketInfo(TradingSymbol, MODE_DIGITS);
   double point   = MarketInfo(TradingSymbol, MODE_POINT);
   double slDist  = atr * SL_ATR_Mult;
   double tpDist  = atr * TP_ATR_Mult;
   double price, sl, tp;

   if (orderType == OP_BUY)
   {
      price = MarketInfo(TradingSymbol, MODE_ASK);
      sl    = NormalizeDouble(price - slDist, digits);
      tp    = NormalizeDouble(price + tpDist, digits);
   }
   else
   {
      price = MarketInfo(TradingSymbol, MODE_BID);
      sl    = NormalizeDouble(price + slDist, digits);
      tp    = NormalizeDouble(price - tpDist, digits);
   }

   // Корректируем SL под минимальный стоп брокера
   double minStop = MarketInfo(TradingSymbol, MODE_STOPLEVEL) * point;
   if (MathAbs(price - sl) < minStop)
   {
      sl = (orderType == OP_BUY)
           ? NormalizeDouble(price - minStop, digits)
           : NormalizeDouble(price + minStop, digits);
      Print("SL скорректирован до минимума брокера: ", sl);
   }

   double lot = CalculateLot(price, sl);
   if (lot <= 0) { Print("ОШИБКА: расчётный лот = 0"); return; }

   string dir = (orderType == OP_BUY) ? "BUY" : "SELL";

   for (int attempt = 1; attempt <= RETRY_COUNT; attempt++)
   {
      RefreshRates();
      price = (orderType == OP_BUY)
              ? MarketInfo(TradingSymbol, MODE_ASK)
              : MarketInfo(TradingSymbol, MODE_BID);

      int ticket = OrderSend(
         TradingSymbol, orderType, lot, price, MaxSlippage,
         sl, tp, OrderComment, MagicNumber, 0,
         (orderType == OP_BUY) ? clrDodgerBlue : clrOrangeRed
      );

      if (ticket > 0)
      {
         g_dailyTradeCount++;
         Print("✓ [", dir, "] Тикет=", ticket,
               " | Лот=", lot,
               " | Цена=", price,
               " | SL=", sl,
               " | TP=", tp,
               " | Причина: ", entryReason,
               " | Сделок сегодня: ", g_dailyTradeCount, "/", MaxTradesPerDay);
         return;
      }

      int err = GetLastError();
      Print("✗ OrderSend попытка ", attempt, "/", RETRY_COUNT,
            " | Ошибка: ", ErrorToString(err), " (", err, ")");
      HandleTradeError(err);
      Sleep(RETRY_SLEEP);
   }

   Print("КРИТИЧНО: Не удалось открыть ", dir, " после ", RETRY_COUNT, " попыток");
}

//+------------------------------------------------------------------+
//| Трейлинг-стоп на основе ATR                                       |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   double atr      = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);
   if (atr <= 0) return;

   double trigger  = atr * Trail_ATR_Trigger;
   double trail    = atr * Trail_ATR_Distance;
   int    digits   = (int)MarketInfo(TradingSymbol, MODE_DIGITS);
   double tickSize = MarketInfo(TradingSymbol, MODE_TICKSIZE);

   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() != TradingSymbol || OrderMagicNumber() != MagicNumber) continue;

      if (OrderType() == OP_BUY)
      {
         double bid    = MarketInfo(TradingSymbol, MODE_BID);
         double profit = bid - OrderOpenPrice();
         if (profit < trigger) continue;

         double newSL = NormalizeDouble(bid - trail, digits);
         if (newSL > OrderStopLoss() + tickSize)
         {
            if (OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrCornflowerBlue))
               Print("Trail BUY: тикет=", OrderTicket(), " | SL=", newSL, " | Bid=", bid);
            else
               Print("Trail BUY ошибка: ", ErrorToString(GetLastError()));
         }
      }
      else if (OrderType() == OP_SELL)
      {
         double ask    = MarketInfo(TradingSymbol, MODE_ASK);
         double profit = OrderOpenPrice() - ask;
         if (profit < trigger) continue;

         double newSL = NormalizeDouble(ask + trail, digits);
         if (OrderStopLoss() == 0 || newSL < OrderStopLoss() - tickSize)
         {
            if (OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrCornflowerBlue))
               Print("Trail SELL: тикет=", OrderTicket(), " | SL=", newSL, " | Ask=", ask);
            else
               Print("Trail SELL ошибка: ", ErrorToString(GetLastError()));
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Частичное закрытие: 50% объёма при достижении 1R прибыли         |
//+------------------------------------------------------------------+
void ManagePartialClose()
{
   double atr = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);
   if (atr <= 0) return;

   double riskDist = atr * SL_ATR_Mult;         // 1R = расстояние риска
   double target   = riskDist * PartialClose_R;  // Цель для частичного закрытия

   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() != TradingSymbol || OrderMagicNumber() != MagicNumber) continue;
      if (OrderType() != OP_BUY && OrderType() != OP_SELL) continue;

      // Пропускаем если уже делали частичное закрытие
      if (IsPartialClosed(OrderTicket())) continue;

      double lotToClose = NormalizeLot(OrderLots() * PartialClosePct / 100.0);
      if (lotToClose < MarketInfo(TradingSymbol, MODE_MINLOT)) continue;

      double closePrice = 0;
      bool   triggered  = false;

      if (OrderType() == OP_BUY)
      {
         double bid = MarketInfo(TradingSymbol, MODE_BID);
         if (bid - OrderOpenPrice() >= target) { triggered = true; closePrice = bid; }
      }
      else
      {
         double ask = MarketInfo(TradingSymbol, MODE_ASK);
         if (OrderOpenPrice() - ask >= target)  { triggered = true; closePrice = ask; }
      }

      if (!triggered) continue;

      if (OrderClose(OrderTicket(), lotToClose, closePrice, MaxSlippage, clrGold))
      {
         MarkPartialClosed(OrderTicket());
         Print("Частичное закрытие: тикет=", OrderTicket(),
               " | Закрыто=", lotToClose, " лот",
               " | Цена=", closePrice,
               " | Остаток=", NormalizeDouble(OrderLots() - lotToClose, 2));
      }
      else
      {
         Print("Ошибка частичного закрытия: ", ErrorToString(GetLastError()));
      }
   }
}

//+------------------------------------------------------------------+
//| Проверка: было ли частичное закрытие для тикета                  |
//+------------------------------------------------------------------+
bool IsPartialClosed(int ticket)
{
   for (int i = 0; i < g_partialClosedCount; i++)
      if (g_partialClosedTickets[i] == ticket) return true;
   return false;
}

//+------------------------------------------------------------------+
//| Записать тикет как частично закрытый                              |
//+------------------------------------------------------------------+
void MarkPartialClosed(int ticket)
{
   if (g_partialClosedCount < ArraySize(g_partialClosedTickets))
   {
      g_partialClosedTickets[g_partialClosedCount] = ticket;
      g_partialClosedCount++;
   }
}

//+------------------------------------------------------------------+
//| Подсчёт открытых позиций советника                               |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for (int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderSymbol() == TradingSymbol && OrderMagicNumber() == MagicNumber)
         count++;
   }
   return count;
}

//====================================================================
// БЛОК РИСК-МЕНЕДЖМЕНТА
//====================================================================

//+------------------------------------------------------------------+
//| Расчёт лота по % риска от баланса                                |
//+------------------------------------------------------------------+
double CalculateLot(double entryPrice, double slPrice)
{
   double balance    = AccountBalance();
   double riskMoney  = balance * RiskPercent / 100.0;
   double slDist     = MathAbs(entryPrice - slPrice);
   if (slDist <= 0) return 0;

   double tickValue  = MarketInfo(TradingSymbol, MODE_TICKVALUE);
   double tickSize   = MarketInfo(TradingSymbol, MODE_TICKSIZE);
   if (tickValue <= 0 || tickSize <= 0) return 0;

   double lossPerLot = (slDist / tickSize) * tickValue;
   double lot        = riskMoney / lossPerLot;

   lot = NormalizeLot(lot);

   Print("Расчёт лота: Баланс=", DoubleToStr(balance, 2),
         " | Риск=", DoubleToStr(riskMoney, 2),
         " | SL=", DoubleToStr(slDist, (int)MarketInfo(TradingSymbol, MODE_DIGITS)),
         " | Лот=", lot);
   return lot;
}

//+------------------------------------------------------------------+
//| Нормализация лота по параметрам брокера                          |
//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double step   = MarketInfo(TradingSymbol, MODE_LOTSTEP);
   double minLot = MathMax(MarketInfo(TradingSymbol, MODE_MINLOT), LotMin);
   double maxLot = MathMin(MarketInfo(TradingSymbol, MODE_MAXLOT), LotMax);

   if (step > 0) lot = MathFloor(lot / step) * step;
   lot = MathMax(lot, minLot);
   lot = MathMin(lot, maxLot);
   return NormalizeDouble(lot, 2);
}

//====================================================================
// БЛОК СТАТИСТИКИ, ДНЕЙ И ДЭШБОРДА
//====================================================================

//+------------------------------------------------------------------+
//| Сброс дневных счётчиков                                           |
//+------------------------------------------------------------------+
void ResetDailyStats()
{
   g_dailyStartBalance = AccountBalance();
   g_dailyTradeCount   = 0;
   g_currentDayOpen    = iTime(TradingSymbol, PERIOD_D1, 0);
   Print("Новый день: баланс=", DoubleToStr(g_dailyStartBalance, 2),
         " | Лимит сделок=", MaxTradesPerDay,
         " | Макс просадка=", MaxDailyDrawdown, "%");
}

//+------------------------------------------------------------------+
//| Смена торгового дня                                               |
//+------------------------------------------------------------------+
void UpdateDailyStats()
{
   datetime todayOpen = iTime(TradingSymbol, PERIOD_D1, 0);
   if (todayOpen != g_currentDayOpen)
      ResetDailyStats();
}

//+------------------------------------------------------------------+
//| Дэшборд через Comment()                                          |
//+------------------------------------------------------------------+
void UpdateDashboard()
{
   double equity   = AccountEquity();
   double balance  = AccountBalance();
   double ddPct    = (g_dailyStartBalance > 0)
                     ? (g_dailyStartBalance - equity) / g_dailyStartBalance * 100.0
                     : 0.0;
   double margin   = AccountMargin();
   double marginLv = (margin > 0) ? equity / margin * 100.0 : 0.0;
   double spread   = MarketInfo(TradingSymbol, MODE_SPREAD);
   double atr      = iATR(TradingSymbol, PERIOD_H1, ATR_Period, 1);
   int    openPos  = CountOpenPositions();

   // Определяем текущий статус
   string status;
   string dummyReason = "";
   if (!PassAllFilters(dummyReason))
      status = "СТОП: " + dummyReason;
   else if (openPos > 0)
      status = "В ПОЗИЦИИ (" + IntegerToString(openPos) + ")";
   else
      status = "ОЖИДАНИЕ СИГНАЛА";

   Comment(
      "╔═══════════════════════════════════════╗\n",
      "║       EMA Trend EA Pro  v2.0          ║\n",
      "╠═══════════════════════════════════════╣\n",
      "║ Пара     : ", TradingSymbol,   "\n",
      "║ Баланс   : ", DoubleToStr(balance, 2), " ", AccountCurrency(), "\n",
      "║ Эквити   : ", DoubleToStr(equity,  2), " ", AccountCurrency(), "\n",
      "║ Просадка : ", DoubleToStr(ddPct, 2), "% (макс ", MaxDailyDrawdown, "%)\n",
      "║ Маржа    : ", DoubleToStr(marginLv, 1), "%\n",
      "╠═══════════════════════════════════════╣\n",
      "║ Сделок   : ", g_dailyTradeCount, " / ", MaxTradesPerDay, "\n",
      "║ Спред    : ", DoubleToStr(spread, 1), " пп (макс ", MaxSpread, ")\n",
      "║ ATR(", ATR_Period, ")  : ",
         DoubleToStr(atr, (int)MarketInfo(TradingSymbol, MODE_DIGITS)), "\n",
      "╠═══════════════════════════════════════╣\n",
      "║ ", status, "\n",
      "╚═══════════════════════════════════════╝"
   );
}

//====================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
//====================================================================

//+------------------------------------------------------------------+
//| Определение новой H1 свечи                                        |
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
//| Обработка торговых ошибок (паузы и обновление котировок)         |
//+------------------------------------------------------------------+
void HandleTradeError(int err)
{
   switch (err)
   {
      case ERR_SERVER_BUSY:
      case ERR_NO_CONNECTION:
      case ERR_TRADE_TIMEOUT:    Sleep(3000); break;
      case ERR_PRICE_CHANGED:
      case ERR_REQUOTE:          RefreshRates(); break;
      case ERR_OFF_QUOTES:       Sleep(2000); RefreshRates(); break;
      case ERR_NOT_ENOUGH_MONEY: Print("КРИТИЧНО: нет средств для открытия позиции"); break;
      case ERR_TRADE_DISABLED:   Print("Автоторговля отключена"); break;
      case ERR_INVALID_STOPS:    Print("Некорректные SL/TP (проверьте минимум брокера)"); break;
      case ERR_MARKET_CLOSED:    Print("Рынок закрыт"); break;
      default: break;
   }
}

//+------------------------------------------------------------------+
//| Описание кодов ошибок MT4 на русском                             |
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
      case 64:  return "Счёт заблокирован";
      case 128: return "Таймаут запроса";
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
//| Валидация входных параметров                                      |
//+------------------------------------------------------------------+
bool ValidateParams()
{
   if (EMA_Fast >= EMA_Slow)
      { Alert("EMA_Fast (", EMA_Fast, ") >= EMA_Slow (", EMA_Slow, ")"); return false; }
   if (RiskPercent <= 0 || RiskPercent > 20)
      { Alert("RiskPercent вне диапазона 0–20"); return false; }
   if (SL_ATR_Mult <= 0 || TP_ATR_Mult <= 0)
      { Alert("Множители ATR должны быть > 0"); return false; }
   if (TP_ATR_Mult <= SL_ATR_Mult)
      { Alert("TP_ATR_Mult должен быть > SL_ATR_Mult для положительного RR"); return false; }
   if (MaxDailyDrawdown <= 0 || MaxDailyDrawdown > 50)
      { Alert("MaxDailyDrawdown вне диапазона 0–50"); return false; }
   if (MaxTradesPerDay <= 0)
      { Alert("MaxTradesPerDay должен быть > 0"); return false; }
   if (TimeFrom >= TimeTo)
      { Alert("TimeFrom >= TimeTo"); return false; }
   return true;
}

//+------------------------------------------------------------------+
//| Печать конфигурации в журнал при старте                          |
//+------------------------------------------------------------------+
void PrintSettings()
{
   Print("╔════════════════════════════════════════════╗");
   Print("║          EMA Trend EA Pro v2.0             ║");
   Print("╚════════════════════════════════════════════╝");
   Print("Пара: ", TradingSymbol, " | Magic: ", MagicNumber);
   Print("EMA: ", EMA_Fast, "/", EMA_Slow,
         " | RSI: ", RSI_Period,
         " | ATR: ", ATR_Period,
         " | ADX: ", ADX_Period, " (мин=", ADX_MinLevel, ")");
   Print("HTF: ", (UseHTF ? "вкл (TF=" + IntegerToString(HTF_Timeframe) + ")" : "откл"),
         " | Глоб. тренд EMA", GlobalTrend_EMA, " D1: ", (UseGlobalTrend ? "вкл" : "откл"));
   Print("Паттерны: ", (UseCandlePattern ? "вкл" : "откл"),
         " | Объём: ", (UseVolumeFilter ? "вкл" : "откл"));
   Print("Риск: ", RiskPercent, "% | SL×", SL_ATR_Mult, " | TP×", TP_ATR_Mult,
         " | RR=1:", DoubleToStr(TP_ATR_Mult / SL_ATR_Mult, 1));
   Print("Трейлинг: ", (UseTrailingStop ? "вкл" : "откл"),
         " | Частичное закрытие: ", (UsePartialClose ? "вкл" : "откл"),
         " (", PartialClosePct, "% при ", PartialClose_R, "R)");
   Print("Макс просадка дня: ", MaxDailyDrawdown, "% | Макс сделок: ", MaxTradesPerDay);
   Print("Спред: ", MaxSpread, " пп | Маржа мин: ", MinMarginLevel,
         "% | Скольжение: ", MaxSlippage, " пп");
   Print("Торговое окно: ", TimeFrom, ":00-", TimeTo, ":00",
         " | Пт закрытие: ", FridayNoTradeHour, ":00",
         " | Пн открытие: ", MondayStartHour, ":00");
}
//+------------------------------------------------------------------+
