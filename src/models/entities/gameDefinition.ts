import { InstanceType, Typegoose, arrayProp, Ref } from 'typegoose';
import { RoundEntity } from './round';

export class GameDefinitionEntity extends Typegoose {

    @arrayProp({ itemsRef: RoundEntity, default: [] })
    public rounds!: Array<Ref<RoundEntity>>;

}

export type GameDefinitionType = InstanceType<GameDefinitionEntity>;
export const GameDefinition = new GameDefinitionEntity().getModelForClass(GameDefinitionEntity, {
    schemaOptions: { collection: 'GameDefinitions' },
});
