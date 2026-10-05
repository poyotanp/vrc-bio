import { env } from "./env";
import KeyvFile from "keyv-file"
import { VRChat, type CurrentUser } from "vrchat"

const vrchat = new VRChat({
  application: {
    name: "vrc-profile+poyotanp@poyo.moe",
    version: "1.0.0",
    contact: "poyotanp@poyo.moe",
  },
  authentication: {
    optimistic: true,
    credentials: {
      username: env.VRCHAT_USERNAME,
      password: env.VRCHAT_PASSWORD,
      totpSecret: env.VRCHAT_2FA_SECRET,
    },
  },
  keyv: new KeyvFile({ filename: "./cookies.json" }),
});

const TEMPLATE = await Bun.file("TEMPLATE.txt").text();

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

  const currentUser = (await vrchat.getCurrentUser({ throwOnError: true })).data;
  if ("requiresTwoFactorAuth" in currentUser) throw new Error("2fa failed");

  const updatedProfile = (await vrchat.updateProfile({
    path: { userId: currentUser.id },
    body: { bio }
  })).data;

  console.log("Updated!");
  console.log("-------------------");
  console.log(updatedProfile?.bio!.replaceAll("\u00AD", "␣"));
  console.log("-------------------");
} catch (e) {
  console.error("An error occurred while updating the bio.");
  throw e;
}

try {
  process.stdout.write("Updating Discord Profile...");
  await fetch(
    `https://discord.com/api/v9/applications/${env.DISCORD_APPLICATION_ID}/users/${env.DISCORD_USER_ID}/identities/0/profile`,
    {
      headers: {
        "User-Agent": "vrc-profile+poyotanp@poyo.moe",
        "Content-Type": "application/json",
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      method: "PATCH",
      body: JSON.stringify({
        username: "poyotanp",
        data: {
          dynamic: [
            {
              type: 1,
              name: "vrchat",
              value: `ぽよたんぴ\u2000 \u2000 \u2000 \u2000 \u2000 \u2000 \u2000 \u2000${playedHours}時間プレイ`,
            },
          ],
        },
      }),
    },
  );
  console.log("Updated!");
} catch (e) {
  console.error("An error occurred while updating the discord profile.");
  throw e;
}

process.exit();
