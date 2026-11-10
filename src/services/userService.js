import api from "./api";
import { initialUsers } from "../data/demoUsers.js";

const USERS_STORAGE_KEY = "eshopper_users";

const getUsersStorage = () => {
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

const saveUsersStorage = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  getUsers: async () => {
    try {
      const response = await api.get("/users/");
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      return getUsersStorage().map((u) => {
        const safe = { ...u };
        delete safe.password;
        return safe;
      });
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}/`);
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getUsersStorage();
      const user = list.find((u) => String(u.id) === String(id));
      if (!user) throw new Error("User not found");
      const safe = { ...user };
      delete safe.password;
      return safe;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post("/users/", userData);
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getUsersStorage();
      const exists = list.some(
        (u) => u.email.toLowerCase() === userData.email.trim().toLowerCase()
      );
      if (exists) throw new Error("User with this email already exists");

      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        password: userData.password || "password123",
        role: userData.role || "customer",
        phone: userData.phone || "+1 (555) 000-0000",
        address: userData.address || "123 Main Street",
        city: userData.city || "New York",
        country: userData.country || "United States",
        status: userData.status || "Active",
        registeredDate: new Date().toISOString().split("T")[0],
        avatar: "/admin/img/avatars/avatar-2.jpg",
      };

      list.unshift(newUser);
      saveUsersStorage(list);

      const safe = { ...newUser };
      delete safe.password;
      return safe;
    }
  },

  updateUser: async (id, updatedFields) => {
    try {
      const response = await api.put(`/users/${id}/`, updatedFields);
      return response.data;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getUsersStorage();
      const index = list.findIndex((u) => String(u.id) === String(id));
      if (index === -1) throw new Error("User not found");

      list[index] = { ...list[index], ...updatedFields };
      saveUsersStorage(list);

      const safe = { ...list[index] };
      delete safe.password;
      return safe;
    }
  },

  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}/`);
      return true;
    } catch (err) {
      console.warn("Backend API offline or failed, using local storage:", err.message);
      const list = getUsersStorage();
      const filtered = list.filter((p) => String(p.id) !== String(id));
      saveUsersStorage(filtered);
      return true;
    }
  },
};
