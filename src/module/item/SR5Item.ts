import { RangedWeaponRules } from './../rules/RangedWeaponRules';
import { SR5Actor } from '../actor/SR5Actor';
import { createItemChatMessage } from '../chat';
import { DEFAULT_ROLL_NAME, FLAGS, SYSTEM_NAME } from '../constants';
import { DataDefaults } from "../data/DataDefaults";
import { SR5ItemDataWrapper } from '../data/SR5ItemDataWrapper';
import { Helpers } from '../helpers';
import { PartsList } from '../parts/PartsList';
import { MatrixRules } from "../rules/MatrixRules";
import { TestCreator } from "../tests/TestCreator";
import { ChatData } from './ChatData';
import { NetworkDeviceFlow } from "./flows/NetworkDeviceFlow";
import { HostDataPreparation } from "./prep/HostPrep";
import ModifiableValue = Shadowrun.ModifiableValue;
import ModList = Shadowrun.ModList;
import AttackData = Shadowrun.AttackData;
import FireModeData = Shadowrun.FireModeData;
import SpellForceData = Shadowrun.SpellForceData;
import ComplexFormLevelData = Shadowrun.ComplexFormLevelData;
import FireRangeData = Shadowrun.FireRangeData;
import BlastData = Shadowrun.BlastData;
import ConditionData = Shadowrun.ConditionData;
import ActionRollData = Shadowrun.ActionRollData;
import SpellData = Shadowrun.SpellData;
import WeaponData = Shadowrun.WeaponData;
import AmmoData = Shadowrun.AmmoData;
import TechnologyData = Shadowrun.TechnologyData;
import RangeWeaponData = Shadowrun.RangeWeaponData;
import SpellRange = Shadowrun.SpellRange;
import CritterPowerRange = Shadowrun.CritterPowerRange;
import ShadowrunItemData = Shadowrun.ShadowrunItemData;
import ActionItemData = Shadowrun.ActionItemData;
import AdeptPowerItemData = Shadowrun.AdeptPowerItemData;
import AmmoItemData = Shadowrun.AmmoItemData;
import ArmorItemData = Shadowrun.ArmorItemData;
import ComplexFormItemData = Shadowrun.ComplexFormItemData;
import ContactItemData = Shadowrun.ContactItemData;
import CritterPowerItemData = Shadowrun.CritterPowerItemData;
import CyberwareItemData = Shadowrun.CyberwareItemData;
import DeviceItemData = Shadowrun.DeviceItemData;
import EquipmentItemData = Shadowrun.EquipmentItemData;
import LifestyleItemData = Shadowrun.LifestyleItemData;
import ModificationItemData = Shadowrun.ModificationItemData;
import ProgramItemData = Shadowrun.ProgramItemData;
import QualityItemData = Shadowrun.QualityItemData;
import SinItemData = Shadowrun.SinItemData;
import SpellItemData = Shadowrun.SpellItemData;
import SpritePowerItemData = Shadowrun.SpritePowerItemData;
import WeaponItemData = Shadowrun.WeaponItemData;
import HostItemData = Shadowrun.HostItemData;
import ActionResultData = Shadowrun.ActionResultData;
import ActionTestLabel = Shadowrun.ActionTestLabel;
import MatrixMarks = Shadowrun.MatrixMarks;
import RollEvent = Shadowrun.RollEvent;
import ShadowrunItemDataData = Shadowrun.ShadowrunItemDataData;
import { DocumentModificationOptions } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs";
import { LinksHelpers } from '../utils/links';
import { TechnologyPrep } from './prep/functions/TechnologyPrep';
import { SinPrep } from './prep/SinPrep';
import { ActionPrep } from './prep/functions/ActionPrep';
import { RangePrep } from './prep/functions/RangePrep';
import { AdeptPowerPrep } from './prep/AdeptPowerPrep';

/**
 * WARN: I don't know why, but removing the usage of ActionResultFlow from SR5Item
 * causes esbuild (I assume) to re-order import dependencies resulting in vastly different orders of execution within transpiled bundle.js code, 
 * resulting OpposedTest not finding SuccessTest (undefined) when extending it.
 * 
 * ... I'd love to remove this, or even just comment it, but tree-shaking will do it's job.
 * 
 * Should you read this: Try it anyway and open any actor sheet. If it's not broken, the build issue must've been fixed somehow.
 * 
 * An esbuild update might fix this, but caused other issues at the time... Didn't fix it with esbuild@0.15.14 (20.11.2022)
 * NOTE: still not fixed with esbuild@0.19.5
 */
import { ActionResultFlow } from './flows/ActionResultFlow';
import { UpdateActionFlow } from './flows/UpdateActionFlow';
import { ArmorPrep } from './prep/functions/ArmorPrep';
import Template from '../template';

ActionResultFlow; // DON'T TOUCH!

/**
 * Implementation of Shadowrun5e items (owned, unowned and nested).
 *
 *       tamIf here: The current legacy nested items approach has been cleaned up a bit but is still causing some issues
 *       with typing and ease of use.
 *
 *       SR5Item._items currently overwrites foundries internal DocumentCollection mechanism of nested documents. Partially
 *       due to legacy reasons and since Foundry 0.8 SR5Item.update can't be used for nested items in items anymore.
 *
 *        At the moment this means, that this.actor can actually be an SR5Actor as well as an SR5Item, depending on who
 *       'owns' the nested item as they are created using Item.createOwned during the nested item prep phase.
 *
 *       For this reason SR5Item.actorOwner has been introduced to allow access to the actual owning actor, no matter
 *       how deep nested into other items an item is.
 *
 *       Be wary of SR5Item.actor for this reason!
 */
export class SR5Item extends Item {
    // Item._items isn't the Foundry default ItemCollection but is overwritten within prepareNestedItems
    // to allow for embedded items in items in actors.
    private _items: Map<string, SR5Item> = new Map<string, SR5Item>();



    // Item Sheet labels for quick info on an item dropdown.
    labels: {} = {};

    // Add v10 type helper
    system: ShadowrunItemDataData; // TODO: foundry-vtt-types v10

    /**
     * Return the owner of this item, which can either be
     * - an actor instance (Foundry default)
     * - an item instance (shadowrun custom) for embedded items
     *
     * If you need the actual actor owner, no matter how deep into item embedding, this current item is use SR5item.actorOwner
     */
    override get actor(): SR5Actor {
        return super.actor as unknown as SR5Actor;
    }

    /**
     * Helper property to get an actual actor for an owned or embedded item. You'll need this for when you work with
     * embeddedItems, as they have their .actor property set to the item they're embedded into.
     *
     * NOTE: This helper is necessary since we have setup embedded items with an item owner, due to the current embedding
     *       workflow using item.update.isOwned condition within Item.update (foundry Item) to NOT trigger a global item
     *       update within the ItemCollection but instead have this.actor.updateEmbeddedEntities actually trigger SR5Item.updateEmbeddedEntities
     */
    get actorOwner(): SR5Actor | undefined {
        // An unowned item won't have an actor.
        if (!this.actor) return;
        // An owned item will have an actor.
        if (this.actor instanceof SR5Actor) return this.actor;
        // An embedded item will have an item as an actor, which might have an actor owner.
        // NOTE: This is very likely wrong and should be fixed during embedded item prep / creation. this.actor will only
        //       check what is set in the items options.actor during it's construction.
        //@ts-expect-error
        return this.actor.actorOwner;
    }

    private get wrapper(): SR5ItemDataWrapper {
        // we need to cast here to unknown first to make ts happy
        return new SR5ItemDataWrapper(this as unknown as ShadowrunItemData);
    }

    // #region Fire mode flags
    // Flag Functions
    getLastFireMode(): FireModeData {
        return this.getFlag(SYSTEM_NAME, FLAGS.LastFireMode) as FireModeData || DataDefaults.fireModeData();
    }
    async setLastFireMode(fireMode: FireModeData) {
        return this.setFlag(SYSTEM_NAME, FLAGS.LastFireMode, fireMode);
    }
    getLastSpellForce(): SpellForceData {
        return this.getFlag(SYSTEM_NAME, FLAGS.LastSpellForce) as SpellForceData || { value: 0 };
    }
    async setLastSpellForce(force: SpellForceData) {
        return this.setFlag(SYSTEM_NAME, FLAGS.LastSpellForce, force);
    }
    getLastComplexFormLevel(): ComplexFormLevelData {
        return this.getFlag(SYSTEM_NAME, FLAGS.LastComplexFormLevel) as ComplexFormLevelData || { value: 0 };
    }
    async setLastComplexFormLevel(level: ComplexFormLevelData) {
        return this.setFlag(SYSTEM_NAME, FLAGS.LastComplexFormLevel, level);
    }
    getLastFireRangeMod(): FireRangeData {
        return this.getFlag(SYSTEM_NAME, FLAGS.LastFireRange) as FireRangeData || { value: 0 };
    }
    async setLastFireRangeMod(environmentalMod: FireRangeData) {
        return this.setFlag(SYSTEM_NAME, FLAGS.LastFireRange, environmentalMod);
    }
    getEmbeddedItemFlags(): any[] | [] {
        const flagData = (this.getFlag(SYSTEM_NAME, FLAGS.EmbeddedItems) as any[] || [])
            .map(item => {
                const data = DataDefaults.baseEntityData<Shadowrun.ModificationItemData | AmmoItemData, Shadowrun.ModificationData | AmmoData>(
                    "Item",
                    { ...item, type: item.type ?? "" }
                )

                return { ...data, _id: item._id ?? foundry.utils.randomID() };

            });

        return flagData;
    }
    async setEmbeddedItemFlags(items: Partial<Shadowrun.ModificationItemData | Shadowrun.AmmoItemData>[]) {
        return this.setFlag(SYSTEM_NAME, FLAGS.EmbeddedItems, items)
    }
    // #endregion

    // #region Nested Items
    /**
   * Centralized method to manage nested items.
   * 
   * Available actions:
   * - `"set"`: Replaces all nested items with a new set.
   * - `"clear"`: Removes all nested items.
   * - `"create"`: Adds one or more new nested items.
   * - `"update"`: Updates one or more existing nested items.
   * - `"delete"`: Removes a nested item by its ID.
   * 
   * @param {string} action - The action to perform: "set" | "clear" | "create" | "update" | "delete"
   * @param {any | any[]} data - Depending on the action:
   *   - `"set"`: A Map of itemData (`Map<string, any>` keyed with `id`) or null (new Map will be created)
   *   - `"clear"`: `null`
   *   - `"create"`: A single item or an array of items
   *   - `"update"`: A single update object or an array of updates
   *   - `"delete"`: A string representing the item ID
    * @param {object} [options={}] - Additional options for item creation.
   */
    private async _modifyNestedItems(action: "set" | "clear" | "create" | "update" | "delete", data?: any | any[], options = {}): Promise<boolean> {
        // TODO: Thogrim Hier nochmal genauer durchgehen.
        //@ts-expect-error v10
        let items = new Map(Array.from(this.getNestedItems()).map(([, item]) => [item.id, item._source]));

        let isModified = false;

        const validNestedTypes: Record<string, string[]> = {
            weapon: ['modification', 'ammo'],
            armor: ['modification'],
            bodyware: ['modification'],
            equipment: ['modification'],
            device: ['modification']
        };

        switch (action) {
            case "set":
                if (data && !(data instanceof Map)) return false;
                items = data ?? new Map<string, any>();
                isModified = true;
                break;

            case "clear":
                if (items.size === 0) {
                    return false;
                }
                items.clear();
                isModified = true;
                break;

            case "create":
                if (!data) return false;

                if (!Array.isArray(data)) data = [data];

                const allowedTypes = validNestedTypes[this.type];

                data.forEach((ogItem) => {

                    const itemType = ogItem.system?.type ?? "";
                    const isAmmo = ogItem.type === 'ammo';
                    const isValidModification = ogItem.type === 'modification' && itemType === this.type as string;

                    if (allowedTypes.includes(ogItem.type) && (isAmmo || isValidModification)) {
                        if (ogItem?.system?.technology?.equipped) {
                            ogItem.system.technology.equipped = false;
                        }

                        const item = foundry.utils.mergeObject(ogItem, { _id: randomID(16), ...options });

                        items.set(item.id, item);
                    }
                });
                isModified = true;
                break;

            case "update":
                if (!data || data.length === 0) return false;
                if (!Array.isArray(data)) data = [data];

                data.forEach(updateData => {
                    const item = items.get(updateData._id);
                    if (!item) return;

                    // TODO: The _id field has been added by the system. Even so, don't change the id to avoid any byproducts.
                    delete updateData._id;

                    updateData = expandObject(updateData);
                    foundry.utils.mergeObject(item, updateData);

                    console.warn("updateData", updateData);
                    console.warn("item", item);
                });
                isModified = true;
                break;

            case "delete":
                if (typeof data !== "string") return false;
                if (!items.has(data)) return false;
                items.delete(data);
                isModified = true;
                break;

            default:
                throw new Error(`Shadowrun5e | modifyNestedItems: Unknown action '${action}'`);
        }

        for (const [key, item] of items) {
            if (!item._id) {
                const newId = randomID(16);
                console.warn(`Shadowrun 5e | Assigning new ID to item '${item.name}': ${newId}`);
                item._id = newId;
                items.set(newId, item); // Add item with new ID
                items.delete(key); // Remove old entry with missing ID
            }
        }

        if(isModified) {
            if (action === "clear" && items.size === 0) {
                await this.unsetFlag(SYSTEM_NAME, FLAGS.EmbeddedItems);
            } else {
                await this.setEmbeddedItemFlags(Array.from(items.values()));
            }
            
            await new Promise(resolve => setTimeout(resolve, 15));

            await this.refreshCachedItems(Array.from(items.values()));

            this.render(false);
        }

        return isModified;
    }



    /**
    * Returns a detached copy of the embedded item data.
    *
    * - Retrieves nested items from `this._items` but returns a new Map(), ensuring that modifications to the returned data do not affect the original structure.
    * - The returned Map is not truly readonly, but direct modifications will not persist and do not update the stored data.
    * - To make persistent changes, use _modifyNestedItems(), which should only be accessed via designated functions.
    * - Ensures effects is always an array, even if Foundry stored it incorrectly.
    *
    * @returns {Map<string, SR5Item>} A copy of the nested items (keyed by `id`), isolated from the original storage.
    */
    // TODO: Thogrim bearbeitet
    getNestedItems(): Map<string, SR5Item> {
        if (this._items.size > 0) {
            return new Map(this._items);
        }

        const items = this.getEmbeddedItemFlags() ?? [];

        if (!items || items.length === 0) {
            this._items = new Map();
            return new Map(this._items);
        }

        this._items = new Map();

        items.forEach((item: any) => {
            // Convert effects array if necessary
            if (item.effects && !Array.isArray(item.effects)) {
                item.effects = Helpers.convertIndexedObjectToArray(item.effects);
            }

            let nestedItem: SR5Item;

            if (item instanceof SR5Item) {
                nestedItem = item;
            } else {
                nestedItem = new SR5Item(item, { parent: this as unknown as SR5Actor });
            }

            this._items.set(nestedItem.id!, nestedItem);
        });

        return new Map(this._items);
    }
    // #region überarbeitet

    // #endregion


    /**
    * Prepare embedded items, ensuring correct ownership and data updates.
    *
    */
    //TODO: Thogrim bearbeitet
    prepareNestedItems() {
        //TODO: Thogrim Falls es damit Probleme gibt, wieder in get     
        if (!(this._items instanceof Map)) {
            this._items = new Map();
        }

        const nestedItems = this.getNestedItems();
        if (nestedItems.size === 0) {
            return;
        }

        // Merge and overwrite existing owned items with new changes.
        nestedItems.forEach((item, id) => {
            // Set user permissions to owner, to allow none-GM users to edit their own nested items.
            //@ts-expect-error v10
            const ownershipData = game.user ? { ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER } } :
                {};
            const updatedData = foundry.utils.mergeObject(item, ownershipData);

            if (JSON.stringify(item) === JSON.stringify(updatedData)) {
                return;
            }

            // Update DocumentData directly, since we're not really having database items here.
            const existingItem = this._items.get(id)!;
            // @ts-expect-error TODO: I have no idea, why updateSource "not exists on SR5Item"
            existingItem.updateSource(updatedData);
            existingItem.prepareData();
        });
    }





    // #region definitiv fertig
    get _isNestedItem(): boolean {
        return this.hasOwnProperty('parent') && this.parent instanceof SR5Item;
    }

    /**
    * Retrieves an owned item by its ID.
    *
    * @param {string} itemId - The ID of the item to retrieve.
    * @return {SR5Item | undefined} The found item or `undefined` if not found.
    */
    // TODO: Thogrim bearbeitet
    getNestedItem(itemId: string): SR5Item | undefined {
        return this.getNestedItems().get(itemId);
    }

    /**
    * Stores the given Map of embedded items in flags.
    *
    *  @param {Map<string, SR5Item>} items - Key: `_id`
    *  @return {Promise<void>}
    */
    // TODO: Thogrim bearbeitet
    async setNestedItems(items: Map<string, SR5Item>) {
        this._modifyNestedItems("set", items);
    }

    //TODO: Thogrim bearbeitet
    async clearNestedItems() {
        this._modifyNestedItems("clear");
    }

    /**
    * Creates a new nested item inside this item.
    *
    * @param {any | any[]} itemData - A single item or an array of items to be added.
    * @param {object} [options={}] - Additional options for item creation. Actually not in use
    * @returns {Promise<boolean>} Resolves `true` if items were successfully created.
    */
    //TODO: Thogrim bearbeitet
    async createNestedItem(itemData: any | any[], options = {}) {
        return this._modifyNestedItems("create", itemData, options);
    }

    /**
    * Updates nested items by applying the given changes.
    *
    * @param {any | any[]} changes - A single change object or an array of changes to apply.
    */
    //TODO: Thogrim bearbeitet
    async updateNestedItems(changes: any | any[]) {
        this._modifyNestedItems("update", changes);
    }

    /**
     * Hook into the Item.update process for embedded items.
     *
     * @param data changes made to the SR5ItemData
     */
    private async _syncWithParentItem(data): Promise<this> {
        if (!this.parent || this.parent instanceof SR5Actor) return this;
        // Inform the parent item about changes to one of it's embedded items.
        // TODO: updateOwnedItem needs the id of the update item. hand the item itself over, to the hack within updateOwnedItem for this.
        data._id = this.id;


        // Shadowrun Items can contain other items, while Foundry Items can't. Use the system local implementation for items.
        // @ts-expect-error
        await this.parent.updateNestedItems(data);

        // After updating all item embedded data, rerender the sheet to trigger the whole rerender workflow.
        // Otherwise changes in the template of an hiddenItem will show for some fields, while not rerendering all
        // #if statements (hidden fields for other values, won't show)
        await this.sheet?.render(false);

        return this;
    }

    /**
    * Removes an owned item from the nested items list.
    *
    * - Throws an error if the item to be deleted does not exist.
    *
    * @param {string | number} deleteData - The ID of the item to be removed.
    * @return {Promise<boolean>} Resolves `true` if the item was successfully deleted.
    */
    // TODO: Thogrim bearbeitet
    async deleteOwnedItem(deleteData) {
        this._modifyNestedItems("delete", deleteData)
    }

    //TODO: Thogrim bearbeitet
    getEquippedAmmo(): SR5Item | undefined {
        for (const [id, item] of this.getNestedItems()) {
            if (item.isAmmo && item.isEquipped()) {
                return item; // There is just one possible equipped ammo item
            }
        }
        return undefined;
    }

    // TODO: Thogrim bearbeitet
    private async _equipNestedItem(id: string, type: string, options: { unequipOthers?: boolean, toggle?: boolean } = {}) {
        const unequipOthers = options.unequipOthers || false;
        const toggle = options.toggle || false;

        // Collect all item data and update at once.
        const updateData: any[] = [];

        for (const [itemId, item] of this.getNestedItems()) {
            if (item.type !== type) continue;
            if (!unequipOthers && itemId !== id) continue;

            //@ts-expect-error TODO: foundry-vtt-types v10
            const equip = toggle ? !item.system.technology.equipped : itemId === id;
            updateData.push({ _id: itemId, "system.technology.equipped": equip });
        }

        if (updateData.length > 0) {
            await this._modifyNestedItems("update", updateData);
        }
    }

    /**
     * Toggle equipment state of a single Modification item.
     * @param iid Modification item id to be equip toggled
     */
    // TODO: Thogrim bearbeitet
    async equipMod(iid: string) {
        await this._equipNestedItem(iid, "modification", { unequipOthers: false, toggle: true });
    }

    /**
     * Equip one ammo item exclusively.
     * 
     * @param id Item id of the to be exclusively equipped ammo item.
     */
    async equipAmmo(id) {
        await this._equipNestedItem(id, 'ammo', { unequipOthers: true });
    }

    // TODO: Thogrim bearbeitet
    getEquippedMods(): Map<string, SR5Item> {
        const equippedMods = new Map<string, SR5Item>();

        for (const [id, item] of this.getNestedItems()) {
            if (item.isModification && item.isEquipped()) {
                equippedMods.set(id, item);
            }
        }

        return equippedMods;
    }

    /**
   * Refreshes the cached `_items` map with the latest embedded item data from flags.
   * 
   * This method ensures that `_items` is only updated when necessary to avoid unnecessary processing.
   *
   * @param {any[]} updatedItems - The new embedded items data from flags.
   */
    async refreshCachedItems(updatedItems: any[]) {
        if (!Array.isArray(updatedItems)) return;

        // Convert current _items Map to an array of raw data objects
        const currentItems = Array.from(this.getNestedItems().values()).map(item => item.toObject());

        // Compare JSON to avoid unnecessary updates
        // if (JSON.stringify(currentItems) === JSON.stringify(updatedItems)) {
        //     return;
        // }

        // Overwrite _items with the new data, ensuring we create SR5Item instances
        this._items = new Map(updatedItems.map(item => {
            const newItem = new SR5Item(item, { parent: this as unknown as SR5Actor });
            return [newItem.id!, newItem];
        }));

        // Trigger any necessary updates
        this.prepareData();
    }
    // #endregion

    // #endregion

    //#region action related
    get hasOpposedRoll(): boolean {
        const action = this.getAction();
        if (!action) return false;
        return !!action.opposed.test;
    }

    get hasRoll(): boolean {
        const action = this.getAction();
        return !!(action && action.type !== '' && (action.skill || action.attribute || action.attribute2 || action.dice_pool_mod));
    }

    /**
     * Determine if a blast area should be placed using FoundryVTT area templates.
     */
    get hasBlastTemplate(): boolean {
        return this.isAreaOfEffect;
    }

    /**
     * Cast the action of this item as a Test.
     *
     * @param event A PointerEvent by user interaction.
     */
    async castAction(event?: RollEvent) {
        // Only show the item's description by user intention or by lack of testability.
        const dontRollTest = TestCreator.shouldPostItemDescription(event) || !this.hasRoll;
        if (dontRollTest) return await this.postItemCard();


        if (!this.actor) return;

        const showDialog = !TestCreator.shouldHideDialog(event);
        const test = await TestCreator.fromItem(this, this.actor, { showDialog });
        if (!test) return;
        await test.execute();
    }


    /**
     * Create display only information for this item. Used on sheets, chat messages and more.
     * Both actor and item sheets.
     * 
     * The original naming leans on the dnd5e systems use of it for chat messages.
     * NOTE: This is very legacy, difficult to read and should be improved upon.
     * 
     * @param htmlOptions 
     * @returns 
     */
    async getChatData(htmlOptions = {}) {
        const system = foundry.utils.duplicate(this.system);
        const { labels } = this;
        if (!system.description) system.description = { chat: '', source: '', value: '' };
        // TextEditor.enrichHTML will return null as a string, making later handling difficult.
        if (!system.description.value) system.description.value = '';
        system.description.value = await TextEditor.enrichHTML(system.description.value, { ...htmlOptions });

        const props = [];
        // Add additional chat data fields depending on item type.
        //@ts-expect-error // TODO: foundry-vtt-types v10 
        const chatDataForItemType = ChatData[this.type];
        if (chatDataForItemType) chatDataForItemType(system, labels, props, this);

        //@ts-expect-error // This is a hacky monkey patch solution to add a property to the item data
        //              that's not actually defined in any SR5Item typing.
        system.properties = props.filter((p) => !!p);

        return system;
    }

    getActionTestName(): string {
        const testName = this.getRollName();
        return testName ? testName : game.i18n.localize('SR5.Action');
    }

    /**
     * Any item implementation can define a set of modifiers to be applied when used within an opposed test.
     *
     * NOTE: This is a legacy method of applied modifiers to opposed tests but works fine for now.
     */
    getOpposedTestMod(): PartsList<number> {
        const parts = new PartsList<number>();

        if (this.hasOpposedTest()) {
            if (this.isAreaOfEffect) {
                parts.addUniquePart('SR5.Aoe', -2);
            }
        }

        return parts;
    }

    getBlastData(actionTestData?: any): BlastData | undefined {
        if (this.isSpell && this.isAreaOfEffect) {
            const system = this.system as unknown as SpellData;

            // By default spell distance is equal to it's Force.
            let distance = this.getLastSpellForce().value;

            // Except for predefined user test selection.
            if (actionTestData?.spell) {
                distance = actionTestData.spell.force;
            }

            // Extended spells have a longer range.
            if (system.extended) distance *= 10;
            const dropoff = 0;

            return {
                radius: distance,
                dropoff
            }

        } else if (this.isGrenade) {
            const system = this.system as WeaponData;

            const distance = system.thrown.blast.radius;
            const dropoff = system.thrown.blast.dropoff;

            return {
                radius: distance,
                dropoff
            }

        } else if (this.hasExplosiveAmmo) {
            const item = this.getEquippedAmmo();
            const ammo = item?.asAmmo;

            if (!ammo) return { radius: 0, dropoff: 0 };

            const distance = ammo.system.blast.radius;
            const dropoff = ammo.system.blast.dropoff;

            return {
                radius: distance,
                dropoff
            };
        }
    }

    isAction(): boolean {
        return this.wrapper.isAction();
    }

    asAction(): ActionItemData | undefined {
        if (this.isAction()) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ActionItemData;
        }
    }

    async rollOpposedTest(target: SR5Actor, attack: AttackData, event): Promise<void> {
        console.error(`Shadowrun5e | ${this.constructor.name}.rollOpposedTest is not supported anymore`);
    }

    async rollTestType(type: string, attack: AttackData, event, target: SR5Actor) {
        if (type === 'opposed') {
            await this.rollOpposedTest(target, attack, event);
        }
        if (type === 'action') {
            await this.castAction(event);
        }
    }

    /**
     * The item can be stored on a token on the current or another, given, scene.
     *
     * The chat message must contain a data attribute containing a 'SceneId.TokenId' mapping.
     * See chat.ts#getTokenSceneId for further context.
     *
     *
     * @param html
     */
    static getItemFromMessage(html): SR5Item | undefined {
        if (!game || !game.scenes || !game.ready || !canvas || !canvas.ready || !canvas.scene) return;

        const card = html.find('.chat-card');
        let actor;
        const sceneTokenId = card.data('tokenId');
        if (sceneTokenId) actor = Helpers.getSceneTokenActor(sceneTokenId);
        else actor = game.actors?.get(card.data('actorId'));

        if (!actor) return;
        const itemId = card.data('itemId');
        return actor.items.get(itemId);
    }

    static getTargets() {
        if (!game.ready || !game.user) return;
        const { character } = game.user;
        // @ts-expect-error
        const { controlled } = canvas.tokens;
        const targets = controlled.reduce((arr, t) => (t.actor ? arr.concat([t.actor]) : arr), []);
        if (character && controlled.length === 0) targets.push(character);
        if (!targets.length) throw new Error(`You must designate a specific Token as the roll target`);
        return targets;
    }

    getActionTests(): ActionTestLabel[] {
        if (!this.hasRoll) return []

        return [{
            label: this.getActionTestName(),
            uuid: this.uuid
        }];
    }

    getActionResult(): ActionResultData | undefined {
        if (!this.isAction()) return;

        return this.wrapper.getActionResult();
    }

    _canDealDamage(): boolean {
        // NOTE: Double negation to force boolean comparison casting.
        const action = this.getAction();
        if (!action) return false;
        return !!action.damage.type.base;
    }

    getAction(): ActionRollData | undefined {
        return this.wrapper.getAction();
    }

    getExtended(): boolean {
        const action = this.getAction();
        if (!action) return false;
        return action.extended;
    }

    getRollName(): string {
        if (this.isRangedWeapon) {
            return game.i18n.localize('SR5.RangeWeaponAttack');
        }
        if (this.isMeleeWeapon) {
            return game.i18n.localize('SR5.MeleeWeaponAttack');
        }
        if (this.isCombatSpell) {
            return game.i18n.localize('SR5.Spell.Attack');
        }
        if (this.isSpell) {
            return game.i18n.localize('SR5.Spell.Cast');
        }
        if (this.hasRoll) {
            return this.name as string;
        }

        return DEFAULT_ROLL_NAME;
    }

    /**
     * An attack with this weapon will create an area of effect / blast.
     * 
     * There is a multitude of possibilities as to HOW an item can create an AoE, 
     * both directly connected to the item and / or some of it's nested items.
     * 
     */
    get isAreaOfEffect(): boolean {
        return this.wrapper.isAreaOfEffect() || this.hasExplosiveAmmo;
    }

    getActionSkill(): string | undefined {
        return this.wrapper.getActionSkill();
    }

    getActionAttribute(): string | undefined {
        return this.wrapper.getActionAttribute();
    }

    getActionAttribute2(): string | undefined {
        return this.wrapper.getActionAttribute2();
    }

    getModifierList(): ModList<number> {
        return this.wrapper.getModifierList();
    }

    getActionSpecialization(): string | undefined {
        return this.wrapper.getActionSpecialization();
    }

    hasOpposedTest(): boolean {
        if (!this.hasOpposedRoll) return false;
        const action = this.getAction();
        if (!action) return false;
        return action.opposed.test !== '';
    }
    // #endregion


    /**
     * PREPARE DATA CANNOT PULL FROM this.actor at ALL
     * - as of foundry v0.7.4, actor data isn't prepared by the time we prepare items
     * - this caused issues with Actions that have a Limit or Damage attribute and so those were moved
     */
    override prepareData() {
        super.prepareData();
        this.prepareNestedItems();

        // Description labels might have changed since last data prep.
        // NOTE: this here is likely unused and heavily legacy.
        this.labels = {};

        // Collect the equipped modifying nested items.
        const equippedMods = this.getEquippedMods();
        const equippedAmmo = this.getEquippedAmmo();

        const technology = this.getTechnologyData();
        if (technology) {
            TechnologyPrep.prepareData(technology, equippedMods);
        }

        const action = this.getAction();
        if (action) {
            ActionPrep.prepareData(action, this, equippedMods, equippedAmmo);
        }

        const range = this.getWeaponRange();
        if (range && range.rc) {
            RangePrep.prepareData(range, equippedMods);
        }

        // Switch item data preparation between types...
        // ... this is ongoing work to clean up SR5item.prepareData
        switch (this.type) {
            case 'host':
                HostDataPreparation(this.system as Shadowrun.HostData);
                break;
            case 'adept_power':
                AdeptPowerPrep.prepareBaseData(this.system as unknown as Shadowrun.AdeptPowerData);
                break;
            case 'sin':
                SinPrep.prepareBaseData(this.system as unknown as Shadowrun.SinData);
                break;
            case 'armor':
                ArmorPrep.prepareData(this.system.armor as unknown as Partial<Shadowrun.ArmorPartData>, equippedMods)
        }
    }

    async postItemCard() {
        const options = {
            actor: this.actor,
            description: await this.getChatData(),
            item: this,
            previewTemplate: this.hasBlastTemplate,
            tests: this.getActionTests()
        };
        return await createItemChatMessage(options);
    }

    // #region Ammo related
    /**
     * Check if weapon has enough ammunition.
     *
     * @param rounds The amount of rounds to be fired
     * @returns Either the weapon has no ammo at all or not enough.
     */
    hasAmmo(rounds: number = 0): boolean {
        return this.ammoLeft >= rounds;
    }

    /**
     * Amount of ammunition this weapon has currently available
     */
    get ammoLeft(): number {
        const ammo = this.wrapper.getAmmo();
        if (!ammo) return 0;

        return ammo.current.value;
    }

    /**
     * Use the weapons ammunition with the amount of bullets fired.
     * @param fired Amount of bullets fired.
     */
    async useAmmo(fired) {
        if (this.type !== 'weapon') return;

        //@ts-expect-error // TODO: foundry-vtt-types v10 
        const value = Math.max(0, this.system.ammo.current.value - fired);
        return await this.update({ 'system.ammo.current.value': value });
    }

    /**
     * Can this item (weapon, melee, ranged, whatever) use ammunition?
     * 
     * @returns true, for weapons with ammunition.
     */
    get usesAmmo(): boolean {
        return this.system.ammo?.current.max !== 0 && this.system.ammo?.current.max !== null;
    }

    /**
     * Reload this weapon according to information in:
     * - its current clips
     * - its available spare clips (when given)
     * - its equipped ammo
     * 
     * This method will only reload the weapon to the max amount of ammo available.
     * 
     * TODO: Currently only the minimal amount of bullets is reloaded. For weapons using ejectable clips, this should be full clip capacity.
     */
    //TODO: Thogrim bearbeitet
    async reloadAmmo(partialReload: boolean) {
        const weapon = this.asWeapon;
        if (!weapon) return;

        // Prepare reloading by getting ammunition information.
        const ammo = this.getEquippedAmmo();
        const ammoItems = new Map<string, SR5Item>();
        this.getNestedItems().forEach((item, id) => {
            if (item.isAmmo) {
                ammoItems.set(id, item);
            }
        });

        const remainingBullets = Number(weapon.system.ammo.current.value);
        // Don't adhere to clip sizes, only reload from the point of capacity left.
        const missingBullets = Math.max(0, weapon.system.ammo.current.max - remainingBullets);
        // This checks how many rounds are required for a partial reload.
        const partialReloadBulletsNeeded = Math.min(weapon.system.ammo.current.max - remainingBullets, RangedWeaponRules.partialReload(weapon.system.ammo.clip_type, this.actor.getAttribute('agility').value));
        // If there aren't ANY ammo items, just use weapon max as to not enforce ammo onto users without.
        const availableBullets = ammoItems.size > 0 ? Number(ammo?.system.technology?.quantity) : weapon.system.ammo.current.max;

        // Validate ammunition and clip availability.
        if (weapon.system.ammo.spare_clips.value === 0 && weapon.system.ammo.spare_clips.max > 0) {
            // Should this ever be enforced, change info to warn.
            ui.notifications?.info("SR5.Warnings.CantReloadWithoutSpareClip", { localize: true });
        }
        if (ammo && Number(ammo.system.technology?.quantity) === 0) {
            return ui.notifications?.warn('SR5.Warnings.CantReloadAtAllDueToAmmo', { localize: true });
        }
        if (ammo && Number(ammo.system.technology?.quantity) < missingBullets) {
            if (partialReload && partialReloadBulletsNeeded !== -1 && Number(ammo.system.technology?.quantity) < partialReloadBulletsNeeded) {
                ui.notifications?.info('SR5.Warnings.CantReloadPartialDueToAmmo', { localize: true });
            } else {
                ui.notifications?.info('SR5.Warnings.CantReloadFullyDueToAmmo', { localize: true });
            }
        }

        // Prepare what can be reloaded.
        const reloadedBullets = Math.min(missingBullets, availableBullets, partialReload ? partialReloadBulletsNeeded : Infinity);

        const updateData: Record<string, any> = {};

        if (weapon.system.ammo.spare_clips.max > 0 && weapon.system.ammo.spare_clips.value > 0) {
            updateData['system.ammo.spare_clips.value'] = Math.max(0, weapon.system.ammo.spare_clips.value - 1);
        }
        if (reloadedBullets > 0) {
            updateData["system.ammo.current.value"] = remainingBullets + reloadedBullets;
        }
        if (Object.keys(updateData).length > 0) {
            await this.update(updateData);
        }

        if (ammo && reloadedBullets > 0) {
            await ammo.update({
                "system.technology.quantity": Math.max(0, Number(ammo.system.technology?.quantity) - reloadedBullets),
            });
        }
    }


    get isAmmo(): boolean {
        return this.wrapper.isAmmo();
    }

    get isAoEAmmo(): boolean {
        return this.wrapper.isAoEAmmo();
    }

    get asAmmo(): AmmoItemData | undefined {
        if (this.isAmmo) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as AmmoItemData;
        }
    }

    get hasExplosiveAmmo(): boolean {
        const ammo = this.getEquippedAmmo();
        if (!ammo) return false;
        const system = ammo.system as AmmoData;
        return system.blast.radius > 0;
    }
    // #endregion

    // #region SIN related
    async addNewLicense() {
        if (this.type !== 'sin') return;

        // NOTE: This might be related to Foundry data serialization sometimes returning arrays as ordered HashMaps...
        const licenses = foundry.utils.getType(this.system.licenses) === 'Object' ?
            //@ts-expect-error TODO: foundry-vtt-types v10
            Object.values(this.system.licenses) :
            this.system.licenses;

        if (!licenses) return;

        // Add the new license to the list
        licenses.push({
            name: '',
            rtg: '',
            description: '',
        });

        await this.update({ 'system.licenses': licenses });
    }

    get isSin(): boolean {
        return this.wrapper.isSin();
    }

    get asSin(): SinItemData | undefined {
        if (this.isSin) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as SinItemData;
        }
    }

    /**
     * SIN Item - remove a single license within this SIN
     * 
     * @param index The license list index
     */
    async removeLicense(index) {
        if (this.type !== 'sin') return;

        //@ts-expect-error TODO: foundry-vtt-types v10
        const licenses = this.system.licenses.splice(index, 1);
        await this.update({ 'system.licenses': licenses });
    }
    // #endregion

    // #region Lifestyle related
    get isLifestyle(): boolean {
        return this.wrapper.isLifestyle();
    }

    get asLifestyle(): LifestyleItemData | undefined {
        if (this.isLifestyle) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as LifestyleItemData;
        }
    }
    // #endregion

    // #region Modification related
    get isModification(): boolean {
        return this.wrapper.isModification();
    }

    asModification(): ModificationItemData | undefined {
        if (this.isModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isArmorModification(): boolean {
        return this.wrapper.isArmorModification();
    }

    asArmorModification(): ModificationItemData | undefined {
        if (this.isArmorModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isBodywareModification(): boolean {
        return this.wrapper.isBodywareModification();
    }

    asBodywareModification(): ModificationItemData | undefined {
        if (this.isBodywareModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isDeviceModification(): boolean {
        return this.wrapper.isDeviceModification();
    }

    asDeviceModification(): ModificationItemData | undefined {
        if (this.isDeviceModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isDroneModification(): boolean {
        return this.wrapper.isDroneModification();
    }

    asDroneModification(): ModificationItemData | undefined {
        if (this.isDroneModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isEquipmentModification(): boolean {
        return this.wrapper.isEquipmentModification();
    }

    asEquipmentModification(): ModificationItemData | undefined {
        if (this.isEquipmentModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isVehicleModification(): boolean {
        return this.wrapper.isVehicleModification();
    }

    asVehicleModification(): ModificationItemData | undefined {
        if (this.isVehicleModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }

    get isWeaponModification(): boolean {
        return this.wrapper.isWeaponModification();
    }

    asWeaponModification(): ModificationItemData | undefined {
        if (this.isWeaponModification) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ModificationItemData;
        }
    }
    // #endregion

    // #region Program related
    get isProgram(): boolean {
        return this.wrapper.isProgram();
    }

    get asProgram(): ProgramItemData | undefined {
        if (this.isProgram) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as ProgramItemData;
        }
    }
    // #endregion

    // #region Quality related
    get isQuality(): boolean {
        return this.wrapper.isQuality();
    }

    get asQuality(): QualityItemData | undefined {
        if (this.isQuality) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as QualityItemData;
        }
    }
    // #endregion

    // #region Adept Power related
    get isAdeptPower(): boolean {
        return this.type === 'adept_power';
    }

    asAdeptPower(): AdeptPowerItemData | undefined {
        if (this.isAdeptPower)
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as AdeptPowerItemData;
    }
    // #endregion

    // #region Source related
    /**
     * Use the items source field and try different means of opening it.
     */
    async openSource() {
        const source = this.getSource();
        await LinksHelpers.openSource(source);
    }

    get sourceIsUrl(): boolean {
        const source = this.getSource();
        return LinksHelpers.isURL(source);
    }

    get sourceIsPDF(): boolean {
        const source = this.getSource();
        return LinksHelpers.isPDF(source);
    }

    get sourceIsUuid(): boolean {
        const source = this.getSource();
        return LinksHelpers.isUuid(source);
    }

    getSource(): string {
        return this.wrapper.getSource();
    }

    setSource(source: string) {
        if (!this.system.description) this.system.description = { chat: '', source: '', value: '' };
        this.update({ 'system.description.source': source });
        this.render(true);
    }
    // #endregion

    // #region Technology related
    getTechnologyData(): TechnologyData | undefined {
        return this.wrapper.getTechnology();
    }

    async parseAvailibility(avail: string) {
        // Remove the computed modifier at the end, if present.
        avail = avail.replace(/\([+-]\d{1,2}\)$/, '');

        // Separates the availability value and any potential restriction
        const availParts = avail.match(/^(\d+)(.*)$/);

        if (!availParts) return null;

        const availability = parseInt(availParts[1], 10);
        const restriction = availParts[2];

        return { availability, restriction }
    }

    isEquipped(): boolean {
        return this.wrapper.isEquipped();
    }

    isWireless(): boolean {
        return this.wrapper.isWireless();
    }

    getConditionMonitor(): ConditionData {
        return this.wrapper.getConditionMonitor();
    }

    getRating(): number {
        return this.wrapper.getRating();
    }

    getCondition(): ConditionData | undefined {
        const technology = this.getTechnologyData();
        if (technology && "condition_monitor" in technology)
            return technology.condition_monitor;
    }
    // #endregion

    // #region Weapon related
    getRange(): CritterPowerRange | SpellRange | RangeWeaponData | undefined {
        return this.wrapper.getRange();
    }

    getWeaponRange(): RangeWeaponData | undefined {
        if (this.isRangedWeapon)
            return this.getRange() as RangeWeaponData;
    }

    get isGrenade(): boolean {
        return this.wrapper.isGrenade();
    }

    get isWeapon(): boolean {
        return this.wrapper.isWeapon();
    }

    get asWeapon(): WeaponItemData | undefined {
        if (this.isWeapon) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as WeaponItemData;
        }
    }

    get isRangedWeapon(): boolean {
        return this.wrapper.isRangedWeapon();
    }

    get isMeleeWeapon(): boolean {
        return this.wrapper.isMeleeWeapon();
    }

    /**
     * Amount of current recoil left after recoil compensation.
     */
    get unhandledRecoil(): number {
        if (!this.isRangedWeapon) return 0;
        return Math.max(this.actor.recoil - this.totalRecoilCompensation, 0);
    }

    /**
     * Amount of recoil compensation configured via weapon system data.
     */
    get recoilCompensation(): number {
        if (!this.isRangedWeapon) return 0;
        return this.wrapper.getRecoilCompensation();
    }

    /**
     * Amount of recoil compensation totally available when using weapon
     * 
     * This includes both actor and item recoil compensation.
     */
    get totalRecoilCompensation(): number {
        if (!this.isRangedWeapon) return 0;
        return RangedWeaponRules.recoilCompensation(this);
    }

    /**
     * Current TOTAL recoil compensation with current recoil included.
     * 
     * This includes both the items and it's parent actors recoil compensation and total progressive recoil.
     * 
     * @returns A positive number or zero.
     */
    get currentRecoilCompensation(): number {
        if (!this.actor || !this.isRangedWeapon) return 0;
        return Math.max(this.totalRecoilCompensation - this.actor.recoil, 0);
    }

    getReach(): number {
        if (this.isMeleeWeapon) {
            const system = this.system as WeaponData;
            return system.melee.reach ?? 0;
        }
        return 0;
    }
    // #endregion

    // #region Armor related
    get isArmor(): boolean {
        return this.wrapper.isArmor();
    }

    get asArmor(): ArmorItemData | undefined {
        if (this.isArmor) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as ArmorItemData;
        }
    }

    get hasArmorBase(): boolean {
        return this.wrapper.hasArmorBase();
    }

    get hasArmorAccessory(): boolean {
        return this.wrapper.hasArmorAccessory();
    }

    get hasArmor(): boolean {
        return this.wrapper.hasArmor();
    }

    getArmorValue(): ModifiableValue {
        return this.wrapper.getArmorValue();
    }

    getArmorElements(): { [key: string]: ModifiableValue } {
        return this.wrapper.getArmorElements();
    }
    // #endregion

    // #region Bodyware related
    get isCyberware(): boolean {
        return this.wrapper.isCyberware();
    }

    get asCyberware(): CyberwareItemData | undefined {
        if (this.isCyberware) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as CyberwareItemData;
        }
    }

    get isBioware(): boolean {
        return this.wrapper.isBioware();
    }

    getEssenceLoss(): number {
        return this.wrapper.getEssenceLoss();
    }

    // #endregion

    // #region Awakened related
    get isCombatSpell(): boolean {
        return this.wrapper.isCombatSpell();
    }

    get isDirectCombatSpell(): boolean {
        return this.wrapper.isDirectCombatSpell();
    }

    get isIndirectCombatSpell(): boolean {
        return this.wrapper.isIndirectCombatSpell();
    }

    get isManaSpell(): boolean {
        return this.wrapper.isManaSpell();
    }

    get isPhysicalSpell(): boolean {
        return this.wrapper.isPhysicalSpell();
    }

    get isSpell(): boolean {
        return this.wrapper.isSpell();
    }

    get isUsingRangeCategory(): boolean {
        return this.wrapper.isUsingRangeCategory();
    }

    get asSpell(): SpellItemData | undefined {
        if (this.isSpell) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as SpellItemData;
        }
    }

    get isCallInAction(): boolean {
        return this.type === 'call_in_action';
    }

    get asCallInAction(): Shadowrun.CallInActionItemData | undefined {
        if (this.isCallInAction) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as Shadowrun.CallInActionItemData;
        }
    }

    get isSummoning(): boolean {
        //@ts-expect-error
        return this.type === 'call_in_action' && this.system.actor_type === 'spirit';
    }

    get isCompilation(): boolean {
        //@ts-expect-error
        return this.type === 'call_in_action' && this.system.actor_type === 'sprite';
    }

    get isSpritePower(): boolean {
        return this.wrapper.isSpritePower();
    }

    get asSpritePower(): SpritePowerItemData | undefined {
        if (this.isSpritePower) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as SpritePowerItemData;
        }
    }

    get isComplexForm(): boolean {
        return this.wrapper.isComplexForm();
    }

    get asComplexForm(): ComplexFormItemData | undefined {
        if (this.isComplexForm) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as ComplexFormItemData;
        }
    }

    get getDrain(): number {
        return this.wrapper.getDrain();
    }

    getFade(): number {
        return this.wrapper.getFade();
    }
    // #endregion

    // #region Contact related
    get isContact(): boolean {
        return this.wrapper.isContact();
    }

    get asContact(): ContactItemData | undefined {
        if (this.isContact) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as ContactItemData;
        }
    }

    /**    
    * Retrieve the actor document linked to this item.
    * e.g.: Contact items provide linked actors
    */
    async getLinkedActor(): Promise<SR5Actor | undefined> {
        const uuid = this.wrapper.getLinkedActorUuid();

        // @ts-expect-error // parseUuid is not defined in the @league-of-foundry-developers/foundry-vtt-types package
        if (uuid && this.asContact && foundry.utils.parseUuid(uuid).documentType === 'Actor') {
            return await fromUuid(uuid) as SR5Actor;
        }
    }
    // #endregion

    // #region Critter Power related
    get isCritterPower(): boolean {
        return this.wrapper.isCritterPower();
    }

    get asCritterPower(): CritterPowerItemData | undefined {
        if (this.isCritterPower) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as CritterPowerItemData;
        }
    }
    // #endregion

    // #region Matrix related
    get isHost(): boolean {
        return this.type === 'host';
    }

    get asHost(): HostItemData | undefined {
        if (this.isHost) {
            //@ts-expect-error TODO: foundry-vtt-types v10
            return this as HostItemData;
        }
    }

    get isDevice(): boolean {
        return this.wrapper.isDevice();
    }

    get asDevice(): DeviceItemData | undefined {
        if (this.isDevice) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as DeviceItemData;
        }
    }

    asController(): HostItemData | DeviceItemData | undefined {
        return this.asHost || this.asDevice || undefined;
    }

    getNetworkController(): string | undefined {
        return this.getTechnologyData()?.networkController;
    }

    async setNetworkController(networkController: string | undefined): Promise<void> {
        await this.update({ 'system.technology.networkController': networkController });
    }

    isCyberdeck(): boolean {
        return this.wrapper.isCyberdeck();
    }

    isRCC(): boolean {
        return this.wrapper.isRCC();
    }

    isCommlink(): boolean {
        return this.wrapper.isCommlink();
    }

    isMatrixAction(): boolean {
        return this.wrapper.isMatrixAction();
    }

    getASDF() {
        return this.wrapper.getASDF();
    }

    /**
     * A host type item can store IC actors to spawn in order, use this method to add into that.
     * @param id An IC type actor id to fetch the actor with.
     * @param pack Optional pack collection to fetch from
     */
    async addIC(id: string, pack: string | null = null) {
        const host = this.asHost;
        if (!host || !id) return;

        // Check if actor exists before adding.
        const actor = (pack ? await Helpers.getEntityFromCollection(pack, id) : game.actors?.get(id)) as SR5Actor;
        if (!actor || !actor.isIC()) {
            console.error(`Provided actor id ${id} doesn't exist (with pack collection '${pack}') or isn't an IC type`);
            return;
        }

        const icData = actor.asIC();
        if (!icData) return;

        // Add IC to the hosts IC order
        const sourceEntity = DataDefaults.sourceItemData({
            id: actor.id as string,
            name: actor.name as string,
            type: 'Actor',
            pack,
            // Custom fields for IC
            // @ts-expect-error foundry-vtt
            system: { icType: icData.system.icType },
        });
        host.system.ic.push(sourceEntity);

        await this.update({ 'system.ic': host.system.ic });
    }

    /**
     * A host type item can contain IC in an order. Use this function remove IC at the said position
     * @param index The position in the IC order to be removed
     */
    async removeIC(index: number) {
        if (isNaN(index) || index < 0) return;

        const host = this.asHost;
        if (!host) return;
        if (host.system.ic.length <= index) return;

        host.system.ic.splice(index, 1);

        await this.update({ 'system.ic': host.system.ic });
    }

    /**
     * Place a Matrix Mark for this Item.
     *
     * @param target The Document the marks are placed on. This can be an actor (character, technomancer, IC) OR an item (Host)
     * @param marks Amount of marks to be placed.
     * @param options Additional options that may be needed.
     * @param options.scene The scene the targeted actor lives on.
     * @param options.item
     *
     * TODO: It might be useful to create a 'MatrixDocument' class sharing matrix methods to avoid duplication between
     *       SR5Item and SR5Actor.
     */
    async setMarks(target: Token, marks: number, options?: { scene?: Scene, item?: Item, overwrite?: boolean }) {
        if (!canvas.ready) return;

        if (!this.isHost) {
            console.error('Only Host item types can place matrix marks!');
            return;
        }

        // Both scene and item are optional.
        const scene = options?.scene || canvas.scene as Scene;
        const item = options?.item;

        // Build the markId string. If no item has been given, there still will be a third split element.
        // Use Helpers.deconstructMarkId to get the elements.
        const markId = Helpers.buildMarkId(scene.id as string, target.id, item?.id as string);
        const host = this.asHost;

        if (!host) return;

        const currentMarks = options?.overwrite ? 0 : this.getMarksById(markId);
        host.system.marks[markId] = MatrixRules.getValidMarksCount(currentMarks + marks);

        await this.update({ 'system.marks': host.system.marks });
    }

    getMarksById(markId: string): number {
        const host = this.asHost;
        return host ? host.system.marks[markId] : 0;
    }

    getAllMarks(): MatrixMarks | undefined {
        const host = this.asHost;
        if (!host) return;
        return host.system.marks;
    }

    /**
     * Receive the marks placed on either the given target as a whole or one it's owned items.
     *
     * @param target
     * @param item
     * @param options
     *
     * TODO: Check with technomancers....
     *
     * @return Will always return a number. At least zero, for no marks placed.
     */
    getMarks(target: SR5Actor, item?: SR5Item, options?: { scene?: Scene }): number {
        if (!canvas.ready) return 0;
        if (!this.isHost) return 0;

        // Scene is optional.
        const scene = options?.scene || canvas.scene as Scene;
        item = item || target.getMatrixDevice();

        const markId = Helpers.buildMarkId(scene.id as string, target.id as string, item?.id as string);
        const host = this.asHost;

        if (!host) return 0

        return host.system.marks[markId] || 0;
    }

    /**
     * Remove ALL marks placed by this item.
     *
     * TODO: Allow partial deletion based on target / item
     */
    async clearMarks() {
        if (!this.isHost) return;

        const host = this.asHost;

        if (!host) return;

        // Delete all markId properties from ActorData
        const updateData = {}
        for (const markId of Object.keys(host.system.marks)) {
            updateData[`-=${markId}`] = null;
        }

        await this.update({ 'system.marks': updateData });
    }

    /**
     * Remove ONE mark. If you want to delete all marks, use clearMarks instead.
     */
    async clearMark(markId: string) {
        if (!this.isHost) return;

        const updateData = {}
        updateData[`-=${markId}`] = null;

        await this.update({ 'system.marks': updateData });
    }

    /**
     * Configure the given matrix item to be controlled by this item in a PAN/WAN.
     * @param target The matrix item to be connected.
     */
    async addNetworkDevice(target: SR5Item | SR5Actor) {
        // TODO: Add device to WAN network
        // TODO: Add IC actor to WAN network
        // TODO: setup networkController link on networked devices.
        await NetworkDeviceFlow.addDeviceToNetwork(this, target);
    }

    /**
     * Alias method for addNetworkDevice, both do the same.
     * @param target
     */
    async addNetworkController(target: SR5Item) {
        await this.addNetworkDevice(target);
    }

    async removeNetworkDevice(index: number) {
        const controllerData = this.asController();
        if (!controllerData) return;

        // Convert the index to a device link.
        if (controllerData.system.networkDevices[index] === undefined) return;
        const networkDeviceLink = controllerData.system.networkDevices[index];
        const controller = this;
        return await NetworkDeviceFlow.removeDeviceLinkFromNetwork(controller, networkDeviceLink);
    }

    async removeAllNetworkDevices() {
        const controllerData = this.asController();
        if (!controllerData) return;

        return await NetworkDeviceFlow.removeAllDevicesFromNetwork(this);
    }

    getAllMarkedDocuments(): Shadowrun.MarkedDocument[] {
        if (!this.isHost) return [];

        const marks = this.getAllMarks();
        if (!marks) return [];

        // Deconstruct all mark ids into documents.
        // @ts-expect-error
        return Object.entries(marks)
            .filter(([markId, marks]) => Helpers.isValidMarkId(markId))
            .map(([markId, marks]) => ({
                ...Helpers.getMarkIdDocuments(markId),
                marks,
                markId
            }))
    }

    /**
     * Return the network controller item when connected to a PAN or WAN.
     */
    async networkController() {
        const technologyData = this.getTechnologyData();
        if (!technologyData) return;
        if (!technologyData.networkController) return;

        return await NetworkDeviceFlow.resolveLink(technologyData.networkController) as SR5Item;
    }

    /**
     * Return all network device items within a possible PAN or WAN.
     */
    async networkDevices() {
        const controller = this.asDevice || this.asHost;
        if (!controller) return [];

        return NetworkDeviceFlow.getNetworkDevices(this);
    }

    /**
     * Only devices can control a network.
     */
    get canBeNetworkController(): boolean {
        return this.isDevice || this.isHost;
    }

    /**
     * Assume all items with that are technology (therefore have a rating) are active matrix devices.
     */
    get canBeNetworkDevice(): boolean {
        const technologyData = this.getTechnologyData();
        return !!technologyData;
    }

    /**
     * Disconnect any kind of item from a PAN or WAN.
     */
    async disconnectFromNetwork() {
        if (this.canBeNetworkController) await NetworkDeviceFlow.removeAllDevicesFromNetwork(this);
        if (this.canBeNetworkDevice) await NetworkDeviceFlow.removeDeviceFromController(this);
    }
    // #endregion

    // #region Equipment related
    isEquipment(): boolean {
        return this.wrapper.isEquipment();
    }

    get asEquipment(): EquipmentItemData | undefined {
        if (this.isEquipment()) {
            //@ts-expect-error // TODO: foundry-vtt-types v10
            return this as EquipmentItemData;
        }
    }
    // #endregion

    override async update(data, options?): Promise<this> {
        // Item.item => Embedded item into another item!
        if (this._isNestedItem) {
            return this._syncWithParentItem(data);
        }

        // Actor.item => Directly owned item by an actor!
        // @ts-expect-error
        return await super.update(data, options);
    }

    override async _onCreate(changed, options, user) {
        const applyData = {};
        UpdateActionFlow.injectActionTestsIntoChangeData(this.type, changed, applyData, this);
        await super._preCreate(changed, options, user);

        // Don't kill DocumentData by applying empty objects. Also performance.
        //@ts-expect-error // TODO: foundry-vtt-types v10
        if (!foundry.utils.isEmpty(applyData)) await this.update(applyData);
    }

    /**
     * Make sure all item data is in a persistent and valid status.
     *
     * This is preferred to altering data on the fly in the prepareData methods flow.
     */
    override async _preUpdate(changed, options: DocumentModificationOptions, user: User) {
        // Some Foundry core updates will no diff and just replace everything. This doesn't match with the
        // differential approach of action test injection. (NOTE: Changing ownership of a document)
        if (options.diff !== false && options.recursive !== false) {
            // Change used action test implementation when necessary.
            UpdateActionFlow.injectActionTestsIntoChangeData(this.type, changed, changed, this);
            UpdateActionFlow.onUpdateAlterActionData(changed, this);
        }

        await super._preUpdate(changed, options, user);
    }
}
