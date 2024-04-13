import BaseClient from "./BaseClient";
import config from "./config";
import Cookies from "js-cookie";

export type Prompt = {
  id: string;
  text: string;
  category: string;
};

export class Api {
  private static _instance: Api;
  userId = null as number | null;
  private static baseClient: BaseClient

  static getInstance(): Api {
    if (!Api._instance) {
      this.baseClient = new BaseClient(config.apiUrl)
      Api._instance = new Api();
    }
    return Api._instance;
  }

  private constructor() { }

  async getUserId(): Promise<number> {
    if (this.userId) return this.userId;

    if (Cookies.get("uid")) {
      this.userId = +Cookies.get("uid")!;
      return this.userId;
    }

    const res = await Api.baseClient.get(config.apiUrl + "/user-id");

    this.userId = +res.data;

    Cookies.set("uid", this.userId.toString());

    return this.userId;
  }

  /**
   * Makes sure the prompt returned by the API is indeed a prompt
   */
  private checkPrompts(prompts: any[]): prompts is Prompt[] {
    if (!Array.isArray(prompts)) return false;

    for (const prompt of prompts) {
      if (prompt?.text?.length === 0)
        return false;
    }

    return true;
  }

  /**
   * @param amount The amount of prompts to get
   * @param idPromptsOnScreen The ids of the prompts that are currently on screen. To tell the API to not return these prompts
   * @param _retries For internal use only
   */
  async getPrompts(
    amount: number,
    idPromptsOnScreen: string[] = [],
    _retries = 5
  ): Promise<Prompt[] | null> {
    if (_retries === 0) return null;

    const userId = await this.getUserId();

    try {
      const res = await Api.baseClient.get(config.apiUrl + "/prompts", {
        params: { amount, exclude: idPromptsOnScreen.join(",") },
        headers: { "x-user-id": userId },
      });

      if (!this.checkPrompts(res.data)) {
        console.warn("Invalid prompts received from the API", res.data);
        return this.getPrompts(amount, idPromptsOnScreen, _retries - 1);
      }

      return res.data;
    } catch (e) {
      console.warn('Error while fetching prompts...', e);
      return this.getPrompts(amount, idPromptsOnScreen, _retries - 1);
    }
  }

  async promptSeen(
    promptId: string,
    action: "use" | "skip",
    _retries = 5
  ): Promise<void> {
    if (_retries === 0) return;

    const userId = await this.getUserId();

    await Api.baseClient
    .put(
      config.apiUrl + "/prompt/" + promptId + "/" + action,
      { used: true },
      { headers: { "x-user-id": userId } }
    )
      .catch(() => {
        this.promptSeen(promptId, action, _retries - 1);
      });
  }
}
