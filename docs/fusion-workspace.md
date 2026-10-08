# Fusion Workspace

The `/fusion/` page is a local planning workspace for arranging distinct card
occurrences in Hand and Summoning Area. Add cards with the existing picker;
duplicates are separate occurrences and can be moved, reordered, selected for a
chain, or removed independently. The occurrence ID is for workspace identity;
canonical DotR card IDs remain the source of card data and fusion outcomes.

The two zones are organizational labels. Their unlimited planning capacity does
not claim that the game has unlimited hand or field capacity. This workspace does
not calculate zone capacity or game legality. It previews ordinary two-card
fusions through `createFusionEngine`, shows ordered successful chain results, and
marks the first failed pair. A preview never consumes or transforms a workspace
occurrence. Failed-chain discards, equipment, rituals, and random transformation
results remain unspecified.

Card images and metadata come from the committed canonical data and shared card
components. Missing imagery is shown as unavailable. All controls stay on the
same route; no planning state is persisted.
