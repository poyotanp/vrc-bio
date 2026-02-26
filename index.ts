import { env } from "./env";
import { VRChatAPI } from "vrc-ts";

const api = new VRChatAPI({
  userAgent: "vrc-profile+poyotanp@poyo.moe",
  username: env.VRCHAT_USERNAME,
  password: env.VRCHAT_PASSWORD,
  useCookies: true,
  cookiePath: "./cookies.json",
  TwoFactorAuthSecret: env.VRCHAT_2FA_SECRET,
});

await api.login();
