# 📝 דוגמאות שירותים לרישום - Knowledge Graph

דוגמאות שירותים עם schemas ו-tables משותפים כדי לראות קשרים ב-Knowledge Graph.

---

## דוגמה 1: User Service (שירות משתמשים)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3001",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["users", "profiles", "user_preferences"],
    "description": "Handles user management, profiles, and preferences"
  }
}
```

---

## דוגמה 2: Auth Service (שירות אימות)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "auth-service",
  "version": "1.2.0",
  "endpoint": "http://localhost:3002",
  "healthCheck": "/api/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["sessions", "tokens", "users"],
    "description": "Handles authentication, sessions, and tokens"
  }
}
```

**קשר:** יש `users` table משותף עם `user-service` → יוצר edge!

---

## דוגמה 3: Product Service (שירות מוצרים)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "product-service",
  "version": "2.1.0",
  "endpoint": "http://localhost:3003",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v2",
    "tables": ["products", "categories", "inventory", "reviews"],
    "description": "Handles product catalog, inventory, and reviews"
  }
}
```

---

## דוגמה 4: Order Service (שירות הזמנות)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "order-service",
  "version": "1.5.3",
  "endpoint": "http://localhost:3004",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v2",
    "tables": ["orders", "order_items", "users", "products"],
    "description": "Handles order processing and order items"
  }
}
```

**קשרים:**
- `users` table משותף עם `user-service` → edge!
- `products` table משותף עם `product-service` → edge!
- `v2` schema משותף עם `product-service` → edge!

---

## דוגמה 5: Payment Service (שירות תשלומים)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "payment-service",
  "version": "2.0.0",
  "endpoint": "http://localhost:3005",
  "healthCheck": "/api/health",
  "migrationFile": {
    "schema": "v2",
    "tables": ["payments", "transactions", "orders"],
    "description": "Handles payment processing and transactions"
  }
}
```

**קשרים:**
- `orders` table משותף עם `order-service` → edge!
- `v2` schema משותף עם `product-service` ו-`order-service` → edges!

---

## דוגמה 6: Notification Service (שירות התראות)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "notification-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3006",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["notifications", "user_notifications", "users"],
    "description": "Handles notifications and messaging"
  }
}
```

**קשרים:**
- `users` table משותף עם `user-service` ו-`auth-service` → edges!
- `v1` schema משותף עם `user-service` ו-`auth-service` → edges!

---

## דוגמה 7: Analytics Service (שירות אנליטיקה)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "analytics-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3007",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v3",
    "tables": ["events", "metrics", "user_events"],
    "description": "Handles analytics and event tracking"
  }
}
```

---

## דוגמה 8: Search Service (שירות חיפוש)

```json
POST http://localhost:3000/register
Content-Type: application/json

{
  "serviceName": "search-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3008",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v2",
    "tables": ["search_index", "products", "categories"],
    "description": "Handles search functionality"
  }
}
```

**קשרים:**
- `products` ו-`categories` tables משותפים עם `product-service` → edge!
- `v2` schema משותף עם `product-service`, `order-service`, `payment-service` → edges!

---

## סדר מומלץ לרישום

1. **user-service** - בסיס
2. **auth-service** - קשור ל-user-service
3. **product-service** - עצמאי
4. **order-service** - קשור ל-user-service ו-product-service
5. **payment-service** - קשור ל-order-service
6. **notification-service** - קשור ל-user-service
7. **search-service** - קשור ל-product-service

---

## אחרי הרישום - בדוק את ה-Knowledge Graph

```bash
GET http://localhost:3000/knowledge-graph
```

**תראה:**
- **Nodes:** כל השירותים
- **Edges:** קשרים בין שירותים עם אותו schema או tables משותפים
- **Relationships:** קשרים מפורטים עם סיבות
- **Schemas:** קיבוץ שירותים לפי schema

---

## דוגמה לתוצאה צפויה

אחרי רישום כל השירותים, תראה:

```json
{
  "knowledgeGraph": {
    "metadata": {
      "totalServices": 7,
      "activeServices": 7
    },
    "nodes": [7 שירותים],
    "edges": [
      {
        "from": "user-service-id",
        "to": "auth-service-id",
        "type": "data_related",
        "label": "shared_tables: users"
      },
      {
        "from": "order-service-id",
        "to": "user-service-id",
        "type": "data_related",
        "label": "shared_tables: users"
      },
      {
        "from": "order-service-id",
        "to": "product-service-id",
        "type": "schema_related, data_related",
        "label": "shared_schema, shared_tables: products"
      }
      // ועוד...
    ],
    "relationships": [
      {
        "from": "user-service",
        "to": "auth-service",
        "type": "data_related",
        "reason": ["shared_tables: users"],
        "weight": 2
      }
      // ועוד...
    ],
    "schemas": {
      "v1": {
        "services": ["user-service", "auth-service", "notification-service"],
        "tables": ["users", "profiles", "sessions", "tokens", "notifications"]
      },
      "v2": {
        "services": ["product-service", "order-service", "payment-service", "search-service"],
        "tables": ["products", "categories", "orders", "payments", "transactions"]
      }
    }
  }
}
```

---

## טיפים

1. **רשום לפי הסדר** - זה עוזר לראות את הקשרים נבנים
2. **בדוק אחרי כל רישום** - `GET /knowledge-graph` לראות את העדכונים
3. **שימו לב ל-schemas** - שירותים עם אותו schema יוצרים קשרים
4. **שימו לב ל-tables** - tables משותפים יוצרים קשרים חזקים יותר

---

**מוכן!** 🚀 עכשיו תוכל לראות Knowledge Graph עשיר עם קשרים מעניינים!


