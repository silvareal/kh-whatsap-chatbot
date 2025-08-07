export function isObject(item: object): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function objectAccessor<T>(obj: T, desc: string) {
  const arr = desc ? desc.split('.') : [];
  let result = { ...obj } as any;
  while (arr.length && (result = result?.[arr.shift() as keyof T]));
  return result;
}

export function excludeProperties<T>(object: T, exclusions: string[] = []) {
  if (!object) return object;

  let _object: T = { ...object };
  for (const exclusion of exclusions) {
    _object = exclude(_object, exclusion.split('.'));
  }
  return _object;

  function exclude<E>(obj: E, nestedProperties: string[]): E {
    const key = nestedProperties.shift() as any;
    if (!nestedProperties.length) {
      delete obj[key as keyof E];
      return obj;
    }
    return exclude((obj as any)[key], nestedProperties);
  }
}

export function renameProperties<T>(
  object: T,
  renamings: { [x: string]: string } = {},
) {
  if (!object) return object;

  let _object: T = { ...object };
  for (const renaming in renamings) {
    _object = rename(_object, renaming.split('.'), renamings[renaming]);
  }
  return _object;

  function rename<E>(obj: any, nestedProperties: string[], newName: string): E {
    const key = nestedProperties.shift()!;
    if (!nestedProperties.length) {
      obj[newName] = obj[key];
      delete obj[key];
      return obj;
    }
    return rename((obj as any)[key!], nestedProperties, newName);
  }
}

export function shallowClone<T extends object>(source: T): T {
  const copy = {} as T;
  Object.keys(source).forEach((key) => {
    copy[key as keyof T] = source[key as keyof T];
  });

  return copy;
}

// Exclude keys from user
export function excludeKeys<T, Key extends keyof T>(
  user: T,
  keys: Key[],
): Omit<T, Key> | null {
  if (!user) return null;
  return Object?.fromEntries(
    Object?.entries(user)?.filter(([key]) => !keys?.includes(key as any)),
  ) as Omit<T, Key>;
}

export function arrayToObject(array: string[]) {
  const object = {} as any;

  for (let i = 0; i < array.length; i += 2) {
    const key = array[i];
    const value = array[i + 1];
    object[key] = value;
  }
  return object;
}

export function removeKeys(obj, keys) {
  keys.forEach((key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  });
  return obj;
}

export function isObjectLike(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

interface PickKeysObject {
  [key: string]: any;
}

export function pickKeys<
  T extends PickKeysObject,
  K extends Extract<keyof T, string | number>,
>(obj: T, keys: K[]): Pick<PickKeysObject, K> {
  return keys.reduce(
    (acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<PickKeysObject, K>,
  );
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
