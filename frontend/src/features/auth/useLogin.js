import { useMutation } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient";

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const response = await axiosClient.post("/auth/login", {
        email,
        password,
      });
      return response.data;
    },
  });
}
