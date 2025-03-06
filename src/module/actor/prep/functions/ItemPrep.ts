import { SR5ItemDataWrapper } from '../../../data/SR5ItemDataWrapper';
import { Helpers } from '../../../helpers';
import { PartsList } from '../../../parts/PartsList';
import ArmorActorData = Shadowrun.ArmorActorData;
import { SR5 } from "../../../config";
import ActorTypesData = Shadowrun.ShadowrunActorDataData;
import { DataDefaults } from '../../../data/DataDefaults';

//TODO: Thogrim Hier passiert die Armormagie
export class ItemPrep {
    /**
     * Prepare the armor data for the Item
     * - will only allow one "Base" armor item to be used (automatically takes the best one if multiple are equipped)
     * - all "accessories" will be added to the armor
     */


    /**
     * Prepare the armor data for the actor.
     * This method selects a base armor, processes accessories, modifications, and calculates armor values.
     */
    //TODO: Thogrim Rüstungsberchnung
    static prepareArmor(system: ActorTypesData & ArmorActorData, items: SR5ItemDataWrapper[]) {
        const { armor } = system;

        Object.assign(armor, DataDefaults.actorArmor());

        const usedArmor = this.determineUsedArmor(armor, items);

        // Apply elemental modifiers of all used armor
        this.applyElementalResistances(armor, usedArmor);

        Helpers.calculateArmorTotals(armor);
    }

    /**
     * Determines which armor pieces are currently equipped.
     * This selects a single base armor and tracks accessories separately.
     *
     * @param armor The actor's armor data.
     * @param items The list of items owned by the actor.
     * @returns A Map containing the selected base armor and any relevant accessories.
     */
    //TODO: Thogrim Rüstungsberechnung
    private static determineUsedArmor(
        armor: Shadowrun.ActorArmor,
        items: SR5ItemDataWrapper[]
    ): Map<string, SR5ItemDataWrapper> {
        const usedArmor = new Map<string, SR5ItemDataWrapper>();
        const equippedArmor = items.filter((item) => item.couldHaveArmor() && item.isEquipped());

        let baseArmor: SR5ItemDataWrapper | undefined;
        const accessoryArmors: SR5ItemDataWrapper[] = [];

        equippedArmor.forEach((item) => {

            if (item.couldHaveArmor()) {
                if (item.hasArmorAccessory()) {
                    accessoryArmors.push(item);
                } else {
                    if (!baseArmor || item.getArmorValues().value > baseArmor.getArmorValues().value) {
                        baseArmor = item;
                    }
                }
            }
        });

        if (baseArmor) {
            armor.armor.base = baseArmor.getArmorValues().value;  
            armor.label = baseArmor.getName();
            armor.hardened = baseArmor.isHardened();
            usedArmor.set(baseArmor.getId(), baseArmor);
        }

        accessoryArmors.forEach((item) => {
            usedArmor.set(item.getId(), item);
        });

        return usedArmor;
    }

    /**
     * Apply elemental resistances based on used armor and modifications.
     */
    //TODO: Thogrim Rüstungsberechnung
    private static applyElementalResistances(
        armor: Shadowrun.ActorArmor,
        usedArmor: Map<string, SR5ItemDataWrapper>
    ) {
        const elementModParts: Record<string, PartsList<number>> = {
            acid: new PartsList<number>(),
            cold: new PartsList<number>(),
            fire: new PartsList<number>(),
            electricity: new PartsList<number>(),
            radiation: new PartsList<number>()
        };

        usedArmor.forEach((item) => {

            Object.keys(elementModParts).forEach((element) => {

                const elementData = item.getArmorElements()[element];

                if (!armor[element]) {
                    armor[element] = { base: 0, value: 0, mod: [] };
                }


                if (item.hasArmorBase()) {
                    armor[element].base = elementData.base;
                } else {
                    elementModParts[element].addUniquePart(item.getName(), elementData.value);
                    armor[element].mod = [...armor[element].mod, ...elementData.mod];
                }
            });
        });

        Object.keys(elementModParts).forEach((element) => {
            armor[element].mod = elementModParts[element].list;
        });
    }

    /**
     * Calculate the total values for armor and its elemental resistances.
     */
    // TODO: Thogrim Rüstungsberechnung
    static calculateArmorValues(armor: Shadowrun.ActorArmor) {

        armor.armor.value = Helpers.calcTotal(armor.armor);

        (["fire", "electricity", "cold", "acid", "radiation"] as const).forEach((element) => {
            if (armor[element]) {
                armor[element].value = Helpers.calcTotal(armor[element]);
            }
        });
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
