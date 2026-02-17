import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { META_PIXEL_ID } from '@/lib/metaPixel';

const MetaPixel = () => {
  const location = useLocation();

  // Load the pixel script once
  useEffect(() => {
    if (window.fbq) return;

    /* eslint-disable */
    (function (f: any, b: Document, e: string, v: string) {
      let n: any;
      let t: HTMLScriptElement;
      let s: Element;
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode!.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

export default MetaPixel;
