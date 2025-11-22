# 📊 Knowledge Graph Persistent Storage - Setup Guide

## מה נוסף?

עכשיו ה-Knowledge Graph **נשמר ב-Supabase** ומתעדכן אוטומטית!

### תכונות חדשות:
- ✅ **שמירה ב-Supabase** - ה-Graph נשמר בטבלה `knowledge_graph`
- ✅ **עדכון אוטומטי** - מתעדכן כל פעם ששירות נרשם/מתעדכן
- ✅ **Cache** - נטען מהר מה-cache או Supabase
- ✅ **שימוש ב-Routing** - ה-AI routing משתמש ב-Graph השמור
- ✅ **Fallback Routing** - משתמש ב-Graph גם כש-OpenAI לא זמין

---

## שלב 1: יצירת הטבלה ב-Supabase

1. לך ל-Supabase Dashboard
2. SQL Editor → New Query
3. העתק את כל התוכן מ-`supabase-knowledge-graph-schema.sql`
4. הרץ את ה-SQL

✅ הטבלה `knowledge_graph` נוצרה!

---

## שלב 2: הפעלה מחדש

```bash
cd services/coordinator
npm start
```

בהלוגים תראה:
```
Knowledge graph initialized on startup
Knowledge graph saved to Supabase
```

---

## איך זה עובד?

### 1. בעת הפעלה:
- השרות בונה את ה-Graph מכל השירותים
- שומר אותו ב-Supabase
- שומר גם ב-cache (30 שניות)

### 2. כששירות נרשם:
- השירות נשמר ב-`registered_services`
- ה-Graph מתעדכן אוטומטית
- נשמר ב-Supabase עם version חדש

### 3. כשמבקשים routing:
- ה-AI routing משתמש ב-Graph השמור
- Fallback routing משתמש ב-Graph למציאת שירותים
- מהיר יותר כי לא צריך לבנות מחדש

---

## API Endpoints

### GET /knowledge-graph
מחזיר את ה-Graph השמור (מה-cache או Supabase)

**Query Parameters:**
- `?rebuild=true` - מכריח rebuild (לא משתמש ב-cache)

**Response:**
```json
{
  "success": true,
  "knowledgeGraph": {
    "metadata": {
      "totalServices": 3,
      "activeServices": 3,
      "lastUpdated": "...",
      "version": 5
    },
    "nodes": [...],
    "edges": [...],
    "schemas": {...},
    "relationships": [...]
  }
}
```

---

## איפה לראות את ה-Graph?

### 1. ב-Supabase Dashboard:
- **Table Editor** → `knowledge_graph`
- תראה את כל ה-versions של ה-Graph
- ה-`graph_data` (JSONB) מכיל את כל המידע

### 2. דרך API:
```
GET http://localhost:3000/knowledge-graph
```

### 3. ב-Routing:
ה-Graph משמש אוטומטית ב:
- `POST /route` - AI routing
- Fallback routing (כש-OpenAI לא זמין)

---

## יתרונות

### לפני:
- ❌ Graph נבנה כל פעם מחדש
- ❌ איטי יותר
- ❌ לא נשמר

### עכשיו:
- ✅ Graph נשמר ב-Supabase
- ✅ מהיר יותר (cache)
- ✅ מתעדכן אוטומטית
- ✅ משמש ל-routing decisions
- ✅ Versioning (כל עדכון = version חדש)

---

## בדיקה

### 1. רשום שירות חדש:
```bash
POST /register
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3001",
  "migrationFile": {
    "schema": "v1",
    "tables": ["users"]
  }
}
```

### 2. בדוק ב-Supabase:
- Table Editor → `knowledge_graph`
- תראה version חדש עם ה-Graph המעודכן

### 3. בדוק את ה-Graph:
```bash
GET /knowledge-graph
```

תראה את השירות החדש ב-nodes וב-relationships.

---

## Troubleshooting

### ❌ "relation 'knowledge_graph' does not exist"
- הרץ את ה-SQL מ-`supabase-knowledge-graph-schema.sql`

### ❌ Graph לא מתעדכן
- בדוק את הלוגים - יש שגיאות?
- נסה `GET /knowledge-graph?rebuild=true` כדי לכפות rebuild

### ❌ Routing לא משתמש ב-Graph
- זה אמור לעבוד אוטומטית
- בדוק שהטבלה קיימת ב-Supabase

---

**מוכן!** 🚀 עכשיו ה-Knowledge Graph נשמר ומשמש לכל הבקשות!


