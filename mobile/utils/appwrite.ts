import { Client, Databases } from "react-native-appwrite";

if (!process.env.EXPO_PUBLIC_APPWRITE_APP_ID) {
  throw new Error("EXPO_PUBLIC_APPWRITE_APP_ID is not set");
}

/**
 * Create a db in appwrite and add your collections
 */
const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_APP_ID,
  platform: "com.betoatexpo.modern-chat-app",
  db: "67d59a3300219b4fc01a",
  col: {
    chatRooms: "67d59bbe000376c4cbe8",
    message: "67d59beb0003e12f398b",
    user: "67d59bd40026f76926fd",
  },
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const database = new Databases(client);
export { database, appwriteConfig, client };
