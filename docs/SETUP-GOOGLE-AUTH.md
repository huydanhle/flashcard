# Fix "Unsupported provider: provider is not enabled"

That error means **Google is not enabled** in your Supabase project. Do this once:

---

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select (or create) a project.
2. Open **APIs & Services** → **Credentials**.
3. Click **Create Credentials** → **OAuth client ID**.
4. If asked, configure the **OAuth consent screen** (External, add your email as test user).
5. Application type: **Web application**.
6. Under **Authorized redirect URIs** you must add **Supabase’s callback** (Google redirects to Supabase first, not to your app):
   ```
   https://xkcgyvuudspqfoogdanp.supabase.co/auth/v1/callback
   ```
   *(Use your real Supabase project ref if different. Do **not** use `http://localhost:3000/auth/callback` here — that goes in Supabase URL Configuration, not in Google’s redirect list.)*
7. You can keep `http://localhost:3000` under **Authorized JavaScript origins** if you use it. Click **Create** (or **Save** if editing) and copy the **Client ID** and **Client Secret**.

---

## 2. Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com) → your project.
2. Left sidebar: **Authentication** → **Providers**.
3. Find **Google** and turn the toggle **ON**.
4. Paste the **Client ID** and **Client Secret** from step 1.
5. Click **Save**.

---

## 3. Redirect URLs (Supabase)

1. In the same project: **Authentication** → **URL Configuration**.
2. **Site URL**: e.g. `http://localhost:3000` for local dev.
3. Under **Redirect URLs** add:
   - `http://localhost:3000/auth/callback`
   - (When you deploy, add your production URL too, e.g. `https://yourdomain.com/auth/callback`.)

---

## 4. Try again

Refresh your app and click **Continue with Google** again. The error should be gone once Google is enabled and the credentials are saved.
