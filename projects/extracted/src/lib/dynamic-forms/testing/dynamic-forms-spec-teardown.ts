/**
 * Jasmine teardown helpers for dynamic-form field specs. Prefer
 * {@link disposeDynamicFormFixture} in `afterEach` so fixtures are destroyed
 * deterministically. For `fakeAsync` specs that schedule timers, call
 * {@link tryFlushDynamicFormZoneInFakeAsync} before dispose, or `tick(...)`
 * for explicit delays (e.g. on-screen-approval 5000ms).
 */
import type { ComponentFixture } from '@angular/core/testing';
import { discardPeriodicTasks, flush } from '@angular/core/testing';

export function disposeDynamicFormFixture<T>(
  fixture: ComponentFixture<T> | null | undefined
): void {
  if (fixture === null || fixture === undefined) {
    return;
  }
  try {
    fixture.destroy();
  } catch {
    return;
  }
}

export function afterEachDisposeDynamicFormFixture<T>(
  getFixture: () => ComponentFixture<T> | null | undefined
): () => void {
  return () => disposeDynamicFormFixture(getFixture());
}

export function tryFlushDynamicFormZoneInFakeAsync(): boolean {
  try {
    flush();
  } catch {
    return false;
  }
  try {
    discardPeriodicTasks();
  } catch {
    return true;
  }
  return true;
}
