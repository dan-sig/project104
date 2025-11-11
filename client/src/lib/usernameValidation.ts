import { z } from "zod";

export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export interface UsernameAvailability {
  checking: boolean;
  available: boolean | null;
  message: string;
}

export async function checkUsernameAvailability(username: string): Promise<UsernameAvailability> {
  if (!username || username.length < 3) {
    return { checking: false, available: null, message: "" };
  }

  try {
    const response = await fetch(`/api/trainer/username/check?username=${encodeURIComponent(username.toLowerCase())}`);
    const data = await response.json();

    if (data.available) {
      return { 
        checking: false, 
        available: true, 
        message: "Username is available!" 
      };
    } else {
      return { 
        checking: false, 
        available: false, 
        message: "Username is already taken" 
      };
    }
  } catch (error) {
    return { 
      checking: false, 
      available: null, 
      message: "Error checking availability" 
    };
  }
}
