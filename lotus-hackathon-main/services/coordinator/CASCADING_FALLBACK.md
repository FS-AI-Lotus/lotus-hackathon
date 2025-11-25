# 🔄 Cascading Fallback Feature

## 📋 Overview

**Cascading Fallback** is an intelligent routing mechanism that automatically tries multiple services in ranked order until finding a high-quality response. Instead of accepting the first service's result (even if empty or poor), the Coordinator tries services in order of confidence until finding data that meets quality criteria.

### Why It's Useful

- ✅ **Automatic Recovery**: No manual intervention when primary service returns poor data
- ✅ **Quality Assurance**: Ensures responses meet minimum quality standards
- ✅ **Resilience**: Handles service degradation gracefully
- ✅ **Transparency**: Full logging and metrics for visibility

### When It's Used

Cascading fallback is **automatically enabled** for all gRPC Route requests. It activates when:

1. AI routing returns multiple ranked services (5-10 candidates)
2. Services are tried in confidence order
3. Each response is evaluated for quality
4. Cascade stops when good data is found (or all candidates exhausted)

---

## 🎯 How It Works

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Routing Service                              │
│  • Analyzes query                                            │
│  • Ranks ALL relevant services (5-10 candidates)            │
│  • Returns ranked list with confidence scores                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Cascading Fallback Logic                             │
│                                                               │
│  Rank 1: Try service-A (confidence: 0.95)                    │
│    ├─ Call service                                           │
│    ├─ Evaluate quality                                       │
│    └─ ❌ Quality too low (0.2) → Try next                   │
│                                                               │
│  Rank 2: Try service-B (confidence: 0.75)                    │
│    ├─ Call service                                           │
│    ├─ Evaluate quality                                       │
│    └─ ✅ Quality good (0.8) → STOP                          │
│                                                               │
│  Return: service-B result + cascade metadata                │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

1. **AI Ranking**: Coordinator gets ranked list of services (5-10 candidates)
2. **Try Rank 1**: Call primary service (highest confidence)
3. **Quality Check**: Evaluate response against criteria
4. **Decision**:
   - ✅ **Good**: Stop and return result (if `STOP_ON_FIRST_SUCCESS=true`)
   - ❌ **Poor**: Try next service in rank order
5. **Repeat**: Continue until good response found or all candidates exhausted
6. **Return**: Successful result + full cascade metadata

---

## ⚙️ Configuration

All cascading behavior is controlled via environment variables in `.env`:

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FALLBACK_ATTEMPTS` | `5` | Maximum number of services to try before giving up |
| `MIN_QUALITY_SCORE` | `0.5` | Minimum quality score (0-1) required to accept response |
| `STOP_ON_FIRST_SUCCESS` | `true` | Stop immediately when good response found (vs trying all) |
| `ATTEMPT_TIMEOUT` | `3000` | Timeout per service call attempt (milliseconds) |

### Configuration Examples

#### Aggressive Fallback (Try Many Services)
```env
MAX_FALLBACK_ATTEMPTS=10
MIN_QUALITY_SCORE=0.7
STOP_ON_FIRST_SUCCESS=true
ATTEMPT_TIMEOUT=5000
```
**Use Case**: High-quality requirements, many backup services

#### Conservative Fallback (Quick Fail)
```env
MAX_FALLBACK_ATTEMPTS=3
MIN_QUALITY_SCORE=0.3
STOP_ON_FIRST_SUCCESS=true
ATTEMPT_TIMEOUT=2000
```
**Use Case**: Fast responses, lower quality acceptable

#### Try All Services (For Metrics)
```env
MAX_FALLBACK_ATTEMPTS=10
MIN_QUALITY_SCORE=0.5
STOP_ON_FIRST_SUCCESS=false
ATTEMPT_TIMEOUT=3000
```
**Use Case**: Collecting metrics on all services, even after success

---

## 📊 Quality Criteria

A response is considered **"good"** only if **ALL** of these criteria are met:

### 1. Service Success
```javascript
result.success === true
```

### 2. Data Exists
```javascript
result.data !== null && result.data !== undefined
```

### 3. Data is Object
```javascript
typeof result.data === 'object' && !Array.isArray(result.data)
```

### 4. Minimum Keys
```javascript
Object.keys(result.data).length >= minKeys  // Default: 1
```

### 5. Relevant Data (Not Only Metadata)
```javascript
// Must have keys OTHER than: timestamp, status, message, success, error
hasRelevantData(data) === true
```

### 6. Not Empty
```javascript
// Must NOT have empty arrays in: results, items, data fields
isEmptyResponse(data) === false
```

### 7. Quality Score Threshold
```javascript
assessQuality(data) >= MIN_QUALITY_SCORE  // Default: 0.5
```

### Quality Scoring Algorithm

The quality score is calculated based on the number of data fields:

| Keys | Score |
|------|-------|
| 0 keys | `0.0` |
| 1-2 keys | `0.3` |
| 3-9 keys | `0.7` |
| 10+ keys | `1.0` |

**Example**:
```javascript
// Response with 5 fields
{ id: 1, name: "John", email: "john@example.com", role: "admin", created: "2024-01-01" }
// Quality Score: 0.7 ✅ (meets 0.5 threshold)

// Response with only metadata
{ timestamp: "2024-01-01", status: "ok", message: "success" }
// Quality Score: 0.0 ❌ (no relevant data fields)
```

---

## 🤖 AI Ranking

### How Services Are Ranked

1. **AI Analysis**: OpenAI analyzes the query and available services
2. **Confidence Scoring**: Each service gets confidence score (0-1)
3. **Filtering**: Only services with confidence > 0.3 are included
4. **Sorting**: Services sorted by confidence (highest first)
5. **Limiting**: Maximum 10 candidates returned

### Ranking Example

```javascript
{
  rankedServices: [
    { serviceName: "payment-service", confidence: 0.95, reasoning: "Direct match" },
    { serviceName: "billing-service", confidence: 0.75, reasoning: "Related capability" },
    { serviceName: "accounting-service", confidence: 0.60, reasoning: "Partial match" },
    { serviceName: "reporting-service", confidence: 0.45, reasoning: "Weak match" },
    { serviceName: "analytics-service", confidence: 0.35, reasoning: "Minimal match" }
  ],
  primaryTarget: { serviceName: "payment-service", confidence: 0.95, ... },
  backupTargets: [
    { serviceName: "billing-service", ... },
    { serviceName: "accounting-service", ... },
    { serviceName: "reporting-service", ... }
  ],
  totalCandidates: 5
}
```

### Cascade Order

Services are tried in **exact order** of AI ranking:
- Rank 1: Highest confidence (primary target)
- Rank 2: Second highest (first backup)
- Rank 3: Third highest (second backup)
- ... and so on

---

## 🔄 Cascade Execution

### Detailed Flow

```
1. Get AI Ranking
   └─> rankedServices: [service-A(0.95), service-B(0.75), service-C(0.60)]

2. Try Rank 1: service-A
   ├─> Call service-A via gRPC/HTTP
   ├─> Receive response
   ├─> Assess quality: 0.2 (too low)
   └─> ❌ Reject: quality_too_low

3. Try Rank 2: service-B
   ├─> Call service-B via gRPC/HTTP
   ├─> Receive response
   ├─> Assess quality: 0.8 (good!)
   └─> ✅ Accept: meets all criteria

4. Stop (if STOP_ON_FIRST_SUCCESS=true)
   └─> Return: service-B result + metadata

5. Return Response
   ├─> successfulResult: { serviceName: "service-B", rank: 2, ... }
   ├─> allAttempts: [
   │     { rank: 1, serviceName: "service-A", success: false, quality: 0.2 },
   │     { rank: 2, serviceName: "service-B", success: true, quality: 0.8 }
   │   ]
   └─> totalAttempts: 2
```

### Rejection Reasons

When a response is rejected, one of these reasons is recorded:

| Reason | Meaning |
|--------|---------|
| `service_error` | Service call failed (`success !== true`) |
| `no_data` | Response has no data field |
| `empty_data` | Data is empty object `{}` |
| `empty_results` | Data contains empty arrays (`results: []`, `items: []`) |
| `only_metadata` | Data only has metadata fields (timestamp, status, etc.) |
| `quality_too_low` | Quality score below `MIN_QUALITY_SCORE` |

---

## 📤 Response Format

### gRPC RouteResponse

The Coordinator returns a `RouteResponse` with cascade information:

```javascript
{
  // All attempted services (in order)
  target_services: ["service-A", "service-B"],
  
  // Normalized fields (easy to parse)
  normalized_fields: {
    // Cascade results
    successful_service: "service-B",
    rank_used: "2",
    total_attempts: "2",
    
    // AI ranking info
    primary_target: "service-A",
    primary_confidence: "0.95",
    
    // Execution info
    stopped_reason: "found_good_response",
    quality_score: "0.8",
    total_time: "450ms",
    processing_time: "520ms",
    
    // Standard fields
    request_id: "abc-123",
    tenant_id: "tenant-1",
    user_id: "user-1",
    query: "show payments"
  },
  
  // Full cascade details (JSON string)
  envelope_json: JSON.stringify({
    request: { tenant_id, user_id, query_text },
    aiRanking: [...],           // All ranked services
    cascadeAttempts: [...],     // All attempts with details
    successfulResult: {...},     // Winning service result
    metadata: {
      total_attempts: 2,
      stopped_reason: "found_good_response",
      total_time: "450ms"
    }
  }),
  
  // Routing metadata (JSON string)
  routing_metadata: JSON.stringify({
    routing_strategy: "cascading_fallback",
    ai_ranking: [...],          // AI ranking details
    execution: {
      total_attempts: 2,
      successful_rank: 2,
      stopped_reason: "found_good_response"
    },
    performance: {
      cascade_time: "450ms",
      total_duration_ms: 520
    },
    all_attempts: [...]         // Detailed attempt info
  })
}
```

### Field Explanations

| Field | Description |
|-------|-------------|
| `target_services` | Array of all services attempted (in order) |
| `successful_service` | Name of service that returned good data |
| `rank_used` | Rank (1, 2, 3...) of successful service |
| `total_attempts` | Total number of services tried |
| `primary_target` | AI's top-ranked service (rank 1) |
| `primary_confidence` | Confidence score of primary target |
| `stopped_reason` | Why cascade stopped: `found_good_response` or `exhausted_candidates` |
| `quality_score` | Quality score (0-1) of successful response |

---

## 📈 Metrics

The Coordinator tracks 4 cascading metrics:

### 1. `coordinator_successful_rank` (Histogram)

**What**: Which rank succeeded (1st, 2nd, 3rd, etc.)

**Buckets**: `[1, 2, 3, 4, 5, 10]`

**Example**:
```prometheus
coordinator_successful_rank_bucket{le="1"} 50   # 50 times rank 1 succeeded
coordinator_successful_rank_bucket{le="2"} 75   # 75 times rank ≤2 succeeded
coordinator_successful_rank_bucket{le="3"} 80   # 80 times rank ≤3 succeeded
```

**Interpretation**: 
- High `le="1"` value = Primary service usually works
- High `le="2"` but low `le="1"` = Fallback often needed

### 2. `coordinator_attempts_before_success` (Histogram)

**What**: How many attempts before getting good result

**Buckets**: `[1, 2, 3, 4, 5, 10]`

**Example**:
```prometheus
coordinator_attempts_before_success_bucket{le="1"} 50   # 50 times succeeded on 1st try
coordinator_attempts_before_success_bucket{le="2"} 75   # 75 times succeeded within 2 tries
```

**Interpretation**: 
- High `le="1"` = Usually succeeds immediately
- High `le="2"` = Often needs one fallback

### 3. `coordinator_primary_success_total` (Counter)

**What**: Times the rank 1 service succeeded immediately

**Example**:
```prometheus
coordinator_primary_success_total 50
```

**Interpretation**: 
- High value = Primary service is reliable
- Low value = Primary service often fails

### 4. `coordinator_fallback_used_total` (Counter with Label)

**What**: Times fallback was needed, labeled by rank

**Example**:
```prometheus
coordinator_fallback_used_total{rank="2"} 20   # 20 times rank 2 succeeded
coordinator_fallback_used_total{rank="3"} 5    # 5 times rank 3 succeeded
```

**Interpretation**: 
- High `rank="2"` = First backup often needed
- High `rank="3"` = Multiple fallbacks common

### Viewing Metrics

```bash
# Get all metrics
curl http://localhost:3000/metrics

# Filter cascading metrics
curl http://localhost:3000/metrics | grep coordinator_successful_rank
curl http://localhost:3000/metrics | grep coordinator_fallback_used_total
```

---

## 📖 Example Scenarios

### Scenario 1: Primary Success ✅

**Query**: `"show payments"`

**AI Ranking**:
```
1. payment-service (confidence: 0.95)
2. billing-service (confidence: 0.75)
3. accounting-service (confidence: 0.60)
```

**Execution**:
```
Try payment-service → ✅ Good data (quality: 0.9)
Stop at rank 1
```

**Result**:
```javascript
{
  successful_service: "payment-service",
  rank_used: "1",
  total_attempts: "1",
  stopped_reason: "found_good_response"
}
```

**Metrics**:
- `coordinator_primary_success_total` +1
- `coordinator_successful_rank_bucket{le="1"}` +1

---

### Scenario 2: Fallback Success ✅

**Query**: `"show payments"`

**AI Ranking**:
```
1. payment-service (confidence: 0.95)
2. billing-service (confidence: 0.75)
3. accounting-service (confidence: 0.60)
```

**Execution**:
```
Try payment-service → ❌ Empty data (quality: 0.0, reject: empty_results)
Try billing-service → ✅ Good data (quality: 0.8)
Stop at rank 2
```

**Result**:
```javascript
{
  successful_service: "billing-service",
  rank_used: "2",
  total_attempts: "2",
  stopped_reason: "found_good_response",
  allAttempts: [
    { rank: 1, serviceName: "payment-service", success: false, rejectReason: "empty_results" },
    { rank: 2, serviceName: "billing-service", success: true, quality: 0.8 }
  ]
}
```

**Metrics**:
- `coordinator_fallback_used_total{rank="2"}` +1
- `coordinator_successful_rank_bucket{le="2"}` +1

---

### Scenario 3: Exhausted Candidates ❌

**Query**: `"show payments"`

**AI Ranking**:
```
1. payment-service (confidence: 0.95)
2. billing-service (confidence: 0.75)
3. accounting-service (confidence: 0.60)
```

**Execution**:
```
Try payment-service → ❌ Empty data (quality: 0.0)
Try billing-service → ❌ Only metadata (quality: 0.0)
Try accounting-service → ❌ Quality too low (quality: 0.3)
All candidates exhausted
```

**Result**:
```javascript
{
  successful_service: "none",
  rank_used: "0",
  total_attempts: "3",
  stopped_reason: "exhausted_candidates",
  successfulResult: null
}
```

**Metrics**:
- No success metrics incremented
- All attempts recorded in `allAttempts`

---

## ✅ Benefits

### 1. Automatic Recovery
- No manual intervention when primary service fails
- System automatically tries backups

### 2. Quality Assurance
- Ensures responses meet minimum quality standards
- Rejects empty or poor data automatically

### 3. Resilience
- Handles service degradation gracefully
- Continues working even if primary service is down

### 4. Transparency
- Full logging of all attempts
- Complete metrics for monitoring
- Detailed response metadata

### 5. Configurable
- Adjust quality thresholds
- Control number of attempts
- Configure timeout behavior

---

## 🔧 Troubleshooting

### Q: Cascade always stops at rank 1, even with poor data

**A**: Check `MIN_QUALITY_SCORE` - may be too low

```env
# Current (too low)
MIN_QUALITY_SCORE=0.1

# Fix (higher threshold)
MIN_QUALITY_SCORE=0.5
```

**Check**: Look at logs for quality scores:
```
Response received - success: true, quality: 0.2
Good response found! Stopping at rank 1
```
If quality is low but still accepted, increase `MIN_QUALITY_SCORE`.

---

### Q: Cascade tries all services even when one succeeds

**A**: Check `STOP_ON_FIRST_SUCCESS` - should be `true`

```env
# Current (wrong)
STOP_ON_FIRST_SUCCESS=false

# Fix
STOP_ON_FIRST_SUCCESS=true
```

**Check**: Look at logs:
```
Good response found! Stopping at rank 2
# But then continues to rank 3, 4, 5...
```

---

### Q: Metrics show no fallback usage

**A**: Either primary service always works, or `MIN_QUALITY_SCORE` is too low

**Diagnosis**:
1. Check `coordinator_primary_success_total` - if high, primary is reliable
2. Check logs for quality scores - if all are high, services are good
3. Check `MIN_QUALITY_SCORE` - if too low, poor data is accepted

**Solution**: If you want to see fallback usage, temporarily increase `MIN_QUALITY_SCORE` to force fallback testing.

---

### Q: Cascade times out on all services

**A**: Increase `ATTEMPT_TIMEOUT` or check service health

```env
# Current (too short)
ATTEMPT_TIMEOUT=1000

# Fix (longer timeout)
ATTEMPT_TIMEOUT=5000
```

**Check**: Look for timeout errors in logs:
```
Service call failed - Service call timeout after 3000ms, trying next
```

---

### Q: No services are being tried (cascade doesn't start)

**A**: Check AI routing - may not be returning ranked services

**Diagnosis**:
1. Check logs for "AI routing completed" - should show `totalCandidates`
2. Verify `rankedServices` array is populated
3. Check if `MAX_FALLBACK_ATTEMPTS` is too low

**Solution**:
```env
# Ensure AI routing is enabled
AI_ROUTING_ENABLED=true
OPENAI_API_KEY=your_key_here

# Ensure enough attempts allowed
MAX_FALLBACK_ATTEMPTS=5
```

---

### Q: Response quality is always 0.0

**A**: Check response format - may not match expected structure

**Diagnosis**:
1. Check service response format
2. Verify `result.data` exists and is an object
3. Check if data has relevant fields (not just metadata)

**Expected Format**:
```javascript
{
  success: true,
  data: {
    id: 1,
    name: "John",
    email: "john@example.com"
    // ... more fields
  }
}
```

**Wrong Format**:
```javascript
{
  success: true,
  data: {
    timestamp: "2024-01-01",
    status: "ok"
    // Only metadata - quality: 0.0
  }
}
```

---

## 🧪 Testing

### Using the Test Script

The Coordinator includes `test-cascading.sh` for testing cascading fallback:

```bash
# Make executable (Linux/Mac)
chmod +x test-cascading.sh

# Run test
./test-cascading.sh
```

**What it does**:
1. ✅ Checks if Coordinator is running
2. ✅ Registers test services
3. ✅ Makes gRPC Route request
4. ✅ Verifies cascade metadata in response
5. ✅ Checks metrics before/after
6. ✅ Shows cascade results

### Manual Testing

#### 1. Register Test Services

```bash
# Service 1: Returns empty data (will trigger fallback)
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-empty",
    "version": "1.0.0",
    "endpoint": "http://localhost:4001",
    "metadata": { "capabilities": ["test"] }
  }'

# Service 2: Returns good data
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-good",
    "version": "1.0.0",
    "endpoint": "http://localhost:4002",
    "metadata": { "capabilities": ["test"] }
  }'
```

#### 2. Make gRPC Request

```bash
grpcurl -plaintext -d '{
  "tenant_id": "test",
  "user_id": "user1",
  "query_text": "test cascading"
}' localhost:50051 rag.v1.CoordinatorService/Route
```

#### 3. Check Response

Look for cascade metadata:
```json
{
  "normalized_fields": {
    "successful_service": "test-good",
    "rank_used": "2",
    "total_attempts": "2"
  }
}
```

#### 4. Verify Metrics

```bash
curl http://localhost:3000/metrics | grep coordinator_fallback_used_total
```

Should show:
```
coordinator_fallback_used_total{rank="2"} 1
```

### Verifying Cascading Works

**Signs cascading is working**:
- ✅ Logs show multiple "Trying rank X" messages
- ✅ Response has `rank_used > 1` when primary fails
- ✅ Metrics show fallback usage
- ✅ `allAttempts` array has multiple entries

**Signs cascading is NOT working**:
- ❌ Always stops at rank 1
- ❌ No fallback metrics
- ❌ `total_attempts` always 1

---

## 📚 Additional Resources

- **Configuration**: See `src/config/routing.js`
- **Quality Logic**: See `src/services/communicationService.js` (methods starting with `_`)
- **Metrics**: See `src/services/metricsService.js`
- **gRPC Handler**: See `src/grpc/services/coordinator.service.js`

---

## 🎯 Summary

Cascading fallback ensures high-quality responses by:

1. **Ranking** services by AI confidence (5-10 candidates)
2. **Trying** services in order until finding good data
3. **Evaluating** each response against quality criteria
4. **Stopping** when quality threshold is met
5. **Returning** successful result with full cascade metadata

**Key Configuration**:
- `MAX_FALLBACK_ATTEMPTS`: How many services to try
- `MIN_QUALITY_SCORE`: Minimum quality threshold
- `STOP_ON_FIRST_SUCCESS`: Stop immediately or try all

**Key Metrics**:
- `coordinator_successful_rank`: Which rank succeeded
- `coordinator_fallback_used_total`: Fallback usage by rank

For questions or issues, check logs and metrics for detailed cascade execution information.

---

**Last Updated**: 2024
**Version**: 1.0

