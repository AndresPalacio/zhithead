import { motion, Variants } from "framer-motion";
import { useState } from "react"; // Removed useEffect, useRef

import { Cards, Card as TCard, getRank } from "../../lib";

import Card from "./Card";

export interface HandProps {
  hand: Cards;
  onCardClick?: (card: TCard, index: number, n?: number) => void;
  hideCards?: boolean;
  flipped?: boolean;
  grayOut?: (card: TCard, index: number) => boolean;
  enablePlaySameRanks?: boolean;
}

// Constants for card layout
const CARD_WIDTH = 90; // Assuming card width, adjust as needed
const CARD_OVERLAP = 30;
const CARD_EFFECTIVE_WIDTH = CARD_WIDTH - CARD_OVERLAP;
const HOVER_RAISE_AMOUNT = -20; // Raise by 20px
const HOVER_SCALE_AMOUNT = 1.05;

export default function Hand(props: HandProps) {
  function sameRanksAmnt(card: TCard) {
    return props.hand.filter((hCard) => getRank(hCard) === getRank(card))
      .length;
  }

  const [selected, setSelected] = useState<TCard | null>(null);
  function onCardClick(card: TCard, i: number, n?: number) {
    if (props.grayOut?.(card, i)) return;
    if (!props.enablePlaySameRanks) {
      props.onCardClick?.(card, i);
      return;
    }

    setSelected(null);
    if (sameRanksAmnt(card) === 1) {
      props.onCardClick?.(card, i, undefined);
    } else if (n !== undefined) {
      props.onCardClick?.(card, i, n);
    } else {
      setSelected(card);
    }
  }

  const flippedSign = props.flipped ? -1 : 1;
  const variants: Variants = {
    show: ({ i, isSelected }: { i: number; isSelected: boolean }) => ({
      x: i * CARD_EFFECTIVE_WIDTH, // For non-flex layout within the inner div
      y: isSelected ? HOVER_RAISE_AMOUNT : 0,
      scale: isSelected ? HOVER_SCALE_AMOUNT : 1,
      rotate: 0, // No rotation
      zIndex: isSelected ? 10 : i, // Bring selected card to front
      transition: { type: "spring", stiffness: 300, damping: 20 },
    }),
    hidden: {
      opacity: 0,
      y: 50 * flippedSign,
      transition: { duration: 0.2 },
    },
    initial: {
      opacity: 0,
      y: 50 * flippedSign,
    }
  };

  // Calculate the width of the inner container that holds all cards
  const innerContainerWidth =
    props.hand.length * CARD_EFFECTIVE_WIDTH +
    (props.hand.length > 0 ? CARD_OVERLAP : 0); // Add back overlap for the last card

  return (
    <div
      className="h-full max-h-card-height w-full overflow-x-auto" // Scroll container
    >
      <motion.div // Inner container for cards
        className="relative flex items-center h-full" // Use relative for zIndex on children
        style={{ width: `${innerContainerWidth}px` }}
      >
        {props.hand.map((card, i) => (
          <motion.div
            custom={{ i, isSelected: selected === card }}
            initial="initial"
            animate="show"
            exit="hidden"
            variants={variants}
            key={card + "-" + i} // Ensure unique key if cards can be identical
            // No className="absolute" needed if direct children of a flex container
            // that handles spacing. However, for overlapping, absolute or negative margins are needed.
            // The current x: i * CARD_EFFECTIVE_WIDTH implies absolute-like positioning within the relative parent.
            // Let's keep it this way for explicit control over overlap.
            // Each motion.div will be absolutely positioned relative to the inner container.
            className="absolute" 
            style={{
              // transformOrigin: "center bottom" // Default, adjust if needed
              // Add left to position cards horizontally based on index
              // This is handled by variants.show.x now
            }}
          >
            <Card
              withSelector={selected === card}
              selectorMax={sameRanksAmnt(card)}
              card={card}
              onClick={(_, n) => onCardClick(card, i, n)}
              flipped={props.hideCards}
              grayOut={props.grayOut?.(card, i)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
// Removed offsetFromCenter function
