# 🧭 Atlas — техническая документация

> Полная инструкция «как всё устроено и как с этим работать».
> Для Виктора (и любого, кто завтра сядет вместо тебя).

---

## 1. Архитектура — что от чего зависит

```
┌──────────────────────────────────────────────────────────┐
│                  ТВОЙ БРАУЗЕР (юзера)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Atlas (index.html, ~150 КБ)                        │  │
│  │   • HTML + CSS + JS — один файл                     │  │
│  │   • Supabase JS SDK (CDN, ~100 КБ, async)           │  │
│  │   • Service Worker (sw.js) — кэш + offline          │  │
│  │   • localStorage (планер-данные, токен сессии)      │  │
│  └────────────────────────────────────────────────────┘  │
│         ↓                            ↑                    │
└─────────│────────────────────────────│────────────────────┘
          │  HTTPS                     │
          ↓                            │
┌─────────────────────┐    ┌──────────────────────────┐
│  GITHUB PAGES       │    │     SUPABASE (облако)     │
│   1chernyshev.      │    │   ploroaresanhqttynroq    │
│   github.io/        │    │   .supabase.co            │
│   personal-planner  │    │                           │
│                     │    │   • PostgreSQL DB         │
│   • Раздаёт твои    │    │     - таблица user_data   │
│     статические     │    │   • Auth (email/password) │
│     файлы           │    │   • RLS (Row-Level Sec)   │
│   • Бесплатно       │    │   • Realtime sync         │
│   • Без серверной   │    │   • Бесплатно до лимитов  │
│     логики          │    │                           │
└─────────────────────┘    └──────────────────────────┘
          ↑                            ↑
          │                            │
          │  git push                  │  SQL Editor / API
          │                            │
┌─────────│────────────────────────────│────────────────────┐
│                                                            │
│         ТЫ (mac, ~/Downloads/personal-planner/)            │
│                                                            │
│   • index.html  ← код Atlas                                │
│   • sw.js       ← Service Worker                           │
│   • manifest.json, icon.svg ← PWA-конфиг                   │
│   • README.md, BRAND.md, LOGO_PROMPT.md, DOCS.md ← доки    │
│   • .git/       ← локальная история                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Кто за что отвечает

| Слой | Что делает | Платит |
|---|---|---|
| **GitHub** | Хранит файлы и раздаёт сайт по `https://1chernyshev.github.io/personal-planner/` | Бесплатно |
| **Supabase** | Хранит данные пользователей в Postgres + авторизация по email/паролю + realtime подписки | Бесплатно до 500 МБ БД, 50k MAU, 5 ГБ трафика |
| **Браузер юзера** | Показывает интерфейс, кэширует данные локально (`localStorage`), работает офлайн (SW) | — |
| **Твой Mac** | Хранит исходники, ты делаешь правки и `git push` → автоматически обновляет сайт | — |

### Что **не используется** (но люди часто спрашивают)

- ❌ **Своего сервера нет** — Atlas чистый frontend.
- ❌ **Базы данных на твоём Mac нет** — данные пользователей в облаке Supabase.
- ❌ **Бэкенд кода (Node.js / Python API) нет** — Supabase даёт REST + Realtime автоматически.
- ❌ **DNS не настроен** — сайт по дефолтному `*.github.io` адресу. Свой домен (`atlas.app`) можно купить когда захочешь, ~$10–15/год.

---

## 2. Как вносить корректировки в платформу

### 2.1 Изменить дизайн / добавить фичу

```bash
# 1. Открой проект в любом редакторе (VS Code / Cursor / Sublime)
open -a "Visual Studio Code" ~/Downloads/personal-planner
# или просто открыть файл
open ~/Downloads/personal-planner/index.html
```

Файлы:
- **`index.html`** — всё приложение (HTML/CSS/JS в одном). Структура:
  ```
  <head>
    стили (CSS variables, layout, glass)
    подключение Supabase SDK
    PWA-meta
  </head>
  <body>
    splash-экран
    auth-экран
    main app (.app)
    модалка
    <script>
      HELPERS, STORAGE, RECURRENCE,
      TABS, CALENDAR, TASKS, HABITS, WORKSPACE, REMINDERS,
      TEMPLATES, AUTH/SUPABASE, NOTIFICATIONS, INIT
    </script>
  </body>
  ```
- **`sw.js`** — кэш + offline. Меняешь — **обязательно увеличь** `CACHE = 'atlas-v5'` → `atlas-v6` (иначе старая версия зависнет в браузере юзеров).
- **`manifest.json`** — PWA-конфиг (имя, цвета, иконки).
- **`icon.svg`** — иконка на главный экран iPhone.

### 2.2 Локальная проверка перед публикацией

```bash
# Просто открой файл двойным кликом или:
open ~/Downloads/personal-planner/index.html
```

⚠️ **Service Worker и Manifest не работают через `file://`** — это норма. Они работают только на github.io. Если хочешь тестировать SW локально:
```bash
cd ~/Downloads/personal-planner
python3 -m http.server 8000
# открой http://localhost:8000
```

### 2.3 Опубликовать изменения

#### Вариант А — через сайт GitHub (мышкой, без терминала)

1. Открой папку: `open ~/Downloads/personal-planner`
2. Открой в браузере: **https://github.com/1chernyshev/personal-planner**
3. Кликни по нужному файлу → иконка ✏️ (Edit) или **Add file → Upload files**
4. Перетащи изменённые файлы
5. Внизу — **Commit changes**

Через 1–2 минуты сайт обновится. Жёсткий рефреш в браузере: `Cmd+Shift+R`.

#### Вариант Б — через терминал (быстрее, если правишь часто)

```bash
cd ~/Downloads/personal-planner
git add -A                              # положить в коммит все изменения
git commit -m "Что я сделал"            # описание (для себя в истории)
git push                                # отправить на GitHub
```

Если попросит токен — см. README.md (Personal Access Token c scope `repo`).

### 2.4 Откатить плохое изменение

```bash
cd ~/Downloads/personal-planner
git log --oneline                       # посмотреть историю
git revert <хэш-плохого-коммита>        # создаёт обратный коммит
git push                                # выкатить откат
```

Или вернуться к конкретному коммиту:
```bash
git reset --hard <хэш-хорошего-коммита>
git push --force                        # ⚠️ перезатрёт историю в облаке
```

---

## 3. Как работать с данными пользователей

### 3.1 Где данные физически хранятся

- **Локально у каждого юзера в браузере** — `localStorage` ключ `planner_db_v2`. Это JSON со всем (события, задачи, привычки, заметки, напоминания, настройки).
- **В облаке Supabase** — таблица `user_data`, одна строка на юзера:
  ```sql
  user_id    UUID PRIMARY KEY  -- ссылается на auth.users
  data       JSONB             -- ровно такой же JSON как в localStorage
  updated_at TIMESTAMPTZ
  ```

### 3.2 Зайти и посмотреть данные

1. Открой https://supabase.com/dashboard
2. Выбери проект **atlas**
3. Слева — **Table Editor** → **`user_data`**
4. Увидишь список строк. Двойной клик по строке → видишь JSON `data` целиком.

### 3.3 Изменить данные пользователя вручную

⚠️ Делай это только если **знаешь конкретно что меняешь** — поломаешь юзера легко.

#### Через UI Supabase
1. Table Editor → `user_data` → кликни ячейку `data`
2. Откроется JSON-редактор
3. Правь → **Save**

#### Через SQL (массово)
**Authentication → SQL Editor → New query:**

Пример — увидеть email юзера и его статистику:
```sql
select
  u.email,
  ud.updated_at,
  jsonb_array_length(ud.data -> 'events')      as events_count,
  jsonb_array_length(ud.data -> 'tasks')       as tasks_count,
  jsonb_array_length(ud.data -> 'habits')      as habits_count,
  jsonb_array_length(ud.data -> 'reminders')   as reminders_count
from public.user_data ud
join auth.users u on u.id = ud.user_id
order by ud.updated_at desc;
```

Пример — посмотреть всех юзеров кто заходил за последние 7 дней:
```sql
select u.email, ud.updated_at
from public.user_data ud
join auth.users u on u.id = ud.user_id
where ud.updated_at > now() - interval '7 days'
order by ud.updated_at desc;
```

Пример — обнулить данные конкретного юзера (например, восстановить «из коробки»):
```sql
update public.user_data
set data = '{}'::jsonb,
    updated_at = now()
where user_id = (select id from auth.users where email = 'user@example.com');
```

Пример — удалить юзера полностью (включая данные):
```sql
delete from auth.users where email = 'user@example.com';
-- каскад автоматически удалит запись из user_data (ON DELETE CASCADE)
```

### 3.4 Резервная копия всей базы

В Supabase → **Project Settings → Database → Backups**.
Бесплатный план — автобэкапы 7 дней назад. На Pro — 30 дней + point-in-time recovery.

Дополнительно — экспорт вручную через SQL Editor:
```sql
copy (select user_id, data, updated_at from public.user_data) to stdout with csv header;
```
И скопировать результат в файл.

### 3.5 Когда добавлять новую таблицу

Сейчас всё в одной `user_data.data` JSON. Это **специально** — даёт максимальную гибкость без миграций кода/БД. Если завтра захочешь:
- 📈 Аналитику по агрегатам (топ-привычки и т.д.) — добавь отдельные таблицы `events`, `tasks`, `habits`
- 🤝 Шеринг между пользователями — нужны таблицы `shares`, `permissions`
- 💳 Платежи — таблицы `subscriptions`, `invoices`

См. раздел **5. SQL Quickstart** ниже.

---

## 4. Управление пользователями

### 4.1 Просмотр зарегистрированных

Supabase → **Authentication → Users**. Видишь email, дату регистрации, метод (email/google/etc), последний вход.

### 4.2 Заблокировать пользователя

Authentication → Users → клик на юзера → **Ban user**. Залогиниться не сможет, данные останутся в БД.

### 4.3 Удалить пользователя

Authentication → Users → клик → **Delete user**. Автоматически удалится и запись из `user_data` (ON DELETE CASCADE).

### 4.4 Сбросить пароль за юзера

Authentication → Users → клик → **Send password recovery** (на email юзера придёт ссылка).

### 4.5 Войти от имени юзера для отладки

Authentication → Users → клик → **Impersonate** (даст тебе magic-link, который залогинит как этот юзер).

---

## 5. SQL Quickstart — практические примеры

### 5.1 Где писать SQL

Supabase → **SQL Editor** → **+ New query** → пишешь → **Run** (или `Cmd+Enter`).

### 5.2 Базовый синтаксис которым ты будешь пользоваться

```sql
-- Прочитать данные
select * from public.user_data limit 10;
select email, created_at from auth.users order by created_at desc;

-- Подсчитать
select count(*) from auth.users;
select count(*) as active_today
from public.user_data
where updated_at::date = current_date;

-- Обновить
update public.user_data
set data = data || '{"settings": {"theme": "dark"}}'::jsonb
where user_id = '00000000-0000-0000-0000-000000000000';

-- Удалить
delete from public.user_data where updated_at < now() - interval '1 year';

-- Создать новую таблицу
create table public.feedback (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  message     text not null,
  created_at  timestamptz default now()
);
alter table public.feedback enable row level security;
create policy "insert own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);
create policy "read own feedback" on public.feedback
  for select using (auth.uid() = user_id);
```

### 5.3 RLS — Row Level Security (ОЧЕНЬ ВАЖНО)

**Главное правило:** на любую таблицу с пользовательскими данными — включай RLS, иначе любой залогиненный юзер увидит данные всех других юзеров.

```sql
alter table public.feedback enable row level security;

create policy "read own"   on public.feedback for select using (auth.uid() = user_id);
create policy "insert own" on public.feedback for insert with check (auth.uid() = user_id);
create policy "update own" on public.feedback for update using (auth.uid() = user_id);
create policy "delete own" on public.feedback for delete using (auth.uid() = user_id);
```

`auth.uid()` — это магическая функция Supabase, возвращает UUID текущего юзера из его JWT-токена.

### 5.4 Полезные SQL-сниппеты для Atlas

#### Топ-10 самых активных юзеров (по количеству задач):
```sql
select u.email,
       jsonb_array_length(ud.data -> 'tasks') as total_tasks,
       jsonb_array_length(ud.data -> 'events') as total_events
from public.user_data ud
join auth.users u on u.id = ud.user_id
order by jsonb_array_length(ud.data -> 'tasks') desc
limit 10;
```

#### Среднее количество привычек на юзера:
```sql
select round(avg(jsonb_array_length(data -> 'habits')), 1) as avg_habits
from public.user_data;
```

#### Юзеры которые загрузили шаблон «Английский за 60 дней»:
```sql
select u.email
from public.user_data ud
join auth.users u on u.id = ud.user_id
where exists (
  select 1
  from jsonb_array_elements(ud.data -> 'taskLists') as l
  where l ->> 'id' = 'tpl-eng-list'
);
```

#### Сколько MAU (monthly active users):
```sql
select count(distinct user_id) as mau
from public.user_data
where updated_at > now() - interval '30 days';
```

---

## 6. Python — когда и зачем

В Atlas Python **не используется в продакшене** — приложение чисто фронтенд. Но Python полезен для:
- 📊 Аналитики (читаешь Supabase, считаешь метрики)
- 🛠 Скриптов миграции (массово обновить все записи)
- 🧪 Тестов
- 🤖 Будущих фич (AI-генерация шаблонов, email-рассылки)

### 6.1 Установка пакета Supabase для Python

```bash
pip install supabase
# или с poetry:
poetry add supabase
```

### 6.2 Подключение к твоей базе

⚠️ **Для скриптов используй `service_role` ключ** (не `publishable`!) — он даёт админские права в обход RLS. **Никогда** не публикуй его в open-source и не клади в `index.html`. Возьми его в **Supabase → Settings → API Keys → service_role**.

```python
# atlas_admin.py
import os
from supabase import create_client, Client

# Лучше через переменную окружения:
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://ploroaresanhqttynroq.supabase.co')
SERVICE_KEY  = os.environ.get('SUPABASE_SERVICE_KEY')

sb: Client = create_client(SUPABASE_URL, SERVICE_KEY)
```

Запуск:
```bash
export SUPABASE_SERVICE_KEY="sb_secret_..."
python3 atlas_admin.py
```

### 6.3 Полезные сниппеты

#### Получить всех пользователей и их статистику:
```python
def list_users():
    users = sb.auth.admin.list_users()
    for u in users:
        data = sb.table('user_data').select('data,updated_at').eq('user_id', u.id).execute()
        if data.data:
            d = data.data[0]['data']
            print(f"{u.email:30}  tasks={len(d.get('tasks',[]))}  habits={len(d.get('habits',[]))}  updated={data.data[0]['updated_at']}")

list_users()
```

#### Массовая миграция (добавить новое поле всем пользователям):
```python
def migrate_add_field():
    rows = sb.table('user_data').select('user_id, data').execute().data
    for row in rows:
        data = row['data']
        if 'newField' not in data:
            data['newField'] = 'defaultValue'
            sb.table('user_data').update({'data': data}).eq('user_id', row['user_id']).execute()
            print(f"✓ migrated {row['user_id']}")
```

#### Бэкап в JSON-файл локально:
```python
import json
from datetime import datetime

def backup():
    rows = sb.table('user_data').select('*').execute().data
    fname = f"atlas_backup_{datetime.now():%Y%m%d_%H%M%S}.json"
    with open(fname, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved {len(rows)} users to {fname}")

backup()
```

#### Скрипт аналитики (вывести популярные категории):
```python
from collections import Counter

def popular_categories():
    rows = sb.table('user_data').select('data').execute().data
    counter = Counter()
    for row in rows:
        for cat in row['data'].get('categories', []):
            counter[cat['name']] += 1
    for name, count in counter.most_common(20):
        print(f"{count:4}  {name}")

popular_categories()
```

### 6.4 Cron-задачи на Python

Если нужно регулярно (раз в день / час) что-то делать — самое простое:
- **GitHub Actions** (бесплатно, идеально для пет-проектов) — кладёшь `.github/workflows/cron.yml`, в нём `cron: '0 9 * * *'`, оно запускает твой Python.
- **Supabase Edge Functions** — JS/Deno, могут срабатывать по расписанию (Pro план).
- **Локальный crontab на ноуте** — `crontab -e`.

---

## 7. Уровни доступа в Supabase

| Ключ | Где использовать | Можно публиковать? |
|---|---|---|
| `sb_publishable_*` | Frontend (`index.html`) | ✅ **ДА** — он специально для этого |
| `sb_secret_*` (service_role) | Python-скрипты, серверные крон-задачи | ❌ **НЕТ — никогда** не клади в публичные репозитории |
| Database password | Прямой доступ к Postgres через SQL клиент | ❌ Только локально |

Если случайно засветил `service_role` — Supabase → Settings → API → **Regenerate keys**.

---

## 8. Что делать если…

### …сайт не открывается / падает с ошибкой
1. Зайди https://github.com/1chernyshev/personal-planner/deployments — смотри последний деплой
2. Если красный — кликни → посмотри лог
3. Если в логе ничего криминального — попробуй жёсткий рефреш в браузере (`Cmd+Shift+R`)
4. Открой DevTools → Console (`Cmd+Opt+I`) — там будет JS-ошибка с номером строки

### …пользователь жалуется «данные пропали»
1. Открой Supabase → Table Editor → `user_data`
2. Найди его строку по `user_id` (из Authentication → Users по email)
3. Посмотри `updated_at` — когда он последний раз заходил
4. Раскрой `data` — посмотри есть ли там его записи
5. Если нет — посмотри в `Backups`, восстанови из бэкапа за вчера

### …Supabase упёрся в лимиты
- 500 МБ БД → удали старые `user_data` через SQL: `delete from public.user_data where updated_at < now() - interval '6 months'`
- 50k MAU → апгрейд на Pro ($25/мес)
- Bandwidth → проверь Project Usage в Settings

### …хочешь добавить новую фичу но боишься сломать
1. Создай ветку: `git checkout -b feature/cool-thing`
2. Правь, коммить, тестируй локально
3. Когда готово: `git checkout main && git merge feature/cool-thing && git push`

### …хочешь свой домен (atlas.app, atlas.run, etc)
1. Купи на namecheap.com / godaddy.com (~$10–20/год)
2. На GitHub: Settings → Pages → Custom domain → впиши `atlas.example.com` → Save
3. На сайте регистратора создай CNAME-запись на `1chernyshev.github.io`
4. Подожди до часа — заработает с HTTPS

---

## 9. Roadmap (что можно добавить дальше)

### Технические улучшения
- [ ] Полноценный recurrence editor (повторение с `until` датой, `count`, исключения)
- [ ] Drag-and-drop задач между списками и временными слотами
- [ ] Поиск по всему контенту (Cmd+K palette)
- [ ] Полная intl-локализация (en/ru/es)
- [ ] Темы пользователя кроме light/dark
- [ ] Push-уведомления через сервер (Vercel/Cloudflare Worker + FCM)

### Продуктовые
- [ ] AI-генерация шаблонов («сделай мне план на марафон под мою физформу»)
- [ ] Шеринг календарей и шаблонов между пользователями
- [ ] Импорт из Google Calendar / Notion / Apple Reminders
- [ ] Виджеты на лендинг (live-демо без регистрации)
- [ ] Платный план Pro: AI-шаблоны + расширенная аналитика

### Бизнес
- [ ] Свой домен → `atlas.run` или `getatlas.app`
- [ ] Лендинг с фичами и скриншотами
- [ ] OpenGraph-картинка для красивых превью в мессенджерах
- [ ] Аналитика (Plausible / Umami — privacy-first без cookies)
- [ ] Email рассылка о новых шаблонах (Resend + Supabase Edge Functions)

---

## 10. Контакты и ссылки

| Что | Где |
|---|---|
| Репозиторий | https://github.com/1chernyshev/personal-planner |
| Живой сайт | https://1chernyshev.github.io/personal-planner/ |
| Supabase проект | https://supabase.com/dashboard/projects |
| GitHub Pages статус | https://github.com/1chernyshev/personal-planner/deployments |
| GitHub Pages settings | https://github.com/1chernyshev/personal-planner/settings/pages |
| Supabase docs | https://supabase.com/docs |
| Supabase Python | https://github.com/supabase-community/supabase-py |

---

**Если что-то непонятно — пиши, обновим этот документ.**
