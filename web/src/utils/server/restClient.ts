import axios from 'axios';
import { API_URL } from '@/utils/config';

export const restClient = axios.create({ baseURL: API_URL});
