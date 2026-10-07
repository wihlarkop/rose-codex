# Reincarnation research

Research inspected on 2026-10-08. This is a feasibility note, not a verified game implementation. M0 deliberately defers a probability calculator: the inspected sources disagree on inputs and ranges that materially change its answers.

## Sources and observed behavior

The [Yugipedia feature description](https://yugipedia.com/wiki/Reincarnation) describes exchanging a chest card for three random cards of similar deck cost after five duels. Its page footer licenses wiki content under Creative Commons Attribution Share Alike unless otherwise noted; that does not establish an implementation-code license.

[Eenkin's calculator page](https://eenkin.github.io/dotr-fusion-simulator/reincarnation_calculator) says campaign wins, losses, and surrenders count, deck leader slots A/B affect results, slot C does not, and low-cost inputs can produce Fake Trap. These are community claims, not Rose Codex gameplay measurements.

The primary research behind that page is [GenericMadScientist's reverse-engineering post, Reincarnation section](https://www.speedrun.com/yugiohdotr/forums/ch2hb). It reports:

- Monster input: 80% monster / 20% spell result; spell input: 60% / 40%.
- Rank is the maximum of leaders A/B, represented from 0 (NCO) to 12 (SD).
- High-range probability is `(8 + 2 * rank)%`; low-range probability is `(92 - 2 * rank)%`.
- High target costs are input DC +1 through +10; low target costs are DC -10 through +1.
- A target cost selects from eligible cards in the chosen class, excluding the sacrificed ID. An empty pool reduces target DC until a pool exists; below 1 yields Fake Trap.

These describe a probability distribution. Card ID alone cannot predict the three resulting cards without the game's RNG state and draw procedure. The forum author reports inspecting game code, but Rose Codex has not reproduced that analysis on a game binary.

An [independent reverse-engineering author, ladd28](https://www.reddit.com/r/yugioh/comments/wkjwqu/i_made_some_gameshark_codes_to_make_duelists_of/) also reports a reincarnation eligibility exclusion list and describes changing the US game's code to permit all cards. This supports treating eligibility as separate factual data; it does not independently verify the probabilities above. No cheat code or implementation source was copied.

## Reference implementation discrepancies

Inspected [Eenkin `reincarnation.js`, pinned revision](https://github.com/Eenkin/dotr-fusion-simulator/blob/91613ec9851a7a75744c1f2c7e4b342514ba315f/scripts/reincarnation.js). It contains an ID eligibility list and separate monster/non-monster DC pools. Its calculation sums the selected A/B ranks, rather than taking their maximum. Its loop uses high offsets -1 through +10, giving twelve targets rather than the forum's ten. Low offsets are -10 through +1. It divides both range weights by twelve. It also removes the sacrificed ID by splicing a shared source pool, making subsequent calls sensitive to earlier inputs. These differences are reasons to avoid treating reference output as a golden oracle.

The repository's [GitHub metadata](https://api.github.com/repos/Eenkin/dotr-fusion-simulator) reported no license, and its recursive tree contained no LICENSE/COPYING file when inspected. Public access does not grant source-code reuse. No calculator implementation or full eligibility table is incorporated here.

## Proposed first-party model and validation

A later canonical reincarnation dataset should contain an explicit list of eligible **card IDs**, source revision, game region/version, and confidence status. Derive class and deck cost from canonical cards rather than duplicating them. Do not infer eligibility merely from having a valid DC.

A future pure function can accept `inputCardId`, rank A, and rank B, and return `{ cardId, probability }` entries. That would calculate a distribution, not simulate the game's exact RNG or promise a particular three-card result. Keep range/rank decisions explicit until evidence resolves them; do not introduce a configurable rule engine for two disputed constants.

Validation should resolve every ID, reject duplicate eligibility IDs, enforce established rank limits, verify finite nonnegative probabilities, verify total probability approximately equals 1, and cover cost gaps, input exclusion, and the Fake Trap fallback. Each call must preserve its input pools. Any implementation must have a case where A/B differ and a case where the high range boundaries change the result, so the disputed semantics cannot be hidden by easy examples.

## Remaining evidence needed

- Resolve maximum rank versus sum and the high-range boundary using game-code evidence or controlled gameplay, with region/version recorded.
- Verify the eligibility table independently and establish a permitted way to capture it.
- Determine whether the three awards are independent, whether duplicates are possible, and what state advances RNG. The distribution description does not settle those questions.
- Confirm availability counter semantics rather than turning a community description into a saved-game-state simulator.

Reincarnation is feasible as a small static probability tool once these gaps are resolved. M0 establishes the research boundary and ID-based model; it does not claim verified probability coverage.
