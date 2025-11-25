# 🚀 מדריך Postman - רישום מיקרו-שירותים

## שלב 1: הפעלת השרות

ראשית, ודא שהשרות רץ:

```bash
cd services/coordinator
npm start
```

השרות אמור לרוץ על `http://localhost:3000`

---

## שלב 2: הגדרת Postman

### א. יצירת Request חדש

1. פתח את **Postman**
2. לחץ על **"New"** → **"HTTP Request"**
3. שנה את השם ל: `Register Microservice`

### ב. הגדרת ה-Request

**Method:** `POST`  
**URL:** `http://localhost:3000/register`

### ג. הגדרת Headers

לחץ על הטאב **"Headers"** והוסף:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

> **אופציונלי:** אם Team 4 הוסיף JWT, הוסף גם:
> | `Authorization` | `Bearer <your-jwt-token>` |

### ד. הגדרת Body

1. לחץ על הטאב **"Body"**
2. בחר **"raw"**
3. בחר **"JSON"** מהרשימה הנפתחת
4. הדבק את ה-JSON הבא:

---

## דוגמאות לרישום מיקרו-שירותים

### דוגמה 1: User Service (שירות משתמשים)

```json
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3001",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["users", "profiles", "sessions"],
    "migrations": [
      {
        "version": "001",
        "name": "create_users_table"
      }
    ]
  }
}
```

### דוגמה 2: Product Service (שירות מוצרים)

```json
{
  "serviceName": "product-service",
  "version": "2.1.0",
  "endpoint": "http://localhost:3002",
  "healthCheck": "/api/health",
  "migrationFile": {
    "schema": "v2",
    "tables": ["products", "categories", "inventory"],
    "features": ["search", "filtering", "pagination"]
  }
}
```

### דוגמה 3: Order Service (שירות הזמנות)

```json
{
  "serviceName": "order-service",
  "version": "1.5.3",
  "endpoint": "http://localhost:3003",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1.5",
    "tables": ["orders", "order_items", "payments"],
    "apiVersion": "v1"
  }
}
```

### דוגמה 4: מינימלית (רק שדות חובה)

```json
{
  "serviceName": "simple-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3004"
}
```

---

## שלב 3: שליחת ה-Request

1. לחץ על **"Send"**
2. בדוק את ה-Response

### Response מוצלח (Status: 201 Created)

```json
{
  "success": true,
  "message": "Service registered successfully",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000"
```

> **שמור את ה-`serviceId`** - תצטרך אותו לבדיקות מאוחרות יותר!

### Response עם שגיאה (Status: 400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "serviceName is required and must be a non-empty string",
    "endpoint must be a valid URL"
  ]
}
```

---

## שלב 4: בדיקת הרישום

### א. בדיקה דרך Postman - GET /services

יצור Request חדש:

**Method:** `GET`  
**URL:** `http://localhost:3000/services`

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "serviceName": "user-service",
      "version": "1.0.0",
      "endpoint": "http://localhost:3001",
      "status": "active",
      "registeredAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### ב. בדיקה דרך Postman - GET /health

**Method:** `GET`  
**URL:** `http://localhost:3000/health`

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "registeredServices": 3
}
```

---

## טיפים ל-Postman

### 1. שמירת Collection

1. לחץ על **"Save"**
2. צור Collection חדש: `Coordinator API`
3. שמור את כל ה-Requests באותו Collection

### 2. שימוש ב-Variables

במקום לכתוב `http://localhost:3000` כל פעם:

1. לחץ על ה-**"..."** ליד Collection
2. בחר **"Edit"**
3. לך ל-**"Variables"**
4. הוסף:
   - `base_url` = `http://localhost:3000`
5. בשימוש: `{{base_url}}/register`

### 3. Pre-request Script (ל-JWT)

אם Team 4 הוסיף JWT, אפשר להוסיף Pre-request Script:

```javascript
// Get JWT token (example)
const token = pm.environment.get("jwt_token");
pm.request.headers.add({
    key: "Authorization",
    value: `Bearer ${token}`
});
```

---

## בדיקות נוספות

### 1. רישום עם שגיאות (לבדיקת Validation)

**שגיאה 1: חסר serviceName**
```json
{
  "version": "1.0.0",
  "endpoint": "http://localhost:3001"
}
```

**שגיאה 2: URL לא תקין**
```json
{
  "serviceName": "test",
  "version": "1.0.0",
  "endpoint": "not-a-valid-url"
}
```

### 2. בדיקת Metrics

**Method:** `GET`  
**URL:** `http://localhost:3000/metrics`

תראה את כל ה-Metrics בפורמט Prometheus.

---

## סדר פעולות מומלץ

1. ✅ הפעל את השרות (`npm start`)
2. ✅ בדוק Health: `GET /health`
3. ✅ רשום שירות ראשון: `POST /register`
4. ✅ בדוק את הרישום: `GET /services`
5. ✅ רשום שירותים נוספים
6. ✅ בדוק Metrics: `GET /metrics`

---

## פתרון בעיות

### שגיאה: "Cannot connect"
- ודא שהשרות רץ (`npm start`)
- בדוק שהפורט נכון (3000)
- בדוק את ה-URL ב-Postman

### שגיאה: "Validation failed"
- ודא ש-`Content-Type` הוא `application/json`
- בדוק שכל השדות החובה קיימים
- ודא שה-URL תקין (מתחיל ב-`http://` או `https://`)

### שגיאה: "Internal server error"
- בדוק את הלוגים של השרות
- ודא שכל ה-Dependencies מותקנים (`npm install`)

---

**בהצלחה! 🎉**


