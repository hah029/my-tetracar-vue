// music
import sound_background from "./music/background.m4a";
import sound_gameover from "./music/gameover.m4a";
import sound_intro from "./music/intro.m4a";
// sfx
import sound_1 from "./sfx/1.m4a";
import sound_2 from "./sfx/2.m4a";
import sound_3 from "./sfx/3.m4a";
import sound_start from "./sfx/start.m4a";
import sound_add_golden from "./sfx/add_golden.m4a";
import sound_add_energon from "./sfx/add_energon.m4a";
import sound_add_patron from "./sfx/add_patron.m4a";
import sound_add_armor from "./sfx/add_armor.m4a";
import sound_add_nitro from "./sfx/add_nitro.m4a";
import sound_new_record from "./sfx/new_record.m4a";
import sound_jump from "./sfx/jump.m4a";
import sound_destroy_bot from "./sfx/destroy_bot.ogg";
import sound_shot from "./sfx/shot.m4a";
import sound_moving from "./sfx/moving.m4a";
//
import type { AudioConfig } from "@/game/sound/types";

export const MUSICS: AudioConfig = {
  music_intro: sound_intro,
  music_background: sound_background,
  music_gameover: sound_gameover,
};

export const SFX: AudioConfig = {
  sfx_sound_1: sound_1,
  sfx_sound_2: sound_2,
  sfx_sound_3: sound_3,
  sfx_start: sound_start,
  sfx_add_golden: sound_add_golden,
  sfx_add_energon: sound_add_energon,
  sfx_add_patron: sound_add_patron,
  sfx_add_armor: sound_add_armor,
  sfx_add_nitro: sound_add_nitro,
  sfx_new_record: sound_new_record,
  sfx_jump: sound_jump,
  sfx_destroy_bot: sound_destroy_bot,
  sfx_shot: sound_shot,
  sfx_moving: sound_moving,
};
