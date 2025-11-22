# 📍 איפה נשמרים ה-URLs אחרי Registry?

## 🎯 תשובה קצרה:
**ה-URLs נשמרים בשני מקומות אפשריים:**
1. **Supabase Database** (אם מוגדר)
2. **In-Memory Map** (fallback)

---

## 🗂️ מבנה האחסון המפורט:

### **1. Supabase Database (עדיף)**
```sql
Table: registered_services
Columns:
├── id (UUID)                    ← Service ID
├── service_name (TEXT)          ← שם השירות
├── version (TEXT)               ← גרסה
├── endpoint (TEXT)              ← 🎯 כאן נשמר ה-URL!
├── health_check (TEXT)          ← נתיב health check
├── description (TEXT)           ← תיאור
├── metadata (JSONB)             ← מטא-דאטה
├── migration_file (JSONB)       ← קובץ migration
├── registered_at (TIMESTAMP)    ← זמן רישום
├── last_health_check (TIMESTAMP)← בדיקת תקינות אחרונה
└── status (TEXT)                ← סטטוס (active/pending/inactive)
```

### **2. In-Memory Storage (fallback)**
```javascript
// registryService.js - שורה 14
this.services = new Map();

// מבנה הנתונים:
Map {
  "service-id-1" => {
    id: "service-id-1",
    serviceName: "payment-service",
    version: "1.0.0",
    endpoint: "http://localhost:4000",  ← 🎯 כאן נשמר ה-URL!
    healthCheck: "/health",
    description: "Payment processing service",
    metadata: { capabilities: ["payments"] },
    migrationFile: { ... },
    registeredAt: "2025-11-21T...",
    lastHealthCheck: null,
    status: "active"
  },
  "service-id-2" => { ... }
}
```

---

## 🔄 זרימת השמירה:

### **שלב 1: רישום השירות**
```javascript
// POST /register
const serviceEntry = {
  id: serviceId,
  service_name: serviceName,
  version: version,
  endpoint: endpoint,        ← 🎯 ה-URL נשמר כאן!
  health_check: healthCheck,
  // ... שאר הנתונים
};
```

### **שלב 2: בחירת מקום האחסון**
```javascript
if (this.useSupabase) {
  // שמירה ב-Supabase
  await supabase
    .from('registered_services')
    .insert([serviceEntry]);
} else {
  // שמירה ב-Memory
  this.services.set(serviceId, serviceEntry);
}
```

---

## 🔍 איך ה-URLs נשלפים לניתוב:

### **1. קריאת כל השירותים הפעילים:**
```javascript
// aiRoutingService.js - שורה 41
const services = await registryService.getAllServicesFull();
const activeServices = services.filter(service => service.status === 'active');
```

### **2. שליפת שירות ספציפי:**
```javascript
// routingService.js - שורה 173
targetService = await registryService.getServiceByName(aiDecision.serviceName);

// מחזיר אובייקט עם:
{
  endpoint: "http://localhost:4000",  ← 🎯 ה-URL!
  version: "1.0.0",
  status: "active"
}
```

### **3. שימוש ב-URL לקריאה:**
```javascript
// proxyService.js - שורה 51
const targetUrl = `${targetService.endpoint}${req.path}`;
// תוצאה: "http://localhost:4000/api/payment/process"

// communicationService.js - שורה 152
const targetUrl = `${service.endpoint}/api/process`;
// תוצאה: "http://localhost:4000/api/process"
```

---

## 📊 מצב נוכחי במערכת:

### **בדיקה איזה מצב פעיל:**
```javascript
// registryService.js - שורות 15-21
this.useSupabase = !!supabase;

if (this.useSupabase) {
  logger.info('RegistryService initialized with Supabase');
} else {
  logger.info('RegistryService initialized with in-memory storage');
}
```

### **מהלוגים שראינו:**
```
📊 Server: RegistryService initialized with in-memory storage (Supabase not configured)
```

**משמעות:** כרגע ה-URLs נשמרים ב-**Memory** (לא ב-Supabase)

---

## 🎯 מיקומים ספציפיים בקוד:

### **שמירה:**
- **קובץ:** `src/services/registryService.js`
- **שורה 59:** `endpoint: endpoint.trim(),` (Supabase)
- **שורה 113:** `endpoint: endpoint.trim(),` (Memory)

### **שליפה:**
- **קובץ:** `src/services/registryService.js`
- **פונקציה:** `getAllServicesFull()` (שורה 41)
- **פונקציה:** `getServiceByName()` (שורה 173)

### **שימוש:**
- **קובץ:** `src/services/proxyService.js` (שורה 51)
- **קובץ:** `src/services/communicationService.js` (שורה 152)
- **קובץ:** `src/grpc/client.js` (שורה 51)

---

## 🔄 דוגמה מלאה:

### **1. רישום:**
```bash
POST /register
{
  "serviceName": "payment-service",
  "endpoint": "http://payment-service:4000"  ← נשמר
}
```

### **2. אחסון (Memory):**
```javascript
services.set("uuid-123", {
  endpoint: "http://payment-service:4000"  ← נשמר כאן
});
```

### **3. ניתוב:**
```javascript
// AI בוחר: "payment-service"
const service = await getServiceByName("payment-service");
// מחזיר: { endpoint: "http://payment-service:4000" }
```

### **4. קריאה:**
```javascript
// HTTP
const url = `${service.endpoint}/api/payment/process`;
// תוצאה: "http://payment-service:4000/api/payment/process"

// gRPC  
const grpcEndpoint = convertToGrpcPort(service.endpoint);
// תוצאה: "payment-service:4051"
```

---

## 🎉 סיכום:

**ה-URLs נשמרים:**
- 🗄️ **Supabase:** `registered_services.endpoint` (אם מוגדר)
- 💾 **Memory:** `this.services.get(id).endpoint` (fallback)
- 🔄 **נשלפים:** דרך `registryService.getAllServicesFull()`
- 🎯 **משמשים:** לקריאות HTTP ו-gRPC למיקרו-שירותים

**במצב הנוכחי:** נשמרים ב-Memory כי Supabase לא מוגדר.
