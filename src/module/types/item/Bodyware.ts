/// <reference path="../Shadowrun.ts" />
declare namespace Shadowrun {
    export interface BodywareData extends
        BodywarePartData,
        DescriptionPartData,
        TechnologyPartData,
        ActionPartData,
        ImportFlags,
        ArmorPartData {

    }

    export interface BodywarePartData {
        essence: BaseValuePair<number>;
        grade: string;
    }
}
