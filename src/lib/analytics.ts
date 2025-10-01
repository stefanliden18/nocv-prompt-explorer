/**
 * Analytics tracking utility for frontend events
 * Sends events to backend for storage and analysis
 */

interface AnalyticsEvent {
  event_type: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

class Analytics {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Track an analytics event
   */
  async track(eventType: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      event_type: eventType,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        page_url: window.location.href,
        page_path: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    try {
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log('📊 Analytics Event:', event);
      }

      // Store in localStorage for now (can be sent to backend later)
      this.storeEvent(event);

      // Could also send to backend analytics service
      // await this.sendToBackend(event);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  private storeEvent(event: AnalyticsEvent) {
    try {
      const storageKey = 'analytics_events';
      const existingEvents = localStorage.getItem(storageKey);
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      
      events.push(event);
      
      // Keep only last 100 events to avoid storage issues
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }

  /**
   * Get stored analytics events
   */
  getStoredEvents(): AnalyticsEvent[] {
    try {
      const storageKey = 'analytics_events';
      const events = localStorage.getItem(storageKey);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Failed to retrieve analytics events:', error);
      return [];
    }
  }

  /**
   * Clear stored analytics events
   */
  clearStoredEvents() {
    try {
      localStorage.removeItem('analytics_events');
    } catch (error) {
      console.error('Failed to clear analytics events:', error);
    }
  }

  // Convenience methods for common events
  trackPageView(pageName?: string) {
    this.track('page_view', {
      page_name: pageName || document.title,
    });
  }

  trackJobView(jobId: string, jobTitle: string) {
    this.track('view_job', {
      job_id: jobId,
      job_title: jobTitle,
    });
  }

  trackJobApplyClick(jobId: string, jobTitle: string) {
    this.track('click_apply', {
      job_id: jobId,
      job_title: jobTitle,
    });
  }

  trackApplicationSubmit(jobId: string, jobTitle: string, success: boolean) {
    this.track('submit_application', {
      job_id: jobId,
      job_title: jobTitle,
      success: success,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();
