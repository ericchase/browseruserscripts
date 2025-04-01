export class LocalStorageProvider<Key extends { toString: () => string }> {
  set(key: Key, value: any): void {
    window.localStorage.setItem(key.toString(), JSON.stringify(value));
  }
  get(key: Key): any | undefined {
    const value = window.localStorage.getItem(key.toString()) ?? undefined;
    if (value !== undefined) {
      return JSON.parse(value);
    }
    return undefined;
  }
}
