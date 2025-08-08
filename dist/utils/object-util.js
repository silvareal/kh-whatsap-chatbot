"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = isObject;
exports.objectAccessor = objectAccessor;
exports.excludeProperties = excludeProperties;
exports.renameProperties = renameProperties;
exports.shallowClone = shallowClone;
exports.excludeKeys = excludeKeys;
exports.arrayToObject = arrayToObject;
exports.removeKeys = removeKeys;
exports.isObjectLike = isObjectLike;
exports.pickKeys = pickKeys;
exports.isEmptyObject = isEmptyObject;
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
function objectAccessor(obj, desc) {
    const arr = desc ? desc.split('.') : [];
    let result = { ...obj };
    while (arr.length && (result = result?.[arr.shift()]))
        ;
    return result;
}
function excludeProperties(object, exclusions = []) {
    if (!object)
        return object;
    let _object = { ...object };
    for (const exclusion of exclusions) {
        _object = exclude(_object, exclusion.split('.'));
    }
    return _object;
    function exclude(obj, nestedProperties) {
        const key = nestedProperties.shift();
        if (!nestedProperties.length) {
            delete obj[key];
            return obj;
        }
        return exclude(obj[key], nestedProperties);
    }
}
function renameProperties(object, renamings = {}) {
    if (!object)
        return object;
    let _object = { ...object };
    for (const renaming in renamings) {
        _object = rename(_object, renaming.split('.'), renamings[renaming]);
    }
    return _object;
    function rename(obj, nestedProperties, newName) {
        const key = nestedProperties.shift();
        if (!nestedProperties.length) {
            obj[newName] = obj[key];
            delete obj[key];
            return obj;
        }
        return rename(obj[key], nestedProperties, newName);
    }
}
function shallowClone(source) {
    const copy = {};
    Object.keys(source).forEach((key) => {
        copy[key] = source[key];
    });
    return copy;
}
function excludeKeys(user, keys) {
    if (!user)
        return null;
    return Object?.fromEntries(Object?.entries(user)?.filter(([key]) => !keys?.includes(key)));
}
function arrayToObject(array) {
    const object = {};
    for (let i = 0; i < array.length; i += 2) {
        const key = array[i];
        const value = array[i + 1];
        object[key] = value;
    }
    return object;
}
function removeKeys(obj, keys) {
    keys.forEach((key) => {
        if (obj.hasOwnProperty(key)) {
            delete obj[key];
        }
    });
    return obj;
}
function isObjectLike(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
function pickKeys(obj, keys) {
    return keys.reduce((acc, key) => {
        if (obj[key] !== undefined) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
//# sourceMappingURL=object-util.js.map