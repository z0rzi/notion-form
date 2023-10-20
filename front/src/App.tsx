import { Component, Show, createEffect, createSignal } from "solid-js";
import { styled } from "solid-styled-components";

import PromptForm from "./PromptForm";
import { Api, Prompt } from "./api";

const PROMPT_TRANSITION_DURATION = 300;

const Container = styled.div`
  display: flex;
  text-align: center;
  height: 100%;
  flex-direction: column;
  max-width: 1000px;
  font-family: Open Sans, sans-serif;
  color: #3E4655;
  font-weight: 500;
  font-size: 19px;
  margin: auto;
`;

const PromptFormContainer = styled.div`
  transition-duration: ${() => PROMPT_TRANSITION_DURATION}ms;
  position: relative;
  flex-grow: 1;
`;

const App: Component = () => {
  const [prompt, setPrompt] = createSignal(null as Prompt | null);
  const [promptOpacity, setPromptOpacity] = createSignal(1);
  const [ratedAmount, setRatedAmount] = createSignal(0);
  const api = Api.getInstance();

  createEffect(() => {
    setPrompt({ text: "Loading...", category: "", id: "" });
    api.getPrompt().then((prompt) => {
      setPrompt(prompt);
    });
  });

  function onRatePrompt(prompt: Prompt | null, rating: number) {
    if (!prompt) return;

    setPromptOpacity(0);

    const apiPromise = api.ratePrompt(prompt.id, rating);
    const transitionPromise = new Promise((resolve) =>
      setTimeout(resolve, PROMPT_TRANSITION_DURATION)
    );

    Promise.all([apiPromise, transitionPromise]).then(() => {
      setPromptOpacity(1);
      api.getPrompt().then((prompt) => {
        setPrompt(prompt);
        setRatedAmount(ratedAmount() + 1);
      });
    });
  }

  return (
    <Container>
      <Show when={prompt() != null}>
        <div style={{ padding: "30px", "font-size": '.9rem' }}>
          For each prompt, rate <b>how likely you are</b> to use it in your next
          journaling session.
        </div>
        <PromptFormContainer style={{ opacity: promptOpacity() }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              width: "100%",
              transform: "translateY(-50%)",
            }}
          >
            <div
              style={{
                opacity: 0.5,
                "font-style": "italic",
                "font-size": ".8rem",
              }}
            >
              {prompt()?.category?.toUpperCase()}
            </div>
            <PromptForm
              prompt={prompt() as Prompt}
              onRate={(rating) => onRatePrompt(prompt(), rating)}
            ></PromptForm>
          </div>
        </PromptFormContainer>
        <div
          style={{
            padding: "30px",
            opacity: ratedAmount() >= 5 ? 0.5 : 0,
            transition: "opacity 1s ease-in-out",
            "font-size": ".9rem",
          }}
        >
          You can stop at any point 😉
        </div>
      </Show>
      <Show when={prompt() == null}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "5%",
            width: "90%",
            transform: "translateY(-50%)",
          }}
        >
          <p>🎉 You're all done! 🎉</p>
          <br />
          <p>Thanks a lot for your help!</p>
          <br />
          <p style={{ "font-size": ".8rem", opacity: 0.5 }}>
            You can come back in a few days, maybe there will be new prompts for
            you to rate 😉
          </p>
        </div>
      </Show>
    </Container>
  );
};

export default App;
