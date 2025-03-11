import { ImportHelper } from '../../helper/ImportHelper';
import { TechnologyItemParserBase } from '../item/TechnologyItemParserBase';
import Ware = Shadowrun.WareItemData;

export class CyberwareParser extends TechnologyItemParserBase<Ware> {
    override Parse(jsonData: object, item: Ware, jsonTranslation?: object): Ware {
        item = super.Parse(jsonData, item, jsonTranslation);

        const essence = ImportHelper.StringValue(jsonData, 'ess', '0').match(/[0-9]\.?[0-9]*/g);
        if (essence !== null) {
            item.system.essence.base = item.system.essence.value = parseFloat(essence[0]);            
        }

        const capacity = ImportHelper.StringValue(jsonData, 'capacity', '0').match(/[0-9]+/g);
        if (capacity !== null) {
            item.system.technology.capacity.max.base = item.system.technology.capacity.max.value = item.system.technology.capacity.value.base = item.system.technology.capacity.value.value = parseInt(capacity[0]);
        }

        return item;
    }
}
