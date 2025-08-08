export declare function isObject(item: object): boolean;
export declare function objectAccessor<T>(obj: T, desc: string): any;
export declare function excludeProperties<T>(object: T, exclusions?: string[]): T;
export declare function renameProperties<T>(object: T, renamings?: {
    [x: string]: string;
}): T;
export declare function shallowClone<T extends object>(source: T): T;
export declare function excludeKeys<T, Key extends keyof T>(user: T, keys: Key[]): Omit<T, Key> | null;
export declare function arrayToObject(array: string[]): any;
export declare function removeKeys(obj: any, keys: any): any;
export declare function isObjectLike(value: any): boolean;
interface PickKeysObject {
    [key: string]: any;
}
export declare function pickKeys<T extends PickKeysObject, K extends Extract<keyof T, string | number>>(obj: T, keys: K[]): Pick<PickKeysObject, K>;
export declare function isEmptyObject(obj: object): boolean;
export {};
