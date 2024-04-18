import axios, { Axios, AxiosRequestConfig } from "axios";

/**
 * Class used to abstract the network layer
 */
export default class NetworkWrapper {
    private client: Axios
    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
        });
    }

    async get(url: string, options?: AxiosRequestConfig) {
        return this.client.get(url, options);
    }

    async post(url: string, data: unknown) {
        return this.client.post(url, data);
    }

    async put(url: string, data: unknown, config: AxiosRequestConfig) {
        return this.client.put(url, data, config);
    }

    async delete(url: string) {
        return this.client.delete(url);
    }
}
