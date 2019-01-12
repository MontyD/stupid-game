import { ObjectOfAny } from './types';
import { ObjectId } from 'mongodb';

export const isObjectId = (entity: any): entity is ObjectId => {
    if (!entity) {
        return false;
    }
    return typeof entity.toHexString === 'function';
};

type ParseableSimpleTypes = {id: string} | ObjectId | number | boolean | string | undefined | null;
type ParseableTypes = ParseableSimpleTypes | ParseableSimpleTypes[];
type ReturnSimpleTypes = number | boolean | string | undefined | null;
type ReturnTypes = ReturnSimpleTypes | ReturnSimpleTypes[];
export const parseEntityProperty = (prop: ParseableTypes): ReturnTypes => {
    if (Array.isArray(prop)) {
        return prop.map(subProp => parseEntityProperty(subProp)) as ReturnSimpleTypes[];
    }
    if (isObjectId(prop)) {
        return prop.toHexString();
    }
    if (prop && typeof prop === 'object') {
        return prop.id;
    }
    return prop;
};

export const makeDTOParser = <Entity>(dtoProps: ReadonlyArray<(keyof Entity)>) => (entity: Entity): ObjectOfAny => {
    return dtoProps.reduce((accumulator, key) => {
        accumulator[key as string] = parseEntityProperty(entity[key] as any);
        return accumulator;
    }, {} as ObjectOfAny);
};
