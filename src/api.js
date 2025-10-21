import axios from "axios";

export const api = axios.create({
  baseURL: "https://chatsteady.onrender.com", // Render 배포 주소
  withCredentials: true,
});