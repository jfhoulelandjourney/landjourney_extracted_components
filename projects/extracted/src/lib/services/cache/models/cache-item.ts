export type CacheItemConstructorInput<T = unknown> = {
  value: T;
  expiresAt: number;
};

const VERSION_METADATA = [
  { version: 1, prefix: '' },
  { version: 2, prefix: '$%$v02$%$:' },
] as const;
export class CacheItem<T = unknown> {
  private readonly expiresAt: number;
  readonly value: T;
  static version = 2;

  private constructor(params: CacheItemConstructorInput<T>) {
    this.value = params.value;
    this.expiresAt = params.expiresAt;
  }

  static checkVersion(value: string): (typeof VERSION_METADATA)[number] {
    const prefix = value.substring(0, 10);
    return (
      VERSION_METADATA.find(meta => meta.prefix === prefix) ??
      VERSION_METADATA[0]
    );
  }

  static serialize(cacheItem: CacheItem): string {
    const { prefix } = VERSION_METADATA.at(CacheItem.version - 1) ?? {
      prefix: '',
    };
    const content = CacheItem.utoa(JSON.stringify(cacheItem));
    return `${prefix}${content}`;
  }

  static deserialize(value: string): CacheItem | null {
    try {
      const { version } = CacheItem.checkVersion(value);
      if (version === 1) {
        const parsed = JSON.parse(atob(value));
        return new CacheItem(parsed);
      }
      const parsed = JSON.parse(CacheItem.atou(value.substring(10)));
      return new CacheItem(parsed);
    } catch {
      return null;
    }
  }

  static create<T>(params: CacheItemConstructorInput<T>): CacheItem<T> {
    return new CacheItem(params);
  }

  /**
   * ASCII to Unicode (decode Base64 to original data)
   * This method allow us to decode Base64 to original data
   * atob() method only allow us to decode ASCII characters
   */
  static atou(value: string) {
    return globalThis.decodeURIComponent(globalThis.atob(value));
  }
  /**
   * Unicode to ASCII (encode data to Base64)
   * This method allow us to encode any characters to Base64
   * btoa() method only allow us to encode ASCII characters
   */
  static utoa(value: string) {
    return globalThis.btoa(globalThis.encodeURIComponent(value));
  }

  isValid(referenceTime: number): boolean {
    return this.expiresAt >= referenceTime;
  }
}
