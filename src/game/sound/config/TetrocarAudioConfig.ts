// music
import sound_background from "@/assets/sounds/music/background.ogg";
import sound_gameover from "@/assets/sounds/music/gameover.ogg";
import sound_intro from "@/assets/sounds/music/intro.ogg";
// sfx
import sound_1 from "@/assets/sounds/sfx/1.ogg";
import sound_2 from "@/assets/sounds/sfx/2.ogg";
import sound_3 from "@/assets/sounds/sfx/3.ogg";
import sound_add_patron from "@/assets/sounds/sfx/add_patron.ogg";
import sound_change_mode from "@/assets/sounds/sfx/change_mode.ogg";
import sound_click from "@/assets/sounds/sfx/click.ogg";
import sound_destroy_bot from "@/assets/sounds/sfx/destroy_bot.ogg";
import sound_inc_100_progress from "@/assets/sounds/sfx/inc_100_progress.ogg";
import sound_shot from "@/assets/sounds/sfx/shot.ogg";
import sound_start from "@/assets/sounds/sfx/start.ogg";
import type { AudioConfig } from "../types";

export const SOUNDS_CONFIG: AudioConfig = {
  //
  music_background: sound_background,
  music_gameover: sound_gameover,
  music_intro: sound_intro,
  //
  sfx_1: sound_1,
  sfx_2: sound_2,
  sfx_3: sound_3,
  sfx_add_patron: sound_add_patron,
  sfx_change_mode: sound_change_mode,
  sfx_click: sound_click,
  sfx_destroy_bot: sound_destroy_bot,
  sfx_inc_100_progress: sound_inc_100_progress,
  sfx_shot: sound_shot,
  sfx_start: sound_start,
};
