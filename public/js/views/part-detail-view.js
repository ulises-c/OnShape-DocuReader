/**
 * PartDetailView - renders part details and mass properties
 */

import { escapeHtml } from '../utils/dom-helpers.js';

export class PartDetailView {
  render(part) {
    if (!part) return;

    // Title
    const title = document.getElementById('partTitle');
    if (title) {
      title.textContent = part.name || 'Unnamed Part';
    }

    // Info
    const infoEl = document.getElementById('partInfo');
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${escapeHtml(part.name || 'Unnamed Part')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Part ID</div>
          <div class="info-value" style="font-family: monospace;">${escapeHtml(part.partId)}</div>
        </div>
        ${part.bodyType ? `
        <div class="info-item">
          <div class="info-label">Body Type</div>
          <div class="info-value">${escapeHtml(part.bodyType)}</div>
        </div>` : ''}
        ${part.state ? `
        <div class="info-item">
          <div class="info-label">State</div>
          <div class="info-value">${escapeHtml(part.state)}</div>
        </div>` : ''}
      `;
    }

    // Mass properties
    const massPropsEl = document.getElementById('partMassProperties');
    if (massPropsEl) {
      const props = part.massProperties;
      if (props?.bodies?.length) {
        const body = props.bodies[0];
        const items = [];

        if (body.mass !== undefined) {
          items.push({
            label: 'Mass',
            value: `${body.mass[0]} ${props.units?.mass || 'kg'}`
          });
        }
        if (body.volume !== undefined) {
          items.push({
            label: 'Volume',
            value: `${body.volume[0]} ${props.units?.volume || 'm³'}`
          });
        }
        if (body.centroid) {
          items.push({
            label: 'Centroid (X, Y, Z)',
            value: `(${body.centroid[0].toFixed(6)}, ${body.centroid[1].toFixed(6)}, ${body.centroid[2].toFixed(6)})`
          });
        }
        if (body.inertia) {
          items.push({
            label: 'Moment of Inertia',
            value: `[${body.inertia.map((v) => v.toFixed(6)).join(', ')}]`
          });
        }

        if (items.length) {
          massPropsEl.innerHTML = items
            .map(
              (it) => `
            <div class="mass-property-item">
              <div class="mass-property-label">${escapeHtml(it.label)}</div>
              <div class="mass-property-value">${escapeHtml(it.value)}</div>
            </div>
          `
            )
            .join('');
        } else {
          massPropsEl.innerHTML =
            '<div class="empty-state"><h3>No Mass Properties</h3><p>No mass properties data available for this part.</p></div>';
        }
      } else {
        massPropsEl.innerHTML =
          '<div class="empty-state"><h3>Loading Mass Properties...</h3><p>Mass properties could not be loaded for this part.</p></div>';
      }
    }
  }
}
