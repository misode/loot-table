import type { CollectionRegistry, ResourceType, SchemaRegistry } from '@mcschema/core'
import { BooleanNode, Case, ChoiceNode, ListNode, MapNode, Mod, NumberNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, Switch } from '@mcschema/core'


const ID = "lithostitched"

export function initLithostitched(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	const Tag = (id: Exclude<ResourceType, `$tag/${string}`>) =>
		ChoiceNode(
			[
				{
					type: "string",
					node: StringNode({
						validator: "resource",
						params: { pool: id, allowTag: true },
					}),
					change: (v: unknown) => {
						if (
							Array.isArray(v) &&
							typeof v[0] === "string" &&
							!v[0].startsWith("#")
						) {
							return v[0]
						}
						return undefined
					},
				},
				{
					type: "list",
					node: ListNode(
						StringNode({ validator: "resource", params: { pool: id } })
					),
					change: (v: unknown) => {
						if (typeof v === "string" && !v.startsWith("#")) {
							return [v]
						}
						return []
					},
				},
			],
			{ choiceContext: "tag" }
		)

	// Worldgen Modifiers
	const MobCategorySpawnSettings = Mod(
		ObjectNode({
			type: StringNode({
				validator: "resource",
				params: { pool: "entity_type" },
			}),
			weight: NumberNode({ integer: true }),
			minCount: NumberNode({ integer: true }),
			maxCount: NumberNode({ integer: true }),
		}),
		{
			category: () => "pool",
			default: () => [
				{
					type: "minecraft:bat",
					weight: 1,
				},
			],
		}
	)

	collections.register(`${ID}:modifier_type`, [
		"lithostitched:add_biome_spawns",
		"lithostitched:add_features",
		"lithostitched:add_structure_set_entries",
		"lithostitched:add_surface_rule",
		"lithostitched:add_template_pool_elements",
		"lithostitched:no_op",
		"lithostitched:redirect_feature",
		"lithostitched:remove_biome_spawns",
		"lithostitched:remove_features",
		"lithostitched:remove_structures_from_structure_set",
		"lithostitched:replace_climate",
		"lithostitched:replace_effects",
	])

	collections.register(`${ID}:modifier_predicate_type`, [
		"lithostitched:all_of",
		"lithostitched:any_of",
		"lithostitched:mod_loaded",
		"lithostitched:not",
		"lithostitched:true"
	])

	schemas.register(`${ID}:worldgen_modifier`, Mod(ObjectNode({
		type: StringNode({ validator: 'resource', params: { pool: `${ID}:modifier_type` as any } }),
		predicate: Opt(Reference(`${ID}:modifier_predicate`)),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'lithostitched:add_biome_spawns': {
				biomes: Tag('$worldgen/biome'),
				spawners: ChoiceNode([
					{
						type: 'object',
						node: MobCategorySpawnSettings,
						change: (v: any) => v[0]
					},
					{
						type: 'list',
						node: ListNode(MobCategorySpawnSettings),
						change: (v: any) => Array(v)
					}
				])
			},
			'lithostitched:add_features': {
				biomes: Tag('$worldgen/biome'),
				features: Tag('$worldgen/configured_feature'),
				step: StringNode({ enum: 'decoration_step' })
			},
			'lithostitched:add_structure_set_entries': {
				structure_set: StringNode({ validator: 'resource', params: { pool: '$worldgen/structure_set' } }),
				entries: ListNode(
					ObjectNode({
						structure: StringNode({ validator: 'resource', params: { pool: '$worldgen/structure' } }),
						weight: NumberNode({ integer: true, min: 1 })
					})
				)
			},
			'lithostitched:add_surface_rule': {
				levels: ListNode(StringNode({ validator: "resource", params: { pool: '$dimension' } })),
				surface_rule: Reference('material_rule')
			},
			'lithostitched:add_template_pool_elements': {
				template_pool: StringNode({ validator: 'resource', params: { pool: '$worldgen/template_pool' } }),
				elements: ListNode(
					Reference('template_weighted_element')
				)
			},
			'lithostitched:redirect_feature': {
				placed_feature: StringNode({ validator: 'resource', params: { pool: '$worldgen/placed_feature' } }),
				redirect_to: StringNode({ validator: 'resource', params: { pool: '$worldgen/configured_feature' } })
			},
			'lithostitched:remove_biome_spawns': {
				biomes: Tag('$worldgen/biome'),
				mobs: Tag('entity_type')
			},
			'lithostitched:remove_features': {
				biomes: Tag('$worldgen/biome'),
				features: Tag('$worldgen/configured_feature'),
				step: StringNode({ enum: 'decoration_step' })
			},
			'lithostitched:remove_structures_from_structure_set': {
				structure_set: StringNode({ validator: 'resource', params: { pool: '$worldgen/structure_set' } }),
				structures: ListNode(
					StringNode({ validator: 'resource', params: { pool: '$worldgen/structure' } })
				)
			},
			'lithostitched:replace_climate': {
				biomes: Tag('$worldgen/biome'),
				climate: ObjectNode({
					temperature: NumberNode(),
					downfall: NumberNode(),
					has_precipitation: BooleanNode(),
					temperature_modifier: Opt(StringNode({ enum: ['none', 'frozen'] }))
				})
			},
			'lithostitched:replace_effects': {
				biomes: Tag('$worldgen/biome'),
				effects: ObjectNode({
					sky_color: Opt(NumberNode({ color: true })),
					fog_color: Opt(NumberNode({ color: true })),
					water_color: Opt(NumberNode({ color: true })),
					water_fog_color: Opt(NumberNode({ color: true })),
					grass_color: Opt(NumberNode({ color: true })),
					foliage_color: Opt(NumberNode({ color: true })),
					grass_color_modifier: Opt(StringNode({ enum: ['none', 'dark_forest', 'swamp'] })),
					ambient_sound: Opt(StringNode()),
					mood_sound: Opt(ObjectNode({
						sound: StringNode(),
						tick_delay: NumberNode({ integer: true }),
						block_search_extent: NumberNode({ integer: true }),
						offset: NumberNode()
					})),
					additions_sound: Opt(ObjectNode({
						sound: StringNode(),
						tick_chance: NumberNode({ min: 0, max: 1 })
					})),
					music: Opt(ObjectNode({
						sound: StringNode(),
						min_delay: NumberNode({ integer: true, min: 0 }),
						max_delay: NumberNode({ integer: true, min: 0 }),
						replace_current_music: BooleanNode()
					})),
					particle: Opt(ObjectNode({
						options: ObjectNode({
							type: StringNode()
						}),
						probability: NumberNode({ min: 0, max: 1 })
					}))
				})
			}
		}
	}, { context: `${ID}.worldgen_modifier`, disableSwitchContext: true }), {
		default: () => ({
			type: `${ID}:add_features`,
			biomes: '#minecraft:is_overworld',
			features: 'example:ore_ruby',
			step: 'underground_ores'
		})
	}))

	schemas.register(`${ID}:modifier_predicate`, ObjectNode({
		type: StringNode({ validator: 'resource', params: { pool: `${ID}:modifier_predicate_type` as any } }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'lithostitched:all_of': {
				predicates: ListNode(Reference(`${ID}:modifier_predicate`))
			},
			'lithostitched:any_of': {
				predicates: ListNode(Reference(`${ID}:modifier_predicate`))
			},
			'lithostitched:mod_loaded': {
				mod_id: StringNode()
			},
			'lithostitched:not': {
				predicate: Reference(`${ID}:modifier_predicate`)
			}
		}
	}, {
		context: `${ID}.modifier_predicate`, disableSwitchContext: true
	}))

	// Modded Biome Slice
	collections.register(`${ID}:modded_biome_layout_type`, [
		"lithostitched:biome_source",
		"lithostitched:multi_noise",
		"lithostitched:original",
		"lithostitched:overlay"
	])

	schemas.register(`${ID}:biome_source`, ObjectNode({
		type: StringNode({ validator: 'resource', params: { pool: 'worldgen/biome_source' } }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'minecraft:fixed': {
				biome: StringNode({ validator: 'resource', params: { pool: '$worldgen/biome' } })
			},
			'minecraft:multi_noise': {
				preset: Opt(StringNode({ validator: 'resource', params: { pool: ['minecraft:overworld', 'minecraft:nether'] } })),
				biomes: Mod(ListNode(
					Reference('generator_biome')
				), {
					enabled: path => path.push('preset').get() === undefined,
					default: () => [{
						biome: 'minecraft:plains'
					}]
				})
			},
			'minecraft:checkerboard': {
				scale: Opt(NumberNode({ integer: true, min: 0, max: 62 })),
				biomes: Tag('$worldgen/biome')
			},
		}
	}, { category: 'predicate', disableSwitchContext: true }))

	schemas.register(`${ID}:modded_biome_slice`, Mod(ObjectNode({
		levels: ListNode(StringNode({ validator: 'resource', params: { pool: `$dimension` } })),
		layout: Opt(Reference(`${ID}:modded_biome_layout`)),
		weight: NumberNode({ integer: true })
	}, { context: `${ID}.modded_biome_slice`, disableSwitchContext: true }), {
		default: () => ({
			levels: ['minecraft:overworld'],
			weight: 100
		})
	}))

	schemas.register(`${ID}:modded_biome_layout`, ObjectNode({
		type: StringNode({ validator: 'resource', params: { pool: `${ID}:modded_biome_layout_type` as any } }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'lithostitched:biome_source': {
				biome_source: Reference(`${ID}:biome_source`)
			},
			'lithostitched:multi_noise': {
				biomes: Mod(ListNode(
					Reference('generator_biome')
				), {
					default: () => [{
						biome: 'minecraft:plains'
					}]
				}),
				areas: Opt(MapNode(
					StringNode({ validator: 'resource', params: { pool: '$worldgen/biome' } }),
					StringNode({ validator: 'resource', params: { pool: '$worldgen/biome' } })
				)),
				only_map_from_areas: Opt(BooleanNode())
			},
			'lithostitched:overlay': {
				overlays: ListNode(
					ObjectNode({
						matches_biomes: Tag('$worldgen/biome'),
						biome_source: Reference(`${ID}:biome_source`)
					})
				)
			}
		}
	}, {
		context: `${ID}.modded_biome_layout`, disableSwitchContext: true
	}))
}
