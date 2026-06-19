# СДЭК интеграция

## Что делаем
1. [x] Ключи в .env — ждём
2. [ ] API /api/cdek/* — OAuth, тарифы, ПВЗ, создание заказа
3. [ ] CartModal — шаг delivery между cart и form
4. [ ] После payment=success — создать заказ СДЭК

## Детали
- Отправитель: Казань (код города СДЭК: 44)
- Режим: боевой (есть аккаунт)
- API v2: https://api.cdek.ru/v2

## Эндпоинты СДЭК
- POST /oauth/token — получить токен
- POST /calculator/tarifflist — расчёт тарифов (from: 44, to: город покупателя)
- GET /deliverypoints?city_code=XXX&type=PVZ — список ПВЗ
- POST /orders — создать заказ

## Шаги CartModal
cart → delivery (город + тариф + ПВЗ) → form (имя/телефон) → paying

## Размеры посылки (для расчёта)
- Вес: 500г (0.5 кг)
- Размеры: 15x15x15 см

## Коды городов СДЭК
- Казань: 44
- Нужен API /location/cities?city=... для поиска кода города получателя
