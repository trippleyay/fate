# FATE: INTO THE PITS

**FATE: Into the Pits** is a text-based cyberpunk management game where fight outcomes are determined by DreamDEX Event Contracts.
In Into the Pits, you run an underground fight club in the Trench. You recruit fighters, manage your roster, build relationships with the people around the club, and make decisions that shape what happens next.

## The Game

The story unfolds through repeated turns made up of short events and decisions. There is no single fixed path through the game. Your choices affect the fighters you recruit, the relationships you build, and the events that become available as the run continues.

Because the game is event-driven rather than based on a fixed linear plot, different runs can develop in different ways. The roster, relationships, and sequence of events can change from one playthrough to another.

## Architecture

### How the market integration works

Fight Night and Side Bet do not generate results on their own. They pin a stake to a real prediction market on Somnia and wait for that market to settle. The game reads the settled result and turns it into the fight outcome.

### DreamDEX markets

DreamDEX is an onchain prediction market on the Somnia network. The markets used here are **Event Contracts** that ask a binary yes or no question. An example would be a market that asks whether the price of ETH will be at or above a set value at a set time.

Each market has two outcomes:

- **YES** — the stated condition happens.
- **NO** — the stated condition does not happen.

When a Fight Night or Side Bet starts, the connector queries the Somnia indexer for open Event Contracts, finds one that has not resolved yet, and ties the stake to that market. The outcome is set automatically. On Fight Nights the stake is locked to YES. On Side Bets one fighter is set to YES and the other to NO. The player risks FATE on the chosen fighter without making a manual yes or no decision.

### Odds and payouts

These are real markets, so the payout is not a fixed amount. The odds come from the market's live price at the moment the stake is placed. The price reflects the market's current probability for that outcome.

If a player stakes on YES at a price of 0.5, the market is pricing that outcome at 50 percent. The payout is the stake divided by that price. A stake of 100 FATE at 0.5 odds returns 200 FATE. A stake of 100 FATE at 0.8 odds returns 125 FATE. A stake of 100 FATE at 0.25 odds returns 400 FATE.

If the market settles against the player, the stake is lost. Winnings are added to the player's FATE balance just like any other FATE and can be used for more bets or cashed out.

### Somnia and tUSDC

Somnia is the chain the markets and the Teller run on. The game's currency tUSDC is the onchain token used for buy and cashout. 

### The Teller

The Teller is the only part of the system that writes the Fate balance. It manages four data stores:

- **fate_ledger** — the authoritative Fate balance for each wallet.
- **fate_events** — an append-only log of every buy, cashout, stake, and reward.
- **fate_wallet_links** — the binding between a signed-in user session and a wallet address.
- **fate_quotas** — a daily rate limit so one wallet cannot drain the Teller reserve.

The client talks to the Teller through HTTP requests carrying the user session token from anonymous auth. The Teller runs with elevated privileges so it can write whatever the rules allow.


### Buying and cashing out

To buy FATE, the player transfers tUSDC from their wallet to the Teller wallet and submits the transaction hash. The Teller checks the transaction onchain and credits FATE to the ledger. The rate is 100 FATE per 1 tUSDC.

To cash out, the player asks to convert FATE back to tUSDC. The Teller debits the ledger and sends tUSDC from its own wallet to the player. All FATE can be cashed out.

### Stakes and settlement

A stake is tied to a specific market id and a specific side, YES or NO. The connector sends the stake to the Teller, which locks the FATE in an escrow record. When the market resolves, the game calls settle with the wallet outcome. The Teller reads the odds saved at stake time, calculates the payout from those odds, and either credits the payout or keeps the stake lost.

## Leaderboard

Into the Pits includes a global leaderboard that tracks each player's current run.

It records:

- Total fights
- Wins
- Losses

The leaderboard provides a persistent view of how different runs perform.

## About the Project

Into the Pits originated from the **Somnia Event Contracts Hackathon** and was built around the idea of using real Event Contract outcomes as part of an interactive game rather than treating prediction markets as a separate financial interface.

## License

FATE: Into the Pits is released under the MIT License.

## Music

**Synthwave**  
Music by [Dmitrii Kolesnikov](https://pixabay.com/users/the_mountain-3616498/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=143303) from [Pixabay](https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=143303)

**Lo-Fi**  
Music by [Olga Akhmetshina](https://pixabay.com/users/ornave-56322367/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=553356) from [Pixabay](https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=553356)

**War Drums**  
Music by [Ievgen Poltavskyi](https://pixabay.com/users/hitslab-47305729/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=318680) from [Pixabay](https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=318680)