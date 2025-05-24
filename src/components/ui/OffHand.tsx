import { motion } from "framer-motion";
import { useState } from "react";

import { Card as TCard, getRank, Player } from "../../lib";

import Card from "./Card";
import CardHolder from "./CardHolder";

type Position = number;

export interface OffHandProps {
  offHand: Player["offHand"];
  flipped?: boolean;
  onCardPositionedClick?: (card: TCard, position: number, n?: number) => void;
  grayOutFaceUpCard?: (card: TCard, position: number) => boolean;
  disable?: boolean;
}

export default function OffHand(props: OffHandProps) {
  const flippedSign = props.flipped ? -1 : 1;

  function sameRanksAmnt(card?: TCard): number {
    if (card === undefined) return 0;
    return props.offHand.faceUp.filter(
      (hCard) => hCard !== undefined && getRank(hCard) === getRank(card)
    ).length;
  }

  const [selected, setSelected] = useState<TCard | null>(null);
  function onCardPositionedClick(card: TCard, i: number, n?: number) {
    if (props.disable) return;
    if (props.grayOutFaceUpCard?.(card, i)) return;

    setSelected(null);
    if (sameRanksAmnt(card) === 1) {
      props.onCardPositionedClick?.(card, i, undefined);
    } else if (n !== undefined) {
      props.onCardPositionedClick?.(card, i, n);
    } else {
      setSelected(card);
    }
  }

  return (
    <motion.div
      initial={{ y: 300 * flippedSign }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2, type: "tween" }}
      exit={{ y: 300 * flippedSign }}
      className="flex justify-center gap-2 md:gap-4"
    >
      {[0, 1, 2].map((index) => {
        if (props.offHand.faceDown[index] === undefined) return null;
        return (
          <CardHolder key={`faceDown-${index}`}>
            <div className="absolute">
              <Card
                flipped
                card={props.offHand.faceDown[index]}
                onClick={(card) =>
                  props.onCardPositionedClick?.(card!, index)
                }
              />
            </div>
          </CardHolder>
        );
      })}
      {props.offHand.faceUp.map((faceUpCard, index) => {
        if (faceUpCard === undefined) return null;
        return (
          <CardHolder key={`faceUp-${index}`}>
            <div className="absolute">
              <Card
                withSelector={selected === faceUpCard}
                selectorMax={sameRanksAmnt(faceUpCard)}
                card={faceUpCard}
                z={1}
                onClick={(_, n) =>
                  onCardPositionedClick(
                    faceUpCard!,
                    index,
                    n
                  )
                }
                grayOut={props.grayOutFaceUpCard?.(
                  faceUpCard!,
                  index
                )}
              />
            </div>
          </CardHolder>
        );
      })}
    </motion.div>
  );
}
