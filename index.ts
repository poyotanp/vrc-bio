import { env } from "./env";
import { VRChatAPI } from "vrc-ts";

const TEMPLATE = await Bun.file("TEMPLATE.txt").text();

const api = new VRChatAPI({
  userAgent: "vrc-profile+poyotanp@poyo.moe",
  username: env.VRCHAT_USERNAME,
  password: env.VRCHAT_PASSWORD,
  useCookies: true,
  cookiePath: "./cookies.json",
  TwoFactorAuthSecret: env.VRCHAT_2FA_SECRET,
});

await api.login();

process.stdout.write("Retrieving the list of Steam games.....");
const ownedGames = await (
  await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?${new URLSearchParams(
      {
        key: env.STEAM_APIKEY,
        steamid: env.STEAM_ID64,
        format: "json",
        include_played_free_games: "true",
      },
    )}`,
  )
).json();
console.log("OK");

const vrcGame = ownedGames.response?.games?.find(
  (game: any) => game.appid == 438100,
);
if (vrcGame) console.log("VRChat game info has been acquired.");
else {
  console.error("Failed to retrieve VRChat game info.");
  process.exit(1);
}

console.log(`Playtime: ${vrcGame.playtime_forever} minutes.`);

const playedHours = (vrcGame.playtime_forever / 60).toFixed(1) || "?";

const bio = TEMPLATE.replaceAll("%play_time%", playedHours)
  .replace(/[^\S\r\n]{2}/gm, "\u00AD\u0020\u00AD\u0020")
  .replace(/^[^\S\r\n]/gm, "\u00AD\u0020")
  .replace(/^\n\n/gm, "\n\u00AD\n");

try {
  process.stdout.write("Updating Bio....");
  const updatedUser = await api.userApi.updateUserInfo({
    userId: api.currentUser?.id!,
    bio,
  });

  console.log("Updated!");
  console.log("-------------------");
  console.log(updatedUser.bio.replaceAll("\u00AD", "␣"));
  console.log("-------------------");
} catch (e) {
  console.error("An error occurred while updating the bio.");
  throw e;
}
