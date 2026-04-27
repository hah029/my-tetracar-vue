// music
import sound_background from "@/assets/sounds/music/background.m4a";
import sound_gameover from "@/assets/sounds/music/gameover.m4a";
import sound_intro from "@/assets/sounds/music/intro.m4a";
// sfx
import sound_1 from "@/assets/sounds/sfx/1.m4a";
import sound_2 from "@/assets/sounds/sfx/2.m4a";
import sound_3 from "@/assets/sounds/sfx/3.m4a";
import sound_start from "@/assets/sounds/sfx/start.m4a";
import sound_add_golden from "@/assets/sounds/sfx/add_golden.m4a";
import sound_add_energon from "@/assets/sounds/sfx/add_energon.m4a";
import sound_add_patron from "@/assets/sounds/sfx/add_patron.m4a";
import sound_new_record from "@/assets/sounds/sfx/new_record.m4a";
import sound_jump from "@/assets/sounds/sfx/jump.m4a";
import sound_destroy_bot from "@/assets/sounds/sfx/destroy_bot.ogg";
import sound_shot from "@/assets/sounds/sfx/shot.m4a";
import sound_moving from "@/assets/sounds/sfx/moving.m4a";
// 
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
  sfx_start: sound_start,
  sfx_add_golden: sound_add_golden,
  sfx_add_energon: sound_add_energon,
  sfx_add_patron: sound_add_patron,
  sfx_new_record: sound_new_record,
  sfx_jump: sound_jump,
  sfx_destroy_bot: sound_destroy_bot,
  sfx_shot: sound_shot,
  sfx_moving: sound_moving,
};
