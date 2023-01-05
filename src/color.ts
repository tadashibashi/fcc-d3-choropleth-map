import { lerp as _lerp } from "./util";

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export namespace Color {
    export function lerp(c: Color, target: Color, amt: number) {
        return {
            r: _lerp(c.r, target.r, amt),
            g: _lerp(c.g, target.g, amt),
            b: _lerp(c.b, target.b, amt),
            a: _lerp(c.a, target.a, amt)
        };
    }

    export function toString(c: Color): string {
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
    }
}



