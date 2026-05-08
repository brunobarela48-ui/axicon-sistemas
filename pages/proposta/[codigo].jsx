import Head from 'next/head'

const VAREJO = { primary:"#001489", secondary:"#2B367B", accent:"#CCA67F", light:"#EEF0F8", dark:"#000D52" }
const ASSESS = { primary:"#713F2A", secondary:"#7C4D33", accent:"#DAB58F", light:"#F7F3EE", dark:"#4A2918" }

const LOGO_FULL = "https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png"

const FT = "'Georgia','Times New Roman',serif"
const FB = "'Inter','Helvetica Neue',sans-serif"

const fmtI = v => v ? `R$ ${Number(v).toLocaleString("pt-BR")}` : "—"
const fmtR = v => v ? `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—"
const FINS_MAP = {capital_giro:"Capital de Giro",antecipacao:"Antecipação de Recebíveis",expansao:"Expansão / Investimento",refinanciamento:"Refinanciamento de Dívidas",investimento:"Investimento / Ativo Fixo",custeio:"Custeio (Agro)",construcao:"Construção / Incorporação"}
const URGS = [{v:"imediata",l:"Imediata (48h)"},{v:"curto",l:"Curto prazo (15d)"},{v:"medio",l:"Médio prazo (15–60d)"},{v:"longo",l:"Longo prazo (60d+)"}]

const CARD = "#141414"
const CARD_BORDER = "rgba(255,255,255,0.08)"
const T1 = "rgba(255,255,255,0.92)"
const T2 = "rgba(255,255,255,0.65)"
const T3 = "rgba(255,255,255,0.40)"
const SIMBOX = "rgba(255,255,255,0.07)"

function SimBox({label, val, color}) {
  return (
    <div style={{background:SIMBOX,borderRadius:8,padding:"10px 12px"}}>
      <div style={{fontSize:10,color:T3,letterSpacing:.5,marginBottom:4}}>{label}</div>
      <div style={{fontSize:15,fontWeight:800,color}}>{val}</div>
    </div>
  )
}

function PSec({title, pal}) {
  const p = pal || ASSESS
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:10,color:p.accent,letterSpacing:2,marginBottom:6}}>{title.toUpperCase()}</div>
      <div style={{height:2,background:`linear-gradient(90deg,${p.primary},${p.accent},transparent)`,width:120}}/>
    </div>
  )
}

export default function PropostaPage({ dados, erro }) {
  if (erro || !dados) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0a",fontFamily:FB}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔍</div>
        <div style={{fontSize:20,fontWeight:700,color:T1,marginBottom:8}}>Proposta não encontrada</div>
        <div style={{fontSize:14,color:T3}}>Verifique o código e tente novamente.</div>
      </div>
    </div>
  )

  const { nome, fat, credito, imovel, fins, urg, ranked, heResults, hubcSim,
          destinos, estResult, garantias, propCode, propDate, tipoArea, tipoPessoa,
          isManual, manParceiros, manTotal, racional } = dados

  const isVarejo = tipoArea === "varejo"
  const PAL = isVarejo ? VAREJO : ASSESS

  const top3 = (ranked||[]).filter(p => p.score >= 45).slice(0,3)
  const rk   = ["linear-gradient(135deg,#f59e0b,#d97706)","linear-gradient(135deg,#94a3b8,#64748b)","linear-gradient(135deg,#cd7f32,#a0522d)"]
  const finsLabel = (Array.isArray(fins)?fins:[]).map(f => FINS_MAP[f]||f).join(", ")
  const totalGarantias = (garantias||[]).filter(g=>g.nome).reduce((s,g)=>s+(Number(g.valor)||0),0)

  const heroGrad = isVarejo
    ? `linear-gradient(150deg,${VAREJO.dark} 0%,${VAREJO.primary}ee 55%,${VAREJO.secondary} 100%)`
    : `linear-gradient(150deg,#0d0d0d 0%,${ASSESS.primary}ee 55%,${ASSESS.secondary} 100%)`

  return (
    <>
      <Head>
        <title>Proposta {propCode} · {nome} · Áxicon</title>
        <meta name="description" content={`Proposta de crédito estruturado para ${nome} — Áxicon Soluções Financeiras`}/>
        <meta property="og:title" content={`Proposta ${propCode} · Áxicon`}/>
        <meta property="og:description" content={`Crédito estruturado de ${fmtI(credito)} para ${nome}`}/>
        <link rel="icon" href="/favicon.ico"/>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#0a0a0a;font-family:${FB};color:${T1}}
          @media print{.no-print{display:none!important}body{background:#fff;color:#1a1a1a}}
          @page{margin:12mm}
        `}</style>
      </Head>

      {/* Barra */}
      <div className="no-print" style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,10,10,.97)",backdropFilter:"blur(10px)",borderBottom:`1px solid ${PAL.accent}30`,padding:"10px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:PAL.accent,fontWeight:700,fontSize:13}}>Proposta {propCode}{isVarejo?" · Varejo":""}{isManual?" · Personalizada":""} · Áxicon Soluções Financeiras</span>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#555"}}>Para PDF: Ctrl+P → Salvar como PDF</span>
          <button onClick={()=>window.print()} style={{padding:"8px 18px",background:PAL.accent,color:"#1a1a1a",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>🖨 Imprimir / PDF</button>
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"0 20px 80px"}}>

        {/* HERO */}
        <div style={{background:heroGrad,borderRadius:"0 0 28px 28px",padding:"64px 52px 52px",marginBottom:28}}>
          <img src={LOGO_FULL} alt="Áxicon" style={{height:44,width:"auto",objectFit:"contain",display:"block",filter:"brightness(0) invert(1)",marginBottom:32,opacity:.9}}/>
          <div style={{fontSize:10,color:PAL.accent,letterSpacing:4,marginBottom:14}}>PROPOSTA COMERCIAL CONFIDENCIAL{isManual?" · PERSONALIZADA":""}{isVarejo?" · VAREJO":""}</div>
          <h1 style={{fontSize:"clamp(26px,4vw,46px)",fontWeight:700,color:"white",fontFamily:FT,margin:"0 0 12px",lineHeight:1.2}}>
            {isVarejo ? "Home Equity · Consultoria" : "Estruturação de Crédito"}
          </h1>
          <p style={{fontSize:16,color:PAL.accent,fontFamily:FT,fontWeight:300,margin:"0 0 36px"}}>Estratégia Financeira Personalizada</p>
          <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
            {[["CLIENTE",nome||"—"],["CRÉDITO",fmtI(credito)],["DATA",propDate],["REF.",propCode]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"12px 20px",border:`1px solid ${PAL.accent}20`}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:2,marginBottom:4}}>{l}</div>
                <div style={{fontSize:15,color:"white",fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MENSAGEM */}
        <div style={{background:CARD,borderRadius:20,padding:"40px 44px",marginBottom:20,position:"relative",overflow:"hidden",border:`1px solid ${CARD_BORDER}`}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${PAL.primary},${PAL.accent},${PAL.secondary})`}}/>
          <PSec title="Mensagem" pal={PAL}/>
          <p style={{fontSize:15,color:T1,lineHeight:1.9,marginBottom:14}}>Prezado(a) <strong>{nome||"cliente"}</strong>,</p>
          <p style={{fontSize:14,color:T2,lineHeight:1.95,marginBottom:12}}>
            É com satisfação que apresentamos esta{" "}
            <strong style={{color:T1}}>Proposta {isVarejo ? "de Home Equity" : "de Estruturação de Crédito"}</strong>,
            {" "}desenvolvida com base no diagnóstico preciso das suas necessidades financeiras.
          </p>
          <p style={{fontSize:14,color:T2,lineHeight:1.95}}>A estratégia apresentada foi modelada para atender <strong style={{color:T1}}>a totalidade das suas demandas</strong>, otimizando custos, prazos e garantias disponíveis.</p>
        </div>

        {/* RACIONAL */}
        {racional&&(
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Racional da Operação" pal={PAL}/>
            <p style={{fontSize:14,color:T2,lineHeight:1.9,whiteSpace:"pre-wrap"}}>{racional}</p>
          </div>
        )}

        {/* SOBRE A ÁXICON */}
        <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
          <PSec title="Sobre a Áxicon" pal={PAL}/>
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
            <img src={LOGO_FULL} alt="Áxicon" style={{height:44,width:"auto",objectFit:"contain",display:"block",filter:"brightness(0) invert(1)",opacity:.85}}/>
          </div>
          <p style={{fontSize:14,color:T2,lineHeight:1.9,marginBottom:24}}>
            A Áxicon nasceu para redefinir a experiência de alavancagem patrimonial e expansão de negócios.
            Mais do que especialistas em soluções financeiras, atuamos na engenharia de operações robustas —
            conectando o seu projeto ao capital inteligente e ao planejamento de alta performance,
            rompendo as barreiras do eixo financeiro tradicional.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:20}}>
            {[
              {t:"DNA ESTRATÉGICO",d:"Nascemos da expertise em gestão de capital, aplicando a inteligência de mercado para maximização de eficiência e performance financeira."},
              {t:"SOLIDEZ E SEGURANÇA",d:"Operamos com total transparência e rigor, garantindo que cada etapa do seu plano seja clara, segura e focada na realização do seu projeto."},
              {t:"ATENDIMENTO CONSULTIVO",d:"Vamos além da oferta de produtos: entregamos inteligência financeira. Estruturamos o crédito ideal para alavancar seu patrimônio com máxima eficiência."},
              {t:"FOCO EM PATRIMÔNIO",d:"Nossa missão é transformar o crédito em uma ferramenta de alavancagem, ajudando você a construir e proteger seus bens de forma inteligente."},
            ].map(v=>(
              <div key={v.t} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:16,border:`1px solid ${PAL.primary}30`}}>
                <div style={{fontSize:10,color:PAL.accent,letterSpacing:2,fontWeight:700,marginBottom:6}}>{v.t}</div>
                <div style={{fontSize:12,color:T2,lineHeight:1.6}}>{v.d}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:24,fontSize:12,color:T3,flexWrap:"wrap"}}>
            <span>📱 (44) 9 9114-7236</span>
            <span>🌐 www.axiconsolucoes.com</span>
            <span>📸 @axicon.solucoes</span>
          </div>
        </div>

        {/* PERFIL FINANCEIRO */}
        <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
          <PSec title="Perfil Financeiro" pal={PAL}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {l:"Empresa / Cliente",v:nome},
              {l:"Tipo de Pessoa",v:tipoPessoa==="pf"?"Pessoa Física":tipoPessoa==="pj"?"Pessoa Jurídica":"—"},
              {l:"Faturamento Anual",v:fmtI(fat)},
              {l:"Crédito Desejado",v:fmtI(credito)},
              {l:"Garantia",v:{proprio:"Imóvel próprio quitado",financiado:"Imóvel financiado",terceiro:"Imóvel de terceiros",nao:"Sem imóvel"}[imovel]},
              {l:"Finalidade",v:finsLabel||"—"},
              {l:"Urgência",v:URGS.find(u=>u.v===urg)?.l},
            ].map(it=>(
              <div key={it.l} style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"12px 16px",border:`1px solid ${PAL.accent}20`}}>
                <div style={{fontSize:10,color:T3,letterSpacing:.5,marginBottom:3}}>{it.l}</div>
                <div style={{fontSize:13,fontWeight:700,color:T1}}>{it.v||"—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GARANTIAS */}
        {(garantias||[]).filter(g=>g.nome).length>0&&(
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Garantias Oferecidas" pal={PAL}/>
            {garantias.filter(g=>g.nome).map((g,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
                <div style={{width:28,height:28,borderRadius:8,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T1}}>{g.nome}</div>
                  <div style={{fontSize:11,color:T3}}>{g.tipo?g.tipo:""}{ g.cidade?` · ${g.cidade}`:""}</div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:PAL.accent,fontFamily:FT}}>{fmtI(Number(g.valor)||0)}</div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",marginTop:4}}>
              <span style={{fontSize:13,fontWeight:700,color:T2}}>Total de Garantias</span>
              <span style={{fontSize:17,fontWeight:900,color:"#4caf50",fontFamily:FT}}>{fmtI(totalGarantias)}</span>
            </div>
            {totalGarantias>0&&<div style={{marginTop:8,fontSize:12,color:T3,background:"rgba(255,255,255,0.04)",padding:"8px 14px",borderRadius:8}}>
              LTV solicitado: <strong style={{color:PAL.accent}}>{((credito/totalGarantias)*100).toFixed(1)}%</strong> sobre o total de garantias
            </div>}
          </div>
        )}

        {/* PROPOSTA MANUAL — ESTRUTURA POR PARCEIRO */}
        {isManual&&(manParceiros||[]).filter(p=>p.nome).length>0&&(
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Estrutura da Proposta" pal={PAL}/>
            <div style={{background:`${PAL.primary}12`,borderRadius:12,padding:"14px 18px",marginBottom:18,border:`1px solid ${PAL.primary}30`}}>
              <div style={{fontSize:11,color:PAL.accent,fontWeight:700,marginBottom:4}}>CRÉDITO TOTAL ESTRUTURADO</div>
              <div style={{fontSize:22,fontWeight:900,color:PAL.accent,fontFamily:FT}}>{fmtI(manTotal)}</div>
            </div>
            {(manParceiros||[]).filter(p=>p.nome).map((parc,pi)=>{
              const hasOld=!parc.produtos
              if(hasOld){
                const val=parc.val||Number(String(parc.valor||"0").replace(/\D/g,""))
                const pct=manTotal>0?((val/manTotal)*100).toFixed(0):0
                return(
                  <div key={pi} style={{border:`1px solid ${PAL.primary}30`,borderRadius:14,padding:20,marginBottom:14,borderLeft:`4px solid ${PAL.accent}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:24,height:24,borderRadius:6,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800}}>{pi+1}</div>
                        <div style={{fontSize:15,fontWeight:800,fontFamily:FT,color:T1}}>{parc.nome}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:900,color:PAL.accent,fontFamily:FT}}>{fmtI(val)}</div>
                        <div style={{fontSize:11,color:T3}}>{pct}% do total</div>
                      </div>
                    </div>
                    <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:10,marginBottom:12}}>
                      <div style={{height:4,borderRadius:10,width:`${pct}%`,background:`linear-gradient(90deg,${PAL.primary},${PAL.accent})`}}/>
                    </div>
                    {(parc.price||parc.sac1)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(parc.sistema==="sac"||parc.sistema==="ambos")&&<SimBox label={`SAC ${parc.prazo}m — 1ª`} val={fmtR(parc.sac1)} color={PAL.accent}/>}
                      {(parc.sistema==="sac"||parc.sistema==="ambos")&&<SimBox label={`SAC ${parc.prazo}m — ÚLTIMA`} val={fmtR(parc.sacl)} color={T3}/>}
                      {(parc.sistema==="price"||parc.sistema==="ambos"||!parc.sistema)&&<SimBox label={`PRICE ${parc.prazo}m`} val={fmtR(parc.price)} color={PAL.accent}/>}
                    </div>}
                  </div>
                )
              }
              const parcTotal=parc.produtos.reduce((s,pr)=>s+(pr.val||0),0)
              const pct=manTotal>0?((parcTotal/manTotal)*100).toFixed(0):0
              return(
                <div key={pi} style={{border:`1px solid ${PAL.primary}30`,borderRadius:14,padding:20,marginBottom:16,borderLeft:`4px solid ${PAL.accent}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>{pi+1}</div>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,fontFamily:FT,color:T1}}>{parc.nome}</div>
                        <div style={{fontSize:11,color:T3}}>{parc.produtos.length} produto{parc.produtos.length!==1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:18,fontWeight:900,color:PAL.accent,fontFamily:FT}}>{fmtI(parcTotal)}</div>
                      <div style={{fontSize:11,color:T3}}>{pct}% do total</div>
                    </div>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:10,marginBottom:14}}>
                    <div style={{height:3,borderRadius:10,width:`${pct}%`,background:`linear-gradient(90deg,${PAL.primary},${PAL.accent})`}}/>
                  </div>
                  {parc.produtos.map((pr,ki)=>(
                    <div key={ki} style={{background:SIMBOX,borderRadius:10,padding:14,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T1}}>{pr.tipo||`Produto ${ki+1}`}</div>
                          <div style={{fontSize:11,color:PAL.accent,fontWeight:600}}>{pr.taxa}% a.a. · {pr.prazo}m{pr.obs?` · ${pr.obs}`:""}{pr.priceEhCustom?" · parcela personalizada":""}</div>
                        </div>
                        <div style={{fontSize:15,fontWeight:800,color:PAL.accent,fontFamily:FT}}>{fmtI(pr.val)}</div>
                      </div>
                      {(pr.price||pr.sac1)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
                        {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC ${pr.prazo}m — 1ª`} val={fmtR(pr.sac1)} color={PAL.accent}/>}
                        {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC ${pr.prazo}m — ÚLTIMA`} val={fmtR(pr.sacl)} color={T3}/>}
                        {(pr.sistema==="price"||pr.sistema==="ambos"||!pr.sistema)&&<SimBox label={`PRICE ${pr.prazo}m${pr.priceEhCustom?" ★":""}`} val={fmtR(pr.price)} color={PAL.accent}/>}
                      </div>}
                    </div>
                  ))}
                </div>
              )
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",borderTop:`2px solid ${PAL.accent}25`,background:`${PAL.primary}10`,borderRadius:10,marginTop:4}}>
              <span style={{fontSize:13,fontWeight:700,color:T2}}>Total estruturado</span>
              <span style={{fontSize:17,fontWeight:900,color:PAL.accent,fontFamily:FT}}>{fmtI(manTotal)}</span>
            </div>
          </div>
        )}

        {/* COMPARATIVO */}
        {isManual&&(manParceiros||[]).filter(p=>p.nome&&p.produtos?.length).length>0&&(
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Comparativo de Opções" pal={PAL}/>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr>
                    {["PARCEIRO","PRODUTO","CRÉDITO","TAXA A.A.","PRAZO","PRICE / SAC 1ª","SAC ÚLTIMA"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:h==="PARCEIRO"||h==="PRODUTO"?"left":"right",fontSize:10,letterSpacing:1,color:PAL.accent,fontWeight:700,whiteSpace:"nowrap",borderBottom:`1px solid rgba(255,255,255,0.1)`,background:"rgba(255,255,255,0.04)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(manParceiros||[]).filter(p=>p.nome&&p.produtos?.length).flatMap((parc,pi)=>
                    parc.produtos.map((pr,ki)=>(
                      <tr key={`${pi}-${ki}`} style={{borderBottom:"1px solid rgba(255,255,255,0.05)",background:ki%2===0?"transparent":"rgba(255,255,255,0.02)"}}>
                        <td style={{padding:"10px 14px",fontWeight:ki===0?800:400,color:ki===0?T1:"transparent",verticalAlign:"top",whiteSpace:"nowrap"}}>{parc.nome}</td>
                        <td style={{padding:"10px 14px",color:T1,fontWeight:600}}>{pr.tipo||"—"}</td>
                        <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:PAL.accent,fontFamily:FT,whiteSpace:"nowrap"}}>{fmtI(pr.val)}</td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:T2,whiteSpace:"nowrap"}}>{pr.taxa}%</td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:T2,whiteSpace:"nowrap"}}>{pr.prazo}m</td>
                        <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:PAL.accent,whiteSpace:"nowrap"}}>
                          {(pr.sistema==="price"||pr.sistema==="ambos"||!pr.sistema)?fmtR(pr.price):(pr.sistema==="sac"?fmtR(pr.sac1):"—")}
                          {pr.priceEhCustom&&<span style={{fontSize:9,color:T3,marginLeft:4}}>★</span>}
                        </td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:T3,whiteSpace:"nowrap"}}>{(pr.sistema==="sac"||pr.sistema==="ambos")?fmtR(pr.sacl):"—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:`2px solid ${PAL.accent}30`}}>
                    <td colSpan={2} style={{padding:"12px 14px",fontWeight:800,color:T1,fontSize:12,background:"rgba(255,255,255,0.04)"}}>TOTAL ESTRUTURADO</td>
                    <td colSpan={5} style={{padding:"12px 14px",textAlign:"right",fontWeight:900,color:PAL.accent,fontFamily:FT,fontSize:15,background:"rgba(255,255,255,0.04)"}}>{fmtI(manTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {(manParceiros||[]).some(p=>p.produtos?.some(pr=>pr.priceEhCustom))&&(
              <div style={{marginTop:12,fontSize:11,color:T3,padding:"6px 14px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>★ Parcela personalizada (informada diretamente pelo parceiro)</div>
            )}
          </div>
        )}

        {/* ESTRATÉGIA */}
        {estResult?.cenarios && (
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Estratégia de Alocação" pal={PAL}/>
            {estResult.cenarios.map((c,ci)=>(
              <div key={c.id} style={{marginBottom:ci<estResult.cenarios.length-1?24:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:c.cor}}>{c.icone} {c.nome}</div>
                    <div style={{fontSize:11,color:T3}}>{c.desc}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:T3}}>ESTRUTURADO</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#4caf50",fontFamily:FT}}>{((c.coberto/estResult.total)*100).toFixed(0)}% · {fmtI(c.coberto)}</div>
                  </div>
                </div>
                {c.parc.map((p,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:i%2===0?"rgba(255,255,255,0.04)":"transparent",borderRadius:8,marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:600,color:T1}}>{String(i+1).padStart(2,"0")} · {p.p}</span>
                    <div style={{display:"flex",gap:14,alignItems:"center"}}>
                      <span style={{fontSize:11,color:T3}}>{p.taxa}</span>
                      <span style={{fontSize:13,fontWeight:800,color:c.cor,fontFamily:FT}}>{fmtI(p.val)}</span>
                    </div>
                  </div>
                ))}
                {ci<estResult.cenarios.length-1&&<div style={{height:1,background:"rgba(255,255,255,0.07)",marginTop:14}}/>}
              </div>
            ))}
            <div style={{marginTop:16,paddingTop:14,borderTop:`2px solid ${PAL.accent}30`,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:700,color:T2}}>Total</span>
              <span style={{fontSize:15,fontWeight:900,color:PAL.accent,fontFamily:FT}}>{fmtI(estResult.total)}</span>
            </div>
            {destinos?.filter(d=>d.desc).map((d,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
                <span style={{fontSize:13,color:T2}}>{d.desc}</span>
                <span style={{fontSize:13,fontWeight:700,color:PAL.accent}}>{fmtI(parseFloat(d.val)*1000000)}</span>
              </div>
            ))}
          </div>
        )}

        {/* HOME EQUITY */}
        {(heResults||[]).length>0 && (
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Simulação Home Equity / CGI" pal={PAL}/>
            {heResults.map((r,i)=>(
              <div key={i} style={{border:`1px solid ${r.color||PAL.primary}30`,borderRadius:14,padding:22,marginBottom:14,borderLeft:`4px solid ${r.color||PAL.primary}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,fontFamily:FT,color:T1}}>{r.name}</div>
                    <div style={{fontSize:11,color:r.color||PAL.primary,fontWeight:600}}>{(r.taxa*100).toFixed(2)}% a.m. + IPCA · LTV máx. {r.ltv}%</div>
                  </div>
                  <div style={{fontSize:20,fontWeight:900,color:r.color||PAL.primary,fontFamily:FT}}>{fmtI(r.valor)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <SimBox label="SAC 240m — 1ª PARCELA" val={fmtR(r.sac1)} color={r.color||PAL.primary}/>
                  <SimBox label="SAC 240m — ÚLTIMA" val={fmtR(r.sacl)} color={T3}/>
                  <SimBox label="PRICE 180m — FIXA" val={fmtR(r.price)} color={r.color||PAL.primary}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HUB-C */}
        {hubcSim && (
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Simulação Hub-C · Taxa Média 18% a.a." pal={PAL}/>
            <div style={{border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:22,borderLeft:"4px solid #888"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,fontFamily:FT,color:T1}}>Hub-C · Capital de Giro</div>
                  <div style={{fontSize:11,color:"#aaa",fontWeight:600}}>12–25%a.a. (média 18%) · Aprovação 48h</div>
                </div>
                <div style={{fontSize:20,fontWeight:900,color:"#aaa",fontFamily:FT}}>{fmtI(hubcSim.valor)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <SimBox label="SAC 48m — 1ª PARCELA" val={fmtR(hubcSim.sac1_48)} color="#aaa"/>
                <SimBox label="SAC 48m — ÚLTIMA" val={fmtR(hubcSim.sacl_48)} color={T3}/>
                <SimBox label="PRICE 48m — FIXA" val={fmtR(hubcSim.price48)} color="#aaa"/>
              </div>
            </div>
          </div>
        )}

        {/* PARCEIROS RECOMENDADOS */}
        {!isManual&&top3.length>0 && (
          <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
            <PSec title="Parceiros Recomendados" pal={PAL}/>
            {top3.map((p,i)=>(
              <div key={p.id} style={{border:`1px solid ${p.color||PAL.primary}25`,borderRadius:14,padding:22,marginBottom:14,borderLeft:`4px solid ${p.color||PAL.primary}`}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:10,background:p.color||PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:12}}>{p.logo}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,fontFamily:FT,color:T1}}>{p.name}</div>
                    <div style={{fontSize:11,color:T3}}>{p.cat}</div>
                  </div>
                  <div style={{width:26,height:26,borderRadius:"50%",background:rk[i],display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800}}>#{i+1}</div>
                </div>
                <div style={{fontSize:12,color:T2,background:"rgba(255,255,255,0.05)",padding:"8px 12px",borderRadius:8,whiteSpace:"pre-line",lineHeight:1.6}}>📋 {p.conds}</div>
              </div>
            ))}
          </div>
        )}

        {/* PRÓXIMOS PASSOS */}
        <div style={{background:CARD,borderRadius:20,padding:"32px 40px",marginBottom:20,border:`1px solid ${CARD_BORDER}`}}>
          <PSec title="Próximos Passos" pal={PAL}/>
          {[
            {n:"01",t:"Alinhamento",d:"Reunião para validação da estratégia e ajustes.",p:"Imediato"},
            {n:"02",t:"Assinatura do Mandato",d:"Formalização via contrato de prestação de serviços.",p:"Até 5 dias"},
            {n:"03",t:"Documentação",d:"Envio do checklist e organização do dossiê.",p:"5–10 dias"},
            {n:"04",t:"Submissão aos Parceiros",d:"Envio simultâneo para análise e pré-aprovação.",p:"10–15 dias"},
            {n:"05",t:"Liberação",d:"Contratos assinados e liberação das tranches.",p:"30–60 dias"},
          ].map((s,i,arr)=>(
            <div key={s.n} style={{display:"flex",gap:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginRight:16}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:800,flexShrink:0}}>{s.n}</div>
                {i<arr.length-1&&<div style={{width:2,flex:1,background:`${PAL.primary}30`,minHeight:18,margin:"3px 0"}}/>}
              </div>
              <div style={{paddingBottom:18,flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:FT,color:T1}}>{s.t}</div>
                  <span style={{fontSize:10,background:`${PAL.accent}25`,color:PAL.accent,padding:"2px 10px",borderRadius:20,fontWeight:600}}>{s.p}</span>
                </div>
                <div style={{fontSize:13,color:T2}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RODAPÉ */}
        <div style={{background:"#0d0d0d",borderRadius:20,padding:"32px 40px",textAlign:"center",border:`1px solid ${PAL.accent}20`}}>
          <img src={LOGO_FULL} alt="Áxicon" style={{height:44,width:"auto",objectFit:"contain",display:"block",filter:"brightness(0) invert(1)",margin:"0 auto 16px",opacity:.85}}/>
          <div style={{fontSize:11,color:T3,marginBottom:18}}>Inteligência Financeira · Performance · Governança</div>
          <div style={{display:"flex",justifyContent:"center",gap:24,fontSize:12,color:T3,flexWrap:"wrap",marginBottom:16}}>
            <span>📍 Maringá, PR</span>
            <span>📞 (44) 9 9114-7236</span>
            <span>✉️ master@axiconsolucoes.com</span>
            <span>🌐 axiconsolucoes.com</span>
          </div>
          <div style={{fontSize:11,color:"#444"}}>Proposta nº <strong style={{color:PAL.accent}}>{propCode}</strong> · Válida por 30 dias · Emitida em {propDate}</div>
        </div>

      </div>
    </>
  )
}

export async function getServerSideProps({ params }) {
  const { codigo } = params
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data, error } = await sb
      .from('propostas')
      .select('dados')
      .eq('codigo', codigo)
      .single()
    if (error || !data) return { props: { erro: true } }
    return { props: { dados: data.dados } }
  } catch {
    return { props: { erro: true } }
  }
}
