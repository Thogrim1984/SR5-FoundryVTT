import { Helpers } from "../../../helpers";
import { PartsList } from "../../../parts/PartsList";
import { Translation } from "../../../utils/strings";
import { SR5Item } from "../../SR5Item";

/**
 * Armor data preparation for all modifiable values.
 */
export const ArmorPrep = {
    /**
     * Calculate the modifiable values of armor.
     * 
     * @param armor The armor section to be altered
     * @param equippedMods Those item mods that are equipped.
     */
    prepareData(armor: Partial<Shadowrun.ArmorPartData>, equippedMods: SR5Item[]) {

        armor.armor = Object.assign(armor.armor ?? {}, { base: armor.armor?.base ?? 0, value: armor.armor?.value ?? 0, mod: armor.armor?.mod ?? [] });
        armor.acid = Object.assign(armor.acid ?? {}, { base: armor.acid?.base ?? 0, value: armor.acid?.value ?? 0, mod: armor.acid?.mod ?? [] });
        armor.cold = Object.assign(armor.cold ?? {}, { base: armor.cold?.base ?? 0, value: armor.cold?.value ?? 0, mod: armor.cold?.mod ?? [] });
        armor.fire = Object.assign(armor.fire ?? {}, { base: armor.fire?.base ?? 0, value: armor.fire?.value ?? 0, mod: armor.fire?.mod ?? [] });
        armor.electricity = Object.assign(armor.electricity ?? {}, { base: armor.electricity?.base ?? 0, value: armor.electricity?.value ?? 0, mod: armor.electricity?.mod ?? [] });
        armor.radiation = Object.assign(armor.radiation ?? {}, { base: armor.radiation?.base ?? 0, value: armor.radiation?.value ?? 0, mod: armor.radiation?.mod ?? [] });
        armor.hardened = armor.hardened ?? false;

        const modLists: Record<string, PartsList<number>> = {
            armorValue: new PartsList<number>(),
            acid: new PartsList<number>(),
            cold: new PartsList<number>(),
            fire: new PartsList<number>(),
            electricity: new PartsList<number>(),
            radiation: new PartsList<number>()
        };

        equippedMods.forEach((modification) => {
            const mod = modification.asArmorModification();
            if (!mod) return;

            if (mod.system.armorMod.armor_value && mod.system.armorMod.armor_value !== 0) {
                modLists.armorValue.addPart(mod.name as string, mod.system.armorMod.armor_value);
            }

            (["acid", "cold", "fire", "electricity", "radiation"] as const).forEach((key) => {
                const modValue = mod.system.armorMod[key];
                if (modValue && modValue !== 0) {
                    modLists[key].addPart(mod.name as string, modValue);
                }
            });

            if (mod.system.armorMod.hardened) {
                armor.hardened = true;
            }
        });

        armor.armor.mod = modLists.armorValue.list;

        (Object.keys(modLists) as Array<keyof typeof modLists>).forEach((key) => {
            if(key === "armorValue") return;

            armor[key].mod = modLists[key].list;
        });

        armor = Helpers.calculateArmorTotals(armor as Shadowrun.ArmorPartData);
    }
}