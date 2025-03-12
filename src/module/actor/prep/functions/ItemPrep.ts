import { SR5ItemDataWrapper } from '../../../data/SR5ItemDataWrapper';
import { Helpers } from '../../../helpers';
import { PartsList } from '../../../parts/PartsList';
import ArmorActorData = Shadowrun.ArmorActorData;
import { SR5 } from "../../../config";
import ActorTypesData = Shadowrun.ShadowrunActorDataData;
import { DataDefaults } from '../../../data/DataDefaults';

export class ItemPrep {
    /**
     * Prepare the armor data for the Item
     * - will only allow one "Base" armor item to be used (automatically takes the best one if multiple are equipped)
     * - all "accessories" will be added to the armor
     * - all mods of bas armor and accessories will be added to the armor
     */


    /**
     * Prepare the armor data for the actor.
     * This method selects a base armor based on highest armor-value, processes accessories, modifications, and calculates armor values.
     */
    static prepareArmor(system: ActorTypesData & ArmorActorData, items: SR5ItemDataWrapper[]) {
        // Determine the used base armor and accessories
        const { baseArmor, accessoryArmors } = this.determineUsedArmor(items);

        // Collect all armor and accessory modifications
        const modsData = this.collectArmorMods(accessoryArmors);

        // Create the armorData object directly with values from base armor and modifications
        const armorData: Shadowrun.ActorArmor = {
            armor: { base: baseArmor ? baseArmor.getArmorValues().value : 0, value: 0, mod: modsData.armor },
            acid: { base: baseArmor ? baseArmor.getArmorElements()["acid"].value : 0, value: 0, mod: modsData.acid },
            cold: { base: baseArmor ? baseArmor.getArmorElements()["cold"].value : 0, value: 0, mod: modsData.cold },
            fire: { base: baseArmor ? baseArmor.getArmorElements()["fire"].value : 0, value: 0, mod: modsData.fire },
            electricity: { base: baseArmor ? baseArmor.getArmorElements()["electricity"].value : 0, value: 0, mod: modsData.electricity },
            radiation: { base: baseArmor ? baseArmor.getArmorElements()["radiation"].value : 0, value: 0, mod: modsData.radiation },
            hardened: baseArmor ? baseArmor.isHardened() : false,
            label: baseArmor ? baseArmor.getName() : ""
        };

        // Calculate final armor values
        Helpers.calculateArmorTotals(armorData);

        // Overwrite the original data with the calculated values
        Object.assign(system.armor, armorData);
    }

    /**
     * Collects all modifications from the equipped accessories and returns them as a structured object.
     * 
     * @param accessoryArmors A list of equipped armor accessories.
     * @returns A structured object containing all collected modifications.
     */
    private static collectArmorMods(
        accessoryArmors: SR5ItemDataWrapper[] = []
    ): { armor: { name: string; value: number }[], acid: { name: string; value: number }[], cold: { name: string; value: number }[], fire: { name: string; value: number }[], electricity: { name: string; value: number }[], radiation: { name: string; value: number }[] } {
        const modsData = {
            armor: [] as { name: string; value: number }[],
            acid: [] as { name: string; value: number }[],
            cold: [] as { name: string; value: number }[],
            fire: [] as { name: string; value: number }[],
            electricity: [] as { name: string; value: number }[],
            radiation: [] as { name: string; value: number }[]
        };
    
        // Collect modifications from all armor accessories
        for (const accessory of accessoryArmors) {
            if (accessory.getArmorValues().value !== 0) {
                modsData.armor.push({ name: accessory.getName(), value: accessory.getArmorValues().value });
            }
            
            for (const element of ["acid", "cold", "fire", "electricity", "radiation"]) {
                const elementValue = accessory.getArmorElements()[element].value;
                if (elementValue !== 0) {
                    modsData[element as keyof typeof modsData].push({ name: accessory.getName(), value: elementValue });
                }
            }
        }
    
        return modsData;
    }

    /**
     * Determines which armor pieces are currently equipped.
     * This selects a single base armor and tracks accessories separately.
     *
     * @param items The list of items owned by the actor.
     * @returns The selected base armor and a Map containing relevant accessories.
     */
    private static determineUsedArmor(items: SR5ItemDataWrapper[]): { baseArmor?: SR5ItemDataWrapper, accessoryArmors: SR5ItemDataWrapper[] } {
        let baseArmor: SR5ItemDataWrapper | undefined;
        const accessoryArmors: SR5ItemDataWrapper[] = [];

        // Filtere ausgerüstete Rüstungsteile
        const equippedArmor = items.filter((item) => item.couldHaveArmor() && item.isEquipped());

        equippedArmor.forEach((item) => {
            if (item.hasArmorAccessory()) {
                accessoryArmors.push(item);
            } else if (!baseArmor || item.getArmorValues().value > baseArmor.getArmorValues().value) {
                baseArmor = item;
            }
        });

        return { baseArmor, accessoryArmors };
    }

    /**
     * Apply all changes to an actor by their 'ware items.
     * 
     * Modify essence by items essence loss
     */
    static prepareWareEssenceLoss(system: ActorTypesData, items: SR5ItemDataWrapper[]) {
        const parts = new PartsList<number>(system.attributes.essence.mod);

        items
            .filter((item) => item.isBodyware() && item.isEquipped())
            .forEach((item) => {
                if (item.getEssenceLoss()) {
                    parts.addPart(item.getName(), -item.getEssenceLoss());
                }
            });

        system.attributes.essence.mod = parts.list;
    }
}
