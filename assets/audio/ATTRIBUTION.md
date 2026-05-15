# Viewer Audio Attribution

## Current RTS/FPS Sound Effects Pack

All live and replay sound-effect categories now use the vendored local pack in
`rts_fps_pack/`.

Source:

- `/Users/adomurad/Downloads/RTS and FPS Sound Effects Asset Pack/`

Attribution:

- Mattis Flettner, 2021
- https://mattflat.itch.io/
- License: CC BY-ND 3.0
- License info copied verbatim to `rts_fps_pack/_LICENSE_and_INFO_.txt`

Used for:

- weapon shots
- melee and impact hits
- ability/explosion sounds
- economy and spawn cues
- power/unlock cues

## Legacy Audio

These replay audio files were copied from the local `monocards-reference` project:

- `melee.ogg`
- `hit_enemy.ogg`
- `minor_missile.ogg`
- `ringfire_hit.ogg`
- `mine.ogg`
- `summon.ogg`
- `powerup.ogg`
- `theme.ogg`

The `.wav` files in this directory are local browser-compatibility transcodes of
the same source audio.

Source paths:

- `/Users/adomurad/sources/monocards-reference/audio/landlocked/`

The source project carries an MIT license in `/Users/adomurad/sources/monocards-reference/LICENSE`.
Its attribution file also lists the following upstream audio/art sources:

- https://bbunker.itch.io/8-bit-music-anthology-nes-edition
- https://hydrogene.itch.io/high-quality-8-bit-musics

These files are retained for music and fallback compatibility, but current sound
effects should use `rts_fps_pack/`.

## Current RTS viewer additions

These files were copied from local projects to improve the replay sound palette:

- `rts_arrow.wav` from `/Users/adomurad/sources/dungeons-and-dragging/resources/new-sound/low-dmg.wav`
- `rts_melee.wav` from `/Users/adomurad/sources/dungeons-and-dragging/old-resources/sound/krabhit1.wav`
- `rts_power.ogg` from `/Users/adomurad/sources/freecol/data/default/resources/sound/event/building.ogg`
- `rts_hit.wav` from `/Users/adomurad/sources/dungeons-and-dragging/resources/new-sound/mid-damage.wav`
- `rts_blast.wav` from `/Users/adomurad/sources/dungeons-and-dragging/resources/new-sound/high-damage.wav`
- `rts_spawn.wav` from `/Users/adomurad/sources/dungeons-and-dragging/resources/new-sound/appear.wav`
- `rts_mine.ogg` from `/Users/adomurad/sources/dungeons-and-dragging/old-resources/sound/gold.ogg`
- `rts_theme.ogg` from `/Users/adomurad/sources/freecol/data/default/resources/music/default/free-colonist.ogg`
