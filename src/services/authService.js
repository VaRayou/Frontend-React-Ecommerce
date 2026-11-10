import api from "./api";
import { initialUsers } from "../data/demoUsers.js";

const USERS_STORAGE_KEY = "eshopper_users";
const CURRENT_USER_KEY = "eshopper_auth_user";
const TOKEN_KEY = "eshopper_token";

export const getStoredUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return initialUsers;
  }
};

export const authService = {
  // API Login (Django REST API with LocalStorage fallback)
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login/", { email, password });
      const { user, token } = response.data;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      return { user, token };
    } catch (apiErr) {
      // If error was 401 unauthorized or invalid credentials from Django, throw actual message
      if (apiErr.response && apiErr.response.data && apiErr.response.data.error) {
        throw new Error(apiErr.response.data.error);
      }

      console.warn("Django Auth API offline, checking local storage:", apiErr.message);
      const users = getStoredUsers();
      const user = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password. Please check your credentials.");
      }

      if (user.status === "Inactive") {
        throw new Error("This account has been deactivated. Please contact support.");
      }

      const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      const safeUser = { ...user };
      delete safeUser.password;

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem(TOKEN_KEY, mockToken);

      return { user: safeUser, token: mockToken };
    }
  },

  // API Register (Django REST API with LocalStorage fallback)
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register/", userData);
      const { user, token } = response.data;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      return { user, token };
    } catch (apiErr) {
      if (apiErr.response && apiErr.response.data && apiErr.response.data.error) {
        throw new Error(apiErr.response.data.error);
      }

      console.warn("Django Auth API offline, registering locally:", apiErr.message);
      const users = getStoredUsers();
      const existing = users.find(
        (u) => u.email.toLowerCase() === userData.email.trim().toLowerCase()
      );

      if (existing) {
        throw new Error("An account with this email address already exists.");
      }

      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || "+1 (555) 000-0000",
        address: userData.address || "123 Main Street",
        city: userData.city || "New York",
        country: userData.country || "United States",
        role: "customer",
        status: "Active",
        registeredDate: new Date().toISOString().split("T")[0],
        avatar: "/admin/img/avatars/avatar-2.jpg",
      };

      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

      const mockToken = `mock-jwt-token-${newUser.id}-${Date.now()}`;
      const safeUser = { ...newUser };
      delete safeUser.password;

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem(TOKEN_KEY, mockToken);

      return { user: safeUser, token: mockToken };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  // Get current logged-in user
  getCurrentUser: () => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  // Update profile
  updateProfile: async (updatedData) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("No authenticated user found.");

    try {
      const response = await api.put(`/users/${currentUser.id}/`, updatedData);
      const updatedUser = response.data;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.warn("Backend user update failed, updating local storage:", err.message);
      const users = getStoredUsers();
      const updatedUsers = users.map((u) => {
        if (u.id === currentUser.id) {
          return { ...u, ...updatedData };
        }
        return u;
      });

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      const newCurrent = { ...currentUser, ...updatedData };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newCurrent));
      return newCurrent;
    }
  },
};
