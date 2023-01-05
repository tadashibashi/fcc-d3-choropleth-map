
export function lerp(n: number, target: number, amt: number) {
    return (target - n) * amt + n;
}

// Gets the percentage of a value in a linear range
export function percentLinear(n: number, min: number, max: number) {
    return (n - min) / (max - min);
}
