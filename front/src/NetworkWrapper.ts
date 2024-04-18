import axios, { Axios } from "axios";

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

    async get(url: string, options?: any) {
        return this.client.get(url, options);
    }

    async post(url: string, data: any) {
        return this.client.post(url, data);
    }

    async put(url: string, data: any, config: any) {
        return this.client.put(url, data, config);
    }

    async delete(url: string) {
        return this.client.delete(url);
    }
}
