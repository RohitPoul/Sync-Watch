const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class SecurityManager {
  constructor(app) {
    this.app = app;
    this.secretKey = this.generateOrLoadSecret();
    this.setupSecurity();
  }

  generateOrLoadSecret() {
    const secretFile = path.join(process.cwd(), '.secret');
    
    if (fs.existsSync(secretFile)) {
      return fs.readFileSync(secretFile, 'utf8');
    } else {
      const secret = crypto.randomBytes(64).toString('hex');
      fs.writeFileSync(secretFile, secret);
      return secret;
    }
  }

  setupSecurity() {
    // Helmet for security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
          mediaSrc: ["'self'", "blob:", "https:", "http:"],
          fontSrc: ["'self'", "data:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow video embedding
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests from localhost, local network, and file protocol (Electron)
        const allowedOrigins = [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^file:\/\//,
          /^https:\/\/.*\.ngrok\.io$/,
        ];

        if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });

    const strictLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // limit room creation to 10 per minute
      message: 'Too many room creation attempts, please try again later.',
    });

    this.app.use('/api/', limiter);
    this.app.use('/api/create-room', strictLimiter);
    this.app.use('/api/join-room', strictLimiter);
  }

  // Generate room token for authentication
  generateRoomToken(roomId, userId, isAdmin = false) {
    const payload = {
      roomId,
      userId,
      isAdmin,
      timestamp: Date.now(),
    };

    return jwt.sign(payload, this.secretKey, {
      expiresIn: '24h', // Token expires in 24 hours
    });
  }

  // Verify room token
  verifyRoomToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Encrypt sensitive data
  encryptData(data) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  // Decrypt sensitive data
  decryptData(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Generate secure room ID
  generateSecureRoomId() {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  // Hash password for room protection
  hashPassword(password) {
    return crypto
      .createHash('sha256')
      .update(password + this.secretKey)
      .digest('hex');
  }

  // Verify password
  verifyPassword(password, hash) {
    const testHash = this.hashPassword(password);
    return testHash === hash;
  }

  // Sanitize user input to prevent XSS
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate room join request
  validateJoinRequest(data) {
    const errors = [];

    if (!data.roomId || !/^[A-Z0-9]{6,12}$/.test(data.roomId)) {
      errors.push('Invalid room ID format');
    }

    if (!data.username || data.username.length < 2 || data.username.length > 20) {
      errors.push('Username must be between 2 and 20 characters');
    }

    if (data.password && data.password.length > 50) {
      errors.push('Password too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Create HTTPS server with self-signed certificate for local development
  createHttpsServer(app) {
    const https = require('https');
    const certPath = path.join(process.cwd(), 'certificates');

    // Create certificates directory if it doesn't exist
    if (!fs.existsSync(certPath)) {
      fs.mkdirSync(certPath, { recursive: true });
    }

    const keyPath = path.join(certPath, 'server.key');
    const certFilePath = path.join(certPath, 'server.cert');

    // Check if certificates exist
    if (!fs.existsSync(keyPath) || !fs.existsSync(certFilePath)) {
      // Generate self-signed certificate for development
      const { execSync } = require('child_process');
      
      try {
        console.log('Generating self-signed certificate for HTTPS...');
        
        // Generate private key
        execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'ignore' });
        
        // Generate certificate
        execSync(
          `openssl req -new -x509 -key "${keyPath}" -out "${certFilePath}" -days 365 -subj "/CN=localhost"`,
          { stdio: 'ignore' }
        );
        
        console.log('Self-signed certificate generated successfully');
      } catch (error) {
        console.warn('Could not generate SSL certificate. HTTPS will not be available.');
        console.warn('Install OpenSSL to enable HTTPS support.');
        return null;
      }
    }

    try {
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const certificate = fs.readFileSync(certFilePath, 'utf8');

      const credentials = {
        key: privateKey,
        cert: certificate,
      };

      return https.createServer(credentials, app);
    } catch (error) {
      console.error('Error loading SSL certificates:', error);
      return null;
    }
  }

  // Socket authentication middleware
  socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth.token;
    
    if (token) {
      const decoded = this.verifyRoomToken(token);
      if (decoded) {
        socket.roomId = decoded.roomId;
        socket.userId = decoded.userId;
        socket.isAdmin = decoded.isAdmin;
        return next();
      }
    }
    
    // Allow connection without token for initial handshake
    next();
  }

  // IP-based rate limiting for socket connections
  socketRateLimiter() {
    const connectionAttempts = new Map();
    
    return (socket, next) => {
      const ip = socket.handshake.address;
      const now = Date.now();
      
      if (!connectionAttempts.has(ip)) {
        connectionAttempts.set(ip, []);
      }
      
      const attempts = connectionAttempts.get(ip);
      
      // Remove old attempts (older than 1 minute)
      const recentAttempts = attempts.filter(time => now - time < 60000);
      
      if (recentAttempts.length >= 10) {
        return next(new Error('Too many connection attempts'));
      }
      
      recentAttempts.push(now);
      connectionAttempts.set(ip, recentAttempts);
      
      next();
    };
  }
}

module.exports = SecurityManager;
