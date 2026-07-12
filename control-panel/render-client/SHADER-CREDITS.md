# Shader credits & attribution

The `control-panel/` render client (`render-client/src/`) is original WebGL2/GLSL ES 3.00
code. A few of its shaders are **formula-for-formula ports** of GLSL that shipped with
VPT8 (the Max/MSP/Jitter application this project replaces). This file records that
lineage so the port stays cleanly MIT-licensed even after the original VPT8 source tree is
archived out of this repo.

## Layer blend modes (`render-client/src/layers.js`, `BLEND_FRAG`)

The 24 layer blend modes — `normal, add(itive), subtractive, multiply, screen, overlay,
darken, lighten, difference, exclude, dodge, burn, hardlight, softlight, glow, reflect,
freeze, heat, negate, inverse, average, stamp, lumablend, brightlight` — have their color
math ported from VPT8's per-mode Jitter shaders in `vpt8 source code/shaders/v001 Mixers/`
(files `v001.co2.<mode>.fp.glsl` + `.jxs`, the **"v001" compositing set** by Vade / Anton
Marini, as bundled and used by VPT8, © HC Gilje). In this project they are consolidated
into a single branch-by-`u_blendMode` fragment shader rather than one file per mode.

These are standard Porter–Duff / Photoshop-style blend equations, which are not themselves
copyrightable; attribution is retained here out of good practice and to honor the original
authors, not out of legal necessity.

## Shared GLSL includes

Any reused snippets derived from the classic 3Dlabs / LightWork Design GLSL sample shaders
(the "OpenGL Shading Language" / Orange Book demos) carry those parties' BSD-style
licenses. The full texts are preserved in the archived VPT8 tree at
`vpt8 source code/shaders/shared/licenses/` (`3Dlabs-license.txt`,
`LightworkDesign-license.txt`), both © 2002–2005 and redistributable in source and binary
form under the standard 3-clause conditions.

## VPT8

VPT (VideoProjectionTool) 8 is © HC Gilje, released May 2018 under
Creative Commons Attribution-NonCommercial-ShareAlike 3.0. This project began as a
browser-based reimplementation of VPT8's capabilities; the original Max/MSP source is
preserved in git history at tag `vpt8-source-archive`.
