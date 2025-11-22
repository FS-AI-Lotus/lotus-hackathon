# 📋 **מדריך מלא ל-ENDPOINTS של מערכת הקואורדינטור**

## 🌐 **סקירה כללית**

המערכת תומכת ב-**שני פרוטוקולים:**
- **HTTP REST API** (פורט 3001)
- **gRPC API** (פורט 50051)

---

## 🔗 **HTTP REST ENDPOINTS**

### **🏠 Root Endpoint**
```http
GET /
```
**תיאור:** מידע בסיסי על השירות וכל ה-endpoints הזמינים
**תגובה:**
```json
{
  "service": "Coordinator Microservice",
  "version": "1.0.0", 
  "status": "running",
  "endpoints": { ... }
}
```

---

### **📝 1. Service Registration (רישום שירותים)**

#### **שלב 1: רישום בסיסי**
```http
POST /register
Content-Type: application/json

{
  "serviceName": "payment-service",
  "version": "1.0.0",
  "endpoint": "http://payment-service:5000",
  "healthCheck": "/health"
}
```

#### **שלב 2: העלאת Migration File**
```http
POST /register/{serviceId}/migration
Content-Type: application/json

{
  "migrationFile": {
    "capabilities": ["process_payments", "refunds"],
    "endpoints": {
      "process": "/api/payments/process",
      "refund": "/api/payments/refund"
    },
    "description": "Payment processing service"
  }
}
```

---

### **🧠 2. AI Routing (ניתוב חכם)**

#### **ניתוב ידני**
```http
POST /route
Content-Type: application/json

{
  "query": "process payment for order 123",
  "routing": {
    "strategy": "single",
    "priority": "accuracy"
  }
}
```

#### **קבלת מידע ניתוב**
```http
GET /route
```

---

### **🔍 3. Service Discovery (גילוי שירותים)**

#### **רשימת כל השירותים**
```http
GET /services
GET /registry  # Alias
```

**תגובה:**
```json
{
  "success": true,
  "services": [
    {
      "serviceId": "uuid",
      "serviceName": "payment-service",
      "endpoint": "http://payment-service:5000",
      "status": "active",
      "version": "1.0.0"
    }
  ],
  "total": 1
}
```

---

### **🕸️ 4. Knowledge Graph (גרף ידע)**

#### **קבלת גרף הידע**
```http
GET /knowledge-graph
GET /graph  # Alias

# Force rebuild
GET /knowledge-graph?rebuild=true
```

#### **בנייה מחדש של הגרף**
```http
POST /knowledge-graph/rebuild
```

---

### **🎨 5. UI/UX Configuration**

#### **קבלת הגדרות UI/UX**
```http
GET /uiux
```

#### **עדכון הגדרות UI/UX**
```http
POST /uiux
Content-Type: application/json

{
  "config": {
    "theme": "dark",
    "layout": "grid",
    "features": ["search", "filters"]
  }
}
```

---

### **📊 6. Changelog (יומן שינויים)**

#### **קבלת יומן שינויים**
```http
GET /changelog
GET /changelog?page=1&limit=50&type=registration
```

#### **סטטיסטיקות יומן**
```http
GET /changelog/stats
```

#### **חיפוש ביומן**
```http
GET /changelog/search?q=payment&limit=20
```

#### **ניקוי יומן (Admin)**
```http
POST /changelog/cleanup
Content-Type: application/json

{
  "keepCount": 500
}
```

---

### **📋 7. Schema Registry (רישום סכמות)**

#### **רשימת כל הסכמות**
```http
GET /schemas
```

#### **סכמות של שירות ספציפי**
```http
GET /schemas/{serviceId}
```

#### **סכמה ספציפית**
```http
GET /schemas/{serviceId}/{schemaType}?version=latest
```

#### **אימות נתונים מול סכמה**
```http
POST /schemas/{serviceId}/validate
Content-Type: application/json

{
  "data": { ... },
  "schemaType": "request",
  "schemaName": "ProcessPayment"
}
```

#### **השוואת גרסאות סכמה**
```http
GET /schemas/{serviceId}/compare/{version1}/{version2}
```

---

### **💊 8. Health & Monitoring**

#### **בדיקת בריאות**
```http
GET /health
```

**תגובה:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "registeredServices": 5
}
```

#### **מטריקות Prometheus**
```http
GET /metrics
```

---

### **🔄 9. Proxy (פרוקסי חכם)**

**כל הבקשות שלא תואמות endpoints של הקואורדינטור עוברות דרך AI routing:**

```http
GET /api/payments/user/123    # → Routes to payment-service
POST /api/users/profile       # → Routes to user-service  
PUT /api/inventory/update     # → Routes to inventory-service
```

---

## 🔌 **gRPC ENDPOINTS**

### **📡 Coordinator Service (rag.v1)**

```protobuf
service CoordinatorService {
  rpc Route (RouteRequest) returns (RouteResponse);
}
```

#### **Route RPC**
```javascript
// gRPC Call
const request = {
  tenant_id: "tenant-123",
  user_id: "user-456", 
  query_text: "process payment for order 789",
  metadata: {
    source: "rag",
    priority: "high"
  }
};

const response = await client.Route(request);
```

**תגובה:**
```javascript
{
  target_services: ["payment-service"],
  normalized_fields: {
    "order_id": "789",
    "action": "process_payment"
  },
  envelope_json: "{ Universal Envelope JSON }",
  routing_metadata: "{ routing info }"
}
```

---

## 🔧 **Universal Envelope Format**

**פורמט אחיד לכל הפרוטוקולים:**

```json
{
  "version": "1.0",
  "timestamp": "2025-11-22T02:30:00Z",
  "request_id": "req-uuid-123",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "source": "coordinator",
  "payload": {
    "query": "process payment for order 789",
    "metadata": {},
    "context": {}
  }
}
```

---

## 🚀 **דוגמאות שימוש**

### **1. רישום שירות חדש (דו-שלבי)**

```bash
# שלב 1: רישום בסיסי
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "notification-service",
    "version": "1.0.0", 
    "endpoint": "http://notification:5000",
    "healthCheck": "/health"
  }'

# תגובה: {"success": true, "serviceId": "uuid-123"}

# שלב 2: העלאת migration
curl -X POST http://localhost:3001/register/uuid-123/migration \
  -H "Content-Type: application/json" \
  -d '{
    "migrationFile": {
      "capabilities": ["send_email", "send_sms"],
      "endpoints": {
        "email": "/api/notifications/email",
        "sms": "/api/notifications/sms"
      }
    }
  }'
```

### **2. ניתוב חכם**

```bash
# HTTP Routing
curl -X POST http://localhost:3001/route \
  -H "Content-Type: application/json" \
  -d '{
    "query": "send email notification to customer",
    "routing": {"strategy": "single"}
  }'

# תגובה: מציאת notification-service
```

### **3. גילוי שירותים**

```bash
# רשימת שירותים פעילים
curl http://localhost:3001/services

# גרף ידע
curl http://localhost:3001/knowledge-graph
```

### **4. בדיקת gRPC עם grpcurl**

```bash
# Test gRPC Route endpoint
grpcurl -plaintext \
  -d '{
    "tenant_id": "test-tenant",
    "user_id": "test-user",
    "query_text": "process payment for order 123",
    "metadata": {"source": "rag"}
  }' \
  localhost:50051 \
  rag.v1.CoordinatorService/Route
```

### **5. Schema Registry**

```bash
# Get all schemas
curl http://localhost:3001/schemas

# Validate data against schema
curl -X POST http://localhost:3001/schemas/payment-service/validate \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"amount": 100, "currency": "USD"},
    "schemaType": "request",
    "schemaName": "ProcessPayment"
  }'
```

### **6. Changelog Operations**

```bash
# Get recent changes
curl http://localhost:3001/changelog?limit=10

# Search changelog
curl "http://localhost:3001/changelog/search?q=payment&limit=5"

# Get statistics
curl http://localhost:3001/changelog/stats
```

---

## 📊 **סיכום Endpoints**

| **קטגוריה** | **Endpoints** | **פעולות** |
|-------------|---------------|-------------|
| **Registration** | `/register` | רישום דו-שלבי |
| **AI Routing** | `/route` | ניתוב חכם |
| **Discovery** | `/services`, `/registry` | גילוי שירותים |
| **Knowledge** | `/knowledge-graph`, `/graph` | גרף ידע |
| **UI/UX** | `/uiux` | הגדרות ממשק |
| **Changelog** | `/changelog` | יומן שינויים |
| **Schemas** | `/schemas` | ניהול סכמות |
| **Health** | `/health`, `/metrics` | מוניטורינג |
| **Proxy** | `/*` | פרוקסי חכם |
| **gRPC** | `Route()` | ניתוב gRPC |

---

## 🎯 **נקודות מפתח**

### **✅ יכולות המערכת:**
- **Dual-Protocol:** HTTP + gRPC
- **AI-Powered Routing:** ניתוב חכם מבוסס OpenAI
- **Two-Stage Registration:** רישום דו-שלבי
- **Universal Envelope:** פורמט אחיד
- **Schema Registry:** ניהול סכמות
- **Knowledge Graph:** גרף ידע דינמי
- **Smart Proxy:** פרוקסי חכם לכל הבקשות

### **🔄 זרימת עבודה:**
1. **רישום שירותים** → דו-שלבי עם migration files
2. **AI routing** → ניתוח חכם של בקשות
3. **Service discovery** → גילוי אוטומטי של שירותים
4. **Smart proxy** → ניתוב אוטומטי של כל הבקשות

### **🚀 פרוטוקולים נתמכים:**
- **HTTP REST:** כל ה-endpoints הסטנדרטיים
- **gRPC:** Route RPC עבור RAG integration
- **Universal Envelope:** פורמט JSON אחיד לשני הפרוטוקולים

### **🔧 תכונות מתקדמות:**
- **AI-Powered Routing:** שימוש ב-OpenAI לניתוב חכם
- **Fallback Routing:** ניתוב מבוסס מילות מפתח כ-fallback
- **Service Health Monitoring:** מעקב אחר בריאות השירותים
- **Prometheus Metrics:** מטריקות מפורטות לכל הפעולות
- **Schema Validation:** אימות נתונים מול סכמות מוגדרות
- **Knowledge Graph:** ייצוג ויזואלי של קשרים בין שירותים

**המערכת מוכנה לייצור עם תמיכה מלאה בכל הפרוטוקולים והיכולות!** 🚀

---

## 📝 **הערות נוספות**

### **Environment Variables:**
```bash
PORT=3001                    # HTTP server port
GRPC_PORT=50051             # gRPC server port
AI_ROUTING_ENABLED=true     # Enable AI routing
OPENAI_API_KEY=sk-...       # OpenAI API key
SUPABASE_URL=https://...    # Supabase URL (optional)
SUPABASE_ANON_KEY=...       # Supabase key (optional)
```

### **Health Checks:**
- **HTTP Health:** `GET /health`
- **gRPC Health:** Port connectivity check on 50051
- **Service Health:** Automatic health monitoring של registered services

### **Error Handling:**
- **HTTP Errors:** Standard HTTP status codes with JSON error responses
- **gRPC Errors:** Standard gRPC status codes with error details
- **Validation Errors:** Detailed validation error messages
- **AI Routing Errors:** Fallback to keyword-based routing

### **Performance:**
- **Client Caching:** gRPC clients are cached and reused
- **Connection Pooling:** HTTP connections are pooled
- **Metrics Collection:** Real-time performance metrics
- **Graceful Shutdown:** Both HTTP and gRPC servers shutdown gracefully
