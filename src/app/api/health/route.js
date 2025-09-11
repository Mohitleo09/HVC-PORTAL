import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/app/utils/config/db';
import { config, validateConfig } from '@/app/utils/config/environment';
import { initializeServerDatabase, getDatabaseStatus } from '@/app/utils/config/initServer';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check configuration
    const configStatus = validateConfig();
    
    // Initialize database if not already done
    let initResult = null;
    try {
      initResult = await initializeServerDatabase();
    } catch (error) {
      console.warn('⚠️ Database initialization warning:', error.message);
    }
    
    // Check database health
    let dbHealth = { status: 'unknown', connected: false, error: 'Not checked' };
    try {
      dbHealth = await checkDatabaseHealth();
    } catch (error) {
      dbHealth = { status: 'error', connected: false, error: error.message };
    }
    
    // Get detailed database status
    const dbStatus = await getDatabaseStatus();
    
    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasMongoURI: !!config.MONGODB_URI,
      hasNextAuthSecret: !!config.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!config.NEXTAUTH_URL,
    };
    
    // Check system resources
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall health
    const overallHealth = dbHealth.connected && configStatus ? 'healthy' : 'unhealthy';
    
    return NextResponse.json({
      success: true,
      status: overallHealth,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      
      // Database initialization status
      initialization: {
        completed: initResult?.success || false,
        message: initResult?.message || 'Not attempted',
        error: initResult?.error || null
      },
      
      // Configuration status
      configuration: {
        valid: configStatus,
        environment: environment,
      },
      
      // Database status
      database: {
        ...dbHealth,
        status: dbStatus,
        ready: dbStatus.ready
      },
      
      // System information
      system: systemInfo,
      
      // API information
      api: {
        version: '1.0.0',
        endpoints: [
          '/api/health',
          '/api/init',
          '/api/users',
          '/api/departments',
          '/api/doctors',
          '/api/languages',
          '/api/questions',
          '/api/schedule',
          '/api/trends',
          '/api/workflows',
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Health check endpoint for load balancers
export async function HEAD() {
  try {
    // Ensure database is initialized
    await initializeServerDatabase();
    
    const dbHealth = await checkDatabaseHealth();
    const isHealthy = dbHealth.connected;
    
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'X-Health-Status': isHealthy ? 'healthy' : 'unhealthy',
        'X-Timestamp': new Date().toISOString(),
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'error',
        'X-Error': error.message,
        'X-Timestamp': new Date().toISOString(),
      }
    });
  }
}
