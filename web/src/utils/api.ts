import axios from 'axios';

const restClient = axios.create({ baseURL: '/api' })

export const dummReq = () => {
    return restClient.get<string>('/dashboard')
}