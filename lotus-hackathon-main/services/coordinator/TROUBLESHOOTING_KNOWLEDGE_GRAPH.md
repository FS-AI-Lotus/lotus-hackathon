# 🔧 פתרון בעיות - Knowledge Graph לא מתעדכן

## בדיקה מהירה

### 1. בדוק שהטבלה קיימת ב-Supabase

1. לך ל-Supabase Dashboard
2. Table Editor
3. בדוק אם יש טבלה בשם `knowledge_graph`

**אם אין:**
- לך ל-SQL Editor
- העתק את התוכן מ-`supabase-knowledge-graph-schema.sql`
- הרץ את ה-SQL

---

### 2. בדוק את הלוגים

בהלוגים של השרות, חפש:
- `Rebuilding knowledge graph`
- `Knowledge graph saved to Supabase`
- `Failed to save knowledge graph` ← אם אתה רואה את זה, יש בעיה

---

### 3. Rebuild ידני

נסה לבנות את ה-Graph ידנית:

**Postman:**
```
POST http://localhost:3000/knowledge-graph/rebuild
```

**cURL:**
```bash
curl -X POST http://localhost:3000/knowledge-graph/rebuild
```

**Response מוצלח:**
```json
{
  "success": true,
  "message": "Knowledge graph rebuilt successfully",
  "graph": {
    "version": 1,
    "totalServices": 3,
    "relationships": 2
  }
}
```

---

## פתרונות נפוצים

### בעיה 1: הטבלה לא קיימת

**פתרון:**
1. לך ל-Supabase SQL Editor
2. הרץ את ה-SQL מ-`supabase-knowledge-graph-schema.sql`
3. הפעל מחדש את השרות

---

### בעיה 2: RLS חוסם את הכתיבה

**פתרון:**
ב-Supabase SQL Editor, הרץ:

```sql
-- בדוק את ה-policies
SELECT * FROM pg_policies WHERE tablename = 'knowledge_graph';

-- אם צריך, שנה את ה-policy
DROP POLICY IF EXISTS "Allow all operations for knowledge graph" ON knowledge_graph;

CREATE POLICY "Allow all operations for knowledge graph" 
  ON knowledge_graph
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

### בעיה 3: Graph לא מתעדכן אחרי רישום

**פתרון:**
1. בדוק את הלוגים - יש שגיאות?
2. נסה rebuild ידני: `POST /knowledge-graph/rebuild`
3. בדוק שהשירותים נרשמו בהצלחה: `GET /services`

---

### בעיה 4: Graph נשמר אבל לא בטבלה

**פתרון:**
1. בדוק ב-Supabase Table Editor → `knowledge_graph`
2. אם ריק, נסה rebuild ידני
3. בדוק את הלוגים לשגיאות

---

## בדיקות שלב אחר שלב

### שלב 1: בדוק שהטבלה קיימת
```sql
-- ב-Supabase SQL Editor
SELECT * FROM knowledge_graph LIMIT 1;
```

אם יש שגיאה "relation does not exist" → הרץ את ה-SQL schema.

---

### שלב 2: בדוק שהשירותים נרשמו
```bash
GET http://localhost:3000/services
```

אם ריק → רשום שירותים קודם.

---

### שלב 3: Rebuild ידני
```bash
POST http://localhost:3000/knowledge-graph/rebuild
```

בדוק את הלוגים - אמור להיות:
```
Rebuilding knowledge graph
Rebuilding graph with X services
Knowledge graph saved to Supabase
```

---

### שלב 4: בדוק ב-Supabase
1. Table Editor → `knowledge_graph`
2. תראה רשומות עם `graph_data` (JSONB)
3. ה-`version` אמור להתעדכן

---

## Debug Endpoints

### 1. Rebuild ידני
```
POST http://localhost:3000/knowledge-graph/rebuild
```

### 2. Get Graph (עם rebuild)
```
GET http://localhost:3000/knowledge-graph?rebuild=true
```

### 3. בדוק שירותים
```
GET http://localhost:3000/services
```

---

## אם עדיין לא עובד

1. **בדוק את הלוגים** - יש שגיאות?
2. **בדוק ב-Supabase** - הטבלה קיימת?
3. **נסה rebuild ידני** - `POST /knowledge-graph/rebuild`
4. **הפעל מחדש** את השרות
5. **בדוק את ה-credentials** - Supabase מוגדר נכון?

---

**אם עדיין יש בעיה**, שלח את הלוגים ואני אעזור!


