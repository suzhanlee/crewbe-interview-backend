const winston = require('winston');
const path = require('path');

// 로그 디렉토리 생성을 위한 fs
const fs = require('fs');
const logDir = 'logs';

// logs 디렉토리가 없으면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 커스텀 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${stackStr}${metaStr ? `\n${metaStr}` : ''}`;
  })
);

// 컬러 포맷 (콘솔용)
const colorFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const emoji = getLogEmoji(level);
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${emoji} [${timestamp}] ${level}: ${message}${stackStr}${metaStr ? `\n${metaStr}` : ''}`;
  })
);

// 로그 레벨에 맞는 이모지 반환
function getLogEmoji(level) {
  const emojis = {
    error: '💥',
    warn: '⚠️',
    info: '📝',
    http: '🌐',
    verbose: '🔍',
    debug: '🐛',
    silly: '🤪'
  };
  return emojis[level] || '📝';
}

// Winston 로거 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // 모든 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    }),

    // API 전용 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'api.log'),
      level: 'http',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// 개발 환경에서는 콘솔 출력 추가
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: colorFormat
  }));
}

// 요청 ID 생성기
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// API 로깅 헬퍼 함수들
const apiLogger = {
  // API 요청 시작
  request: (req, res, next) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    req.startTime = Date.now();
    
    logger.http('🌐 API Request Started', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.method === 'POST' ? req.body : undefined
    });
    
    // 응답 완료 시 로깅
    const originalSend = res.send;
    res.send = function(body) {
      const responseTime = Date.now() - req.startTime;
      
      logger.http('🌐 API Request Completed', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: body ? body.length : 0
      });
      
      originalSend.call(this, body);
    };
    
    next();
  },

  // AWS 서비스 호출 로깅
  aws: {
    start: (service, operation, params, requestId) => {
      logger.info(`🔧 AWS ${service} ${operation} Started`, {
        requestId,
        service,
        operation,
        params: JSON.stringify(params, null, 2)
      });
    },
    
    success: (service, operation, result, requestId, duration) => {
      logger.info(`✅ AWS ${service} ${operation} Success`, {
        requestId,
        service,
        operation,
        duration: `${duration}ms`,
        result: typeof result === 'object' ? JSON.stringify(result, null, 2) : result
      });
    },
    
    error: (service, operation, error, requestId, duration) => {
      logger.error(`💥 AWS ${service} ${operation} Failed`, {
        requestId,
        service,
        operation,
        duration: duration ? `${duration}ms` : 'N/A',
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  },

  // 업로드 프로세스 로깅
  upload: {
    start: (fileName, fileSize, requestId) => {
      logger.info('📤 File Upload Started', {
        requestId,
        fileName,
        fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`
      });
    },
    
    progress: (fileName, progress, requestId) => {
      logger.info('📊 File Upload Progress', {
        requestId,
        fileName,
        progress: `${progress}%`
      });
    },
    
    success: (fileName, s3Key, uploadTime, speed, requestId) => {
      logger.info('✅ File Upload Success', {
        requestId,
        fileName,
        s3Key,
        uploadTime: `${uploadTime}s`,
        speed: `${speed}Mbps`
      });
    },
    
    error: (fileName, error, requestId) => {
      logger.error('💥 File Upload Failed', {
        requestId,
        fileName,
        error: error.message,
        stack: error.stack
      });
    }
  },

  // 분석 프로세스 로깅
  analysis: {
    start: (s3Key, analysisTypes, requestId) => {
      logger.info('🧠 Analysis Started', {
        requestId,
        s3Key,
        analysisTypes
      });
    },
    
    jobCreated: (jobType, jobId, requestId) => {
      logger.info(`🚀 ${jobType.toUpperCase()} Job Created`, {
        requestId,
        jobType,
        jobId
      });
    },
    
    statusCheck: (jobType, jobId, status, requestId) => {
      logger.info(`🔍 ${jobType.toUpperCase()} Status Check`, {
        requestId,
        jobType,
        jobId,
        status
      });
    },
    
    completed: (jobType, jobId, duration, requestId) => {
      logger.info(`✅ ${jobType.toUpperCase()} Job Completed`, {
        requestId,
        jobType,
        jobId,
        duration: duration ? `${duration}ms` : 'N/A'
      });
    },
    
    failed: (jobType, jobId, error, requestId) => {
      logger.error(`💥 ${jobType.toUpperCase()} Job Failed`, {
        requestId,
        jobType,
        jobId,
        error: error.message,
        code: error.code
      });
    }
  }
};

// 시스템 메트릭 로깅
const systemLogger = {
  startup: () => {
    logger.info('🚀 System Startup', {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  },
  
  memoryUsage: () => {
    const usage = process.memoryUsage();
    logger.info('💾 Memory Usage', {
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`
    });
  }
};

module.exports = {
  logger,
  apiLogger,
  systemLogger,
  generateRequestId
}; 