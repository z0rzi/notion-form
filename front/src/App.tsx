import { Component, Show, createEffect, createSignal } from "solid-js";
import { styled } from "solid-styled-components";

import Card from "./Card";
import { Api, Prompt } from "./api";

const PROMPT_TRANSITION_DURATION = 300;

const Container = styled.div`
  display: flex;
  text-align: center;
  height: 100%;
  width: 100%;
  flex-direction: column;
  font-family: Open Sans, sans-serif;
  color: #3e4655;
  font-weight: 500;
  font-size: 15px;
  margin: auto;
  overflow: hidden;
`;

const CardsContainer = styled.div`
  margin: auto 5%;
  position: relative;
  height: 100%;
  width: 90%;
  max-height: 500px;
`;

const App: Component = () => {
  const [prompts, setPrompts] = createSignal([] as Prompt[]);
  const [errMessage, setErrMessage] = createSignal("");
  const api = Api.getInstance();

  createEffect(() => {
    console.log('fetching init prompts');
    api
      .getPrompts(3)
      .then((prompts) => {
        if (prompts) setPrompts(prompts);
      })
      .catch(() => {
        setPrompts([]);
        setErrMessage("Failed to load prompts... 😢");
      });
  }, []);

  function onPromptSwipe(prompt: Prompt | null, action: "use" | "skip") {
    if (!prompt) return;

    const promptsIds = prompts().map(p => p.id);

    const seePromptPromise = api.promptSeen(prompt.id, action);
    const transitionPromise = new Promise((resolve) =>
      setTimeout(resolve, PROMPT_TRANSITION_DURATION)
    );
    console.log('fetching prompts');
    const newPrompts = prompts().filter((p) => p.id !== prompt.id);

    const getPromptPromise = api.getPrompts(1, promptsIds).then((apiPrompts) => {
      if (apiPrompts) {
        newPrompts.push(apiPrompts[0]);
      }
    })

    Promise.all([seePromptPromise, transitionPromise, getPromptPromise]).then(() => {
      setPrompts(newPrompts);
    });
  }

  return (
    <Container>
      <Show when={!errMessage()}>
        <CardsContainer>
          {prompts().map((prompt, idx) => (
              <Card
                zIndex={prompts().length - idx}
                prompt={prompt}
                onSwipe={(action) => onPromptSwipe(prompt, action)}
                inFront={idx === 0}
              ></Card>
          ))}
        </CardsContainer>
      </Show>
      <Show when={errMessage()}>
        <div>{errMessage()}</div>
      </Show>
    </Container>
  );
};

export default App;
