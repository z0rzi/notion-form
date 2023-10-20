import axios from "axios";
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

  static getInstance(): Api {
    if (!Api._instance) Api._instance = new Api();
    return Api._instance;
  }

  private constructor() {}

  async getUserId(): Promise<number> {
    if (this.userId) return this.userId;

    if (Cookies.get("uid")) {
      this.userId = +Cookies.get("uid")!;
      return this.userId;
    }

    const res = await axios.get(config.apiUrl + "/user-id");

    this.userId = +res.data;

    Cookies.set("uid", this.userId.toString());

    return this.userId;
  }

  async getPrompt(): Promise<Prompt | null> {
    const userId = await this.getUserId();

    try {
      const res = await axios.get(config.apiUrl + "/prompt", {
        headers: { "x-user-id": userId },
      });

      return res.data;
    } catch (e) {
      return null;
    }
  }

  async ratePrompt(promptId: string, rating: number): Promise<void> {
    const userId = await this.getUserId();

    await axios.put(
      config.apiUrl + "/prompt/" + promptId,
      { rating },
      { headers: { "x-user-id": userId } }
    );
  }
}
