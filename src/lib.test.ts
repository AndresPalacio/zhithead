import { expect, test, describe, it } from "vitest";
import {
  createCard,
  getRank,
  getSuite,
  Rank,
  Suite,
  createDeck,
  dealCards,
  dealCardsFor,
  Deck,
  Player,
} from "./lib";

test("getSuite()", () => {
  expect(getSuite(createCard(Suite.Clubs, Rank.Ace))).toBe(Suite.Clubs);
  expect(getSuite(createCard(Suite.Diamonds, Rank.Queen))).toBe(Suite.Diamonds);
  expect(getSuite(createCard(Suite.Hearts, Rank.King))).toBe(Suite.Hearts);
  expect(getSuite(createCard(Suite.Spades, Rank.Ace))).toBe(Suite.Spades);
});

test("getRank()", () => {
  expect(getRank(createCard(Suite.Clubs, Rank.Ace))).toBe(Rank.Ace);
  expect(getRank(createCard(Suite.Clubs, Rank.Num2))).toBe(Rank.Num2);
  expect(getRank(createCard(Suite.Diamonds, Rank.Jack))).toBe(Rank.Jack);
  expect(getRank(createCard(Suite.Hearts, Rank.King))).toBe(Rank.King);
  expect(getRank(createCard(Suite.Spades, Rank.Num10))).toBe(Rank.Num10);
});

describe("dealCards", () => {
  const initialDeck: Deck = createDeck();
  const STARTING_HAND_SIZE = 15; // As per recent change
  const STARTING_FACEDOWN_SIZE = 3;

  it(`should deal ${STARTING_HAND_SIZE} cards to hand and ${STARTING_FACEDOWN_SIZE} to offHand.faceDown`, () => {
    const [newDeck, player]: [Deck, Player] = dealCards(initialDeck);

    // Check hand size
    expect(player.hand.length).toBe(STARTING_HAND_SIZE);

    // Check faceDown cards
    // player.offHand.faceDown is of type OffHandCards = [Card?, Card?, Card?]
    // Its .length property will always be 3 if fully populated by dealCards,
    // or less if partially populated (though dealCards always aims for 3).
    // We expect 3 cards to be dealt.
    expect(player.offHand.faceDown.length).toBe(STARTING_FACEDOWN_SIZE);
    // More precise check: ensure all 3 slots have cards
    expect(player.offHand.faceDown.filter(Boolean).length).toBe(STARTING_FACEDOWN_SIZE);


    // Check deck size reduction
    const expectedDeckSize =
      initialDeck.length - (STARTING_HAND_SIZE + STARTING_FACEDOWN_SIZE);
    expect(newDeck.length).toBe(expectedDeckSize);
  });
});

describe("dealCardsFor", () => {
  const initialDeck: Deck = createDeck();
  const STARTING_HAND_SIZE = 15; // As per recent change
  const STARTING_FACEDOWN_SIZE = 3;
  const playerCount = 2;

  it(`should deal ${STARTING_HAND_SIZE} cards to each player's hand for ${playerCount} players`, () => {
    const [newDeck, players]: [Deck, Player[]] = dealCardsFor(
      playerCount,
      initialDeck
    );

    expect(players.length).toBe(playerCount);

    players.forEach((player, index) => {
      // Check hand size for each player
      expect(
        player.hand.length,
        `Player ${index + 1} hand size`
      ).toBe(STARTING_HAND_SIZE);

      // Check faceDown cards for each player
      expect(
        player.offHand.faceDown.length,
        `Player ${index + 1} faceDown length`
      ).toBe(STARTING_FACEDOWN_SIZE);
      expect(
        player.offHand.faceDown.filter(Boolean).length,
        `Player ${index + 1} faceDown actual cards`
      ).toBe(STARTING_FACEDOWN_SIZE);
    });

    // Check deck size reduction
    const expectedDeckSize =
      initialDeck.length -
      playerCount * (STARTING_HAND_SIZE + STARTING_FACEDOWN_SIZE);
    expect(newDeck.length).toBe(expectedDeckSize);
  });

  it("should handle dealing to 0 players", () => {
    const [newDeck, players]: [Deck, Player[]] = dealCardsFor(0, initialDeck);
    expect(players.length).toBe(0);
    expect(newDeck.length).toBe(initialDeck.length);
  });
  
  it("should handle dealing when deck might not be sufficient for full hands (edge case)", () => {
    // Create a smaller deck, e.g., 10 cards
    const smallDeck: Deck = initialDeck.slice(0, 10); 
    const singlePlayerCount = 1;
    // Expected: hand gets 10 cards (all of deck except 3 for facedown, if possible), facedown gets 3.
    // Actually, dealCards takes hand first, then facedown.
    // Hand: 10 cards. FaceDown: 0 from deck.
    // This needs careful thought on how dealCards behaves with insufficient cards.
    // dealCards: player.hand = deckCopy.splice(-STARTING_HAND_SIZE); (takes up to 15)
    //            player.offHand.faceDown = deckCopy.splice(-STARTING_FACEDOWN_SIZE) (takes up to 3 from remaining)

    // If deck has 10 cards:
    // player.hand gets min(10, 15) = 10 cards. Deck becomes 0.
    // player.offHand.faceDown gets min(0, 3) = 0 cards.
    // Let's test this specific scenario for dealCards first.
    
    const [finalDeckSmallDeal, playerSmallDeal] = dealCards(smallDeck);
    expect(playerSmallDeal.hand.length).toBe(Math.min(smallDeck.length, STARTING_HAND_SIZE)); // Should be 10
    
    const remainingInDeckAfterHand = smallDeck.length - playerSmallDeal.hand.length; // 0
    // faceDown is OffHandCards = [Card?, Card?, Card?], splice will return empty array if deck is empty
    // and the type assertion `as OffHandCards` in `dealCards` might be problematic if splice returns []
    // `[] as OffHandCards` is not type safe. However, `player.offHand.faceDown = []` is done in makePlayer initially.
    // `player.offHand.faceDown = deckCopy.splice(-STARTING_FACEDOWN_SIZE) as OffHandCards;`
    // If deckCopy is empty, `deckCopy.splice(-3)` is `[]`. `[] as OffHandCards` is `[]`.
    // So `player.offHand.faceDown` would be `[]`, not `[undefined, undefined, undefined]`.
    // This might be an issue in `dealCards` or `makePlayer` ensuring `faceDown` is always a 3-element tuple.
    // `makePlayer` initializes `faceDown: []`. This is inconsistent with `OffHandCards` type.
    // Let's assume `makePlayer` is: `faceDown: [undefined, undefined, undefined]` for type safety.
    // If `dealCards` assigns `[] as OffHandCards` then `player.offHand.faceDown.length` would be 0.
    // This test will expose that.

    expect(playerSmallDeal.offHand.faceDown.length).toBe(Math.min(remainingInDeckAfterHand, STARTING_FACEDOWN_SIZE)); // Should be 0 if interpreted as actual cards.
                                                                                                                  // Or it could be 3 if it means slots, some of which are undefined.
                                                                                                                  // Given `[] as OffHandCards`, length is 0.
    
    // If `makePlayer` ensures `faceDown` is `[undefined,undefined,undefined]`, and `dealCards` populates it:
    // `const faceDownCards = deckCopy.splice(-STARTING_FACEDOWN_SIZE);`
    // `faceDownCards.forEach((card, i) => player.offHand.faceDown[i] = card);`
    // Then `player.offHand.faceDown.length` would be 3.
    // `player.offHand.faceDown.filter(Boolean).length` would be 0.
    // The current `dealCards` implementation `player.offHand.faceDown = deckCopy.splice(...) as OffHandCards;`
    // will result in `player.offHand.faceDown` being `[]` if `deckCopy.splice` returns `[]`.
    // So, `player.offHand.faceDown.length` will be 0.
    
    expect(playerSmallDeal.offHand.faceDown.filter(Boolean).length).toBe(0); // No cards dealt to faceDown
    expect(finalDeckSmallDeal.length).toBe(0);


    // Now for dealCardsFor with insufficient deck
    const deckOf20 = initialDeck.slice(0, 20);
    const twoPlayers = 2;
    // Total cards needed for 2 players: 2 * (15 + 3) = 36. Deck has 20.
    // Player 1: hand gets 15, facedown gets 3. Deck remaining: 20 - 18 = 2.
    // Player 2: hand gets 2, facedown gets 0. Deck remaining: 0.
    // This depends on how dealCardsFor loops and if it stops early.
    // It calls dealCards repeatedly.
    // P1: dealCards(deckOf20) -> p1.hand=15, p1.fd=3. deck_after_p1 = 2.
    // P2: dealCards(deckOf2)  -> p2.hand=2,  p2.fd=0. deck_after_p2 = 0.

    const [finalDeckMulti, playersMultiInsufficient] = dealCardsFor(twoPlayers, deckOf20);
    expect(playersMultiInsufficient.length).toBe(twoPlayers);

    expect(playersMultiInsufficient[0].hand.length).toBe(15);
    expect(playersMultiInsufficient[0].offHand.faceDown.filter(Boolean).length).toBe(3);
    
    expect(playersMultiInsufficient[1].hand.length).toBe(2); // Remaining 2 cards from deck
    expect(playersMultiInsufficient[1].offHand.faceDown.filter(Boolean).length).toBe(0); // No cards left for facedown

    expect(finalDeckMulti.length).toBe(0);
  });
});
