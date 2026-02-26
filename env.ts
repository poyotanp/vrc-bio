import arkenv from "arkenv";

export const env = arkenv({
  VRCHAT_USERNAME: "string",
  VRCHAT_PASSWORD: "string",
  VRCHAT_2FA_SECRET: "string?",
  STEAM_ID64: "string.numeric",
  STEAM_APIKEY: "string",
});
