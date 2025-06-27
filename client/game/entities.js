// Entity management logic
import { state } from './state.js';
import { Player } from './player.js';
import { angleTo, normalizeAngle, magnitude } from './math.js';

const Entities = {
  drawEntity(ctx, entity, fillStyle = "#fff", strokeStyle = "#fff") {
    ctx.save();
    let radius = entity.radius;
    let alpha = 1.0;
    if (entity.energy !== undefined) {
      const energyRatio = entity.energy / entity.maxEnergy;
      radius = entity.radius * (0.5 + 0.7 * energyRatio);
      if (energyRatio < 0.2) {
        alpha = 0.3 + 0.7 * (energyRatio / 0.2);
      }
      if (energyRatio > 0.7) {
        fillStyle = "#0f0";
      } else if (energyRatio > 0.3) {
        fillStyle = "#ff0";
      } else {
        fillStyle = "#f00";
      }
    }
    if (entity.isAlive === false) {
      alpha = 0.2;
      fillStyle = "#666";
      strokeStyle = "#444";
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);
    ctx.lineTo(
      entity.x + Math.cos(entity.angle) * radius,
      entity.y + Math.sin(entity.angle) * radius
    );
    ctx.stroke();
    ctx.restore();
  },

  updateFollowEntity() {
    const followIndex = state.getFollowEntityIndex();
    if (followIndex !== null && state.getEntities()[followIndex]) {
      const target = state.getEntities()[followIndex];
      const followDist = target.radius + player.radius + state.ENTITY_FOLLOW_PADDING;
      const rawAngle = angleTo(player, target);
      const followX = target.x - Math.cos(rawAngle) * followDist;
      const followY = target.y - Math.sin(rawAngle) * followDist;
      const dx = followX - player.x;
      const dy = followY - player.y;
      const dist = magnitude(dx, dy);
      const angleToFollow = Math.atan2(dy, dx);
      const slowRadius = Math.max(followDist * 2, target.radius * 2);
      let slowFactor = Math.min(1, dist / slowRadius);
      const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
      let delta = normalizeAngle(angleToFollow - player.angle);
      if (Math.abs(delta) > player.rotationSpeed) {
        player.angle += Math.sign(delta) * player.rotationSpeed;
        player.angle = normalizeAngle(player.angle);
      } else {
        player.angle = angleToFollow;
      }
      player.vx += Math.cos(player.angle) * autoAccel;
      player.vy += Math.sin(player.angle) * autoAccel;
      const velocity = magnitude(player.vx, player.vy);
      if (velocity > autoMaxSpeed) {
        player.vx = (player.vx / velocity) * autoMaxSpeed;
        player.vy = (player.vy / velocity) * autoMaxSpeed;
      }
      if (dist < 1) {
        player.vx = 0;
        player.vy = 0;
      }
    }
  }
};

export default Entities;