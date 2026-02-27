# Supabase 配置说明（电脑与手机数据同步）

## 1. 创建项目

1. 打开 [Supabase](https://supabase.com) 并登录，新建项目（记下 **Project URL** 和 **anon public** key）。
2. 在项目里打开 **SQL Editor**，执行下面的 SQL 建表和 RLS。

## 2. 执行 SQL（建表 + RLS）

```sql
-- 每个用户一行，存全部打卡数据（便于同步）
create table if not exists public.user_data (
  id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{"dailyBeautyGoal":100,"dailyUglyGoal":0,"dailyWellnessGoal":0}',
  exercises jsonb not null default '[]',
  ugly_behaviors jsonb not null default '[]',
  wellness_behaviors jsonb not null default '[]',
  entries jsonb not null default '[]',
  ugly_entries jsonb not null default '[]',
  wellness_entries jsonb not null default '[]',
  pleasure_entries jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- 仅允许用户读写自己的行
alter table public.user_data enable row level security;

create policy "user_data_select_own"
  on public.user_data for select
  using (auth.uid() = id);

create policy "user_data_insert_own"
  on public.user_data for insert
  with check (auth.uid() = id);

create policy "user_data_update_own"
  on public.user_data for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 注册后自动插入一行默认数据（可选）
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_data (id, settings, exercises, ugly_behaviors, wellness_behaviors, entries, ugly_entries, wellness_entries, pleasure_entries)
  values (
    new.id,
    '{"dailyBeautyGoal":100,"dailyUglyGoal":0,"dailyWellnessGoal":0}'::jsonb,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 3. 本机环境变量

在项目根目录新建 `.env`（不要提交到 git），内容：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的 anon public key
```

构建/开发时会读取这两个变量。部署到 GitHub Pages 时：在仓库 **Settings → Secrets and variables → Actions** 里添加 **Variables** `VITE_SUPABASE_URL`（你的 Project URL）和 **Secrets** `VITE_SUPABASE_ANON_KEY`（anon key）， workflow 会在构建时传入。

## 4. 启用邮箱登录

在 Supabase 项目 **Authentication → Providers** 中启用 **Email**，如需邮箱验证可关闭 “Confirm email” 以便本地测试。
