/**
 * @param defaultValue - The default value to return if no value exists in the
 * storage.
 */
declare function GM_getValue(key: string, defaultValue: any): any;
/**
 * @param value - The value to be stored, which must be JSON serializable
 * (string, number, boolean, null, or an array/object consisting of these
 * types) so for example you can't store DOM elements or objects with cyclic
 * dependencies.
 */
declare function GM_setValue(key: string, value: any): void;
