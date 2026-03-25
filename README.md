# Lognum 🎮

A mobile-first PWA with two number-guessing games — installable on your home screen.

**Developed by Logithaa G**

---

## Games

### 🔢 Number Quest
- Set any range (e.g. 1–1000)
- Temperature hints: 🔥 Hot, 🌤️ Warm, 🧊 Cool, ❄️ Cold
- **Solo** (you vs computer) + **2 Player** (real-time via room code)

### 🐂 Bulls & Cows
- Crack a 4-digit code with no repeated digits
- 🐂 Bull = right digit, right position
- 🐄 Cow = right digit, wrong position
- **Solo** (competitive duel vs AI) + **2 Player** (real-time via room code)

---

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial Lognum commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/lognum.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework: **Vite** (auto-detected)
4. Click **Deploy** ✅

### Step 3 — Enable 2-Player Mode (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy your Project URL and anon key
4. In Vercel → your project → **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://xxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
5. **Redeploy** the project

### Step 4 — Enable Realtime in Supabase
Go to **Database → Replication** in your Supabase dashboard and enable the `rooms` table for realtime.

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in Supabase creds
npm run dev
```

---

## Install as App (PWA)

- **Android**: Open in Chrome → tap menu → "Add to Home Screen"
- **iOS**: Open in Safari → tap Share → "Add to Home Screen"
- **Desktop**: Click the install icon in the browser address bar

---

## Tech Stack
- React 18 + React Router
- Vite + vite-plugin-pwa
- Supabase (real-time multiplayer)
- Pure CSS with CSS variables (no Tailwind)
- Fredoka + Space Mono fonts
