/// <reference path="../Shadowrun.ts" />
declare namespace Shadowrun {
    export interface ModificationData extends
        ModificationPartData,
        DescriptionPartData,
        ImportFlags,
        TechnologyPartData {

    }

    /**
     * Fields to modify matching parent item fields with during item preparation
     */
    export interface ModificationPartData {
        type: 'weapon' | 'armor' | 'bodyware' | 'equipment' | 'vehicle' | 'drone' | 'device' | ''

        armorMod: ArmorModData;
        bodywareMod: BodywareModData;
        technologyMod: TechnologyModData;
        vehicleMod: VehicleModData;
        weaponMod: WeaponModData;        
    }

    /**
     * Armor related mod data.
     */
    export interface ArmorModData {
        armor_value: number;
        hardened: boolean;
        acid: number;
        cold: number;
        fire: number;
        electricity: number;
        radiation: number;
    }

    /**
     * Bodyware related mod data.
     */
    export interface BodywareModData {
        grade: BodywareGrades;
    }

    export type BodywareGrades = 'standard' | 'alpha' | 'beta' | 'delta' | 'gamma' | 'grey' | 'used'

    /**
     * TechnologyPart related mod data.
     */
    export interface TechnologyModData {
        conceal: number
        capacity: number;
        capacity_max: number;
    }

    /**
     * Vehicle related mod data.
     */
    export interface VehicleModData {
        modification_category: VehicleModificationCategoryType
        slots: number
    }

    export type VehicleModificationCategoryType = 'body' | 'cosmetic' | 'electromagnetic' | 'power_train' | 'protection' | 'weapons' | '';

    /**
     * Weapon related mod data.
     */
    export interface WeaponModData {
        mount_point: MountType
        dice_pool: number
        accuracy: number
        rc: number
    }

    export type MountType = 'barrel' | 'under_barrel' | 'stock' | 'top' | 'side' | 'internal' | '';
}
