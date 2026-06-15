import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
<main class="relative w-screen h-screen overflow-hidden bg-[#050506] text-zinc-300 font-sans flex flex-col">
  <!-- Radial grid background from theme -->
  <div class="absolute inset-0 bg-[radial-gradient(#1A1A1C_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>

  <canvas #webglCanvas
    class="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
    (pointerdown)="onPointerDown($event)"
    (pointermove)="onPointerMove($event)"
    (pointerup)="onPointerUp($event)"
    (pointercancel)="onPointerUp($event)"
    (pointerout)="onPointerUp($event)"
    (wheel)="onWheel($event)">
  </canvas>

  <aside class="absolute top-4 left-4 w-72 bg-[#0E0E10]/95 backdrop-blur-md border border-zinc-800 rounded shadow-2xl flex flex-col z-10 overflow-hidden transform transition-all max-h-[calc(100vh-32px)]">
    <header class="p-4 border-b border-zinc-800 flex flex-col gap-1 bg-[#0E0E10] shrink-0">
       <div class="flex items-center justify-between">
           <h1 class="text-sm font-semibold tracking-tight uppercase text-zinc-100 flex items-center gap-2">
                Prime Walk
           </h1>
           <div class="flex gap-2">
              <button (click)="isExportModalOpen.set(true)" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold tracking-wider uppercase transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]">Export</button>
           </div>
       </div>
       <div class="mt-2 flex items-center justify-between bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-md">
          <span class="text-[10px] text-zinc-500 uppercase font-bold">Number</span>
          <span class="text-xs font-mono text-emerald-400">{{ currentNumber() | number }}</span>
       </div>
       <div class="mt-1 flex items-center justify-between bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-md">
          <span class="text-[10px] text-zinc-500 uppercase font-bold">Primes</span>
          <span class="text-xs font-mono text-emerald-400">{{ primesFound() | number }}</span>
       </div>
    </header>

    <div class="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
      
      <!-- Execution Controls -->
      <section class="flex flex-col gap-3">
        <button 
          (click)="toggleRunning()"
          class="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-colors text-white"
          [class.bg-emerald-600]="!isRunning()" [class.hover:bg-emerald-500]="!isRunning()"
          [class.bg-zinc-800]="isRunning()" [class.hover:bg-zinc-700]="isRunning()">
          <span class="material-icons text-[16px]">{{ isRunning() ? 'pause' : 'play_arrow' }}</span>
          {{ isRunning() ? 'Pause Engine' : 'Resume Engine' }}
        </button>

        <div class="flex gap-2">
            <button (click)="resetView()" class="flex-1 flex items-center justify-center gap-1 p-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 rounded text-[10px] text-zinc-300 uppercase font-bold transition-colors">
                <span class="material-icons text-[14px]">center_focus_strong</span> Recenter
            </button>
            <button (click)="clearEngine()" class="flex-1 flex items-center justify-center gap-1 p-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 rounded text-[10px] text-zinc-300 uppercase font-bold transition-colors">
                <span class="material-icons text-[14px]">restart_alt</span> Restart
            </button>
        </div>
      </section>

      <!-- Math Parameters -->
      <section class="space-y-4">
        <h2 class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Vector Precision Controls</h2>
        
        <div class="space-y-1">
            <div class="flex justify-between mb-2">
                <div class="text-[11px] text-zinc-400">Modulo Base</div>
                <span class="font-mono text-[11px] text-emerald-500">{{ modulo() }}</span>
            </div>
            <input type="range" [value]="modulo()" (input)="updateModulo($event)" (change)="clearEngine()" min="2" max="720" step="1" class="w-full accent-emerald-500 cursor-pointer" />
            <div class="grid grid-cols-4 gap-1 pt-1 opacity-70">
                @for (m of [90, 180, 270, 360]; track m) {
                  <button (click)="setModulo(m)" class="text-[9px] bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 rounded py-1 px-1 text-zinc-400 transition-colors">{{ m }}</button>
                }
            </div>
        </div>

        <div class="space-y-1">
            <div class="flex justify-between mb-2">
                <div class="text-[11px] text-zinc-400">Angle Multiplier</div>
                <span class="font-mono text-[11px] text-emerald-500">{{ angleStep() }}x</span>
            </div>
            <input type="range" [value]="angleStep()" (input)="updateAngleStep($event)" (change)="clearEngine()" min="0.1" max="10" step="0.1" class="w-full accent-emerald-500 cursor-pointer" />
        </div>

        <label class="flex items-center justify-between cursor-pointer group pt-1" for="cumulativeCheck">
            <span class="text-[11px] text-zinc-400 group-hover:text-zinc-300 transition-colors">Cumulative Angle</span>
            <div class="relative w-8 h-4 bg-zinc-800 rounded-full transition-colors" [class.!bg-emerald-500]="cumulative()">
                <input id="cumulativeCheck" type="checkbox" [checked]="cumulative()" (change)="toggleCumulative()" class="sr-only" />
                <div class="absolute left-1 top-1 bg-zinc-400 w-2 h-2 rounded-full transition-transform" [class.translate-x-4]="cumulative()" [class.!bg-white]="cumulative()"></div>
            </div>
        </label>
      </section>

      <!-- Visual Parameters -->
      <section class="space-y-4">
        <h2 class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Rendering Engine</h2>
        
        <div class="space-y-1 mt-1">
            <div class="flex justify-between mb-2">
                <div class="text-[11px] text-zinc-400">Stroke Precision</div>
                <span class="font-mono text-[11px] text-emerald-500">{{ lineLength() }}px</span>
            </div>
            <input type="range" [value]="lineLength()" (input)="updateLineLength($event)" (change)="clearEngine()" min="1" max="50" step="1" class="w-full accent-emerald-500 cursor-pointer" />
        </div>

        <div class="space-y-1">
            <div class="flex justify-between mb-2">
                <div class="text-[11px] text-zinc-400">Node Density Speed</div>
                <span class="font-mono text-[11px] text-emerald-500">{{ speed() }} ops/tick</span>
            </div>
            <input type="range" [value]="speed()" (input)="updateSpeed($event)" min="10" max="50000" step="10" class="w-full accent-emerald-500 cursor-pointer" />
        </div>

        <div class="space-y-2 pt-2">
            <div class="text-[11px] text-zinc-400 mb-2">Color Matrix</div>
            <div class="grid grid-cols-2 gap-2">
                <button (click)="setColorMode('gradient')" [class.border-emerald-500/30]="colorMode() === 'gradient'" [class.border-zinc-800]="colorMode() !== 'gradient'" [class.opacity-50]="colorMode() !== 'gradient'" class="p-2 bg-zinc-900 border rounded text-left transition-all">
                    <div class="text-[10px] text-emerald-500 font-bold mb-1">RADIAL_HSV</div>
                    <div class="text-[9px] text-zinc-500">Spectral depth</div>
                </button>
                <button (click)="setColorMode('solid')" [class.border-emerald-500/30]="colorMode() === 'solid'" [class.border-zinc-800]="colorMode() !== 'solid'" [class.opacity-50]="colorMode() !== 'solid'" class="p-2 bg-zinc-900 border rounded text-left transition-all">
                    <div class="text-[10px] text-emerald-500 font-bold mb-1 flex items-center justify-between">
                       <span>FLAT_RGB</span>
                       <div class="relative">
                          <input type="color" [value]="solidColor()" (input)="updateColor($event)" 
                              [disabled]="colorMode() !== 'solid'" 
                              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed" />
                          <div class="w-3 h-3 rounded-full border border-zinc-700" [style.backgroundColor]="solidColor()"></div>
                       </div>
                    </div>
                    <div class="text-[9px] text-zinc-500 font-mono">{{ solidColor() }}</div>
                </button>
            </div>
        </div>
      </section>
      
    </div>
  </aside>

  <!-- Floating Telemetry Panel -->
  <div class="absolute top-4 right-4 bg-[#0E0E10]/90 backdrop-blur-md border border-zinc-800 rounded shadow-2xl p-3 flex flex-col gap-3 w-52 z-10 pointer-events-none">
    <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 pb-2">Live Telemetry</div>
    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-[10px] text-zinc-500 font-mono">CALC_DEPTH</span>
        <span class="text-[10px] font-mono text-zinc-300">{{ currentNumber() | number }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-[10px] text-zinc-500 font-mono">DENSITY</span>
        <span class="text-[10px] font-mono text-emerald-400">{{ primeDensity() | number:'1.2-2' }}%</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-[10px] text-zinc-500 font-mono">VARIANCE_σ²</span>
        <span class="text-[10px] font-mono text-amber-500">{{ angleVariance() | number:'1.2-2' }}</span>
      </div>
    </div>
  </div>

  <!-- Info Footer -->
  <footer class="absolute bottom-0 left-0 right-0 h-8 bg-[#0E0E10] border-t border-zinc-800 px-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono z-10 pointer-events-none">
    <div class="flex gap-4 items-center">
      <span class="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-0.5 rounded"><span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="isRunning()" [class.bg-rose-500]="!isRunning()"></span> {{ isRunning() ? 'ENGINE_ACTIVE' : 'ENGINE_PAUSED' }}</span>
      <span class="hidden sm:inline">WORKSPACE: PRIME_WALK_V4</span>
    </div>
    <div class="flex gap-4 items-center">
      <span class="hidden sm:inline">CANVAS: WEBGL2</span>
      <span class="border border-zinc-800 bg-zinc-900 px-2 py-0.5 rounded text-emerald-500">ZOOM: {{(scale * 100).toFixed(1)}}%</span>
    </div>
  </footer>

  <!-- Export Dialog Modal -->
  @if (isExportModalOpen()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
       <div class="bg-[#0E0E10] border border-zinc-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
             <h2 class="text-zinc-200 font-semibold text-sm tracking-wide uppercase">Export Graphic</h2>
             <button (click)="isExportModalOpen.set(false)" class="text-zinc-500 hover:text-zinc-300 transition-colors">
                <span class="material-icons text-[18px]">close</span>
             </button>
          </div>
          <div class="p-5 flex flex-col gap-6">
             
             <!-- Format Selection -->
             <div>
                <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 flex">Export Engine Format</div>
                <div class="grid grid-cols-2 gap-2">
                   <button (click)="exportFormat.set('PNG')" [class.bg-zinc-800]="exportFormat() === 'PNG'" [class.border-emerald-500]="exportFormat() === 'PNG'" class="py-2.5 border border-zinc-700/50 rounded text-xs font-bold tracking-wide text-zinc-300">RASTER_PNG</button>
                   <button (click)="exportFormat.set('SVG')" [class.bg-zinc-800]="exportFormat() === 'SVG'" [class.border-emerald-500]="exportFormat() === 'SVG'" class="py-2.5 border border-zinc-700/50 rounded text-xs font-bold tracking-wide text-zinc-300">VECTOR_SVG</button>
                </div>
             </div>

             <!-- Resolution (PNG only) -->
             @if (exportFormat() === 'PNG') {
                 <div>
                    <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
                       Master Resolution Limit
                       <span class="text-emerald-500 font-mono text-[9px]">{{ getExportDimensions().width }}x{{ getExportDimensions().height }}</span>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                       @for (res of ['2K', '4K', '8K', '16K']; track res) {
                          <button (click)="setExportResolution($any(res))" [class.bg-zinc-800]="exportResolution() === res" [class.border-emerald-500]="exportResolution() === res" class="py-2 border border-zinc-700/50 rounded text-xs font-bold tracking-wide text-zinc-300 transition-colors">{{ res }}</button>
                       }
                    </div>
                 </div>
             }

             <!-- Aspect Ratio -->
             <div>
                <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 flex">Aspect Boundary Ratio</div>
                <div class="grid grid-cols-4 gap-2">
                   @for (ratio of ['16:9', '1:1', '4:3', '9:16']; track ratio) {
                      <button (click)="setExportRatio($any(ratio))" [class.bg-zinc-800]="exportRatio() === ratio" [class.border-emerald-500]="exportRatio() === ratio" class="py-2 border border-zinc-700/50 rounded text-xs font-bold tracking-wide text-zinc-300 transition-colors">{{ ratio }}</button>
                   }
                </div>
             </div>

             <!-- Scope -->
             <div>
                <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 flex">Rendering Matrix Scope</div>
                <div class="grid grid-cols-2 gap-2">
                   <button (click)="exportScope.set('viewport')" [class.bg-zinc-800]="exportScope() === 'viewport'" [class.border-emerald-500]="exportScope() === 'viewport'" class="p-3 border border-zinc-700/50 rounded text-left transition-colors">
                      <div class="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">Dynamic Viewport</div>
                      <div class="text-[9px] text-zinc-500 font-mono mt-1">Crops to current screen</div>
                   </button>
                   <button (click)="exportScope.set('entire')" [class.bg-zinc-800]="exportScope() === 'entire'" [class.border-emerald-500]="exportScope() === 'entire'" class="p-3 border border-zinc-700/50 rounded text-left transition-colors">
                      <div class="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">Macro Network</div>
                      <div class="text-[9px] text-zinc-500 font-mono mt-1">Computes total geometry bounding box</div>
                   </button>
                </div>
             </div>
          </div>
          <div class="p-4 border-t border-zinc-800 bg-[#0A0A0B]">
             <button (click)="performExport()" [disabled]="isExporting()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700 disabled:cursor-not-allowed border border-emerald-500 text-white rounded text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2">
                @if (isExporting()) {
                   <span class="material-icons animate-spin text-[18px]">autorenew</span> COMPUTING HIGH-RES MATRIX...
                } @else {
                   <span class="material-icons text-[18px]">file_download</span> INITIATE SECURE DOWNLOAD
                }
             </button>
          </div>
       </div>
    </div>
  }

  <!-- Zoom Controls (Interactive Overlay) -->
  <div class="absolute bottom-12 right-8 flex gap-2 z-10 pointer-events-auto">
      <button (click)="zoomLevel(1.5)" class="w-8 h-8 bg-[#0E0E10]/80 backdrop-blur-md rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors active:scale-95 cursor-pointer shadow-lg">
          <span class="material-icons text-[18px]">add</span>
      </button>
      <button (click)="zoomLevel(0.666)" class="w-8 h-8 bg-[#0E0E10]/80 backdrop-blur-md rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors active:scale-95 cursor-pointer shadow-lg">
          <span class="material-icons text-[18px]">remove</span>
      </button>
  </div>
</main>
`
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  gl!: WebGL2RenderingContext;
  program!: WebGLProgram;

  uResolution!: WebGLUniformLocation;
  uTranslation!: WebGLUniformLocation;
  uScale!: WebGLUniformLocation;
  uColor!: WebGLUniformLocation;
  uUseGradient!: WebGLUniformLocation;

  modulo = signal(360);
  angleStep = signal(1);
  cumulative = signal(true);
  speed = signal(5000);
  lineLength = signal(2);
  colorMode = signal<'gradient' | 'solid'>('solid');
  solidColor = signal('#10b981');

  isRunning = signal(true);
  currentNumber = signal(2);
  primesFound = signal(0);
  
  sumAngles = 0;
  sumAnglesSq = 0;
  angleVariance = signal(0);
  primeDensity = computed(() => {
      const total = this.currentNumber() - 2;
      if (total <= 0) return 0;
      return (this.primesFound() / total) * 100;
  });

  isExportModalOpen = signal(false);
  exportFormat = signal<'PNG' | 'SVG'>('PNG');
  exportRatio = signal<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  exportResolution = signal<'2K' | '4K' | '8K' | '16K'>('4K');
  exportScope = signal<'viewport' | 'entire'>('viewport');
  isExporting = signal(false);

  translateX = 0;
  translateY = 0;
  scale = 1;

  maxPoints = 5_000_000;
  positions = new Float32Array(this.maxPoints * 2);
  positionBuffer!: WebGLBuffer;
  lastUpdateCount = 0;
  
  currentX = 0;
  currentY = 0;
  currentAngleDegrees = 0;

  animationFrameId = 0;
  needsRender = true;

  pointers = new Map<number, { x: number, y: number }>();

  ngAfterViewInit() {
    this.initWebGL();
    const ro = new ResizeObserver(() => this.resizeCanvas());
    ro.observe(this.canvasRef.nativeElement);
    this.animationFrameId = requestAnimationFrame(() => this.processBatch());
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId);
  }

  updateModulo(e: Event) { this.modulo.set(Number((e.target as HTMLInputElement).value)); }
  updateAngleStep(e: Event) { this.angleStep.set(Number((e.target as HTMLInputElement).value)); }
  updateLineLength(e: Event) { this.lineLength.set(Number((e.target as HTMLInputElement).value)); }
  updateSpeed(e: Event) { this.speed.set(Number((e.target as HTMLInputElement).value)); }
  updateColor(e: Event) { this.solidColor.set((e.target as HTMLInputElement).value); this.needsRender = true; }

  setModulo(m: number) { this.modulo.set(m); this.clearEngine(); }
  setColorMode(m: 'gradient' | 'solid') { this.colorMode.set(m); this.needsRender = true; }
  
  setExportRatio(r: '16:9' | '1:1' | '4:3' | '9:16') { this.exportRatio.set(r); }
  setExportResolution(r: '2K' | '4K' | '8K' | '16K') { this.exportResolution.set(r); }

  toggleRunning() { this.isRunning.set(!this.isRunning()); }
  toggleCumulative() { this.cumulative.set(!this.cumulative()); this.clearEngine(); }

  clearEngine() {
    this.currentNumber.set(2);
    this.primesFound.set(0);
    this.sumAngles = 0;
    this.sumAnglesSq = 0;
    this.angleVariance.set(0);
    this.lastUpdateCount = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.currentAngleDegrees = 0;
    this.needsRender = true;
  }

  resetView() {
    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;
    this.needsRender = true;
  }

  zoomLevel(factor: number) {
    this.scale *= factor;
    this.needsRender = true;
  }

  isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5, sqrt = Math.sqrt(n); i <= sqrt; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  getExportDimensions() {
    let width = 3840;
    const res = this.exportResolution();
    if (res === '2K') width = 2560;
    if (res === '4K') width = 3840;
    if (res === '8K') width = 7680;
    if (res === '16K') width = 15360;

    let height = width;
    const ratio = this.exportRatio();
    if (ratio === '16:9') height = Math.round(width * 9 / 16);
    if (ratio === '4:3') height = Math.round(width * 3 / 4);
    if (ratio === '1:1') height = width;
    if (ratio === '9:16') height = Math.round(width * 16 / 9);

    return { width, height };
  }

  getBounds() {
    const count = this.primesFound();
    if (count === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const pts = this.positions;
    for(let i=0; i<count; i++) {
       const x = pts[i*2];
       const y = pts[i*2+1];
       if (x < minX) minX = x;
       if (x > maxX) maxX = x;
       if (y > maxY) maxY = y;
       if (y < minY) minY = y;
    }
    return { minX, maxX, minY, maxY };
  }

  async performExport() {
    this.isExporting.set(true);
    // Yield brief frame so UI shows spinning loader
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const { width, height } = this.getExportDimensions();
      const count = this.primesFound();
      const pts = this.positions;
      
      let tx = this.translateX;
      let ty = this.translateY;
      let sc = this.scale;

      if (this.exportScope() === 'entire') {
        const bounds = this.getBounds();
        if (bounds) {
          const bWidth = bounds.maxX - bounds.minX;
          const bHeight = bounds.maxY - bounds.minY;
          const scaleX = width / (bWidth || 1);
          const scaleY = height / (bHeight || 1);
          sc = Math.min(scaleX, scaleY) * 0.9;
          const cx = (bounds.minX + bounds.maxX) / 2;
          const cy = (bounds.minY + bounds.maxY) / 2;
          tx = -cx * sc;
          ty = -cy * sc;
        }
      } else {
        const appCanvas = this.canvasRef.nativeElement;
        const scaleMatchX = width / appCanvas.width;
        const scaleMatchY = height / appCanvas.height;
        const scaleMatch = Math.max(scaleMatchX, scaleMatchY); 
        
        sc = this.scale * scaleMatch;
        tx = this.translateX * scaleMatch;
        ty = this.translateY * scaleMatch;
      }

      if (this.exportFormat() === 'SVG') {
         await this.exportSVG(width, height, tx, ty, sc, count, pts);
      } else {
         await this.exportPNG(width, height, tx, ty, sc, count, pts);
      }
    } catch (e) {
      console.error(e);
      alert("System Failed to export graphic matrix limit. Memory exception or resolution bounds exceeded. " + (e instanceof Error ? e.message : ''));
    } finally {
      this.isExporting.set(false);
      this.isExportModalOpen.set(false);
    }
  }

  async exportPNG(width: number, height: number, tx: number, ty: number, sc: number, count: number, pts: Float32Array) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Could not initialize 2D hardware context bounds");

      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, width, height);

      ctx.translate(width / 2, height / 2);
      ctx.translate(tx, ty);
      ctx.scale(sc, sc);

      if (this.colorMode() === 'solid') {
        ctx.beginPath();
        ctx.strokeStyle = this.solidColor();
        ctx.lineWidth = 1 / sc; 
        
        if(count > 0) ctx.moveTo(pts[0], pts[1]);
        for(let i = 1; i < count; i++) {
            ctx.lineTo(pts[i*2], pts[i*2+1]);
        }
        ctx.stroke();
      } else {
         const batchSize = 1000;
         ctx.lineWidth = 1 / sc;
         for (let b = 0; b < count; b += batchSize) {
            ctx.beginPath();
            const end = Math.min(b + batchSize, count);
            ctx.moveTo(pts[b*2], pts[b*2+1]);
            for(let i = b + 1; i < end; i++) {
                ctx.lineTo(pts[i*2], pts[i*2+1]);
            }
            const hue = (b / 120000.0) % 1.0;
            ctx.strokeStyle = `hsl(${Math.round(hue * 360)}, 85%, 50%)`;
            ctx.stroke();
         }
      }

      return new Promise<void>((resolve, reject) => {
         canvas.toBlob((blob) => {
            if (!blob) { reject(new Error("Canvas toBlob output bounds exceeded")); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prime_matrix_${width}x${height}.png`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
         }, 'image/png');
      });
  }

  async exportSVG(width: number, height: number, tx: number, ty: number, sc: number, count: number, pts: Float32Array) {
      const isSolid = this.colorMode() === 'solid';
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #050506;">\n`;
      svgContent += `<g transform="translate(${width/2 + tx}, ${height/2 + ty}) scale(${sc}, ${sc})">\n`;
      
      const fix = (n: number) => Number(n.toFixed(3));

      if (isSolid) {
        let d = '';
        if(count > 0) d += `M${fix(pts[0])},${fix(pts[1])}`;
        const chunkLimit = 50000;
        for(let i = 1; i < count; i++) {
            d += ` L${fix(pts[i*2])},${fix(pts[i*2+1])}`;
            if (i % chunkLimit === 0) {
               svgContent += `<path d="${d}" fill="none" stroke="${this.solidColor()}" stroke-width="${1/sc}" stroke-linejoin="round" />\n`;
               d = `M${fix(pts[i*2])},${fix(pts[i*2+1])}`;
            }
        }
        if (d.length > 0) {
            svgContent += `<path d="${d}" fill="none" stroke="${this.solidColor()}" stroke-width="${1/sc}" stroke-linejoin="round" />\n`;
        }
      } else {
         const batchSize = 1000;
         for (let b = 0; b < count; b += batchSize) {
            const end = Math.min(b + batchSize, count);
            let d = `M${fix(pts[b*2])},${fix(pts[b*2+1])}`;
            for(let i = b + 1; i < end; i++) {
                d += ` L${fix(pts[i*2])},${fix(pts[i*2+1])}`;
            }
            const hue = (b / 120000.0) % 1.0;
            svgContent += `<path d="${d}" fill="none" stroke="hsl(${Math.round(hue * 360)}, 85%, 50%)" stroke-width="${1/sc}" stroke-linejoin="round" />\n`;
         }
      }

      svgContent += `</g>\n</svg>`;
      const blob = new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prime_matrix_vector.svg`;
      a.click();
      URL.revokeObjectURL(url);
  }

  processBatch() {
    let currentCount = this.primesFound();

    if (this.isRunning() && currentCount < this.maxPoints) {
      const t0 = performance.now();
      let num = this.currentNumber();
      const m = this.modulo();
      const aStep = this.angleStep();
      const cum = this.cumulative();
      const lLen = this.lineLength();
      
      let workCount = 0;
      const targetWork = this.speed();
      let index = currentCount * 2;
      let sAngle = this.sumAngles;
      let sAngleSq = this.sumAnglesSq;
      
      // Limit processing to 12ms per frame to maintain 60fps visually
      while (performance.now() - t0 < 12 && workCount < targetWork && currentCount < this.maxPoints) {
        if (this.isPrime(num)) {
          const mod = num % m;
          const turn = mod * aStep;
          
          if (cum) {
             this.currentAngleDegrees += turn;
          } else {
             this.currentAngleDegrees = turn;
          }

          sAngle += turn;
          sAngleSq += turn * turn;

          const radians = this.currentAngleDegrees * (Math.PI / 180.0);
          this.currentX += Math.cos(radians) * lLen;
          this.currentY += Math.sin(radians) * lLen;

          this.positions[index++] = this.currentX;
          this.positions[index++] = this.currentY;

          currentCount++;
          workCount++;
        }
        num++;
      }
      
      this.currentNumber.set(num);
      
      if (currentCount > this.primesFound()) {
        this.sumAngles = sAngle;
        this.sumAnglesSq = sAngleSq;
        const mean = sAngle / currentCount;
        const variance = Math.max(0, (sAngleSq / currentCount) - (mean * mean));
        this.angleVariance.set(variance);

        this.primesFound.set(currentCount);
        this.updateGLBuffer();
        this.needsRender = true;
      }
    }
    
    if (this.needsRender) {
      this.render();
      this.needsRender = false;
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.processBatch());
  }

  updateGLBuffer() {
    if (!this.gl) return;
    const gl = this.gl;
    const offsetBytes = this.lastUpdateCount * 2 * 4; // float32 = 4 bytes, 2 coords per point
    const subArray = this.positions.subarray(this.lastUpdateCount * 2, this.primesFound() * 2);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offsetBytes, subArray);
    this.lastUpdateCount = this.primesFound();
  }

  initWebGL() {
    const canvas = this.canvasRef.nativeElement;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL 2 is not supported.');
      return;
    }
    this.gl = gl;

    const vsSource = `#version 300 es
    in vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform float u_scale;
    uniform vec4 u_color;
    uniform bool u_useGradient;
    out vec4 v_color;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        float idx = float(gl_VertexID);
        vec2 pos = (a_position * u_scale) + u_translation;
        vec2 clipSpace = pos / (u_resolution / 2.0);
        clipSpace.y = -clipSpace.y;
        gl_Position = vec4(clipSpace, 0.0, 1.0);
        
        if (u_useGradient) {
            float hue = idx / 120000.0;
            v_color = vec4(hsv2rgb(vec3(fract(hue), 0.85, 1.0)), 1.0);
        } else {
            v_color = u_color;
        }
    }
    `;

    const fsSource = `#version 300 es
    precision highp float;
    in vec4 v_color;
    out vec4 outColor;
    void main() {
        outColor = v_color;
    }
    `;

    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    this.uResolution = gl.getUniformLocation(this.program, 'u_resolution')!;
    this.uTranslation = gl.getUniformLocation(this.program, 'u_translation')!;
    this.uScale = gl.getUniformLocation(this.program, 'u_scale')!;
    this.uColor = gl.getUniformLocation(this.program, 'u_color')!;
    this.uUseGradient = gl.getUniformLocation(this.program, 'u_useGradient')!;

    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions.byteLength, gl.DYNAMIC_DRAW);

    const positionAttr = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);

    this.resizeCanvas();
  }

  compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw new Error('Shader compile error');
    }
    return shader;
  }

  resizeCanvas() {
    if (!this.canvasRef || !this.gl) return;
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.needsRender = true;
  }

  hexToRgba(hex: string): [number, number, number, number] {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#')) hex = hex.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return [r / 255.0, g / 255.0, b / 255.0, 1.0];
  }

  render() {
    if (!this.gl || this.primesFound() === 0) return;
    const gl = this.gl;
    
    // Transparent background to show CSS grid
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    const canvasElem = gl.canvas as HTMLCanvasElement;
    const rect = canvasElem.getBoundingClientRect();
    gl.uniform2f(this.uResolution, rect.width, rect.height);
    gl.uniform2f(this.uTranslation, this.translateX, this.translateY);
    gl.uniform1f(this.uScale, this.scale);
    gl.uniform1i(this.uUseGradient, this.colorMode() === 'gradient' ? 1 : 0);
    
    const color = this.hexToRgba(this.solidColor());
    gl.uniform4f(this.uColor, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.LINE_STRIP, 0, this.primesFound());
  }

  // --- Pointer Gestures for seamless Zoom & Pan ---
  onPointerDown(e: PointerEvent) {
    this.canvasRef.nativeElement.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  onPointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    const prev = this.pointers.get(e.pointerId)!;
    
    if (this.pointers.size === 1) {
       // Single finger Pan
       const dx = e.clientX - prev.x;
       const dy = e.clientY - prev.y;
       this.translateX += dx;
       this.translateY += dy;
       this.needsRender = true;
       this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (this.pointers.size === 2) {
       // Pinch zoom
       const otherId = Array.from(this.pointers.keys()).find(id => id !== e.pointerId)!;
       const other = this.pointers.get(otherId)!;
       
       const distPrev = Math.hypot(prev.x - other.x, prev.y - other.y);
       const distCurr = Math.hypot(e.clientX - other.x, e.clientY - other.y);
       
       const scaleFactor = distCurr / (distPrev || 1);
       
       const rect = this.canvasRef.nativeElement.getBoundingClientRect();
       const midX = (e.clientX + other.x) / 2 - rect.left - rect.width / 2;
       const midY = (e.clientY + other.y) / 2 - rect.top - rect.height / 2;
       
       this.translateX = midX - (midX - this.translateX) * scaleFactor;
       this.translateY = midY - (midY - this.translateY) * scaleFactor;
       this.scale *= scaleFactor;
       
       this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
       this.needsRender = true;
    }
  }

  onPointerUp(e: PointerEvent) {
    if (this.pointers.has(e.pointerId)) {
        this.canvasRef.nativeElement.releasePointerCapture(e.pointerId);
        this.pointers.delete(e.pointerId);
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const ptrX = e.clientX - rect.left - rect.width / 2;
    const ptrY = e.clientY - rect.top - rect.height / 2;
    
    const zoomSensitivity = 0.001;
    const scaleFactor = Math.exp(-e.deltaY * zoomSensitivity);
    
    this.translateX = ptrX - (ptrX - this.translateX) * scaleFactor;
    this.translateY = ptrY - (ptrY - this.translateY) * scaleFactor;
    this.scale *= scaleFactor;
    
    this.needsRender = true;
  }
}

