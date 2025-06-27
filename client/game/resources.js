// Resource rendering logic
import { State } from './state.js';
import { RESOURCE_PULSE_MIN, RESOURCE_PULSE_MAX, RESOURCE_PULSE_SPEED } from './config.js';

const Resources = {
  drawResources(ctx) {
    const resources = State.getResources();
    const time = Date.now() / RESOURCE_PULSE_SPEED;
    for (const resource of resources) {
      if (!resource.isActive) continue;
      const pulse = RESOURCE_PULSE_MIN + (RESOURCE_PULSE_MAX - RESOURCE_PULSE_MIN) * Math.abs(Math.sin(time + resource.id.charCodeAt(0)));
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(resource.x, resource.y, resource.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#09f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(resource.x, resource.y, resource.radius * pulse * 1.5, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  }
};

export default Resources;