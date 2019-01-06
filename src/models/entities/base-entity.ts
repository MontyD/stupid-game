import { ObjectIdColumn } from "typeorm";
import { ObjectOfAny } from "../../utils/types";

const EXCLUDED_DTO_FIELDS = ['id'];

export abstract class BaseEntity {

    @ObjectIdColumn()
    public id!: string;

    public equals<T extends BaseEntity>(entityToCompareTo: T): boolean {
        return this.id === entityToCompareTo.id;
    }

    public toDTO(): object {
        const keys: string[] = Object.keys(this).filter(key =>
            !EXCLUDED_DTO_FIELDS.includes(key) && typeof (this as ObjectOfAny)[key] !== 'function'
        );
        return keys.reduce(((accumulator: ObjectOfAny, key: string) => {
            accumulator[key] = this.parsePropertyToDTO((this as ObjectOfAny)[key]);
            return accumulator;
        }), {});
    }

    private parsePropertyToDTO(prop: any): any {
        if (Array.isArray(prop)) {
            return prop.map(value => this.parsePropertyToDTO(value));
        }
        if (prop && typeof prop.toDTO === 'function' && prop.id) {
            return prop.id;
        }
        return prop;
    }
}
