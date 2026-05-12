import { InjectionToken } from '@angular/core';

export const TIMING = new InjectionToken<typeof TIMING_VALUES>(
  'app.constants.timing'
);

export const TIMING_VALUES = {
  click: {
    /* The time in milliseconds to throttle click events */
    throttle: 200,
  },
  typing: {
    /* The time in milliseconds to debounce typing events */
    debounce: 300,
  },
  fetch: {
    /* The time in milliseconds to debounce fetch events */
    debounce: 500,
  },
};
