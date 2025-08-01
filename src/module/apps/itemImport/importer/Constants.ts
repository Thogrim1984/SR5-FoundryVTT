import { SR5 } from '../../../config';

export type CompendiumKey = keyof typeof Constants.MAP_COMPENDIUM_KEY;

export class Constants {

    public static readonly MAP_COMPENDIUM_CONFIG = {
        // Actors
        'Critter':          { pack: 'world.sr5critter',         type: 'Actor', folder: null, subFolder: null }, // Critters, Spirits and Sprites
        'Drone':            { pack: 'world.sr5drone',           type: 'Actor', folder: null, subFolder: null }, // Vehicles and Drones

        // Items
        'Gear':             { pack: 'world.sr5gear',            type: 'Item', folder: null, subFolder: null }, // Armor + General Gear
        'Trait':            { pack: 'world.sr5trait',           type: 'Item', folder: null, subFolder: null }, // Quality + Powers
        'Magic':            { pack: 'world.sr5magic',           type: 'Item', folder: null, subFolder: null }, // Spells, rituals, complex forms
        'Modification':     { pack: 'world.sr5modification',    type: 'Item', folder: null, subFolder: null }, // Armor/Vehicle/weapon mods + ammo
        'Ware':             { pack: 'world.sr5ware',            type: 'Item', folder: null, subFolder: null }, // Bioware + Cyberware
        'Weapon':           { pack: 'world.sr5weapon',          type: 'Item', folder: null, subFolder: null }, // Weapons
    } as const satisfies Record<string, { pack: string; type: 'Actor' | 'Item'; folder: string | null, subFolder: string | null }>;

    public static readonly MAP_COMPENDIUM_KEY = {
        // --- Critters ---
        'Critter':          'Critter',
        'Spirit':           'Critter',
        'Sprite':           'Critter',
        'Critter_Power':    'Trait',

        // --- Character Traits ---
        'Quality':          'Trait',
        'Ware':             'Ware',

        // --- Vehicles ---
        'Drone':            'Drone',
        'Vehicle':          'Drone',
        'Vehicle_Mod':      'Modification',

        // --- Magic ---
        'Adept_Power':      'Trait',
        'Complex_Form':     'Magic',
        'Echo':             'Trait',
        'Spell':            'Magic',

        // --- Gear ---
        'Ammo':             'Gear',
        'Armor':            'Gear',
        'Device':           'Gear',
        'Program':          'Gear',
        'Gear':             'Gear',
        'Weapon':           'Weapon',
        'Weapon_Mod':       'Modification',
    } as const satisfies Record<string, keyof typeof Constants.MAP_COMPENDIUM_CONFIG>;

    public static readonly MAP_TRANSLATION_TYPE = {
        'adept_power': 'power',
        'ammo': 'gear',
        'armor': 'armor',
        'bioware': 'bioware',
        'complex_form': 'complexform',
        'critter_power': 'power',
        'cyberware': 'cyberware',
        'device': 'gear',
        'echo': 'echo',
        'equipment': 'gear',
        'modification': 'mod',
        'program': 'gear',
        'quality': 'quality',
        'spell': 'spell',
        'spirit': 'metatype',
        'sprite': 'metatype',
        'sprite_power': 'power',
        'vehicle': 'vehicle',
        'weapon': 'weapon'
    } as const satisfies Record<string, string>;

    public static readonly MAP_CATEGORY_TO_SKILL = {
        'Assault Cannons': 'heavy_weapons',
        'Assault Rifles': 'automatics',
        'Blades': 'blades',
        'Bows': 'archery',
        'Carbines': 'automatics',
        'Clubs': 'clubs',
        'Crossbows': 'archery',
        'Exotic Melee Weapons': 'exotic_melee',
        'Exotic Ranged Weapons': 'exotic_range',
        'Flamethrowers': 'exotic_range',
        'Grenade Launchers': 'heavy_weapons',
        'Heavy Machine Guns': 'heavy_weapons',
        'Heavy Pistols': 'pistols',
        'Holdouts': 'pistols',
        'Laser Weapons': 'exotic_range',
        'Light Machine Guns': 'heavy_weapons',
        'Light Pistols': 'pistols',
        'Machine Pistols': 'automatics',
        'Medium Machine Guns': 'automatics',
        'Missile Launchers': 'heavy_weapons',
        'Shotguns': 'longarms',
        'Sniper Rifles': 'longarms',
        'Sporting Rifles': 'longarms',
        'Submachine Guns': 'automatics',
        'Tasers': 'pistols',
        'Unarmed': 'unarmed_combat',
    } as const;

    public static readonly MAP_IMPORT_RANGE_CATEGORY_TO_SYSTEM_RANGE_CATEGORY = {
        'Tasers': 'taser',
        'Holdouts': 'holdOutPistol',
        'Light Pistols': 'lightPistol',
        'Heavy Pistols': 'heavyPistol',
        'Machine Pistols': 'machinePistol',
        'Submachine Guns': 'smg',
        'Assault Rifles': 'assaultRifle',
        'Shotguns': 'shotgunSlug',
        'Shotguns (slug)': 'shotgunSlug',
        'Shotguns (flechette)': 'shotgunFlechette',
        'Sniper Rifles': 'sniperRifle',
        'Sporting Rifles': 'sportingRifle',
        'Light Machine Guns': 'lightMachinegun',
        'Medium/Heavy Machinegun': 'mediumHeavyMachinegun',
        'Assault Cannons': 'assaultCannon',
        'Grenade Launchers': 'grenadeLauncher',
        'Missile Launchers': 'missileLauncher',
        'Bows': 'bow',
        'Light Crossbows': 'lightCrossbow',
        'Medium Crossbows': 'mediumCrossbow',
        'Heavy Crossbows': 'heavyCrossbow',
        'Thrown Knife': 'thrownKnife',
        'Net': 'net',
        'Shuriken': 'shuriken',
        'Standard Grenade': 'standardThrownGrenade',
        'Aerodynamic Grenade': 'aerodynamicThrownGrenade',
        'Harpoon Gun': 'harpoonGun',
        'Harpoon Gun (Underwater)': 'harpoonGunUnderwater',
        'Flamethrowers': 'flamethrower',
    } as const satisfies Record<string, Exclude<keyof typeof SR5.weaponRangeCategories, "manual">> ;
}
