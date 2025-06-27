// Resource rendering logic
import { gameState } from './state.js';

const ResourceModule = {
  drawResources(ctx) {
    const resources = gameState.getResources();
    const time = Date.now() / 400;
    for (const resource of resources) {
      if (!resource.isActive) continue;
      const pulse = 0.8 + 0.2 * Math.sin(time + resource.id.charCodeAt(0));
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(resource.x, resource.y, resource.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#0f0';
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

export default ResourceModule;