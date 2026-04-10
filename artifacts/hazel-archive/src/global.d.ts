import React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      marquee: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        behavior?: string;
        direction?: string;
        scrollamount?: number;
        loop?: number;
      }, HTMLElement>;
    }
  }
}
