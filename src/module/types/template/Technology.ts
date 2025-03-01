declare namespace Shadowrun {
    export type TechnologyPartData = {
        technology: TechnologyData
    };
    export type TechnologyData = {
        capacity: ValueMaxPair<number>
        rating: NumberOrEmpty
        availability: BaseValuePair<string> & { adjusted: boolean }
        quantity: NumberOrEmpty
        cost: BaseValuePair<NumberOrEmpty> & { adjusted: boolean }
        equipped: boolean
        conceal: ModifiableValue
        condition_monitor: ConditionData
        wireless: boolean
        networkController: string
    };

}
