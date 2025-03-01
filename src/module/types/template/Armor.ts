declare namespace Shadowrun {
    export type ActorArmorData = ModifiableValue & LabelField

    export type ActorArmor = ActorArmorData & {
        fire: ModifiableValue,
        electricity: ModifiableValue,
        cold: ModifiableValue,
        acid: ModifiableValue,
        label?: string,
        hardened: boolean
    }
}