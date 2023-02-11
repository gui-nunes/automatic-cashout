import { HttpDAO } from '../interfaces';
import axios from 'axios';
export class AxiosService implements HttpDAO {
    http
    constructor() {
        this.http = axios.create();
    }
    async get(url: string, options?: object | undefined): Promise<any> {
        const result: { data: any } = await this.http.get(url, options)
        return result.data
    }
    async post(url: string, data?: any, options?: object | undefined): Promise<any> {
        const result: { data: any } = await this.http.post(url, data, options)
        return result.data
    }

}