"use strict";

(function () {
  function drawIsoWorldRect(env, x0, y0, x1, y1, fill, stroke) {
    const { ctx, worldToScreen } = env;
    const north = worldToScreen(x0, y0);
    const east = worldToScreen(x1, y0);
    const south = worldToScreen(x1, y1);
    const west = worldToScreen(x0, y1);
    ctx.beginPath();
    ctx.moveTo(north.x, north.y);
    ctx.lineTo(east.x, east.y);
    ctx.lineTo(south.x, south.y);
    ctx.lineTo(west.x, west.y);
    ctx.closePath();
    if (fill && fill !== "transparent") {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = env.crispLine ? env.crispLine(1.2) : 1.2;
      ctx.stroke();
    }
  }

  function drawExpansionSiteMarker(env, x, y, size, progress, color, hovered, active) {
    const { ctx, crispLine, hexToRgba, mixColor } = env;
    const w = size * 1.72;
    const h = size * 0.82;
    ctx.save();
    ctx.globalAlpha = hovered || active ? 1 : 0.74;
    ctx.lineWidth = hovered || active ? crispLine(2.8) : crispLine(1.7);
    ctx.strokeStyle = hexToRgba(color, hovered || active ? 0.82 : 0.42);
    ctx.fillStyle = hexToRgba(color, active ? 0.12 : 0.055);
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (progress > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = hexToRgba(mixColor(color, "#ffffff", 0.36), 0.92);
      ctx.lineWidth = crispLine(4.0);
      const points = [[x, y - h], [x + w, y], [x, y + h], [x - w, y], [x, y - h]];
      const total = progress * 4;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 0; i < Math.floor(total); i++) ctx.lineTo(points[i + 1][0], points[i + 1][1]);
      const rem = total - Math.floor(total);
      const idx = Math.min(3, Math.floor(total));
      if (rem > 0) {
        const [x0, y0] = points[idx];
        const [x1, y1] = points[idx + 1];
        ctx.lineTo(x0 + (x1 - x0) * rem, y0 + (y1 - y0) * rem);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIsoBlock(env, x, y, size, bevel) {
    const { ctx } = env;
    const h = size / 2;
    const b = size * bevel;
    ctx.beginPath();
    ctx.moveTo(x - h + b, y - h);
    ctx.lineTo(x + h, y - h + b);
    ctx.lineTo(x + h - b, y + h);
    ctx.lineTo(x - h, y + h - b);
    ctx.closePath();
  }

  function drawIsoBuildingTop(env, x, y, size, height, bevel) {
    drawIsoBlock(env, x, y - height, size, bevel);
  }

  function drawBuildingFoundation(env, x, y, size, ownerColor, owned, hoveredNeutral, idleReady, pulse) {
    const { ctx, crispLine, hexToRgba } = env;
    const w = size * 1.42;
    const h = w * 0.46;
    ctx.save();
    ctx.fillStyle = owned
      ? hexToRgba(ownerColor, 0.18)
      : hoveredNeutral
        ? "rgba(245,221,128,0.18)"
        : "rgba(120,128,116,0.18)";
    ctx.strokeStyle = owned ? hexToRgba(ownerColor, 0.55) : "rgba(220,218,204,0.30)";
    ctx.lineWidth = crispLine(1.4);
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (idleReady) {
      const ringAlpha = 0.18 + 0.32 * pulse;
      ctx.strokeStyle = hexToRgba(ownerColor, ringAlpha);
      ctx.lineWidth = crispLine(2.0 + pulse * 1.2);
      const swell = 1.0 + pulse * 0.07;
      ctx.beginPath();
      ctx.moveTo(x, y - h * swell);
      ctx.lineTo(x + w * swell, y);
      ctx.lineTo(x, y + h * swell);
      ctx.lineTo(x - w * swell, y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBuildingOwnerBand(env, x, y, size, height, ownerColor) {
    const { ctx, hexToRgba, mixColor } = env;
    const half = size / 2;
    const bevel = 0.30;
    const b = size * bevel;
    const topY = y - height;
    const bandTop = topY + 2;
    const bandBottom = topY + 6;
    ctx.save();
    ctx.fillStyle = hexToRgba(ownerColor, 0.92);
    ctx.beginPath();
    ctx.moveTo(x + half, bandTop - half + b);
    ctx.lineTo(x + half - b, bandTop + half);
    ctx.lineTo(x + half - b, bandBottom + half);
    ctx.lineTo(x + half, bandBottom - half + b);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(mixColor(ownerColor, "#000000", 0.35), 0.92);
    ctx.beginPath();
    ctx.moveTo(x + half - b, bandTop + half);
    ctx.lineTo(x - half, bandTop + half - b);
    ctx.lineTo(x - half, bandBottom + half - b);
    ctx.lineTo(x + half - b, bandBottom + half);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBuildingUpperTier(env, x, y, size, height, ownerColor, owned, hoveredNeutral, isMain) {
    const { ctx, crispLine, mixColor } = env;
    const tierSize = size * (isMain ? 0.62 : 0.52);
    const tierHeight = isMain ? 12 : 8;
    const baseY = y - height;
    const half = tierSize / 2;
    const bevel = 0.30;
    const b = tierSize * bevel;
    const topY = baseY - tierHeight;
    const top = [
      { x: x - half + b, y: topY - half },
      { x: x + half, y: topY - half + b },
      { x: x + half - b, y: topY + half },
      { x: x - half, y: topY + half - b },
    ];
    const bottom = top.map((p) => ({ x: p.x, y: p.y + tierHeight }));
    ctx.save();
    ctx.strokeStyle = "rgba(4,6,7,0.94)";
    ctx.lineWidth = crispLine(isMain ? 3.4 : 2.8);
    const sideA = ctx.createLinearGradient(x, topY, x, baseY);
    sideA.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.22) : "#7b8173");
    sideA.addColorStop(1, "#171b1d");
    ctx.fillStyle = sideA;
    ctx.beginPath();
    ctx.moveTo(top[1].x, top[1].y);
    ctx.lineTo(bottom[1].x, bottom[1].y);
    ctx.lineTo(bottom[2].x, bottom[2].y);
    ctx.lineTo(top[2].x, top[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const sideB = ctx.createLinearGradient(x - half, topY, x + half, baseY);
    sideB.addColorStop(0, owned ? mixColor(ownerColor, "#050809", 0.22) : "#50584f");
    sideB.addColorStop(1, "#080b0c");
    ctx.fillStyle = sideB;
    ctx.beginPath();
    ctx.moveTo(top[2].x, top[2].y);
    ctx.lineTo(bottom[2].x, bottom[2].y);
    ctx.lineTo(bottom[3].x, bottom[3].y);
    ctx.lineTo(top[3].x, top[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const cap = ctx.createLinearGradient(x - half, topY - half, x + half, topY + half);
    cap.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.34) : "#9a9f8d");
    cap.addColorStop(0.6, owned ? ownerColor : hoveredNeutral ? "#9a9f8d" : "#6c7367");
    cap.addColorStop(1, owned ? mixColor(ownerColor, "#000000", 0.30) : "#3a4239");
    ctx.fillStyle = cap;
    ctx.strokeStyle = owned ? "rgba(243,239,230,0.78)" : "rgba(220,218,204,0.62)";
    ctx.lineWidth = crispLine(isMain ? 1.8 : 1.4);
    drawIsoBlock(env, x, topY, tierSize, bevel);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBuildingCorePulse(env, x, y, height, ownerColor, intensity) {
    const { ctx, hexToRgba, mixColor } = env;
    const cx = x;
    const cy = y - height - 16;
    const baseRadius = 3.2;
    const swell = baseRadius + intensity * 1.6;
    ctx.save();
    ctx.fillStyle = "rgba(4,6,7,0.84)";
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(mixColor(ownerColor, "#ffffff", 0.45), 0.85 + intensity * 0.15);
    ctx.beginPath();
    ctx.arc(cx, cy, swell, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIsoBuildingBlock(env, x, y, size, height, ownerColor, owned) {
    const { ctx, mixColor } = env;
    const h = size / 2;
    const bevel = 0.30;
    const topY = y - height;
    const top = [
      { x: x - h + size * bevel, y: topY - h },
      { x: x + h, y: topY - h + size * bevel },
      { x: x + h - size * bevel, y: topY + h },
      { x: x - h, y: topY + h - size * bevel },
    ];
    const bottom = top.map((point) => ({ x: point.x, y: point.y + height }));
    const sideA = ctx.createLinearGradient(x, topY, x, y + h);
    sideA.addColorStop(0, owned ? mixColor(ownerColor, "#ffffff", 0.10) : "#697166");
    sideA.addColorStop(1, "#111719");
    ctx.fillStyle = sideA;
    ctx.beginPath();
    ctx.moveTo(top[1].x, top[1].y);
    ctx.lineTo(bottom[1].x, bottom[1].y);
    ctx.lineTo(bottom[2].x, bottom[2].y);
    ctx.lineTo(top[2].x, top[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const sideB = ctx.createLinearGradient(x - h, topY, x + h, y + h);
    sideB.addColorStop(0, owned ? mixColor(ownerColor, "#050809", 0.18) : "#50584f");
    sideB.addColorStop(1, "#070a0b");
    ctx.fillStyle = sideB;
    ctx.beginPath();
    ctx.moveTo(top[2].x, top[2].y);
    ctx.lineTo(bottom[2].x, bottom[2].y);
    ctx.lineTo(bottom[3].x, bottom[3].y);
    ctx.lineTo(top[3].x, top[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawBuilding(env, building, opts = {}) {
    if (!building.alive) return;
    const { ctx, crispLine, hexToRgba, mixColor, drawShadow, drawHealthPip, drawTeamPlate } = env;
    const isMain = building.kind === "main";
    const p = env.worldToScreen(building.x, building.y, 0);
    const x = p.x;
    const y = p.y;
    const size = isMain ? 34 : 28;
    const half = size / 2;
    const colors = env.colors || [];
    const ownerColor = building.owner >= 0 ? colors[building.owner] : "#c8c5bc";
    const hoveredNeutral = !!opts.hoveredNeutral;
    const claimOwner = Number(building.claim_owner ?? building.human_claim_intent_owner ?? -1);
    const intentOwner = Number(building.human_claim_intent_owner ?? -1);
    const activeClaimOwner = claimOwner >= 0 ? claimOwner : intentOwner;
    const claimColor = activeClaimOwner >= 0 ? colors[activeClaimOwner] : "#f5dd80";
    const claimRequired = Math.max(1, Number(building.claim_required || 1));
    const claimRatio = Math.max(0, Math.min(1, Number(building.claim_progress || 0) / claimRequired));
    const isExpansionSite = !isMain && building.owner < 0;
    const hpRatio = Math.max(0, Math.min(1, building.hp / Math.max(1, building.max_hp)));
    const blockHeight = isMain ? 22 : 15;
    const idleReady = building.owner >= 0 && Number(building.pending_card_id || 0) === 0;
    const idlePulse = 0.5 + 0.5 * Math.sin((env.animTime || 0) * 2.4 + (building.id || 0) * 0.7);

    ctx.save();
    if (isExpansionSite) drawExpansionSiteMarker(env, x, y, size, claimRatio, claimColor, hoveredNeutral, activeClaimOwner >= 0);
    drawShadow(x, y + half * 0.85, half * 1.55, isMain ? 0.38 : 0.28);
    drawBuildingFoundation(env, x, y, size, ownerColor, building.owner >= 0, hoveredNeutral || activeClaimOwner >= 0, idleReady, idlePulse);
    const ownerGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.45);
    ownerGlow.addColorStop(0, building.owner >= 0 ? hexToRgba(ownerColor, 0.24) : hexToRgba(claimColor, hoveredNeutral || activeClaimOwner >= 0 ? 0.22 : 0.08));
    ownerGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = ownerGlow;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "rgba(4,6,7,0.94)";
    ctx.lineWidth = isMain ? crispLine(5.0) : crispLine(4.0);
    drawIsoBuildingBlock(env, x, y, size, blockHeight, ownerColor, building.owner >= 0);
    ctx.stroke();
    ctx.strokeStyle = isMain ? "rgba(243,239,230,0.88)" : hoveredNeutral ? "#f5dd80" : "rgba(220,218,204,0.78)";
    ctx.lineWidth = isMain ? crispLine(2.3) : crispLine(1.6);
    drawIsoBuildingTop(env, x, y, size, blockHeight, isMain ? 0.34 : 0.24);
    const top = ctx.createLinearGradient(x - half, y - half - 20, x + half, y + half);
    top.addColorStop(0, building.owner >= 0 ? mixColor(ownerColor, "#ffffff", 0.25) : "#7b8173");
    top.addColorStop(0.58, building.owner >= 0 ? ownerColor : hoveredNeutral ? "#868c76" : "#5b6256");
    top.addColorStop(1, "#15191b");
    ctx.fillStyle = top;
    ctx.fill();
    ctx.stroke();

    if (building.owner >= 0) drawBuildingOwnerBand(env, x, y, size, blockHeight, ownerColor);
    drawBuildingUpperTier(env, x, y, size, blockHeight, ownerColor, building.owner >= 0, hoveredNeutral || activeClaimOwner >= 0, isMain);
    if (isMain && building.owner >= 0) drawBuildingCorePulse(env, x, y, blockHeight, ownerColor, idleReady ? idlePulse : 0);

    if (isMain) {
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.lineWidth = crispLine(1);
      ctx.beginPath();
      ctx.moveTo(x - half * 0.7, y - blockHeight + 4);
      ctx.lineTo(x + half * 0.7, y - blockHeight + 4);
      ctx.moveTo(x, y - half * 0.7 - blockHeight + 4);
      ctx.lineTo(x, y + half * 0.3);
      ctx.stroke();
    }
    if (building.static_defense_level > 0) {
      ctx.strokeStyle = hexToRgba(ownerColor, 0.85);
      ctx.lineWidth = crispLine(isMain ? 2.1 : 1.8);
      for (let i = 0; i < Math.min(4, Math.round(building.static_defense_level)); ++i) {
        const rr = half + 6 + i * 3.2;
        ctx.beginPath();
        ctx.arc(x, y, rr, -Math.PI * 0.18, Math.PI * 0.18);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, rr, Math.PI * 0.82, Math.PI * 1.18);
        ctx.stroke();
      }
    }
    if (opts.afterBlock) opts.afterBlock({ x, y, size, half, ownerColor, isMain, activeClaimOwner, claimRatio });
    if (isExpansionSite && (hoveredNeutral || activeClaimOwner >= 0) && opts.expansionLabel) {
      const label = opts.expansionLabel({ building, hoveredNeutral, activeClaimOwner, claimRatio });
      if (label?.text) {
        ctx.font = "900 11px ui-sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = label.color || (hoveredNeutral ? "#fff2ad" : claimColor);
        ctx.fillText(label.text, x, y - half - 35);
      }
    }
    if (building.owner >= 0) {
      const label = isMain ? (env.teamNames?.[building.owner] ?? `P${building.owner}`) : `P${building.owner}`;
      drawTeamPlate(x - (isMain ? 24 : 15), y - half - (isMain ? 38 : 29), isMain ? 48 : 30, ownerColor, label);
    }
    drawHealthPip(x, y + half + 7, size, hpRatio, ownerColor);
    if (opts.drawProduction && Number(building.pending_card_id || 0) > 0) {
      opts.drawProduction({ x, y, size, half, building });
    }
    if (isExpansionSite && (building.claim_progress > 0 || activeClaimOwner >= 0)) {
      drawHealthPip(x, y + half + 14, size + 12, Math.max(0.03, claimRatio), claimColor);
    }
    ctx.restore();
  }

  window.SimIsoRenderer = {
    drawIsoWorldRect,
    drawExpansionSiteMarker,
    drawIsoBlock,
    drawIsoBuildingTop,
    drawBuildingFoundation,
    drawBuildingOwnerBand,
    drawBuildingUpperTier,
    drawBuildingCorePulse,
    drawIsoBuildingBlock,
    drawBuilding,
  };
}());
