import axios from "axios";

const baseURL =
  import.meta?.env?.VITE_API_BASE || // Vite
  process.env.REACT_APP_API_BASE ||   // CRA
  "http://localhost:4000";            // 로컬 기본

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
