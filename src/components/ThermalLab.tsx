import { useEffect, useRef, useState } from "react";
import { Pause, Play, Power } from "lucide-react";
import { Formula } from "@/components/Formula";

export const SIGMA = 5.670374419e-8;
export const EPS_FIN = 0.85;

const PASTES = { seca: { k: 0.5, n: "Sem pasta (ar)" }, comum: { k: 4, n: "Pasta comum" }, metal: { k: 70, n: "Metal líquido" } } as const;
type Paste = keyof typeof PASTES;

const T_MAX = 95;
const A_DIE = 0.0012;
const L_PASTE = 0.0001;
const R_BASE = 0.08;
const C_J = 12;
const C_D = 380;
const F_BASE = 3.6, F_BOOST = 5.2, F_MIN = 0.8;
const RPM_MAX = 2000;

export function resistances(paste: Paste, fan: number, finArea: number) {
  const Rp = L_PASTE / (PASTES[paste].k * A_DIE);
  const v = (fan / 100) * 3;
  const h = 6 + 12 * Math.pow(v, 0.8);
  const Rc = 1 / (h * finArea);
  return { Rp, Rc, h, v, Rjd: Rp + R_BASE, R: Rp + R_BASE + Rc };
}

export function cpuPower(tdp: number, f: number, Tj: number) {
  const x = f / F_BOOST;
  const V = 0.75 + 0.6 * x;
  const dyn = tdp * 0.85 * x * (V * V) / (1.35 * 1.35);
  const leak = tdp * 0.15 * Math.exp((Tj - 25) / 45);
  return { P: dyn + leak, dyn, leak };
}

export function radiationHeat(tdC: number, ambC: number, area: number, eps: number = EPS_FIN) {
  const Ts = tdC + 273.15;
  const Tviz = ambC + 273.15;
  return eps * SIGMA * area * (Ts ** 4 - Tviz ** 4);
}

export function checkEquilibriumGuess(guess: number, amb: number, power: number, rTot: number, tol: number = 3) {
  if (!Number.isFinite(guess)) return false;
  return Math.abs(guess - (amb + power * rTot)) <= tol;
}

function tempColor(t: number, amb: number) {
  const x = Math.min(1, Math.max(0, (t - amb) / (T_MAX + 10 - amb)));
  return `oklch(${0.7 + x * 0.05} ${0.14 + x * 0.09} ${230 - x * 205})`;
}

export function ThermalLab() {
  const [tdp, setTdp] = useState(150);
  const [fan, setFan] = useState(60);
  const [paste, setPaste] = useState<Paste>("comum");
  const [fins, setFins] = useState(0.35);
  const [amb, setAmb] = useState(25);
  const [timeScale, setTimeScale] = useState(1);
  const [paused, setPaused] = useState(false);
  const [cpuOn, setCpuOn] = useState(true);
  const [, force] = useState(0);
  const hist = useRef<{ j: number; d: number; t: number }[]>([]);
  const s = useRef({ Tj: 25, Td: 25, f: F_BOOST, P: 0, t: 0 });
  const fanRotor = useRef<SVGGElement | null>(null);
  const fanAngle = useRef(0);

  const { Rp, Rc, h, v, Rjd, R } = resistances(paste, cpuOn ? fan : 0, fins);
  const rpm = cpuOn ? Math.round((fan / 100) * RPM_MAX) : 0;

  useEffect(() => {
    const rotor = fanRotor.current;
    if (!rotor || rpm === 0 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let previous = 0;
    let frame = 0;
    const animate = (timestamp: number) => {
      if (previous > 0) {
        const elapsed = Math.min((timestamp - previous) / 1000, 0.05);
        fanAngle.current = (fanAngle.current + rpm * 6 * timeScale * elapsed) % 360;
        rotor.setAttribute("transform", `rotate(${fanAngle.current} 48 91)`);
      }
      previous = timestamp;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [rpm, timeScale, paused]);

  useEffect(() => {
    const id = setInterval(() => {
      if (paused) return;
      const st = s.current;
      const dt = 0.05 * timeScale;
      for (let i = 0; i < 10; i++) {
        if (cpuOn && st.Tj >= T_MAX) st.f = Math.max(F_MIN, st.f - 0.02);
        else if (cpuOn && st.Tj < T_MAX - 4) st.f = Math.min(F_BOOST, st.f + 0.005);
        else if (!cpuOn) st.f = 0;
        const { P } = cpuOn ? cpuPower(tdp, st.f, st.Tj) : { P: 0 };
        const qjd = (st.Tj - st.Td) / Rjd;
        const qconv = (st.Td - amb) / Rc;
        st.Tj += (dt * (P - qjd)) / C_J;
        st.Td += (dt * (qjd - qconv)) / C_D;
        st.P = P;
        st.t += dt;
      }
      hist.current = [...hist.current.slice(-149), { j: st.Tj, d: st.Td, t: st.t }];
      force((n) => n + 1);
    }, 100);
    return () => clearInterval(id);
  }, [tdp, Rjd, Rc, amb, timeScale, paused, cpuOn]);

  const { Tj, Td, f, P, t } = s.current;
  const throttle = cpuOn && f < F_BASE - 0.05;
  const boosting = cpuOn && f > F_BASE + 0.05;
  const perf = cpuOn ? (f / F_BOOST) * 100 : 0;
  const Tss = cpuOn ? amb + P * R : amb;
  const qOut = (Td - amb) / Rc;
  const qCond = (Tj - Td) / Rjd;
  const qConv = qOut;
  const qRad = radiationHeat(Td, amb, fins);
  const qLeaving = qConv + qRad;
  const radShare = qLeaving > 0.01 ? (qRad / qLeaving) * 100 : 0;
  const convShare = qLeaving > 0.01 ? (qConv / qLeaving) * 100 : 0;
  const effectiveRpm = paused ? 0 : rpm * timeScale;
  const fanBlur = Math.min(effectiveRpm / RPM_MAX, 1) * 0.62;
  const plot = { left: 42, right: 310, top: 18, bottom: 140 };
  const chartY = (temperature: number) => plot.bottom - ((temperature - 20) / 100) * (plot.bottom - plot.top);
  const chartX = (index: number) => plot.left + (index / Math.max(hist.current.length - 1, 1)) * (plot.right - plot.left);
  const line = (key: "j" | "d") => hist.current.map((point, index) => `${chartX(index)},${chartY(point[key])}`).join(" ");
  const firstSample = hist.current[0];
  const lastSample = hist.current[hist.current.length - 1];
  const startTime = firstSample?.t ?? t;
  const endTime = lastSample?.t ?? t;
  const currentX = lastSample ? chartX(hist.current.length - 1) : plot.left;
  const currentYj = lastSample ? chartY(lastSample.j) : chartY(Tj);
  const currentYd = lastSample ? chartY(lastSample.d) : chartY(Td);
  const yTicks = [20, 40, 60, 80, 100, 120];
  const xTickFractions = [0, 0.25, 0.5, 0.75, 1];

  const toggleCpu = () => {
    const next = !cpuOn;
    s.current.f = next ? F_BASE : 0;
    s.current.P = 0;
    setCpuOn(next);
  };
  const reset = () => {
    s.current = { Tj: amb, Td: amb, f: cpuOn ? F_BOOST : 0, P: 0, t: 0 };
    hist.current = [];
    force((n) => n + 1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Corte do sistema · t = {t.toFixed(0)} s</span>
          <span className={`rounded-full px-3 py-1 font-mono text-xs ${throttle ? "animate-pulse bg-destructive text-destructive-foreground" : boosting ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {!cpuOn ? "CPU DESLIGADA" : throttle ? "LIMITAÇÃO TÉRMICA" : boosting ? "TURBO BOOST" : "FREQUÊNCIA BASE"}
          </span>
        </div>
        <svg viewBox="0 0 380 290" className="mt-4 w-full" role="img" aria-label="Corte lateral de um processador com cooler torre e fluxo de calor">
          <defs>
            <linearGradient id="cpu-copper" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f4c27a" />
              <stop offset="0.5" stopColor="#bd7135" />
              <stop offset="1" stopColor="#75401f" />
            </linearGradient>
            <linearGradient id="cpu-metal" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d7e0e2" />
              <stop offset="0.45" stopColor="#77858a" />
              <stop offset="1" stopColor="#3c484d" />
            </linearGradient>
          </defs>

          {rpm > 0 && !paused && Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1={12} x2={366} y1={70 + i * 22} y2={70 + i * 22} stroke="var(--cold)" strokeWidth={1.5} strokeDasharray="6 10" opacity={0.48}>
              <animate attributeName="stroke-dashoffset" from="0" to="-32" dur={`${Math.max(0.15, 2.2 - (fan * timeScale) / 50)}s`} repeatCount="indefinite" />
            </line>
          ))}

          <text x={48} y={27} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">VENTOINHA</text>
          <text x={48} y={37} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">{rpm} RPM</text>
          <circle cx={48} cy={91} r={39} fill="#20282b" stroke="var(--border)" strokeWidth={2} />
          <circle cx={48} cy={91} r={34} fill="#344044" stroke="url(#cpu-metal)" strokeWidth={2} />
          <circle cx={48} cy={91} r={27} fill="#aab7ba" opacity={fanBlur} />
          <g ref={fanRotor} opacity={0.92 * (1 - fanBlur)}>
            {Array.from({ length: 7 }, (_, i) => (
              <path key={i} d="M48 88 C49 79 54 69 62 64 C66 71 62 83 48 91Z" fill="#aab7ba" transform={`rotate(${(i * 360) / 7} 48 91)`} />
            ))}
          </g>
          <circle cx={48} cy={91} r={7} fill="url(#cpu-metal)" stroke="#d7e0e2" strokeWidth={1} />

          <text x={221} y={27} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">TORRE DE ALETAS</text>
          {Array.from({ length: 15 }).map((_, i) => {
            const x = 126 + i * 13;
            const edge = Math.abs(i - 7) / 7;
            return <path key={i} d={`M${x} 43v112`} stroke={tempColor(amb + (Td - amb) * (1 - 0.3 * edge), amb)} strokeWidth={5} opacity={0.9} />;
          })}
          <path d="M117 43v112M318 43v112" stroke="url(#cpu-metal)" strokeWidth={3} />

          <path d="M174 180V99a10 10 0 0 1 20 0v81M213 180V99a10 10 0 0 1 20 0v81" fill="none" stroke="#633b25" strokeWidth={8} strokeLinecap="round" />
          <path d="M174 180V99a10 10 0 0 1 20 0v81M213 180V99a10 10 0 0 1 20 0v81" fill="none" stroke="url(#cpu-copper)" strokeWidth={5} strokeLinecap="round" />
          <rect x={112} y={174} width={212} height={13} rx={2} fill="url(#cpu-metal)" stroke="#c5d0d2" strokeWidth={1} />
          <rect x={112} y={184} width={212} height={5} fill={tempColor(Td, amb)} opacity={0.95} />
          <text x={332} y={181} fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">base</text>

          <rect x={157} y={190} width={122} height={13} rx={2} fill={tempColor(Td + (Tj - Td) * 0.7, amb)} stroke="#d9e0e1" strokeWidth={1} />
          <text x={218} y={199} textAnchor="middle" fontSize={7} fill="var(--background)" fontFamily="monospace" fontWeight="bold">IHS · {Td.toFixed(1)} °C</text>
          <rect x={171} y={204} width={94} height={3} fill={tempColor((Tj + Td) / 2, amb)} />
          <rect x={192} y={208} width={52} height={17} rx={1} fill={tempColor(Tj, amb)} stroke="#f2d5a8" strokeWidth={1} />
          <text x={218} y={219} textAnchor="middle" fontSize={7} fill="var(--background)" fontFamily="monospace" fontWeight="bold">DIE {Tj.toFixed(1)} °C</text>
          <rect x={153} y={226} width={130} height={13} rx={1} fill="#42695d" stroke="#85aa96" strokeWidth={1} />
          {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={160 + i * 10} y={229} width={5} height={3} fill="#d7b878" opacity={0.9} />)}
          <text x={218} y={236} textAnchor="middle" fontSize={6} fill="#f0f3e9" fontFamily="monospace">SUBSTRATO</text>
          {Array.from({ length: 17 }).map((_, i) => <path key={i} d={`M${158 + i * 7.5} 240v8`} stroke="#c5a46c" strokeWidth={1.4} />)}
          <rect x={139} y={249} width={158} height={5} rx={1} fill="#475257" stroke="#889397" strokeWidth={1} />
          <text x={218} y={267} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">DIE → TIM → IHS → BASE → HEATPIPES → ALETAS → AR</text>
          <text x={218} y={281} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">socket / placa-mãe · ar do gabinete: {amb} °C</text>
        </svg>
        <div className="mt-2 rounded-xl bg-muted px-3 pt-3">
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 pb-1 font-mono text-[10px]" aria-label="Legenda das temperaturas no gráfico">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="w-4 border-t-2 border-primary" aria-hidden="true" />
              Die {Tj.toFixed(1)} °C
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="w-4 border-t-2 border-cold" aria-hidden="true" />
              Dissipador {Td.toFixed(1)} °C
            </span>
          </div>
          <svg viewBox="0 0 320 190" className="w-full" role="img" aria-label="Gráfico da temperatura do die e do dissipador ao longo do tempo">
            {yTicks.map((temperature) => {
              const yPosition = chartY(temperature);
              return (
                <g key={temperature}>
                  <line x1={plot.left} x2={plot.right} y1={yPosition} y2={yPosition} stroke="var(--border)" strokeWidth={0.7} />
                  <text x={plot.left - 6} y={yPosition + 3} textAnchor="end" fontSize={8} fill="var(--muted-foreground)" fontFamily="monospace">{temperature}</text>
                </g>
              );
            })}
            {xTickFractions.map((fraction) => {
              const xPosition = plot.left + fraction * (plot.right - plot.left);
              const tickTime = startTime + fraction * (endTime - startTime);
              return (
                <g key={fraction}>
                  <line x1={xPosition} x2={xPosition} y1={plot.top} y2={plot.bottom} stroke="var(--border)" strokeWidth={0.7} />
                  <text x={xPosition} y={plot.bottom + 14} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)" fontFamily="monospace">{tickTime.toFixed(0)} s</text>
                </g>
              );
            })}
            <line x1={plot.left} x2={plot.right} y1={chartY(T_MAX)} y2={chartY(T_MAX)} stroke="var(--hot)" strokeDasharray="4 4" />
            <text x={plot.left + 4} y={chartY(T_MAX) - 4} fontSize={7} fill="var(--hot)" fontFamily="monospace">Limite térmico · 95 °C</text>
            <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} stroke="var(--muted-foreground)" strokeWidth={1} />
            <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke="var(--muted-foreground)" strokeWidth={1} />
            <polyline points={line("d")} fill="none" stroke="var(--cold)" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={line("j")} fill="none" stroke="var(--primary)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={currentX} cy={currentYd} r={2.5} fill="var(--cold)" />
            <circle cx={currentX} cy={currentYj} r={3} fill="var(--primary)" />
            <text x={(plot.left + plot.right) / 2} y={184} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)" fontFamily="monospace">Tempo simulado (s)</text>
            <text x={10} y={(plot.top + plot.bottom) / 2} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)" fontFamily="monospace" transform={`rotate(-90 10 ${(plot.top + plot.bottom) / 2})`}>Temperatura (°C)</text>
          </svg>
        </div>
        <div className="mt-3 rounded-xl border border-border p-4" aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Para onde vai o calor agora?</p>
          <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Condução (pasta)</p>
              <p className="text-foreground">{qCond.toFixed(1)} W</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Convecção (ar)</p>
              <p className="text-foreground">{qConv.toFixed(1)} W</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Radiação (ε={EPS_FIN})</p>
              <p className="text-foreground">{qRad.toFixed(1)} W</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Divisão do calor que sai do dissipador: convecção ${convShare.toFixed(0)} por cento, radiação ${radShare.toFixed(0)} por cento`}>
            <div className="flex h-full w-full">
              <div className="h-full bg-cold transition-all" style={{ width: `${convShare}%` }} />
              <div className="h-full bg-accent transition-all" style={{ width: `${radShare}%` }} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span>Convecção {convShare.toFixed(0)}%</span>
            <span>Radiação {radShare.toFixed(1)}%</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Com aletas escuras (ε = {EPS_FIN}) e A = {fins.toFixed(2)} m², a radiação responde por cerca de {radShare.toFixed(0)}% da saída, um limite superior, pois na prática as aletas enxergam umas às outras (fator de forma). Num satélite, sem ar (h ≈ 0), ela seria 100% da saída.
          </p>
        </div>
      </div>

      <div className="space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-sm font-medium">Alimentação da CPU</p>
            <p className="text-xs text-muted-foreground">{cpuOn ? "Processador e ventoinha ativos" : "Resfriando sem gerar calor"}</p>
          </div>
          <button type="button" onClick={toggleCpu} aria-pressed={cpuOn} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${cpuOn ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
            <Power size={16} aria-hidden="true" />
            {cpuOn ? "Desligar CPU" : "Ligar CPU"}
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Velocidade do tempo</span>
            <span className="font-mono text-xs text-muted-foreground">{paused ? "Pausado" : `${timeScale.toLocaleString("pt-BR")}×`}</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Velocidade e pausa da simulação">
            {[0.5, 1, 2].map((speed) => (
              <button key={speed} type="button" onClick={() => setTimeScale(speed)} aria-pressed={timeScale === speed} className={`rounded-lg border px-3 py-2 font-mono text-xs transition ${timeScale === speed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                {speed.toLocaleString("pt-BR")}×
              </button>
            ))}
            <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition hover:border-primary">
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
              {paused ? "Retomar" : "Pausar"}
            </button>
          </div>
        </div>
        <Slider label="Carga da CPU (TDP)" value={tdp} min={15} max={250} unit="W" onChange={setTdp} />
        <Slider label={cpuOn ? `Ventoinha (ar a ${v.toFixed(1)} m/s)` : "Ventoinha (CPU desligada)"} value={fan} min={0} max={100} unit="%" onChange={setFan} />
        <Slider label="Área das aletas" value={fins} min={0.05} max={0.8} step={0.05} unit="m²" onChange={setFins} />
        <Slider label="Temperatura do ambiente" value={amb} min={10} max={45} unit="°C" onChange={setAmb} />
        <div>
          <p className="text-sm text-muted-foreground">Interface térmica</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(PASTES) as Paste[]).map((p) => (
              <button key={p} onClick={() => setPaste(p)}
                className={`rounded-xl border px-2 py-2 text-xs transition ${paste === p ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                {PASTES[p].n} <span className="opacity-70">k={PASTES[p].k}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Frequência {f.toFixed(2)} GHz</span><span className={throttle ? "text-destructive" : "text-foreground"}>desempenho {perf.toFixed(0)}%</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-thermal transition-all" style={{ width: `${perf}%` }} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 font-mono text-sm">
          <Stat k="Potência dissipada" v={`${P.toFixed(0)} W`} />
          <Stat k="Calor para o ar" v={`${qOut.toFixed(0)} W`} />
          <Stat k="R pasta (condução)" v={`${Rp.toFixed(3)} K/W`} />
          <Stat k="R aletas (convecção)" v={`${Rc.toFixed(3)} K/W`} />
          <Stat k="h do ar" v={`${h.toFixed(0)} W/m²K`} />
          <Stat k="Equilíbrio previsto" v={`${Tss.toFixed(0)} °C`} hot={Tss > T_MAX} />
        </div>
        <EquilibriumQuiz amb={amb} power={P} rTot={R} cpuOn={cpuOn} />
        <button onClick={reset} className="w-full rounded-xl border border-border py-2 text-sm hover:border-primary">Reiniciar simulação</button>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-mono text-primary">{value} {unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-2 w-full accent-primary" />
    </label>
  );
}

function Stat({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={hot ? "text-destructive" : "text-foreground"}>{v}</p>
    </div>
  );
}

export function EquilibriumQuiz({ amb, power, rTot, cpuOn }: { amb: number; power: number; rTot: number; cpuOn: boolean }) {
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; guessNum: number; a: number; p: number; r: number; expected: number }>(null);

  useEffect(() => {
    setResult(null);
    setGuess("");
  }, [cpuOn]);

  if (!cpuOn) {
    return (
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Mini-verificação: preveja o equilíbrio</p>
        <p className="mt-1 text-xs text-muted-foreground">Ligue a CPU para prever a temperatura de equilíbrio.</p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = Number(guess.replace(",", "."));
    const expected = amb + power * rTot;
    setResult({ ok: checkEquilibriumGuess(g, amb, power, rTot), guessNum: g, a: amb, p: power, r: rTot, expected });
  };

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-medium">Mini-verificação: preveja o equilíbrio</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Com P = {power.toFixed(0)} W, R<sub>tot</sub> = {rTot.toFixed(3)} K/W e T<sub>∞</sub> = {amb} °C,
        qual será a temperatura de equilíbrio do chip?
      </p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="eq-guess">Palpite da temperatura de equilíbrio em °C</label>
        <input
          id="eq-guess"
          type="number"
          inputMode="decimal"
          step="any"
          value={guess}
          onChange={(e) => { setGuess(e.target.value); setResult(null); }}
          placeholder="Ex.: 69"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button type="submit" className="shrink-0 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
          Conferir
        </button>
      </form>
      {result !== null && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed ${result.ok ? "bg-primary/10 text-foreground" : "bg-destructive/10 text-foreground"}`} aria-live="polite">
          {result.ok ? (
            <span><strong>Acertou</strong> (tolerância ±3 °C). </span>
          ) : (
            <span><strong>Não foi dessa vez.</strong> Reveja a conta: </span>
          )}
          <Formula tex={String.raw`T_j = T_\infty + P\,R_{tot}`} /> = {result.a} + {result.p.toFixed(0)} × {result.r.toFixed(3)} ≈ <strong>{result.expected.toFixed(0)} °C</strong>.
          {!result.ok && result.guessNum < result.expected && " Seu palpite ficou abaixo do esperado."}
          {!result.ok && result.guessNum > result.expected && " Seu palpite ficou acima do esperado."}
        </div>
      )}
    </div>
  );
}
