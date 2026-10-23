import { useEffect, useEffectEvent, type RefObject } from "react";

type OutsidePressOptions = {
  isActive: boolean;
  refs: RefObject<HTMLElement | null>[];
  ignoresOverlays?: boolean;
  onOutsidePress: () => void;
};

function layerOf(node: Node) {
  let current = node;

  while (current.parentNode && current.parentNode !== document.body) {
    current = current.parentNode;
  }

  return current;
}

export function useOutsidePress({
  isActive,
  refs,
  ignoresOverlays = false,
  onOutsidePress,
}: OutsidePressOptions) {
  const handlePress = useEffectEvent((target: Node) => {
    const elements = refs.map(ref => ref.current).filter(element => element !== null);
    const isInside = elements.some(element => element.contains(target));
    const isOverlay = elements.every(element => layerOf(element) !== layerOf(target));

    if (!isInside && !(ignoresOverlays && isOverlay)) {
      onOutsidePress();
    }
  });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    function listen(event: PointerEvent) {
      if (event.target instanceof Node) {
        handlePress(event.target);
      }
    }

    document.addEventListener("pointerdown", listen);

    return () => document.removeEventListener("pointerdown", listen);
  }, [isActive]);
}
