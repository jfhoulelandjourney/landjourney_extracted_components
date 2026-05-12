import { ActivatedRouteSnapshot } from '@angular/router';

export function collectRouteParams(
  rootRoute: ActivatedRouteSnapshot
): Record<string, string> {
  const params = {};
  const stack: ActivatedRouteSnapshot[] = [rootRoute];
  while (stack.length > 0) {
    const route = stack.pop();
    if (!route) {
      break;
    }
    Object.assign(params, { ...route.params });
    stack.push(...route.children);
  }
  return params;
}

export function collectRouteData(
  rootRoute: ActivatedRouteSnapshot
): Record<string, unknown> {
  const data = {};
  const stack: ActivatedRouteSnapshot[] = [rootRoute];
  while (stack.length > 0) {
    const route = stack.pop();
    if (!route) {
      break;
    }
    Object.assign(data, { ...route.data });
    stack.push(...route.children);
  }
  return data;
}
