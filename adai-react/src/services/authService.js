
import api from "@/lib/api";

export const authService = {
  login: async ({ email, password }) => {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response.data;

    if (
      typeof data?.access_token !== "string" ||
      !data.access_token ||
      !data.user
    ) {
      throw new Error("The server returned an invalid login response.");
    }

    return data;
  },

  getCurrentUser: async (accessToken) => {
    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  logout: async (accessToken) => {
    if (!accessToken) return;

    const response = await api.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },
};

export const loginUser = authService.login;
