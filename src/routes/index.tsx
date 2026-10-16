import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/hero-cpu.jpg";
import { ThermalLab } from "@/components/ThermalLab";
import { Formula } from "@/components/Formula";
import { ArrowRight, Laptop, Satellite, Server, Smartphone, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const mech = [
  { n: "01", t: "Condução", f: String.raw`\dot{Q} = -k\,A\,\dfrac{dT}{dx} \approx k\,A\,\dfrac{\Delta T}{L}`, d: "O calor atravessa sólidos: do silício para a pasta térmica e para a base de cobre. Quanto maior a condutividade k e menor a espessura L, melhor." },
  { n: "02", t: "Convecção", f: String.raw`\dot{Q} = h\,A\,(T_s - T_\infty)`, d: "O ar que passa entre as aletas leva o calor embora. A ventoinha aumenta o coeficiente h; mais aletas aumentam a área A." },
  { n: "03", t: "Radiação", f: String.raw`\dot{Q} = \varepsilon\,\sigma\,A\,(T_s^4 - T_{viz}^4)`, d: "Todo corpo quente emite ondas infravermelhas. Num PC é pequena, mas em satélites é o único jeito de resfriar a eletrônica." },
];

function Index() {
  return (
    <main id="top">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute -top-48 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute right-[-180px] bottom-[-140px] h-[420px] w-[420px] rounded-full bg-cold/10 blur-[130px]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-24 pb-20 min-h-[100dvh] content-center lg:grid-cols-[1fr_1fr] lg:items-center lg:pt-28">
          <div className="max-w-xl">
            <div className="hero-enter inline-flex items-center gap-3 rounded-full border border-border bg-card/70 px-4 py-1.5" style={{ animationDelay: "0ms" }}>
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Fenômenos de Transporte · UNIJORGE</span>
            </div>

            <h1 className="hero-enter mt-6 text-balance text-5xl leading-[1.02] font-bold tracking-[-0.03em] md:text-6xl" style={{ animationDelay: "80ms" }}>
              Por que seu processador{" "}
              <span className="text-thermal">não derrete?</span>
            </h1>

            <p className="hero-enter mt-5 max-w-[44ch] text-base leading-relaxed text-muted-foreground md:text-lg" style={{ animationDelay: "160ms" }}>
              Uma CPU dissipa <strong className="font-semibold text-foreground">250&nbsp;W</strong> num chip menor que uma moeda. Veja como o calor sai antes dos 95&nbsp;°C.
            </p>

            <div className="hero-enter mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <a
                href="#lab"
                className="group inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Entrar no laboratório
                <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#fisica"
                className="inline-flex min-h-[48px] items-center rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent/90 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Ver a física
              </a>
            </div>
          </div>

          <figure className="hero-enter mx-auto w-full max-w-[560px]" style={{ animationDelay: "200ms" }}>
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={hero}
                alt="Processador com dissipador em imagem térmica"
                width={1600}
                height={912}
                className="aspect-[16/11] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>Imagem térmica · CPU sob carga</span>
              <span className="tabular-nums">Die → Ar</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="equipe" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-12">
        <h2 className="max-w-2xl text-4xl font-bold md:text-5xl">Quem fez este trabalho</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Equipe responsável pelo laboratório térmico da CPU.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { nome: "Caio Rios", foto: "/team/caio.png" },
            { nome: "Carlos Bezerra", foto: "/team/carlos.jpg" },
            { nome: "David Souza", foto: "/team/david.jpg" },
            { nome: "Davi Hiel", foto: "/team/hiel.png" },
            { nome: "Marcos Antônio", foto: "/team/marcos.jpg" },
          ].map((m) => (
            <article key={m.nome} className="rounded-3xl border border-border bg-card p-4 transition-colors duration-300 hover:border-primary/30">
              <img
                src={m.foto}
                alt={`Foto de ${m.nome}`}
                width={400}
                height={400}
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover"
              />
              <h3 className="mt-4 px-1 pb-1 text-lg font-bold">{m.nome}</h3>
            </article>
          ))}
        </div>
      </section>

      <section id="mecanismos" className="mx-auto max-w-6xl scroll-mt-8 px-6 pt-12 pb-24">
        <h2 className="text-4xl font-bold md:text-5xl">O caminho do calor</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Cada watt gerado nos transistores percorre três mecanismos até chegar ao ambiente.</p>
        <div className="mt-6 h-1 w-full rounded-full bg-thermal" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {mech.map((m) => (
            <article key={m.n} className="rounded-3xl border border-border bg-card p-7">
              <span className="font-mono text-sm text-primary">{m.n}</span>
              <h3 className="mt-2 text-2xl font-bold">{m.t}</h3>
              <div className="mt-4 overflow-x-auto rounded-xl bg-muted px-3 py-1 text-lg"><Formula tex={m.f} block /></div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="lab" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Programa interativo</p>
        <h2 className="mt-2 text-4xl font-bold md:text-5xl">Laboratório térmico da CPU</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Aumente a carga, desligue a ventoinha ou tire a pasta térmica e veja a temperatura subir em tempo real. Ao passar de 95 °C, o processador reduz o próprio desempenho para se proteger.
        </p>
        <div className="mt-10"><ThermalLab /></div>
      </section>

      <section id="fisica" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24">
        <h2 className="text-4xl font-bold md:text-5xl">A física por trás do programa</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-7">
            <h3 className="text-xl font-bold">Resistência térmica em série</h3>
            <div className="mt-3 overflow-x-auto rounded-xl bg-muted px-3 py-1 text-lg"><Formula block tex={String.raw`R_{tot} = \underbrace{\frac{L}{k\,A}}_{\text{pasta}} + R_{Cu} + \underbrace{\frac{1}{h\,A_{al}}}_{\text{aletas}}`} /></div>
            <p className="mt-3 text-sm text-muted-foreground">Como resistores em série: o calor é a corrente e ΔT é a tensão. Somam-se pasta (condução), base de cobre e aletas (convecção). A pior camada domina. Sem pasta ou sem vento, o chip chega aos 95 °C. Troque a pasta ou a ventoinha no laboratório e veja esse termo dominar o total, pois no equilíbrio vale <Formula tex={String.raw`T_j = T_\infty + P\,R_{tot}`} />.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7">
            <h3 className="text-xl font-bold">Primeira Lei no chip</h3>
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-muted px-3 py-2 text-lg">
              <div className="overflow-x-auto"><Formula block tex={String.raw`C_j\frac{dT_j}{dt} = P(f,T_j) - \frac{T_j - T_d}{R_{jd}}`} /></div>
              <div className="overflow-x-auto"><Formula block tex={String.raw`C_d\frac{dT_d}{dt} = \frac{T_j - T_d}{R_{jd}} - \frac{T_d - T_\infty}{R_{conv}}`} /></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Dois nós térmicos: o chip (pequena capacidade, esquenta rápido) e o dissipador (grande capacidade, esquenta devagar). A potência cresce com a frequência e com a temperatura (corrente de fuga). Equilíbrio: <Formula tex={String.raw`T_j = T_\infty + P\,R_{tot}`} />.</p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-border bg-card p-7">
          <h3 className="text-xl font-bold">Valores de referência usados no laboratório</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            De onde vêm os números dos sliders: faixas típicas da literatura (Incropera &amp; DeWitt, Çengel).
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
            <span aria-hidden="true" className="text-primary">As linhas marcadas com ● são as adotadas na simulação.</span>
          </p>
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-primary">Condutividade k (W/m·K)</h4>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Cobre (base)</td><td className="py-1.5 text-right font-mono">~400</td></tr>
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Alumínio (aletas)</td><td className="py-1.5 text-right font-mono">~200</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Metal líquido</td><td className="py-1.5 text-right font-mono">70</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Pasta comum</td><td className="py-1.5 text-right font-mono">4</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Sem pasta (ar)</td><td className="py-1.5 text-right font-mono">0,5*</td></tr>
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Ar parado (real)</td><td className="py-1.5 text-right font-mono">0,026</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">*Valor efetivo com micro-folgas; o ar puro seria 0,026.</p>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-primary">Coeficiente h (W/m²·K)</h4>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Convecção natural</td><td className="py-1.5 text-right font-mono">5–25</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Lab, fan 0% (v = 0)</td><td className="py-1.5 text-right font-mono">6</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Lab, fan 60% (v ≈ 1,8 m/s)</td><td className="py-1.5 text-right font-mono">≈25</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Lab, fan 100% (v = 3 m/s)</td><td className="py-1.5 text-right font-mono">≈35</td></tr>
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Forçada típica (ar)</td><td className="py-1.5 text-right font-mono">25–250</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">Modelo do lab: h = 6 + 12·v<sup>0,8</sup>, correlação simplificada de placa forçada.</p>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-primary">Emissividade ε (–)</h4>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Alumínio polido</td><td className="py-1.5 text-right font-mono">0,05</td></tr>
                  <tr className="text-foreground"><td className="py-1.5 pr-2">● Aletas (anodizado)</td><td className="py-1.5 text-right font-mono">0,85</td></tr>
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">Tinta preta</td><td className="py-1.5 text-right font-mono">0,95</td></tr>
                  <tr><td className="py-1.5 pr-2 text-muted-foreground">σ Stefan-Boltzmann</td><td className="py-1.5 text-right font-mono">5,67×10⁻⁸</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">Com ε = 0,85 o lab calcula ~15–20% da saída via radiação (limite superior, pois o fator de forma entre aletas reduz o valor real). Confira no comparador do laboratório.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="aplicacoes" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24">
        <h2 className="max-w-2xl text-4xl font-bold md:text-5xl">Onde esse calor aparece na vida real</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Os mesmos três mecanismos do laboratório, em cinco cenários diferentes. Cada cartão indica o que reproduzir nos sliders.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {[
            {
              Icon: Laptop,
              t: "Notebooks",
              d: "Chassi fino, pouca área de aletas e uma ventoinha pequena. A pasta térmica e os heatpipes fazem a condução; o ar faz o resto. É o cenário mais parecido com o padrão do laboratório.",
              tag: "Convecção forçada · área pequena",
              hint: "No lab: reduza a área das aletas.",
              span: "lg:col-span-3",
            },
            {
              Icon: Zap,
              t: "Placas de vídeo",
              d: "Centenas de watts concentrados numa placa só, com duas ou três ventoinhas e câmara de vapor. Mostra o que acontece quando a potência sobe e a convecção precisa acompanhar.",
              tag: "TDP alto · h alto",
              hint: "No lab: suba o TDP com fan em 100%.",
              span: "lg:col-span-3",
            },
            {
              Icon: Server,
              t: "Servidores de data center",
              d: "Operação contínua com ar ambiente quente, perto dos 35 °C. O equilíbrio Tj = Tamb + P·Rtot piora porque o ponto de partida já é alto.",
              tag: "Ambiente quente · 24/7",
              hint: "No lab: eleve o ambiente para 35–45 °C.",
              span: "lg:col-span-2",
            },
            {
              Icon: Smartphone,
              t: "Celulares",
              d: "Sem ventoinha: o calor sai por condução até a carcaça e convecção natural. O coeficiente h é baixo, então o throttling chega rápido para proteger o chip.",
              tag: "h 5–25 · sem partes móveis",
              hint: "No lab: zere a ventoinha.",
              span: "lg:col-span-2",
            },
            {
              Icon: Satellite,
              t: "Satélites",
              d: "No vácuo não há ar, então h ≈ 0 e a radiação carrega 100% da saída. Por isso usam radiadores grandes e escuros, com emissividade alta.",
              tag: "ε 0,85 · só radiação",
              hint: "No lab: compare os termos no comparador.",
              span: "lg:col-span-2",
            },
          ].map((a) => (
            <article key={a.t} className={`rounded-3xl border border-border bg-card p-7 ${a.span}`}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <a.Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold">{a.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.d}</p>
              <p className="mt-4 font-mono text-xs text-primary">{a.tag}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.hint}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#lab"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Testar esses cenários no laboratório
            <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </main>
  );
}
