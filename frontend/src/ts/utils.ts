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
