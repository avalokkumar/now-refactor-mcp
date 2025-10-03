# ServiceNow Code Intelligence MCP - Deployment Guide

This guide provides detailed instructions for deploying the ServiceNow Code Intelligence MCP server in various environments.

## Table of Contents

1. [Local Development Deployment](#local-development-deployment)
2. [Production Deployment](#production-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [CI/CD Integration](#cicd-integration)
6. [Security Considerations](#security-considerations)
7. [Performance Tuning](#performance-tuning)
8. [Monitoring and Logging](#monitoring-and-logging)

## Local Development Deployment

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- Git

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/servicenow/code-intelligence-mcp.git
   cd code-intelligence-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the web interface at http://localhost:3000 and the MCP server at http://localhost:8080

### Development Configuration

Create a `.env.development` file in the project root:

```
PORT=3000
MCP_PORT=8080
LOG_LEVEL=debug
STORAGE_DIR=./data
```

## Production Deployment

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- PM2 or another process manager (recommended)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/servicenow/code-intelligence-mcp.git
   cd code-intelligence-mcp
   ```

2. Install dependencies:
   ```bash
   npm install --production
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your settings
   ```

5. Start with PM2:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   ```

6. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

### Production Configuration

Create a `.env.production` file:

```
PORT=3000
MCP_PORT=8080
LOG_LEVEL=info
STORAGE_DIR=/var/lib/code-intelligence-mcp/data
NODE_ENV=production
```

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose (optional)

### Using Pre-built Image

1. Pull the Docker image:
   ```bash
   docker pull servicenow/code-intelligence-mcp:latest
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -p 8080:8080 -v /path/to/data:/app/data servicenow/code-intelligence-mcp:latest
   ```

### Building Custom Image

1. Build the Docker image:
   ```bash
   docker build -t code-intelligence-mcp .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -p 8080:8080 -v /path/to/data:/app/data code-intelligence-mcp
   ```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  code-intelligence-mcp:
    image: servicenow/code-intelligence-mcp:latest
    ports:
      - "3000:3000"
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Cloud Deployment

### AWS Deployment

#### Using Elastic Beanstalk

1. Install the EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize EB application:
   ```bash
   eb init
   ```

3. Create an environment:
   ```bash
   eb create code-intelligence-mcp-prod
   ```

4. Deploy:
   ```bash
   eb deploy
   ```

#### Using EC2

1. Launch an EC2 instance with Amazon Linux 2
2. Install Node.js:
   ```bash
   curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   ```

3. Clone and set up the application:
   ```bash
   git clone https://github.com/servicenow/code-intelligence-mcp.git
   cd code-intelligence-mcp
   npm install --production
   npm run build
   ```

4. Set up PM2:
   ```bash
   sudo npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 startup
   pm2 save
   ```

5. Configure Nginx as a reverse proxy:
   ```bash
   sudo amazon-linux-extras install nginx1
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

   Create `/etc/nginx/conf.d/code-intelligence-mcp.conf`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /mcp/ {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. Reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Google Cloud Deployment

#### Using App Engine

1. Create an `app.yaml` file:
   ```yaml
   runtime: nodejs16
   env: standard
   instance_class: F2

   env_variables:
     PORT: 8080
     MCP_PORT: 8081
     NODE_ENV: production

   handlers:
   - url: /.*
     script: auto
   ```

2. Deploy to App Engine:
   ```bash
   gcloud app deploy
   ```

#### Using Cloud Run

1. Build and push Docker image:
   ```bash
   gcloud builds submit --tag gcr.io/your-project/code-intelligence-mcp
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy code-intelligence-mcp \
     --image gcr.io/your-project/code-intelligence-mcp \
     --platform managed \
     --allow-unauthenticated
   ```

### Azure Deployment

#### Using App Service

1. Create a web app in Azure Portal
2. Set up deployment from GitHub or Azure DevOps
3. Configure environment variables in the Configuration section
4. Deploy the application

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Test
        run: npm test
        
      - name: Deploy
        if: success()
        run: |
          # Add your deployment commands here
          # For example, deploying to AWS:
          npm install -g aws-cdk
          cdk deploy
```

### Jenkins Pipeline

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'node:16'
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'server-key', keyFileVariable: 'KEY_FILE')]) {
                    sh '''
                        rsync -avz -e "ssh -i $KEY_FILE" dist/ user@your-server:/path/to/deployment/
                        ssh -i $KEY_FILE user@your-server "cd /path/to/deployment && npm install --production && pm2 restart code-intelligence-mcp"
                    '''
                }
            }
        }
    }
}
```

## Security Considerations

### Server Hardening

1. **Use HTTPS**: Always configure SSL/TLS for production deployments
2. **Set up a reverse proxy**: Use Nginx or Apache as a reverse proxy
3. **Implement rate limiting**: Protect against DoS attacks
4. **Configure CORS**: Restrict cross-origin requests

### Environment Variables

Store sensitive information in environment variables, not in code:

```
# .env.production
JWT_SECRET=your-secret-key
API_KEYS=key1,key2,key3
```

### Authentication

For protected deployments, implement authentication:

```javascript
// Example middleware
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !process.env.API_KEYS.split(',').includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Apply to routes
app.use('/api', authenticate);
```

## Performance Tuning

### Node.js Configuration

Optimize Node.js for production:

```bash
# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Caching

Implement caching for analysis results:

```javascript
const NodeCache = require('node-cache');
const analysisCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

// Example caching middleware
function cacheAnalysis(req, res, next) {
  const cacheKey = req.body.fileName + req.body.code.substring(0, 100);
  const cachedResult = analysisCache.get(cacheKey);
  
  if (cachedResult) {
    return res.json(cachedResult);
  }
  
  const originalJson = res.json;
  res.json = function(result) {
    analysisCache.set(cacheKey, result);
    return originalJson.call(this, result);
  };
  
  next();
}

app.post('/api/analyze', cacheAnalysis, analyzeController);
```

### Load Balancing

For high-traffic deployments, set up load balancing:

1. **Nginx Load Balancer**:
   ```nginx
   upstream code_intelligence_backend {
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
       server 127.0.0.1:3003;
   }

   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://code_intelligence_backend;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **PM2 Cluster Mode**:
   ```bash
   pm2 start ecosystem.config.js -i max
   ```

## Monitoring and Logging

### Logging Configuration

Configure logging for production:

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### Health Checks

Implement a health check endpoint:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    services: {
      mcp: mcpServerRunning ? 'UP' : 'DOWN',
      database: dbConnected ? 'UP' : 'DOWN'
    }
  });
});
```

### Metrics

Collect and expose metrics:

```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();

// Create metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Conclusion

This deployment guide covers various scenarios for deploying the ServiceNow Code Intelligence MCP server. Choose the approach that best fits your infrastructure and requirements. For additional support, consult the project documentation or open an issue on the GitHub repository.
