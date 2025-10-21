// src/api.js
import axios from "axios";

const base =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:4000"; // 로컬 fallback

export const api = axios.create({
  baseURL: base,
  withCredentials: true,
});
