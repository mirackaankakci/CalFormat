// utils/logger.ts - GÜVENLİK LOGLAMA
interface SecurityEvent {
  type: 'login_attempt' | 'unauthorized_access' | 'suspicious_upload' | 'rate_limit_exceeded';
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  details?: any;
}

export class SecurityLogger {
  private static events: SecurityEvent[] = [];
  
  static log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    this.events.push(securityEvent);
    console.warn('[SECURITY]', securityEvent);
    
    // Kritik olayları hemen Firebase'e kaydet
    if (['unauthorized_access', 'suspicious_upload'].includes(event.type)) {
      this.reportCriticalEvent(securityEvent);
    }
  }
  
  private static async reportCriticalEvent(event: SecurityEvent) {
    try {
      // Firebase'e kritik güvenlik olayını kaydet
      await fetch('/api/security-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Güvenlik olayı raporlanırken hata:', error);
    }
  }
}

// Kullanım örnekleri:
// SecurityLogger.log({ type: 'login_attempt', userId: 'user123', details: { success: false } });
// SecurityLogger.log({ type: 'unauthorized_access', details: { attemptedResource: '/admin' } });