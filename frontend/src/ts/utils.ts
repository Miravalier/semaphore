export function randomUint32(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array)
    return array.at(0);
}

export function randomChoice<T>(items: T[]): T {
    if (!items || items.length == 0) {
        return null;
    }
    return items[randomUint32() % items.length];
}

export async function intFromStringByHashing(key: string): Promise<number> {
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(key);
  const digest = await window.crypto.subtle.digest("SHA-1", encodedKey);
  const view = new Uint32Array(digest);
  return view.at(0);
}
