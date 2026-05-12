/**
 * Load pdfmake and vfs_fonts. Tries dynamic import first (works when bundler
 * inlines pdfmake). On failure (e.g. when pdfmake is in externalDependencies),
 * loads from CDN so runtime works in both CI-built and local builds.
 */

const PDFMAKE_CDN_VERSION = '0.2.18';
const PDFMAKE_CDN_BASE = `https://unpkg.com/pdfmake@${PDFMAKE_CDN_VERSION}/build`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export interface PdfMakeLoadResult {
  pdfMake: unknown;
  pdfFonts: unknown;
}

export async function loadPdfMakeWithFallback(): Promise<PdfMakeLoadResult> {
  try {
    const [pdfMakeModule, pdfFontsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
    const pdfFonts = pdfFontsModule.default ?? pdfFontsModule;
    return { pdfMake, pdfFonts };
  } catch {
    // Dynamic import failed (e.g. externalDependencies in build). Load from CDN.
    await loadScript(`${PDFMAKE_CDN_BASE}/pdfmake.min.js`);
    await loadScript(`${PDFMAKE_CDN_BASE}/vfs_fonts.js`);
    const w =
      typeof window !== 'undefined'
        ? window
        : (globalThis as unknown as Window);
    const pdfMake = (w as unknown as { pdfMake?: unknown }).pdfMake;
    const pdfFonts = pdfMake && typeof pdfMake === 'object' ? { pdfMake } : {};
    if (!pdfMake) {
      throw new Error('pdfMake not available after loading from CDN');
    }
    return { pdfMake, pdfFonts };
  }
}
