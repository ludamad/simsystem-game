(() => {
  function color(hex, fallback = 0xffffff) {
    if (typeof hex !== "string") return fallback;
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
    return Number.isFinite(value) ? value : fallback;
  }

  function rgba(hex, alpha = 1) {
    return { color: color(hex), alpha };
  }

  function mix(a, b, t) {
    const av = color(a, 0xffffff);
    const bv = color(b, 0xffffff);
    const ar = (av >> 16) & 255, ag = (av >> 8) & 255, ab = av & 255;
    const br = (bv >> 16) & 255, bg = (bv >> 8) & 255, bb = bv & 255;
    const m = (x, y) => Math.round(x + (y - x) * t);
    return (m(ar, br) << 16) | (m(ag, bg) << 8) | m(ab, bb);
  }

  function drawDiamond(g, x, y, w, h, fill, stroke, strokeWidth = 1) {
    g.moveTo(x, y - h)
      .lineTo(x + w, y)
      .lineTo(x, y + h)
      .lineTo(x - w, y)
      .closePath()
      .fill(fill)
      .stroke({ ...stroke, width: strokeWidth });
  }

  function unitShape(kind, r) {
    const shapes = {
      archer: [[1.55, 0], [-0.58, -0.92], [-0.34, -0.24], [-1.08, -0.24], [-0.76, 0], [-1.08, 0.24], [-0.34, 0.24], [-0.58, 0.92]],
      vulture: [[1.72, 0], [-0.18, -0.54], [-1.12, -0.24], [-0.62, 0], [-1.12, 0.24], [-0.18, 0.54]],
      skirmisher: [[1.35, 0], [-0.10, -0.86], [-0.92, -0.32], [-0.48, 0], [-0.92, 0.32], [-0.10, 0.86]],
      soldier: [[1.05, 0], [0.38, -0.90], [-0.72, -0.66], [-1.05, 0], [-0.72, 0.66], [0.38, 0.90]],
      storm_caster: [[0, -1], [1.05, -0.12], [0.36, 1.05], [-0.36, 1.05], [-1.05, -0.12]],
      bomber: [[0, -1.24], [0.29, -0.58], [1.18, -0.38], [0.58, 0.18], [0.73, 1.0], [0, 0.58], [-0.73, 1.0], [-0.58, 0.18], [-1.18, -0.38], [-0.29, -0.58]],
      worker: [[-0.72, -0.72], [0.72, -0.72], [0.72, 0.72], [-0.72, 0.72]],
      siege: [[-1.05, -0.66], [0.75, -0.66], [0.75, 0.66], [-1.05, 0.66]],
    };
    return (shapes[kind] || shapes.soldier).flatMap(([x, y]) => [x * r, y * r]);
  }

  function setVisibleMap(map, liveKeys) {
    for (const [key, value] of map) {
      if (!liveKeys.has(key)) (value.root || value).visible = false;
    }
  }

  class PixiWorldRenderer {
    constructor(opts, app) {
      this.opts = opts;
      this.app = app;
      this.canvas = app.canvas || app.view;
      this.ground = new PIXI.Graphics();
      this.mineralLayer = new PIXI.Container();
      this.thingLayer = new PIXI.Container();
      this.effectLayer = new PIXI.Graphics();
      this.overlayLayer = new PIXI.Graphics();
      this.units = new Map();
      this.buildings = new Map();
      this.minerals = new Map();
      this.textureByCanvas = new WeakMap();
      this.lastGroundKey = "";
      this.canvas.className = "pixi-arena";
      app.stage.addChild(this.ground, this.mineralLayer, this.thingLayer, this.effectLayer, this.overlayLayer);
    }

    static async create(opts) {
      if (!window.PIXI) throw new Error("PixiJS is not loaded");
      const app = new PIXI.Application();
      const rect = opts.stageEl.getBoundingClientRect();
      const input = opts.inputCanvas;
      const initialWidth = Math.max(640, Math.floor(input?.width || rect.width));
      const initialHeight = Math.max(420, Math.floor(input?.height || rect.height));
      await app.init({
        width: initialWidth,
        height: initialHeight,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: false,
        resolution: 1,
        powerPreference: "high-performance",
      });
      const renderer = new PixiWorldRenderer(opts, app);
      opts.stageEl.insertBefore(renderer.canvas, opts.inputCanvas);
      return renderer;
    }

    resize() {
      const rect = this.opts.stageEl.getBoundingClientRect();
      const input = this.opts.inputCanvas;
      const w = Math.max(640, Math.floor(input?.width || rect.width));
      const h = Math.max(420, Math.floor(input?.height || rect.height));
      this.canvas.style.width = `${Math.max(1, Math.floor(rect.width))}px`;
      this.canvas.style.height = `${Math.max(1, Math.floor(rect.height))}px`;
      if (this.app.renderer.width !== w || this.app.renderer.height !== h) {
        this.app.renderer.resize(w, h);
        this.lastGroundKey = "";
      }
    }

    textureForCanvas(canvas) {
      let texture = this.textureByCanvas.get(canvas);
      if (!texture) {
        texture = PIXI.Texture.from(canvas);
        this.textureByCanvas.set(canvas, texture);
      }
      return texture;
    }

    render(frame) {
      this.resize();
      this.drawGround(frame);
      this.drawMinerals(frame.snap.minerals || []);
      this.drawThings(frame);
      this.drawEffects(frame);
      this.drawOverlay(frame);
      this.app.render();
    }

    drawGround(frame) {
      const key = `${this.app.renderer.width}x${this.app.renderer.height}:${frame.camera.x.toFixed(2)}:${frame.camera.y.toFixed(2)}:${frame.camera.zoom.toFixed(3)}`;
      if (key === this.lastGroundKey) return;
      this.lastGroundKey = key;
      const g = this.ground.clear();
      const w = this.app.renderer.width;
      const h = this.app.renderer.height;
      g.rect(0, 0, w, h).fill({ color: 0x17231d, alpha: 1 });
      const c = frame.center();
      g.circle(c.x, c.y, Math.max(w, h) * 0.58).fill({ color: 0x223027, alpha: 0.46 });
      for (let v = -frame.bounds; v <= frame.bounds; v += 12) {
        const a = frame.worldToScreen(v, -frame.bounds);
        const b = frame.worldToScreen(v, frame.bounds);
        const c2 = frame.worldToScreen(-frame.bounds, v);
        const d = frame.worldToScreen(frame.bounds, v);
        g.moveTo(a.x, a.y).lineTo(b.x, b.y).moveTo(c2.x, c2.y).lineTo(d.x, d.y);
      }
      g.stroke({ color: 0xd2e6d2, alpha: 0.055, width: 1 });
      this.drawIsoRect(g, -frame.bounds, -frame.bounds, frame.bounds, frame.bounds, frame, 0xe2e8d2, 0.18, 1.4);
      for (let r = 48; r < frame.bounds; r += 48) {
        this.drawIsoRect(g, -r, -r, r, r, frame, 0xe2e8d2, 0.08, 1);
      }
      g.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.06 });
    }

    drawIsoRect(g, x0, y0, x1, y1, frame, stroke, alpha, width) {
      const n = frame.worldToScreen(x0, y0);
      const e = frame.worldToScreen(x1, y0);
      const s = frame.worldToScreen(x1, y1);
      const w = frame.worldToScreen(x0, y1);
      g.moveTo(n.x, n.y).lineTo(e.x, e.y).lineTo(s.x, s.y).lineTo(w.x, w.y).closePath().stroke({ color: stroke, alpha, width });
    }

    drawMinerals(minerals) {
      const live = new Set();
      for (const mineral of minerals) {
        if ((mineral.amount ?? 0) <= 0) continue;
        const key = String(mineral.id ?? `${mineral.x}:${mineral.y}`);
        live.add(key);
        let g = this.minerals.get(key);
        if (!g) {
          g = new PIXI.Graphics();
          this.mineralLayer.addChild(g);
          this.minerals.set(key, g);
        }
        g.visible = true;
        g.clear();
        const p = this.opts.worldToScreen(mineral.x, mineral.y, 1.2);
        drawDiamond(g, p.x, p.y, 7.5, 6.2, { color: 0xd6b34f, alpha: 0.96 }, { color: 0xffef9d, alpha: 0.88 }, 1.4);
        g.circle(p.x - 1.8, p.y - 1.8, 1.8).fill({ color: 0xfff5ae, alpha: 0.58 });
      }
      setVisibleMap(this.minerals, live);
    }

    drawThings(frame) {
      const unitKeys = new Set();
      const buildingKeys = new Set();
      this.thingLayer.sortableChildren = true;
      for (const t of frame.things) {
        if (t.kind === "building") {
          if (frame.canvasBuildings) continue;
          const key = String(t.item.id);
          buildingKeys.add(key);
          this.updateBuilding(key, t.item, frame);
        } else {
          const key = String(t.item.id);
          unitKeys.add(key);
          this.updateUnit(key, t.item, t, frame);
        }
      }
      setVisibleMap(this.units, unitKeys);
      setVisibleMap(this.buildings, buildingKeys);
    }

    ensureBuilding(key) {
      let entry = this.buildings.get(key);
      if (entry) return entry;
      const root = new PIXI.Container();
      entry = {
        root,
        image: new PIXI.Sprite(PIXI.Texture.EMPTY),
        base: new PIXI.Graphics(),
        body: new PIXI.Graphics(),
        bar: new PIXI.Graphics(),
        label: new PIXI.Text({ text: "", style: { fill: 0xf7f3e8, fontSize: 10, fontWeight: "800" } }),
        sig: "",
      };
      entry.image.anchor.set(0.5, 0.62);
      entry.label.anchor.set(0.5, 1);
      root.addChild(entry.image, entry.base, entry.body, entry.bar, entry.label);
      this.thingLayer.addChild(root);
      this.buildings.set(key, entry);
      return entry;
    }

    updateBuilding(key, b, frame) {
      const entry = this.ensureBuilding(key);
      const p = frame.worldToScreen(b.x, b.y, 0);
      const ui = frame.uiScale || 1;
      const ownerColor = b.owner >= 0 ? color(frame.teamColors[b.owner], 0x8f9799) : 0x8f9799;
      const size = b.kind === "main" ? 32 : 23;
      entry.root.visible = b.alive !== false;
      entry.root.zIndex = (frame.isoDepth || ((x, y) => y))(b.x, b.y, 0);
      entry.root.position.set(p.x, p.y);
      const spriteData = (frame.getBuildingSprite || this.opts.getBuildingSprite)?.(b);
      if (spriteData?.canvas) {
        entry.image.visible = true;
        entry.base.visible = false;
        entry.body.visible = false;
        entry.bar.visible = false;
        entry.label.visible = false;
        if (spriteData.canvas !== entry.spriteCanvas) {
          entry.spriteCanvas = spriteData.canvas;
          entry.image.texture = this.textureForCanvas(spriteData.canvas);
        }
        entry.image.anchor.set(spriteData.anchorX ?? 0.5, spriteData.anchorY ?? 0.62);
        entry.image.width = spriteData.widthCss || spriteData.canvas.width;
        entry.image.height = spriteData.heightCss || spriteData.canvas.height;
        return;
      }
      entry.image.visible = false;
      entry.base.visible = true;
      entry.body.visible = true;
      entry.bar.visible = true;
      entry.label.visible = true;
      const sig = `${b.owner}:${b.kind}:${b.static_defense_level}:${b.claim_progress > 0}`;
      if (sig !== entry.sig) {
        entry.sig = sig;
        entry.base.clear();
        entry.body.clear();
        const owned = b.owner >= 0;
        drawDiamond(entry.base, 0, 8, size * 1.45, size * 0.70, { color: owned ? ownerColor : 0x646c61, alpha: owned ? 0.18 : 0.16 }, { color: owned ? ownerColor : 0xdcdacc, alpha: owned ? 0.48 : 0.28 }, 1.5);
        drawDiamond(entry.body, 0, -1, size, size * 0.72, { color: owned ? mix(`#${ownerColor.toString(16).padStart(6, "0")}`, "#ffffff", 0.14) : 0x6d7468, alpha: 1 }, { color: owned ? ownerColor : 0xdcdacc, alpha: 0.78 }, 2);
        entry.body.rect(-size * 0.22, -size * 1.10, size * 0.44, size * 0.75).fill({ color: owned ? ownerColor : 0x4d554d, alpha: 0.96 }).stroke({ color: 0x050708, alpha: 0.88, width: 2 });
        if (b.static_defense_level > 0 || b.kind === "main") {
          entry.body.circle(0, -size * 0.70, size * 0.15).fill({ color: 0xfff2a8, alpha: 0.88 });
        }
      }
      entry.label.text = b.owner >= 0 ? (frame.teamNames[b.owner] || `P${b.owner}`) : "";
      entry.label.tint = ownerColor;
      entry.label.style.fontSize = 10 * ui;
      entry.label.position.set(0, -size - 12 * ui);
      this.drawHealth(entry.bar, -size, size + 12, size * 2, 5, Math.max(0, Number(b.hp ?? 1) / Math.max(1, Number(b.max_hp ?? 1))), ownerColor);
      if (b.owner < 0 && Number(b.claim_progress || 0) > 0) {
        this.drawHealth(entry.bar, -size, size + 19, size * 2, 4, Number(b.claim_progress) / Math.max(1, Number(b.claim_required || 1)), 0xf4d35e, true);
      }
    }

    ensureUnit(key) {
      let entry = this.units.get(key);
      if (entry) return entry;
      const root = new PIXI.Container();
      entry = {
        root,
        aura: new PIXI.Graphics(),
        shadow: new PIXI.Graphics(),
        select: new PIXI.Graphics(),
        sprite: new PIXI.Sprite(PIXI.Texture.EMPTY),
        intent: new PIXI.Graphics(),
        health: new PIXI.Graphics(),
        spriteCanvas: null,
        sig: "",
      };
      entry.sprite.anchor.set(0.5);
      root.addChild(entry.aura, entry.shadow, entry.select, entry.sprite, entry.intent, entry.health);
      this.thingLayer.addChild(root);
      this.units.set(key, entry);
      return entry;
    }

    updateUnit(key, u, display, frame) {
      const entry = this.ensureUnit(key);
      const team = color(frame.teamColors[u.owner], 0xc8c5bc);
      const r = display.r * (frame.unitWorldArtScale || 1);
      entry.root.visible = u.alive !== false;
      entry.root.zIndex = display.depth + 0.1;
      entry.root.position.set(display.x, display.y);
      this.drawUnitAura(entry.aura, u, r, frame);
      const spriteData = (frame.getRotatedUnitSprite || this.opts.getRotatedUnitSprite)(u.class, u.owner, frame.unitAngle(u));
      if (spriteData?.canvas && spriteData.canvas !== entry.spriteCanvas) {
        entry.spriteCanvas = spriteData.canvas;
        entry.sprite.texture = this.textureForCanvas(spriteData.canvas);
      }
      if (spriteData?.canvas) {
        const spriteScale = (frame.unitWorldArtScale || 1) * (frame.uiScale || 1);
        entry.sprite.width = spriteData.sizeCss * spriteScale;
        entry.sprite.height = spriteData.sizeCss * spriteScale;
      }
      const crowd = frame.units.length > 120 ? "crowd" : "normal";
      const sig = `${u.class}:${u.owner}:${r.toFixed(1)}:${crowd}`;
      if (sig !== entry.sig) {
        entry.sig = sig;
        entry.shadow.clear().ellipse(0, r * 0.56, r * 1.04, r * 0.55).fill({ color: 0x000000, alpha: 0.26 });
        entry.shadow.visible = crowd !== "crowd";
      }
      const selected = frame.selected.has(u.id);
      entry.select.clear();
      if (selected) {
        entry.select.ellipse(0, r * 0.50, r * 1.18, r * 0.48).stroke({ color: 0xffee9c, alpha: 0.95, width: 2.2 * (frame.uiScale || 1) });
      }
      entry.health.clear();
      const hp = Math.max(0, Number(u.hp ?? 1) / Math.max(1, Number(u.max_hp ?? 1)));
      if (hp < 0.92 || selected) this.drawHealth(entry.health, -r, r + 8 * (frame.uiScale || 1), r * 2.1, 4 * (frame.uiScale || 1), hp, team);
      this.drawWorkerIntent(entry.intent, u, display, r, frame);
    }

    drawUnitAura(g, u, r, frame) {
      g.clear();
      if (!u.ability || u.ability === "none") return;
      const ui = frame.uiScale || 1;
      const team = frame.teamColors[u.owner] || "#f3efe6";
      const ready = Number(u.cooldown || 0) === 0;
      const c = mix(team, "#ffffff", 0.28);
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / (ready ? 145 : 330) + Number(u.id || 0));
      g.circle(r * 0.72, -r * 0.72, (ready ? 5.2 : 4.0) * ui).fill({ color: 0x040607, alpha: 0.86 });
      if (ready) {
        g.circle(r * 0.72, -r * 0.72, (3.4 + pulse * 0.8) * ui).fill({ color: c, alpha: 0.96 });
      } else {
        g.circle(r * 0.72, -r * 0.72, 3.2 * ui).stroke({ color: c, alpha: 0.34, width: 1.2 * ui });
      }
    }

    drawWorkerIntent(g, u, display, r, frame) {
      g.clear();
      if (u.class !== "worker") return;
      const ui = frame.uiScale || 1;
      const targetX = Number(u.target_x ?? u.x);
      const targetY = Number(u.target_y ?? u.y);
      const moving = Math.hypot(targetX - Number(u.x || 0), targetY - Number(u.y || 0)) > 1.0;
      if (moving && (u.intent === "mine" || u.intent === "return" || u.intent === "claim")) {
        const target = frame.worldToScreen(targetX, targetY, 0.2);
        const stroke = u.intent === "return" ? 0xf5dd80 : 0x8df0ae;
        g.moveTo(0, 0).lineTo(target.x - display.x, target.y - display.y).stroke({ color: stroke, alpha: u.intent === "return" ? 0.42 : 0.34, width: 2 * ui });
      }
      if (Number(u.worker_cargo || 0) > 0) {
        g.circle(r * 0.55, -r * 0.55, 5 * ui).fill({ color: 0xf5dd80, alpha: 1 }).stroke({ color: 0x000000, alpha: 0.75, width: 2 * ui });
      }
    }

    drawHealth(g, x, y, w, h, ratio, fillColor, append = false) {
      if (!append) g.clear();
      g.rect(x, y, w, h).fill({ color: 0x000000, alpha: 0.72 });
      g.rect(x, y, Math.max(0, Math.min(1, ratio)) * w, h).fill({ color: fillColor, alpha: 1 });
    }

    drawEffects(frame) {
      const g = this.effectLayer.clear();
      for (const e of frame.snap.events || []) {
        const ttl = Math.max(0, (e.expires_tick - frame.snap.tick) / 12);
        if (ttl <= 0) continue;
        const a = frame.worldToScreen(e.from_x ?? e.x ?? 0, e.from_y ?? e.y ?? 0, 3);
        const b = frame.worldToScreen(e.to_x ?? e.x ?? 0, e.to_y ?? e.y ?? 0, 3);
        const c = color(frame.teamColors[e.owner], 0xfff2a8);
        if (Number.isFinite(a.x) && Number.isFinite(b.x)) {
          g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: c, alpha: 0.32 + ttl * 0.34, width: e.kind === "main_shot" ? 4 : 2 });
          g.circle(b.x, b.y, e.kind === "main_shot" ? 10 : 5).fill({ color: c, alpha: 0.18 + ttl * 0.22 });
        }
      }
    }

    drawOverlay(frame) {
      const g = this.overlayLayer.clear();
      if (frame.commandMarker) {
        const age = (performance.now() - frame.commandMarker.time) / 1000;
        if (age <= 0.9) {
          const p = frame.worldToScreen(frame.commandMarker.x, frame.commandMarker.y, 0.8);
          const t = 1 - age / 0.9;
          const ui = frame.uiScale || 1;
          const r = (11 + (1 - t) * 18) * ui;
          const c = color(frame.commandMarker.color || "#f4d35e", 0xf4d35e);
          drawDiamond(g, p.x, p.y, r, r, { color: c, alpha: 0.14 * t }, { color: c, alpha: 0.72 * t }, 2.4 * ui);
        }
      }
    }

    destroy() {
      this.app.destroy(true);
    }
  }

  window.SimPixiWorldRenderer = PixiWorldRenderer;
})();
