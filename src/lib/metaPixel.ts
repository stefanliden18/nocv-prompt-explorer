declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const META_PIXEL_ID = '506887683107389';

export const trackMetaEvent = (eventName: string, params?: Record<string, any>) => {
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }
};
