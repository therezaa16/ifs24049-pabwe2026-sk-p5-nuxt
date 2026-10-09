import { defineStore } from "pinia";
import userApi, { type User } from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface UsersState {
  users: User[];
  user: User | null;
  profile: User | null;
  isProfile: boolean;
  isChangeProfile: boolean;
  isChangeProfilePhoto: boolean;
  isChangeProfilePassword: boolean;
}

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    users: [],
    user: null,
    profile: null,
    isProfile: false,
    isChangeProfile: false,
    isChangeProfilePhoto: false,
    isChangeProfilePassword: false,
  }),
  actions: {
    setUsers(users: User[]) {
      this.users = users;
    },
    setUser(user: User | null) {
      this.user = user;
    },
    setProfile(profile: User | null) {
      this.profile = profile;
    },
    setIsProfile(status: boolean) {
      this.isProfile = status;
    },
    setIsChangeProfile(status: boolean) {
      this.isChangeProfile = status;
    },
    setIsChangeProfilePhoto(status: boolean) {
      this.isChangeProfilePhoto = status;
    },
    setIsChangeProfilePassword(status: boolean) {
      this.isChangeProfilePassword = status;
    },
    async asyncSetUsers() {
      try {
        const users = await userApi.getUsers();
        this.setUsers(users);
      } catch (error) {
        this.setUsers([]);
      }
    },
    async asyncSetUserById(userId: string | number) {
      try {
        const user = await userApi.getUserById(userId);
        this.setUser(user);
      } catch (error) {
        this.setUser(null);
      }
    },
    async asyncSetProfile() {
      try {
        const profile = await userApi.getProfile();
        this.setProfile(profile);
      } catch (error) {
        this.setProfile(null);
      } finally {
        this.setIsProfile(true);
      }
    },
    async asyncPutProfile(name: string, email: string) {
      try {
        const profile = await userApi.putProfile(name, email);
        this.setProfile(profile);
        showSuccessDialog("Profil berhasil diperbarui!");
        this.setIsChangeProfile(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfile(false);
      }
    },
    async asyncPostProfilePhoto(photo: File | (Blob & { name?: string })) {
      try {
        const message = await userApi.postProfilePhoto(photo);
        showSuccessDialog(message || "Foto profil berhasil diperbarui!");
        const profile = await userApi.getProfile();
        this.setProfile(profile);
        this.setIsChangeProfilePhoto(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfilePhoto(false);
      }
    },
    async asyncPutProfilePassword(
      oldPassword: string,
      newPassword: string,
      newPasswordConfirmation?: string
    ) {
      try {
        const message = await userApi.putProfilePassword(
          oldPassword,
          newPassword,
          newPasswordConfirmation
        );
        showSuccessDialog(message || "Kata sandi berhasil diperbarui!");
        this.setIsChangeProfilePassword(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfilePassword(false);
      }
    },
  },
});
