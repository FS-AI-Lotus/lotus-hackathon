# AI Routing Guide

## Overview

The Coordinator's AI-powered routing system uses OpenAI to intelligently analyze requests and determine the most appropriate microservice(s) to handle them. This guide explains how the system works and how to optimize your services for better routing decisions.

---

## How AI Routing Works

### 1. Request Analysis

When a routing request is received, the AI system:

1. **Analyzes the request data** - type, payload, and context
2. **Examines available services** - capabilities, endpoints, events, and dependencies
3. **Uses AI reasoning** - leverages OpenAI to make intelligent routing decisions
4. **Provides fallback** - uses keyword matching if AI is unavailable

### 2. Service Matching Process

The AI considers multiple factors:

- **Service capabilities** from metadata
- **API endpoints** from migration files
- **Event publishing/subscribing** patterns
- **Service descriptions** and documentation
- **Historical routing patterns** (future enhancement)

### 3. Routing Strategies

- **Single**: Route to the best matching service
- **Multiple**: Route to top 3 matching services
- **Broadcast**: Route to all relevant services

---

## Configuration

### Environment Variables

```bash
# Enable/disable AI routing
AI_ROUTING_ENABLED=true

# OpenAI configuration
OPENAI_API_KEY=your-api-key-here
AI_MODEL=gpt-4o-mini

# Fallback behavior
AI_FALLBACK_ENABLED=true
```

### AI Models Supported

- `gpt-4o-mini` (recommended for cost-effectiveness)
- `gpt-4o` (for maximum accuracy)
- `gpt-3.5-turbo` (legacy support)

---

## Request Format

### Basic Routing Request

```json
{
  "data": {
    "type": "payment_request",
    "payload": {
      "amount": 100.50,
      "currency": "USD",
      "description": "Purchase payment"
    },
    "context": {
      "userId": "user-123",
      "orderId": "order-456"
    }
  },
  "routing": {
    "strategy": "single",
    "priority": "accuracy"
  }
}
```

### Request Fields Explained

#### Data Object
- **type**: Describes the nature of the request (e.g., "payment_request", "user_query", "notification")
- **payload**: The actual data being processed
- **context**: Additional context that might influence routing decisions

#### Routing Configuration
- **strategy**: How many services to route to
  - `single`: Best match only
  - `multiple`: Top matches (usually 3)
  - `broadcast`: All relevant services
- **priority**: What to optimize for
  - `accuracy`: Best possible match (slower)
  - `speed`: Fast routing (may be less accurate)
  - `cost`: Minimize AI API calls

---

## Optimizing Services for AI Routing

### 1. Comprehensive Service Metadata

Provide detailed capabilities in your service registration:

```json
{
  "serviceName": "payment-service",
  "metadata": {
    "capabilities": [
      "payment-processing",
      "credit-card-payments",
      "paypal-integration",
      "refund-processing",
      "transaction-history",
      "payment-validation"
    ],
    "team": "Payments Team",
    "owner": "payments@company.com",
    "tags": ["financial", "transaction", "money"]
  }
}
```

### 2. Detailed API Endpoints

Include comprehensive endpoint descriptions:

```json
{
  "api": {
    "endpoints": [
      {
        "path": "/api/payment/process",
        "method": "POST",
        "description": "Process credit card and digital wallet payments including Stripe, PayPal, and Apple Pay",
        "tags": ["payment", "transaction", "billing"],
        "requestSchema": {
          "properties": {
            "amount": {"type": "number", "description": "Payment amount in cents"},
            "currency": {"type": "string", "description": "ISO currency code"},
            "paymentMethod": {"type": "string", "description": "Payment method type"}
          }
        }
      },
      {
        "path": "/api/payment/refund",
        "method": "POST",
        "description": "Process full or partial refunds for completed payments",
        "tags": ["refund", "reversal", "chargeback"]
      }
    ]
  }
}
```

### 3. Event Patterns

Clearly define what events your service handles:

```json
{
  "events": {
    "publishes": [
      "payment.created",
      "payment.completed",
      "payment.failed",
      "refund.processed",
      "transaction.disputed"
    ],
    "subscribes": [
      "order.created",
      "user.verified",
      "fraud.detected",
      "inventory.reserved"
    ]
  }
}
```

### 4. Service Descriptions

Write clear, keyword-rich descriptions:

```json
{
  "description": "Comprehensive payment processing service handling credit cards, digital wallets, bank transfers, and cryptocurrency payments. Supports refunds, disputes, and international transactions with fraud detection."
}
```

---

## Routing Examples

### Example 1: Payment Processing

**Request:**
```json
{
  "data": {
    "type": "payment_request",
    "payload": {
      "amount": 99.99,
      "currency": "USD",
      "paymentMethod": "credit_card",
      "cardNumber": "****-****-****-1234"
    },
    "context": {
      "userId": "user-789",
      "merchantId": "merchant-123"
    }
  },
  "routing": {
    "strategy": "single",
    "priority": "accuracy"
  }
}
```

**AI Response:**
```json
{
  "success": true,
  "routing": {
    "targetServices": [
      {
        "serviceName": "payment-service",
        "endpoint": "http://payment-service:4000/api/payment/process",
        "confidence": 0.95,
        "reasoning": "High confidence match based on payment-related keywords, credit card processing capability, and exact API endpoint match for payment processing"
      }
    ],
    "strategy": "single",
    "processingTime": "45ms",
    "method": "ai"
  }
}
```

### Example 2: User Notification

**Request:**
```json
{
  "data": {
    "type": "notification_request",
    "payload": {
      "type": "email",
      "recipient": "user@example.com",
      "subject": "Payment Confirmation",
      "template": "payment_success"
    }
  },
  "routing": {
    "strategy": "multiple"
  }
}
```

**AI Response:**
```json
{
  "routing": {
    "targetServices": [
      {
        "serviceName": "notification-service",
        "endpoint": "http://notification-service:3000/api/send",
        "confidence": 0.92,
        "reasoning": "Primary notification service with email capabilities"
      },
      {
        "serviceName": "email-service",
        "endpoint": "http://email-service:3000/api/email/send",
        "confidence": 0.88,
        "reasoning": "Specialized email service as backup option"
      }
    ],
    "strategy": "multiple"
  }
}
```

### Example 3: Data Analytics Query

**Request:**
```json
{
  "data": {
    "type": "analytics_query",
    "payload": {
      "query": "user engagement metrics for last 30 days",
      "dateRange": "2024-01-01 to 2024-01-30",
      "metrics": ["page_views", "session_duration", "bounce_rate"]
    }
  },
  "routing": {
    "strategy": "single",
    "priority": "accuracy"
  }
}
```

---

## Fallback Routing

When AI routing fails or is disabled, the system uses keyword-based fallback:

### Keyword Matching Rules

1. **Service name matching** (weight: 0.8)
2. **Capability matching** (weight: 0.6)
3. **API endpoint path matching** (weight: 0.4)
4. **Event name matching** (weight: 0.5)
5. **Data type matching** (weight: 0.7)

### Fallback Example

For a payment request, the fallback system would:
1. Look for services with "payment" in the name
2. Check for "payment" or "transaction" capabilities
3. Find API endpoints with "/payment/" paths
4. Match event names like "payment.created"

---

## Monitoring and Debugging

### Routing Context Endpoint

Get current routing context:

```bash
curl http://coordinator:3000/route/context
```

**Response:**
```json
{
  "success": true,
  "context": {
    "aiEnabled": true,
    "fallbackEnabled": true,
    "totalServices": 5,
    "activeServices": 4,
    "services": [
      {
        "serviceName": "payment-service",
        "capabilities": ["payments", "refunds"],
        "endpoints": 3,
        "events": {
          "publishes": 4,
          "subscribes": 2
        }
      }
    ]
  }
}
```

### Routing Metrics

Monitor routing performance through Prometheus metrics:

```
# Routing request counts
coordinator_routing_requests_total{status="success"} 150
coordinator_routing_requests_total{status="failed"} 5

# Routing latency
coordinator_routing_duration_seconds_bucket{target_service="payment-service",le="0.1"} 120

# Successful routing by service
coordinator_successful_routing_total{target_service="payment-service"} 95
```

### Common Issues and Solutions

#### 1. Low Confidence Scores

**Problem:** AI returns low confidence scores (< 0.5)

**Solutions:**
- Improve service descriptions with more keywords
- Add more specific capabilities
- Include detailed API endpoint descriptions
- Ensure event names are descriptive

#### 2. Wrong Service Selection

**Problem:** AI routes to incorrect service

**Solutions:**
- Review and improve service metadata
- Add negative examples in descriptions ("does NOT handle X")
- Use more specific capability names
- Ensure API endpoint descriptions are accurate

#### 3. AI Routing Failures

**Problem:** AI routing consistently fails

**Solutions:**
- Check OpenAI API key and quota
- Verify network connectivity to OpenAI
- Enable fallback routing
- Review AI model configuration

---

## Best Practices

### 1. Service Design for Routing

- **Single Responsibility**: Each service should have a clear, focused purpose
- **Descriptive Naming**: Use clear, descriptive service and capability names
- **Comprehensive Metadata**: Include all relevant capabilities and tags
- **API Documentation**: Provide detailed endpoint descriptions

### 2. Request Design

- **Clear Types**: Use descriptive request types (e.g., "user_authentication" vs "auth")
- **Rich Context**: Include relevant context that helps routing decisions
- **Appropriate Strategy**: Choose the right routing strategy for your use case

### 3. Performance Optimization

- **Cache Results**: Consider caching routing decisions for similar requests
- **Batch Requests**: Group similar routing requests when possible
- **Monitor Costs**: Track OpenAI API usage and costs
- **Use Fallback**: Always enable fallback for reliability

### 4. Testing and Validation

- **Test Routing**: Regularly test routing with sample requests
- **Monitor Accuracy**: Track routing accuracy and adjust service metadata
- **Load Testing**: Test routing performance under load
- **Fallback Testing**: Ensure fallback routing works correctly

---

## Advanced Features (Future Enhancements)

### 1. Learning from History
- Track successful routing decisions
- Learn from user feedback
- Improve routing accuracy over time

### 2. Custom Routing Rules
- Define custom routing rules for specific scenarios
- Override AI decisions when needed
- Support complex routing logic

### 3. A/B Testing
- Test different routing strategies
- Compare AI vs. rule-based routing
- Optimize for different metrics

### 4. Multi-Model Support
- Support multiple AI models
- Fallback between models
- Model-specific optimizations

---

## Troubleshooting

### Debug Checklist

1. ✅ Is AI routing enabled? (`AI_ROUTING_ENABLED=true`)
2. ✅ Is OpenAI API key configured correctly?
3. ✅ Are services properly registered with migration files?
4. ✅ Do services have descriptive capabilities and endpoints?
5. ✅ Is the request format correct?
6. ✅ Are there active services available for routing?

### Log Analysis

Check coordinator logs for routing decisions:

```
[INFO] AI routing request received: payment_request
[INFO] AI routing completed: payment-service (confidence: 0.95)
[WARN] AI routing failed, using fallback: OpenAI API error
[ERROR] Routing failed: No active services available
```

---

For more information, see the [API Documentation](API_DOCUMENTATION.md) and [Integration Guide](INTEGRATION_GUIDE.md).

