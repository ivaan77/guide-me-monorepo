import axios from 'axios';

let restClient = axios.create({ baseURL: '/api' })

export const dummReq = () => {
    return restClient.get<string>('/dashboard')
}