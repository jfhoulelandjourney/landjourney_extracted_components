export class Queue<T> {
  private items: T[] = [];

  constructor(...elements: T[]) {
    this.items = [...elements];
  }

  push(...items: T[]) {
    return this.items.push(...items);
  }

  shift() {
    return this.items.shift();
  }

  getLength() {
    return this.items.length;
  }

  truncate(length: number) {
    return (this.items.length = length);
  }
}
