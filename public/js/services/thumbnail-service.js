/**
 * ThumbnailService - image handling and fallbacks
 */

export class ThumbnailService {
  setup(docId, originalUrl, proxyUrl) {
    const img = document.getElementById(`document-thumbnail-img-${docId}`);
    const placeholder = document.getElementById(`thumbnail-placeholder-${docId}`);

    if (!img || !placeholder) {
      console.error('Thumbnail elements not found for doc:', docId);
      return;
    }

    img.addEventListener('load', () => {
      img.style.display = 'block';
      placeholder.style.display = 'none';
      console.log('Thumbnail loaded successfully via:', img.src);
    });

    img.addEventListener('click', () => {
      window.open(originalUrl, '_blank');
    });

    let hasTriedDirect = false;
    img.addEventListener('error', () => {
      if (!hasTriedDirect) {
        console.error('Proxy failed, trying direct URL:', originalUrl);
        img.src = originalUrl;
        hasTriedDirect = true;
      } else {
        img.style.display = 'none';
        placeholder.innerHTML = `
          <div>❌</div>
          <div style="margin-top: 0.5rem;">Thumbnail unavailable</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem;">Proxy: ${proxyUrl}</div>
          <div style="font-size: 0.8rem;">Direct: ${originalUrl}</div>
        `;
        console.error('Both proxy and direct URL failed');
      }
    });
  }
}
