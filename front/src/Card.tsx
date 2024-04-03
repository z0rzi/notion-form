import { createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { Prompt } from "./api";

const categoriesColors: Record<string, string> = {
  default: "#11202F",
  career: "#4D88B3",
  feelings_and_emotions: "#A273B2",
  goals_and_plans: "#65AB8D",
  love_and_relationships: "#D17176",
  self_reflexion: "#C98642",
};

const Container = styled.div`
  position: absolute;
  background: #f5f5f5;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100%;
  aspect-ratio: 16 / 11;
  border-radius: 20px;
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.1);

  user-select: none;
  cursor: grab;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CardDecoration = styled.div<{ color: string }>`
  height: 100px;
  margin: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  hr {
    background: ${(props) => props.color || categoriesColors.default};
    height: 5px;
    border-radius: 5px;
    border: none;
    width: 100%;
    margin: 0 30px;
  }

  img {
    height: 100%;
  }
`;

const PromptContainer = styled.div`
  margin: 0 50px;
  font-size: 1.5em;
`;

function findDomCard(e: HTMLElement | null): HTMLDivElement {
  if (!e) throw new Error("No card found");

  if (e.classList.contains("card")) {
    return e as HTMLDivElement;
  } else {
    return findDomCard(e.parentElement as HTMLElement | null);
  }
}

let domCard: HTMLDivElement | null = null;
let startPos = { x: 0, y: 0 };
let initTime = 0;
export default function (props: {
  prompt: Prompt;
  onSwipe: (action: "use" | "skip") => void;
  zIndex: number;
  inFront: boolean;
}) {
  createEffect(() => {
    if (props.inFront) {
      initTime = Date.now();
    }
  });

  //
  // Adding the grabbing listeners
  //
  function onMove(e: MouseEvent) {
    if (!domCard) return;

    const offsetX = e.clientX - startPos.x;
    const offsetY = e.clientY - startPos.y;

    const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2);
    const scaleFactor = Math.min(1 + distance / 1000, 1.2);

    domCard.style.transition = "";
    domCard.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scaleFactor}) rotate(${
      offsetX / 30
    }deg)`;
  }
  function onGrab(e: MouseEvent) {
    domCard = findDomCard(e.target as HTMLDivElement);

    startPos = { x: e.clientX, y: e.clientY };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onRelease);
  }
  function onRelease(e: MouseEvent) {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onRelease);

    if (!domCard) return;

    const offsetX = e.clientX - startPos.x;
    const offsetY = e.clientY - startPos.y;

    const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2);

    if (distance > 300) {
      // Card has been swiped, we have to send it off the screen
      domCard.style.transition = "transform 0.5s";
      domCard.style.transform = `translate(${offsetX * 5}px, ${
        offsetY * 5
      }px) scale(1.2) rotate(${offsetX / 30}deg)`;

      let action: "use" | "skip" = "skip";

      const cardDuration = (Date.now() - initTime) / 1000;
      if (cardDuration > 30) {
        // If a card has been on the screen for more than 30 seconds, we consider it as used
        action = "use";
      }

      props.onSwipe(action);
    } else {
      // Card has been released, putting it back to the center
      domCard.style.transition = "transform 0.5s";
      domCard.style.transform = `translate(-50%, -50%)`;
      domCard = null;
    }
  }

  const categorySlug =
    props.prompt.category.toLowerCase().replace(/[^a-z]/g, "_") || "default";
  const imagePath = `/inkie_${categorySlug}.png`;

  const cardColor = categoriesColors[categorySlug] || categoriesColors.default;

  return (
    <Container
      class="card"
      onMouseDown={onGrab}
      style={{ "z-index": props.zIndex }}
    >
      <CardDecoration color={cardColor}>
        <hr />
        <img src={imagePath}></img>
        <hr />
      </CardDecoration>
      <PromptContainer>
        <p>{props.prompt.text}</p>
      </PromptContainer>
      <CardDecoration color={cardColor}>
        <hr />
      </CardDecoration>
    </Container>
  );
}
