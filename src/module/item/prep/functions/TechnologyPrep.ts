import { Helpers } from "../../../helpers";
import { PartsList } from "../../../parts/PartsList";
import { SR5Item } from "../../SR5Item";

/**
 * Item data preparation around the 'technology' template.json item template.
 */
export const TechnologyPrep = {
    /**
     * Calculate the device condition monitor
     * 
     * See SR5#228 'Matrix Damage'
     * @param technology The system technology section to be altered
     */
    prepareConditionMonitor(technology: Shadowrun.TechnologyData) {        
        // taMiF: This seems to be legacy code to avoid a migration.
        //        Leave it in, as it doesn't hurt for now.
        if (technology.condition_monitor === undefined) {
            technology.condition_monitor = { value: 0, max: 0, label: '' };
        }
        
        const rating = typeof technology.rating === 'string' ? 0 : technology.rating;
        technology.condition_monitor.max = 8 + Math.ceil(rating / 2);
    },

    /**
     * Routes to the modifiable values in TechnologyData to hold the itemprep section cleaner.
     * 
     * @param technology The system technology section to be altered
     * @param equippedMods Those item mods that are equipped.
     */
    prepareData(technology: Shadowrun.TechnologyData, equippedMods: SR5Item[]) {
        this.prepareConditionMonitor(technology);
        this.prepareConceal(technology, equippedMods);
        this.prepareCapacity(technology, equippedMods);
    },

    /**
     * Calculate a devices ability to conceal.
     * 
     * See SR5#419 'Concealing Gear'
     * @param technology The system technology section to be altered
     * @param equippedMods Those item mods that are equipped.
     */
    prepareConceal(technology: Shadowrun.TechnologyData, equippedMods: Map<string, SR5Item>) {
        // Calculate conceal data.
        if (!technology.conceal) technology.conceal = {base: 0, value: 0, mod: []};

        const concealParts = new PartsList<number>();
        equippedMods.forEach((mod) => {
            if (mod.system.technologyMod?.conceal  && mod.system.technologyMod?.conceal != 0) {
                concealParts.addUniquePart(mod.name as string, mod.system.technologyMod?.conceal);
            }
        });

        technology.conceal.mod = concealParts.list;
        technology.conceal.value = Helpers.calcTotal(technology.conceal);
    },

    /**
     * Calculate the capacity as max/value.
     * 
     * @param technology The system technology section to be altered
     * @param equippedMods Those item mods that are equipped.
     */
    prepareCapacity(technology: Shadowrun.TechnologyData, equippedMods: Map<string, SR5Item>) {
        // Calculate capacity data.
        if (!technology.capacity) technology.capacity = {max: 0, value: 0};

        equippedMods.forEach((mod) => {            
            const modification = mod.asModification();
            if (!modification) return;
            if (mod.system.technologyMod?.capacity  && mod.system.technologyMod?.capacity != 0) {
                technology.capacity.value += modification.system.technologyMod?.capacity
            }
            if (mod.system.technologyMod?.capacity_max  && mod.system.technologyMod?.capacity_max != 0) {
                technology.capacity.max += modification.system.technologyMod?.capacity_max
            }
        });
    }
}