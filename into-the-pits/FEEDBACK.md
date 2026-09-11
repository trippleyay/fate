# Feedback: Building on Somnia + DreamDEX

Feedback from integrating DreamDEX Event Contracts into FATE: Into the Pits, scoped to Somnia and DreamDEX specifically.

## Positives

**Event Contracts suit a game loop well.**
Binary YES/NO Event Contracts are a natural fit for Fight Nights and Side Bets. The structure is simple: a question, two outcomes, a resolution, and a clear winner or loser. That maps cleanly onto matchmaking without forcing awkward game logic around the on chain piece.

**On chain settlement is verifiable.**
When a market resolves, the result exists on chain. That gives the game a source of truth that is independent of the roster, the UI, or the backend. For a game that wants to argue its outcomes are fair, that is a useful property.

**tUSDC integration is coherent on Somnia.**
tUSDC is the token the markets use and the token the buy and cashout layer talks to. Having the market token and the stablecoin on the same chain avoids a cross chain layer, which keeps things simpler than bridging stablecoins around.

**Prices arrive in a usable form for odds.**
Event Contracts expose prices that can be read as an implied probability for the outcome. That gives a natural source for variable payouts instead of inventing odds inside the game. The math is straightforward, stake divided by entry price.

## Friction

**Binary market discovery was not reliable through the SDK.**
The biggest practical problem we hit: the markets SDK returned no binary markets, but binary markets were live and tradable the whole time. We had to bypass the SDK and query the Somnia indexer directly to reliably find open Event Contracts. If a game depends on markets actually being available, the discovery path matters more than the trading path, and the SDK was weak there for this use case.

**Markets are not always open.**
This is not a bug in Somnia, but it is a constraint to design around. If nothing is currently open and resolvable, the game has nothing to pin a stake to. We hit a UX worst case where players saw a generic "no market" message that did not distinguish between SDK failure, indexer failure, and genuinely empty markets. The underlying system had real markets in some cases, but the discovery path hid that.

**Market data and resolution data live in different places.**
The market state, prices, expiry, and resolution come through different endpoints and different documentation pieces. To build the full loop, find a market, read the question, read the price, wait for resolution, read the outcome, you end up touching several surfaces. That is manageable, but it makes the flow more assembled than plug and play.

**Resolution and settlement semantics matter more than expected.**
An on chain resolution is only useful if the game can translate it cleanly into win, loss, or payout. Payout depends on price at entry time, not price at resolution time, so entry odds must be captured at stake time. That is doable, but it means the game has to store odds with the stake and not recompute them later from the market alone. A small but important detail.

**Fetcher and indexer are two different things to keep straight.**
The SDK gave the impression of a cleaner abstraction than it delivered for discovery. The indexer was more reliable for queries, but the indexer is not the market itself, it is a read path. Teams building on this need to know which layer they are querying and what each layer is allowed to tell them.

## Our Take

Somnia and DreamDEX are a decent fit for this kind of game because the market model is simple and the outcomes are verifiable. The weak spot was practical discoverability of binary markets and the need to go straight to the indexer to get anything dependable. If that gap stays, builders will either miss markets or end up writing their own discovery layer anyway.
