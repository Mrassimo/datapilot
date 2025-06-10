# DataPilot Deployment Guide

## Production Deployment

DataPilot is production-ready with enterprise-grade features:

### Requirements
- Node.js 18+ 
- 512MB+ RAM (for large files)
- File system access

### Installation Options

**Global CLI Installation:**
```bash
npm install -g datapilot-cli
datapilot --version
```

**Docker Deployment:**
```dockerfile
FROM node:18-alpine
RUN npm install -g datapilot-cli
ENTRYPOINT ["datapilot"]
```

**Programmatic Usage:**
```bash
npm install datapilot-cli
```

### Health Monitoring

DataPilot includes production monitoring endpoints:

```bash
# Health check (for load balancers)
curl http://localhost:3000/health

# Readiness probe (Kubernetes)
curl http://localhost:3000/health/ready

# Liveness probe (Kubernetes)  
curl http://localhost:3000/health/live

# Metrics (for monitoring systems)
curl http://localhost:3000/metrics
```

### Security Features

- Input validation and sanitization
- Path traversal attack prevention
- File system access controls
- Suspicious content detection

### Performance Specifications

| File Size | Memory Usage | Processing Speed | Configuration |
|-----------|--------------|------------------|---------------|
| < 100MB   | < 64MB       | 1-2M rows/min   | Default       |
| 1-10GB    | < 256MB      | 500K-1M rows/min| Large files   |
| 10-100GB  | < 512MB      | 200-500K rows/min| Ultra large  |

### Configuration

Create `.datapilotrc` for custom settings:

```json
{
  "performance": "large-files",
  "output": {
    "format": "json",
    "includeVisualizationRecommendations": true
  },
  "analysis": {
    "maxCorrelationPairs": 50
  }
}
```

### Error Handling

DataPilot includes graceful degradation:
- Automatic fallback strategies
- Partial result recovery
- User-friendly error messages
- Resource cleanup on failure

### Support

- GitHub Issues: [Report bugs](https://github.com/Mrassimo/datapilot/issues)
- Documentation: [Full guides](https://github.com/Mrassimo/datapilot/tree/main/docs)
- Examples: [Sample outputs](https://github.com/Mrassimo/datapilot/tree/main/examples)