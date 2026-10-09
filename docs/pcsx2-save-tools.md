# PCSX2 Save Inspector v1 · Read-only

## Intent

Rose Codex offers a **local-only memory card inspector** at /saves/. This is a cautious foundation for future game-save support, **not** a DotR card/Deck Leader/save editor.

PCSX2's official [Memory Cards guide](https://pcsx2.net/docs/configuration/memcards/) distinguishes File Memory Cards (one .ps2 image, typically 8MB, also 16/32/64MB) from Folder Memory Cards (host folders). The v1 inspector supports file images only; it does not open a directory or parse .max, .psu, .cbs, .psv, or save states. The UI recommends using PCSX2 Settings → Memory Cards → Browse or Tools → Open Data Directory, then inspecting **a copy** from memcards.

## Scope and safety

1. Local browser File API (file input, then File.arrayBuffer()), no backend, no upload, no fetch of save bytes, no download or original-file mutation. File/image bytes remain transient browser memory only. They are not stored in IndexedDB, localStorage, deck JSON or Collection.
2. Validate exact PS2 superblock signature, type, page/cluster/block geometry, bounded 70 MiB file size, and image size consistency for raw data pages or pages with 16 spare/ECC bytes. Reject other containers instead of guessing offsets.
3. Read superblock version, physical/logical sizes, pages and clusters. The first directory block is identified by allocation offset and root relative cluster; read indirect FAT and subsequent clusters, with range bounds and cycle detection. Only the first **256 root directory records** (each 512 bytes) are inspected, including dot/dot-dot; deleted records and the two pseudo-records are not displayed. Partial/corrupt root chains report a visible warning rather than inventing entries.
4. A possible DotR match is a live root entry whose name contains SLUS-20515 (hyphen/underscore optional), based on a [published NTSC-U/C DotR save resource](https://www.speedrun.com/yugiohdotr/resources/46vto). It is **not a validated file payload or checksum**. No matching name does **not** imply absence of the game; Japanese/European regions and alternative naming may differ.
5. We do **not** inspect nested game payloads or claim to know card copies, Chest contents, the selected duel deck, leader rank, campaign path, opponent progress or reincarnation counter. A permitted, independently verified DotR save layout is required before making those claims. No write or save-editing workflow exists.

Primary technical reference: Ross Ridge, [PlayStation 2 Memory Card File System](https://github.com/PCSX2/pcsx2/blob/master/pcsx2/Reference/PS2-MemoryCardFileSystem.htm), distributed in the PCSX2 repository and explicitly **public domain**. This is a first-party TypeScript implementation from the published on-disk structure, with no external parser runtime dependency or code copied from PCSX2/MyMC.

## Acceptance

Use a **copy** of a genuine PCSX2 .ps2 File Memory Card.

- Open /saves/ using bun run dev, select a file and see recognized version, geometry, file size and top-level entries.
- Try an unrelated file; a signature/format failure appears without bogus results.
- If the card contains a SLUS-20515 folder, see **possible** DotR association; no false decoding of the inventory.
- Reinspect another file, use Clear, and check no browser storage or source file was modified.
- Check a narrow viewport and keyboard-driven file picker.
- Folder-based cards, exported .psu files and other formats remain explicitly unsupported.

Three focused synthetic tests cover standard raw 8MB cards, ECC/spare 16-byte pages, malformed signatures and FAT cycles. No private save fixture is committed. CI runs the repository's existing checks and production build.

## Next milestone boundary

Actual DotR ownership/deck data requires read-only parsing of **confirmed game-specific payloads** with region/offset checks, checksums when documented, and comparison with known PCSX2 observations. Do not infer card ownership from a filename, and never mutate a save image even if game records become understood.
