//fetch instance and axios for API calls


import axios from 'axios';

export const api = axios.create({
    baseURL: "import.meta.envVITE_API_URL"

})