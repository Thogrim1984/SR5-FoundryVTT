/// <reference path="../Shadowrun.ts" />
declare namespace Shadowrun {
    export interface ArmorData extends
        ArmorPartData,
        DescriptionPartData,
        ImportFlags,
        TechnologyPartData {

    }

    export interface ArmorPartData {
        armor: ModifiableValue & {
            accessory: boolean;
            acid: ModifiableValue;
            cold: ModifiableValue;
            fire: ModifiableValue;
            electricity: ModifiableValue;
            radiation: ModifiableValue;
            hardened: boolean;
        };
    }
}
