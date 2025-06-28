// Entity management logic
import { State } from './state.js';
import { Player } from './player.js';
import { angleTo, normalizeAngle, magnitude } from '../utils/math.js';

const showGen = false

const Entities = {
  drawEntity(ctx, entity, fillStyle = "#fff", strokeStyle = "#fff") {
    ctx.save();
    let radius = entity.radius;
    let alpha = 1.0;

    // Energy-based color and size changes
    if (entity.energy !== undefined) {
      const energyRatio = entity.energy / entity.maxEnergy;

      // Size based on current radius (which includes growth)
      radius = entity.radius;

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

    // Dead entity styling
    if (entity.isAlive === false) {
      alpha = 0.2;
      fillStyle = "#666";
      strokeStyle = "#444";
    }

    // Division readiness indicator
    if (entity.isAlive && entity.energy !== undefined) {
      const energyRatio = entity.energy / entity.maxEnergy;
      const divisionValue = entity.energy + (entity.radius - (entity.baseRadius || 18)) * 10;
      const divisionThreshold = entity.divisionThreshold || 150;

      if (divisionValue >= divisionThreshold && entity.divisionCooldown <= 0) {
        // Entity is ready to divide - add pulsing effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        alpha *= pulse;

        // Add division indicator ring
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
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

    // Generation indicator for divided entities
    if (showGen && entity.generation >= 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`G${entity.generation}`, entity.x, entity.y + radius + 15);
    }

    ctx.restore();
  },

  updateFollowEntity() {
    const followIndex = State.getFollowEntityIndex();
    if (followIndex !== null && State.getEntities()[followIndex]) {
      const target = State.getEntities()[followIndex];
      const followDist = target.radius + Player.radius + State.ENTITY_FOLLOW_PADDING;
      const rawAngle = angleTo(Player, target);
      const followX = target.x - Math.cos(rawAngle) * followDist;
      const followY = target.y - Math.sin(rawAngle) * followDist;
      const dx = followX - Player.x;
      const dy = followY - Player.y;
      const dist = magnitude(dx, dy);
      const angleToFollow = Math.atan2(dy, dx);
      const slowRadius = Math.max(followDist * 2, target.radius * 2);
      let slowFactor = Math.min(1, dist / slowRadius);
      const autoMaxSpeed = 1.5 + (Player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (Player.acceleration - 0.05) * slowFactor;
      let delta = normalizeAngle(angleToFollow - Player.angle);
      if (Math.abs(delta) > Player.rotationSpeed) {
        Player.angle += Math.sign(delta) * Player.rotationSpeed;
        Player.angle = normalizeAngle(Player.angle);
      } else {
        Player.angle = angleToFollow;
      }
      Player.vx += Math.cos(Player.angle) * autoAccel;
      Player.vy += Math.sin(Player.angle) * autoAccel;
      const velocity = magnitude(Player.vx, Player.vy);
      if (velocity > autoMaxSpeed) {
        Player.vx = (Player.vx / velocity) * autoMaxSpeed;
        Player.vy = (Player.vy / velocity) * autoMaxSpeed;
      }
      if (dist < 1) {
        Player.vx = 0;
        Player.vy = 0;
      }
    }
  }
};

export default Entities;