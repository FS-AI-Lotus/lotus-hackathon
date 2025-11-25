# 🗄️ Supabase Setup Guide for Coordinator

מדריך להגדרת Supabase לשמירת השירותים הרשומים במקום אחסון בזיכרון.

## למה Supabase?

- ✅ **Persistent Storage** - הנתונים נשמרים גם אחרי restart
- ✅ **Scalable** - יכול לטפל בהרבה שירותים
- ✅ **Real-time** - אפשר להוסיף real-time updates בעתיד
- ✅ **Free Tier** - יש tier חינמי לפרויקטים קטנים
- ✅ **PostgreSQL** - מבוסס על PostgreSQL, חזק ואמין

## שלב 1: יצירת פרויקט Supabase

1. לך ל-[https://supabase.com](https://supabase.com)
2. היכנס או צור חשבון
3. לחץ על **"New Project"**
4. מלא את הפרטים:
   - **Name**: `coordinator-registry` (או שם אחר)
   - **Database Password**: בחר סיסמה חזקה (שמור אותה!)
   - **Region**: בחר את האזור הקרוב אליך
5. לחץ **"Create new project"**
6. חכה כמה דקות עד שהפרויקט מוכן

## שלב 2: יצירת הטבלה

1. בפרויקט Supabase, לך ל-**SQL Editor**
2. לחץ על **"New Query"**
3. העתק את כל התוכן מ-`supabase-schema.sql`
4. הדבק ב-SQL Editor
5. לחץ **"Run"** (או F5)

✅ הטבלה `registered_services` נוצרה!

## שלב 3: קבלת Credentials

1. בפרויקט Supabase, לך ל-**Settings** → **API**
2. מצא את:
   - **Project URL** (משהו כמו: `https://xxxxx.supabase.co`)
   - **anon/public key** (מפתח ארוך שמתחיל ב-`eyJ...`)

**או** אם אתה רוצה הרשאות מלאות:
   - **service_role key** (מפתח ארוך, **זהירות - זה חזק יותר!**)

## שלב 4: הגדרת Environment Variables

הוסף ל-`.env` שלך:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**או** אם אתה משתמש ב-service_role (לא מומלץ ל-production אלא אם אתה יודע מה אתה עושה):

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## שלב 5: התקנת Dependencies

```bash
cd services/coordinator
npm install
```

זה יתקין את `@supabase/supabase-js` אוטומטית.

## שלב 6: הפעלה מחדש

```bash
npm start
```

בהלוגים תראה:
```
RegistryService initialized with Supabase
```

אם אתה רואה:
```
RegistryService initialized with in-memory storage (Supabase not configured)
```

זה אומר שה-credentials לא הוגדרו נכון.

## בדיקה

### 1. רשום שירות חדש

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-service",
    "version": "1.0.0",
    "endpoint": "http://localhost:3001",
    "healthCheck": "/health",
    "migrationFile": {}
  }'
```

### 2. בדוק ב-Supabase

1. לך ל-**Table Editor** ב-Supabase
2. בחר את הטבלה `registered_services`
3. תראה את השירות שנרשם! 🎉

### 3. בדוק דרך API

```bash
curl http://localhost:3000/services
```

תראה את כל השירותים שנשמרו ב-Supabase.

## Fallback Behavior

אם Supabase לא מוגדר או לא זמין:
- ✅ השרות יעבוד עם in-memory storage
- ✅ לא תהיה שגיאה
- ✅ הלוגים יציינו שזה משתמש ב-in-memory

## Row Level Security (RLS)

הטבלה נוצרת עם RLS מופעל. אם אתה רוצה:

### אפשר גישה ציבורית לקריאה בלבד:

```sql
-- ב-SQL Editor של Supabase
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON registered_services;

CREATE POLICY "Public read access" 
  ON registered_services
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write access" 
  ON registered_services
  FOR INSERT
  USING (true)
  WITH CHECK (true);
```

### או כבה RLS לחלוטין (לא מומלץ ל-production):

```sql
ALTER TABLE registered_services DISABLE ROW LEVEL SECURITY;
```

## Troubleshooting

### ❌ "RegistryService initialized with in-memory storage"
- בדוק ש-`SUPABASE_URL` ו-`SUPABASE_ANON_KEY` מוגדרים ב-`.env`
- ודא שאין שגיאות כתיב
- הפעל מחדש את השרות

### ❌ "Failed to register service: new row violates row-level security policy"
- RLS חוסם את הכתיבה
- שנה את ה-policies ב-Supabase (ראה למעלה)
- או השתמש ב-`SUPABASE_SERVICE_ROLE_KEY` במקום `SUPABASE_ANON_KEY`

### ❌ "relation 'registered_services' does not exist"
- הטבלה לא נוצרה
- הרץ את ה-SQL מ-`supabase-schema.sql` שוב

### ❌ "invalid input syntax for type uuid"
- בדוק שה-`id` הוא UUID תקין
- הקוד יוצר UUID אוטומטית, אז זה לא אמור לקרות

## Railway Deployment

כשאתה מפריס ל-Railway:

1. לך ל-Railway Dashboard
2. בחר את השרות `coordinator`
3. לך ל-**Variables**
4. הוסף:
   - `SUPABASE_URL` = ה-URL מ-Supabase
   - `SUPABASE_ANON_KEY` = ה-anon key מ-Supabase
5. שמור ו-redeploy

## Security Notes

⚠️ **אבטחה:**
- `SUPABASE_ANON_KEY` בטוח לשימוש בצד הלקוח (עם RLS)
- `SUPABASE_SERVICE_ROLE_KEY` **חזק מאוד** - אל תשתף אותו!
- השתמש ב-RLS policies כדי להגביל גישה
- אל תעלה את ה-keys ל-Git

---

**מוכן!** 🚀 עכשיו השירותים נשמרים ב-Supabase במקום בזיכרון.


