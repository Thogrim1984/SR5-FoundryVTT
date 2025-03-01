import { ImportHelper } from '../../helper/ImportHelper';
import VehicleModificationCategoryType = Shadowrun.VehicleModificationCategoryType;
import { TechnologyItemParserBase } from '../item/TechnologyItemParserBase';
import ModificationItemData = Shadowrun.ModificationItemData;

export class VehicleModParserBase extends TechnologyItemParserBase<ModificationItemData> {
    override Parse(jsonData: object, item: ModificationItemData): ModificationItemData {
        item = super.Parse(jsonData, item);

        item.system.type = 'vehicle';

        const categoryName = ImportHelper.StringValue(jsonData, 'category');
        const enhancement  = ["Acceleration", "Armor", "Handling", "Sensor", "Speed"];

        item.system.vehicleMod.modification_category = (
            categoryName === undefined         ? "" :
            categoryName === "Powertrain"      ? "power_train"
                                               : categoryName.toLowerCase()
        ) as VehicleModificationCategoryType;

        item.system.vehicleMod.slots = +ImportHelper.StringValue(jsonData, 'slots') || 0;

        return item;
    }
}
