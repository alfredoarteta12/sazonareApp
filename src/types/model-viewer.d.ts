import * as React from 'react';

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        poster?: string;
        alt?: string;
        'camera-controls'?: boolean | string;
        'touch-action'?: string;
        'auto-rotate'?: boolean | string;
        'rotation-per-second'?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        scale?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'manual';
        slot?: string;
      };
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        poster?: string;
        alt?: string;
        'camera-controls'?: boolean | string;
        'touch-action'?: string;
        'auto-rotate'?: boolean | string;
        'rotation-per-second'?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        scale?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'manual';
        slot?: string;
      };
    }
  }
}
