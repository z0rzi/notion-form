import { styled } from "solid-styled-components";
import { Prompt } from "./api";
import { createEffect, createSignal } from "solid-js";

const Container = styled.div`
  padding: 10px 20px;
  text-align: center;
  line-height: 1.5;
  font-size: 1.4re;
`;

const CircleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Circle = styled.div<{ size: number; color: string; filled: boolean }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  border: 3px solid ${(props) => props.color};
  border-radius: 50%;
  cursor: pointer;

  transition-duration: 0.3s;
  background-color: ${(props) => (props.filled ? props.color : "transparent")};

  @media only screen and (min-width: 768px) {
    &:hover {
      background-color: ${(props) => props.color};
    }
  }

`;

const PromptContainer = styled.div`
  margin: 10px;
  margin-bottom: 30px;
`;

const SideTextContainer = styled.div`
  padding-top: 10px;
  width: 100%;
  display: flex;
  justify-content: space-between;
`;
const SideText = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-weight: 700;
  font-size: 0.7rem;
`;

export type PromptFormProps = {
  onRate: (rating: number) => void;
  prompt: Prompt
};

export default function PromptForm(props: PromptFormProps) {
  const [rating, setRating] = createSignal(null as number | null);

  function giveRating(rating: number) {
    setRating(rating);
    props.onRate(rating);
  }

  createEffect(() => {
    // Reset rating when prompt changes
    props.prompt;
    setRating(null);
  });

  return (
    <Container>
      <PromptContainer>{props.prompt.text}</PromptContainer>
      <div style={{"max-width": '400px', margin: 'auto'}}>
        <CircleContainer>
          <Circle
            filled={rating() === 1}
            size={50}
            color="#ee935e"
            onclick={() => giveRating(1)}
          ></Circle>
          <Circle
            filled={rating() === 2}
            size={37}
            color="#e8a362"
            onclick={() => giveRating(2)}
          ></Circle>
          <Circle
            filled={rating() === 3}
            size={25}
            color="#d4cc6a"
            onclick={() => giveRating(3)}
          ></Circle>
          <Circle
            filled={rating() === 4}
            size={37}
            color="#9acb79"
            onclick={() => giveRating(4)}
          ></Circle>
          <Circle
            filled={rating() === 5}
            size={50}
            color="#61bc81"
            onclick={() => giveRating(5)}
          ></Circle>
        </CircleContainer>
        <SideTextContainer>
          <SideText color="#ee935e">Very unlikely</SideText>
          <SideText color="#61bc81">Very likely</SideText>
        </SideTextContainer>
      </div>
    </Container>
  );
}
