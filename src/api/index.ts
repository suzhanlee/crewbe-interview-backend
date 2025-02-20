import axios from 'axios';

const BASE_URL = 'https://api.yourapp.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}); 