import { Injectable } from '@angular/core';
import { TimeUtil } from '../../utils/timeUtil';
import { CacheItem } from './models/cache-item';
import { isNil } from '../../utils/nullishUtil';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  public invalidateCacheByPrefix(prefix: string) {
    Object.keys(localStorage).forEach((key: string) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  public put(key: string, value: unknown, timeToLiveInMinutes = 60): boolean {
    if (isNil(value) || value === '') {
      localStorage.removeItem(key);
      return false;
    }

    const timeNow = TimeUtil.getTimestampSeconds();
    const expiration = timeNow + timeToLiveInMinutes * 1000;

    const item = CacheItem.create({
      value: value,
      expiresAt: expiration,
    });

    try {
      localStorage.setItem(key, CacheItem.serialize(item));
      return true;
    } catch (err) {
      // TODO: Send this error to Open Replay as local storage may be available in some edge cases
      console.error('Local storage error:', String(err), key, item);
      return false;
    }
  }

  public get(key: string): unknown {
    const storedItem = localStorage.getItem(key);

    if (isNil(storedItem)) {
      localStorage.removeItem(key);
      return null;
    }

    try {
      const cacheItem = CacheItem.deserialize(storedItem);
      const now = TimeUtil.getTimestampSeconds();
      return cacheItem?.isValid(now) ? cacheItem.value : null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
    return;
  }
}
