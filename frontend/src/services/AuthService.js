import axios from "axios";

const API_URL = "http://localhost:5000/api"; // đổi thành backend của bạn

export async function login(payload) {
  const response = await axios.post(`${API_URL}/auth/login`, payload);
  return response.data;
}
