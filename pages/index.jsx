import { useState, useEffect, useRef, useCallback, Component } from 'react'
import { supabase } from '../lib/supabase'
import CrmModule from './crm'

class ErrorBoundary extends Component {
  constructor(p){super(p);this.state={err:null}}
  static getDerivedStateFromError(err){return{err}}
  render(){
    if(this.state.err)return(
      <div style={{padding:32,background:"#fff3f3",borderRadius:12,margin:24,fontFamily:"monospace"}}>
        <div style={{fontWeight:700,color:"#c62828",marginBottom:8}}>Erro ao renderizar:</div>
        <pre style={{fontSize:12,color:"#333",whiteSpace:"pre-wrap"}}>{String(this.state.err)}</pre>
        <button onClick={()=>this.setState({err:null})} style={{marginTop:16,padding:"8px 16px",background:"#c62828",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}

const API = typeof window !== 'undefined' ? window.location.origin : 'https://propostas.axiconsolucoes.com'
const LOGO_FULL = "https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png"
const LOGO_ICON = "https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/3a4392f661ffa16b27a6daddec24ba38.png"

// ── PALETAS ───────────────────────────────────────────────────────────────────
const VAREJO = { primary:"#001489", secondary:"#2B367B", accent:"#CCA67F", light:"#EEF0F8", dark:"#000D52" }
const ASSESS = { primary:"#713F2A", secondary:"#7C4D33", accent:"#DAB58F", light:"#F7F3EE", dark:"#4A2918" }
const SEC    = "#CCA67F"
const FT = "'The Seasons','Georgia',serif"
const SN = "'Montserrat','Helvetica Neue',sans-serif"
const FB = SN

function AxLogo({height=48,variant="full",dark=true,style={}}){
  const src=variant==="icon"?LOGO_ICON:LOGO_FULL
  const filter=dark?"brightness(0) saturate(100%) invert(1)":"none"
  return <img src={src} alt="Áxicon" style={{height,width:"auto",objectFit:"contain",display:"block",filter,...style}}/>
}

const fmtR = v => v?`R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"
const fmtI = v => v?`R$ ${Number(v).toLocaleString("pt-BR")}`:"—"
const today = () => new Date().toLocaleDateString("pt-BR")
const nowTs = () => new Date().toISOString()
const genCode = () => Math.random().toString(36).substring(2,8).toUpperCase()
const taxaMes = aa => Math.pow(1+aa,1/12)-1
const CP  = (pv,t,n) => pv*(t*Math.pow(1+t,n))/(Math.pow(1+t,n)-1)
const CS1 = (pv,t,n) => (pv/n)+pv*t
const CSL = (pv,t,n) => (pv/n)*(1+t)

// ── DADOS ─────────────────────────────────────────────────────────────────────
const FINS_MAP = {capital_giro:"Capital de Giro",antecipacao:"Antecipação de Recebíveis",expansao:"Expansão / Investimento",refinanciamento:"Refinanciamento de Dívidas",investimento:"Investimento / Ativo Fixo",custeio:"Custeio (Agro)",construcao:"Construção / Incorporação"}
const SETORES = [{v:"comercio",l:"Comércio"},{v:"servicos",l:"Serviços"},{v:"industria",l:"Indústria"},{v:"agronegocio",l:"Agronegócio"},{v:"rural",l:"Rural/Pecuária"},{v:"alimenticio",l:"Alimentício"},{v:"tecnologia",l:"Tecnologia"},{v:"saude",l:"Saúde"},{v:"construcao",l:"Construção Civil"},{v:"transporte",l:"Transporte"},{v:"educacao",l:"Educação"},{v:"outros",l:"Outros"}]
const FINS   = [{v:"capital_giro",l:"Capital de Giro"},{v:"antecipacao",l:"Antecipação de Recebíveis"},{v:"expansao",l:"Expansão / Investimento"},{v:"refinanciamento",l:"Refinanciamento de Dívidas"},{v:"investimento",l:"Investimento / Ativo Fixo"},{v:"custeio",l:"Custeio (Agro)"},{v:"construcao",l:"Construção / Incorporação"}]
const URGS   = [{v:"imediata",l:"Imediata (48h)"},{v:"curto",l:"Curto prazo (15d)"},{v:"medio",l:"Médio prazo (15–60d)"},{v:"longo",l:"Longo prazo (60d+)"}]
const TIPOS_GARANTIA = [{v:"terreno",l:"Terreno"},{v:"rural",l:"Rural"},{v:"comercial",l:"Comercial"},{v:"residencial",l:"Residencial"}]
const IMOVEL_OPTS    = [{v:"proprio",l:"Próprio quitado"},{v:"financiado",l:"Próprio financiado"},{v:"terceiro",l:"Imóvel de terceiros"},{v:"nao",l:"Não possui"}]

const PARTNERS = [
  {id:"trinus",name:"Trinus.co",logo:"T",color:ASSESS.primary,cat:"Nacional",prods:["HomeEquity/CGI (R$50k–R$20M)"],conds:"R$50k–R$20M. Taxa 1,39%a.m.+IPCA. 180m. Carência 3m.",alerts:[{c:d=>d.imovel==="nao",m:"Exige imóvel."},{c:d=>d.urg==="imediata",m:"Due diligence 15–45 dias."}],isHE:true,taxa:0.0139,heMax:20000000,heLTV:60,score:d=>{let s=0;if(d.imovel==="proprio")s+=40;else if(d.imovel==="financiado")s+=20;if(d.credito>=50000&&d.credito<=20000000)s+=25;if(d.fins.some(f=>["capital_giro","expansao","refinanciamento","investimento","construcao"].includes(f)))s+=20;if(["medio","longo"].includes(d.urg))s+=10;return s;}},
  {id:"pontte",name:"Pontte",logo:"P",color:"#7C4D33",cat:"Nacional",prods:["HomeEquity/CGI (R$100k–R$3M)"],conds:"R$100k–R$3M. LTV≤55%. Renda≥R$10k/mês. Cidade≥50k hab.",alerts:[{c:d=>d.imovel==="nao",m:"Exige imóvel."},{c:d=>d.fat<120000,m:"Renda mín. R$10k/mês."},{c:d=>d.credito>3000000,m:"Teto: R$3M."},{c:d=>d.credito<100000,m:"Mínimo: R$100k."},{c:d=>d.imovel!=="nao"&&!d.cityOk,m:"Cidade <50k hab."}],isHE:true,taxa:0.0119,heMax:3000000,heLTV:55,score:d=>{let s=0;if(d.imovel==="proprio")s+=40;else if(d.imovel==="financiado")s+=25;if(d.fat>=120000)s+=20;if(d.credito>=100000&&d.credito<=3000000)s+=25;if(d.cityOk)s+=15;return s;}},
  {id:"multiplike",name:"Multiplike",logo:"M",color:ASSESS.primary,cat:"Nacional",prods:["CRI/CRA","Crédito Empresarial"],conds:"Construtoras: fat.≥R$18M/ano, 5 anos.\nDemais: fat.≥R$36M/ano, 5 anos.",alerts:[{c:d=>d.anos<5,m:"Mínimo 5 anos."},{c:d=>d.setor==="construcao"&&d.fat<18000000,m:"Construtoras: fat.≥R$18M."},{c:d=>d.setor!=="construcao"&&d.fat<36000000,m:"Demais: fat.≥R$36M."}],isHE:false,score:d=>{let s=0;const m=d.setor==="construcao"?18000000:36000000;if(d.fat>=m)s+=40;else if(d.fat>=m*.5)s+=15;if(d.anos>=5)s+=35;if(d.fins.some(f=>["expansao","investimento","refinanciamento","construcao"].includes(f)))s+=15;if(["medio","longo"].includes(d.urg))s+=10;return s;}},
  {id:"ecoagro",name:"EcoAgro",logo:"E",color:"#2d6a4f",cat:"Nacional",prods:["CRA≥R$20M","FIDC/FI Agro≥R$35M"],conds:"CRA:≥R$20M,CDI+,6a. FIDC:≥R$35M,IPCA+,10a. Exclusivo agronegócio.",alerts:[{c:d=>!["agronegocio","rural","alimenticio"].includes(d.setor),m:"Exclusivo agronegócio."},{c:d=>d.credito<20000000,m:"Mínimo: R$20M."}],isHE:false,score:d=>{let s=0;if(["agronegocio","rural","alimenticio"].includes(d.setor))s+=45;if(d.credito>=20000000)s+=30;if(["medio","longo"].includes(d.urg))s+=15;return s;}},
  {id:"inteligencia",name:"Inteligência Comercial",logo:"IC",color:"#8B6914",cat:"Nac+Intl",prods:["Nacional (R$100k+)","Internacional USD/EUR"],conds:"Nacional: fat.≥R$300k/mês. Taxa 12–25%a.a.\nInternacional: fat.≥R$3M/mês. Taxa 3–12%a.a.",alerts:[{c:d=>d.fat<3600000,m:"Nacional: fat.≥R$300k/mês."},{c:d=>d.fat<36000000&&d.credito>5000000,m:"Internacional: fat.≥R$3M/mês."}],isHE:false,score:d=>{let s=0;if(d.fat>=36000000)s+=35;else if(d.fat>=3600000)s+=20;if(d.credito>=100000)s+=20;if(d.fins.some(f=>["expansao","investimento","refinanciamento","construcao"].includes(f)))s+=20;if(d.anos>=5)s+=15;return s;}},
  {id:"oporto",name:"Oporto Forte Group",logo:"OF",color:"#8B1A1A",cat:"Internacional",prods:["Internacional USD/EUR — sem limite"],conds:"Fat.≥R$3M/mês. Prazo mín. 60m. Taxa 3–12%a.a.",alerts:[{c:d=>d.fat<36000000,m:"Fat.≥R$3M/mês."},{c:d=>d.anos<5,m:"Mínimo 5 anos."}],isHE:false,score:d=>{let s=0;if(d.fat>=36000000)s+=45;if(d.credito>=3000000)s+=30;if(["medio","longo"].includes(d.urg))s+=15;return s;}},
  {id:"hubc",name:"Hub-C",logo:"HC",color:"#555",cat:"Nacional + Internacional",prods:["Capital de Giro","Internacional 9,7%a.a."],conds:"Ticket mín. R$100k. Fat. mín. R$300k/mês.\nInternacional: 9,7%a.a. · 108m · 3 tranches.",alerts:[{c:d=>d.fat<3600000,m:"Fat. mín. R$300k/mês."},{c:d=>d.credito<100000,m:"Ticket mín. R$100k."}],isHE:false,score:d=>{let s=0;if(d.fat>=3600000)s+=25;else if(d.fat>=1200000)s+=10;if(d.credito>=100000)s+=30;if(["imediata","curto"].includes(d.urg))s+=20;if(d.anos>=1)s+=15;return s;}},
  {id:"cashme",name:"CashMe",logo:"CM",color:"#0057B8",cat:"Nacional",prods:["HomeEquity/CGI (R$50k–R$25M)","Crédito para Construção"],conds:"R$50k–R$25M. LTV≤60%. Taxa 1,52%a.m.+IPCA. 240m. Carência 3m.\nConstrução: até 50% valor obra / 30% terreno. Imóvel mín. R$500k.",alerts:[{c:d=>d.imovel==="nao",m:"Exige imóvel."},{c:d=>d.urg==="imediata",m:"Due diligence 15–45 dias."},{c:d=>d.credito>25000000,m:"Teto: R$25M."},{c:d=>d.credito<50000,m:"Mínimo: R$50k."}],isHE:true,taxa:0.0152,heMax:25000000,heLTV:60,score:d=>{let s=0;if(d.imovel==="proprio")s+=40;else if(d.imovel==="financiado")s+=20;if(d.credito>=50000&&d.credito<=25000000)s+=25;if(d.fins.some(f=>["capital_giro","expansao","refinanciamento","investimento","construcao"].includes(f)))s+=20;if(["medio","longo"].includes(d.urg))s+=10;if(d.setor==="construcao")s+=5;return s;}},
]

const normCity = s=>!s?"":s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()
const CIDADES_POP={"sao paulo":12325000,"rio de janeiro":6747000,"brasilia":3094000,"salvador":2900000,"fortaleza":2703000,"belo horizonte":2530000,"manaus":2255000,"curitiba":1948000,"recife":1653000,"porto alegre":1484000,"belem":1499000,"goiania":1536000,"guarulhos":1392000,"campinas":1223000,"sao luis":1108000,"maceio":1025000,"natal":890000,"teresina":866000,"campo grande":906000,"joao pessoa":817000,"santos":434000,"ribeirao preto":718000,"uberlandia":706000,"sorocaba":696000,"contagem":658000,"aracaju":664000,"cuiaba":618000,"joinville":616000,"londrina":580000,"juiz de fora":566000,"florianopolis":537000,"maringa":435000,"sao jose dos campos":729000,"feira de santana":629000,"vitoria":365000,"vila velha":501000,"cascavel":340000,"ponta grossa":355000,"blumenau":361000,"itajai":233000,"chapeco":227000,"palmas":310000,"anapolis":391000,"piracicaba":407000,"diadema":420000,"sao bernardo do campo":844000,"santo andre":723000,"bauru":374000,"jundiai":423000,"mogi das cruzes":449000,"caxias do sul":516000,"pelotas":340000,"canoas":347000,"novo hamburgo":244000,"imperatriz":259000,"criciuma":213000,"araraquara":240000,"americana":231000,"nova iguacu":820000,"duque de caxias":924000,"niteroi":510000,"sao goncalo":1077000,"caruaru":361000,"petrolina":352000,"jaboatao dos guararapes":719000,"montes claros":406000,"betim":421000,"ribeirao das neves":340000,"uberaba":330000}
const getCityPop=c=>CIDADES_POP[normCity(c)]||null
const fmtPop=n=>n?(n>=1000000?`${(n/1e6).toFixed(1)}M hab`:`${Math.round(n/1000)}k hab`):null

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const iSt={padding:"10px 14px",border:"1px solid rgba(113,63,42,0.22)",borderRadius:8,fontSize:14,outline:"none",fontFamily:FB,background:"#EFE9E0",width:"100%",boxSizing:"border-box"}
function FL({l,children}){return <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8}}>{l}</label>{children}</div>}
function FLV({l,children}){return <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:VAREJO.primary,letterSpacing:.8}}>{l}</label>{children}</div>}
function Grid2({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{children}</div>}
function SimBox({label,val,color,sub}){return <div style={{background:"#f8f5f0",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#999",letterSpacing:.5,marginBottom:4}}>{label}</div><div style={{fontSize:15,fontWeight:800,color:color||ASSESS.primary}}>{val}</div>{sub&&<div style={{fontSize:10,color:"#aaa",marginTop:2}}>{sub}</div>}</div>}
function SecBanner({title,sub,varejo}){const C=varejo?VAREJO:ASSESS;return <div style={{borderLeft:`4px solid ${C.accent||C.secondary}`,paddingLeft:16,marginBottom:16,marginTop:24}}><div style={{fontSize:16,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>{title}</div>{sub&&<div style={{fontSize:10,color:"#aaa",letterSpacing:.5,marginTop:2}}>{sub}</div>}</div>}
function PSec({title,varejo}){const clr=varejo?VAREJO.primary:ASSESS.primary;return <div style={{marginBottom:20}}><div style={{fontSize:10,color:clr,letterSpacing:2,marginBottom:6}}>{title.toUpperCase()}</div><div style={{height:2,background:varejo?`linear-gradient(90deg,${VAREJO.primary},${VAREJO.secondary},transparent)`:`linear-gradient(90deg,${ASSESS.primary},${SEC},transparent)`,width:120}}/></div>}
function RG({opts,val,onChange,varejo}){const ac=varejo?VAREJO.primary:ASSESS.primary;return <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{opts.map(o=><button key={o.v} onClick={()=>onChange(o.v)} style={{padding:"7px 13px",borderRadius:8,border:`1.5px solid ${val===o.v?ac:"#ddd"}`,background:val===o.v?`${ac}14`:"white",color:val===o.v?ac:"#1a1a1a",fontFamily:FB,fontSize:13,fontWeight:val===o.v?700:400,cursor:"pointer"}}>{o.l}</button>)}</div>}
function MS({opts,val,onChange,varejo}){const ac=varejo?VAREJO.primary:ASSESS.secondary;return <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{opts.map(o=>{const sel=val.includes(o.v);return <button key={o.v} onClick={()=>onChange(o.v)} style={{padding:"7px 13px",borderRadius:8,border:`1.5px solid ${sel?ac:"#ddd"}`,background:sel?`${ac}14`:"white",color:sel?ac:"#1a1a1a",fontFamily:FB,fontSize:13,fontWeight:sel?700:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>{sel&&<span style={{fontSize:10}}>✓</span>}{o.l}</button>})}</div>}
function PfxFmt({pre,val,onChange,ph}){const[f,setF]=useState(false);const raw=String(val||"").replace(/\D/g,"");const disp=f?raw:(raw?Number(raw).toLocaleString("pt-BR"):"");return <div style={{display:"flex",alignItems:"center",border:"1.5px solid #ddd",borderRadius:8,overflow:"hidden",background:"#fafaf8"}}><span style={{padding:"9px 10px 9px 12px",fontSize:11,color:"#888",background:"#f0ede8",borderRight:"1px solid #ddd",whiteSpace:"nowrap"}}>{pre}</span><input type="text" placeholder={ph} value={disp} onFocus={()=>setF(true)} onBlur={()=>setF(false)} onChange={e=>onChange(e.target.value.replace(/\D/g,""))} style={{border:"none",background:"transparent",padding:"9px 12px",fontSize:14,color:"#1a1a1a",width:"100%",outline:"none"}}/></div>}
function BtnRow({onBack,onNext,dis,nxt,last,varejo}){
  const ac=varejo?VAREJO.primary:ASSESS.primary
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:28,paddingTop:22,borderTop:"1px solid rgba(113,63,42,0.12)"}}>
      <button style={{background:"transparent",border:0,color:"#888",fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:"default"}}>Salvar rascunho</button>
      <div style={{display:"flex",gap:10}}>
        {onBack&&<button onClick={onBack} style={{height:44,padding:"0 22px",borderRadius:10,border:"1.5px solid rgba(113,63,42,0.22)",background:"white",color:"#555",fontSize:12,fontWeight:500,cursor:"pointer",letterSpacing:.8,display:"inline-flex",alignItems:"center",gap:8}}>← Voltar</button>}
        <button onClick={onNext} disabled={dis} style={{height:44,padding:"0 28px",borderRadius:10,border:"none",background:ac,color:"white",fontSize:12,fontWeight:500,letterSpacing:1,cursor:dis?"not-allowed":"pointer",opacity:dis?.5:1,boxShadow:dis?"none":`0 12px 28px -12px ${ac}88`,display:"inline-flex",alignItems:"center",gap:10}}>{nxt}</button>
      </div>
    </div>
  )
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen(){
  const[loading,setLoading]=useState(false)
  const[erro,setErro]=useState("")
  const[hover,setHover]=useState(false)
  const login=async()=>{setLoading(true);setErro("");const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${API}/`}});if(error){setErro(error.message);setLoading(false)}}
  const MUTED="rgba(255,255,255,0.45)"
  const GOLD="#CCA67F"
  const cornerSt={position:"fixed",fontFamily:SN,fontSize:10,letterSpacing:3,textTransform:"uppercase",color:MUTED}
  return(
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0a0a0a",fontFamily:SN,WebkitFontSmoothing:"antialiased",position:"relative",overflow:"hidden"}}>
      {/* Radial gradient overlays */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(204,166,127,0.06) 0%, rgba(204,166,127,0) 45%), radial-gradient(ellipse at 50% 100%, rgba(0,20,137,0.10) 0%, rgba(0,0,0,0) 55%)",pointerEvents:"none"}}/>

      {/* Corner labels */}
      <div style={{...cornerSt,top:28,left:32}}><span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:GOLD,marginRight:8,verticalAlign:1}}/>SOLUÇÕES FINANCEIRAS</div>
      <div style={{...cornerSt,top:28,right:32}}>SISTEMA INTERNO · v1.0</div>
      <div style={{...cornerSt,bottom:28,left:32}}>© 2026 ÁXICON</div>
      <div style={{...cornerSt,bottom:28,right:32}}>SUPORTE · TI@AXICON</div>

      {/* Stage */}
      <div style={{width:"min(440px, calc(100vw - 48px))",textAlign:"center",position:"relative",zIndex:1}}>

        {/* Logo + gold underline */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:26,position:"relative"}}>
          <img src={LOGO_FULL} alt="Áxicon" style={{height:132,width:"auto",objectFit:"contain",filter:"brightness(0) invert(1)",display:"block"}}/>
          <div style={{width:36,height:1,background:GOLD,opacity:.85,marginTop:16}}/>
        </div>

        {/* Vertical rule */}
        <div style={{margin:"48px auto 0",width:1,height:32,background:"linear-gradient(to bottom, transparent, rgba(204,166,127,0.55), transparent)",opacity:.6}}/>

        {/* Heading */}
        <h1 style={{marginTop:56,fontFamily:FT,fontWeight:300,fontSize:38,letterSpacing:.5,lineHeight:1.2,color:"white"}}>
          Acesso <em style={{fontStyle:"italic",fontWeight:300,color:GOLD}}>restrito</em>
        </h1>

        {/* Lede */}
        <p style={{margin:"14px auto 0",maxWidth:320,fontSize:13,lineHeight:1.7,color:MUTED,fontWeight:300}}>
          Área exclusiva para consultores e equipe interna. Entre com sua conta corporativa para continuar.
        </p>

        {/* Error */}
        {erro&&<div style={{background:"#2a0000",border:"1px solid #f4433640",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#f44336",marginTop:20}}>{erro}</div>}

        {/* Google button */}
        <button
          onClick={login}
          disabled={loading}
          onMouseEnter={()=>setHover(true)}
          onMouseLeave={()=>setHover(false)}
          style={{
            marginTop:44,width:"100%",height:52,
            background:hover?"#f5f5f5":"#ffffff",color:"#1f1f1f",
            border:0,borderRadius:999,
            fontFamily:SN,fontWeight:500,fontSize:14,letterSpacing:.3,
            cursor:loading?"not-allowed":"pointer",
            display:"inline-flex",alignItems:"center",justifyContent:"center",gap:12,
            opacity:loading?.7:1,
            boxShadow:hover?"0 0 0 1px rgba(204,166,127,0.35), 0 18px 40px -14px rgba(0,0,0,0.8)":"0 12px 30px -12px rgba(0,0,0,0.6)",
            transform:hover?"translateY(-1px)":"translateY(0)",
            transition:"transform .18s ease, box-shadow .18s ease, background .18s ease"
          }}
        >
          <svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961l3.007 2.332C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          {loading?"Redirecionando...":"Entrar com Google"}
        </button>

        {/* Secure indicator */}
        <div style={{marginTop:22,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:MUTED,display:"inline-flex",alignItems:"center",gap:8}}>
          <span style={{width:10,height:10,borderRadius:"50%",background:GOLD,opacity:.8,boxShadow:"0 0 0 4px rgba(204,166,127,0.10)"}}/>
          Conexão segura · OAuth 2.0
        </div>
      </div>
    </div>
  )
}

// ── PAINEL USUÁRIOS ───────────────────────────────────────────────────────────
function PainelUsuarios({token,onClose}){
  const[usuarios,setUsuarios]=useState([])
  const[loading,setLoading]=useState(true)
  const[novoEmail,setNovoEmail]=useState("")
  const[novoNome,setNovoNome]=useState("")
  const[novoRole,setNovoRole]=useState("consultor_varejo")
  const[salvando,setSalvando]=useState(false)
  const[msg,setMsg]=useState("")
  const h={headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}}
  useEffect(()=>{fetch(`${API}/api/usuarios`,h).then(r=>r.json()).then(d=>{setUsuarios(d.usuarios||[]);setLoading(false)})},[])
  const add=async()=>{if(!novoEmail)return;setSalvando(true);setMsg("");const res=await fetch(`${API}/api/usuarios`,{method:"POST",...h,body:JSON.stringify({email:novoEmail,nome:novoNome,role:novoRole})});const d=await res.json();if(d.usuario){setUsuarios(p=>[d.usuario,...p.filter(u=>u.email!==d.usuario.email)]);setNovoEmail("");setNovoNome("");setMsg("✅ Salvo!")}else setMsg(`❌ ${d.error}`);setSalvando(false)}
  const toggleAtivo=async(email,ativo)=>{await fetch(`${API}/api/usuarios`,{method:"PATCH",...h,body:JSON.stringify({email,ativo:!ativo})});setUsuarios(p=>p.map(u=>u.email===email?{...u,ativo:!ativo}:u))}
  const changeRole=async(email,role)=>{await fetch(`${API}/api/usuarios`,{method:"PATCH",...h,body:JSON.stringify({email,role})});setUsuarios(p=>p.map(u=>u.email===email?{...u,role}:u))}
  const roleColor={admin:"#b71c1c",administrativo:"#7c4d33",consultor_varejo:VAREJO.primary,consultor_atacado:"#2e7d32",assessor:ASSESS.primary,consultor:VAREJO.primary}
  const roleLabel={admin:"Administrador",administrativo:"Administrativo",consultor_varejo:"Consultor Varejo",consultor_atacado:"Consultor Atacado",assessor:"Assessor",consultor:"Consultor"}
  const ist={padding:"9px 12px",border:"1.5px solid #333",borderRadius:8,fontSize:13,outline:"none",background:"#1a1a1a",color:"white",width:"100%",boxSizing:"border-box"}
  return(
    <div style={{position:"fixed",inset:0,zIndex:4000,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB}}>
      <div style={{background:"#111",borderRadius:20,padding:32,width:"100%",maxWidth:680,maxHeight:"85vh",overflowY:"auto",border:"1px solid #222"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontSize:16,fontWeight:800,color:SEC}}>👥 Gerenciar Usuários</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        {/* Legenda de roles */}
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          {[{r:"admin",d:"Acesso total"},{r:"administrativo",d:"Varejo + Financeiro + RH + Rastreamento"},{r:"consultor_varejo",d:"Varejo + Tarefas"},{r:"consultor_atacado",d:"Atacado + Tarefas"}].map(({r,d})=>(
            <div key={r} style={{padding:"4px 12px",borderRadius:20,background:`${roleColor[r]}15`,border:`1px solid ${roleColor[r]}40`,fontSize:11}}>
              <span style={{fontWeight:700,color:roleColor[r]}}>{roleLabel[r]}</span>
              <span style={{color:"#888",marginLeft:6}}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#1a1a1a",borderRadius:12,padding:16,marginBottom:20,border:"1px solid #333"}}>
          <div style={{fontSize:11,color:"#666",letterSpacing:1,marginBottom:12}}>ADICIONAR USUÁRIO</div>
          <Grid2><input placeholder="E-mail Google" value={novoEmail} onChange={e=>setNovoEmail(e.target.value)} style={ist}/><input placeholder="Nome" value={novoNome} onChange={e=>setNovoNome(e.target.value)} style={ist}/></Grid2>
          <div style={{display:"flex",gap:10,alignItems:"center",marginTop:10}}>
            <select value={novoRole} onChange={e=>setNovoRole(e.target.value)} style={{...ist,width:"auto"}}>
              <option value="consultor_varejo">Consultor Varejo</option>
              <option value="consultor_atacado">Consultor Atacado</option>
              <option value="administrativo">Administrativo</option>
              <option value="admin">Administrador</option>
            </select>
            <button onClick={add} disabled={salvando||!novoEmail} style={{padding:"9px 20px",background:SEC,color:"#1a1a1a",border:"none",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",opacity:novoEmail?1:.5}}>{salvando?"Salvando...":"+ Adicionar"}</button>
            {msg&&<span style={{fontSize:12,color:msg.startsWith("✅")?"#4caf50":"#f44336"}}>{msg}</span>}
          </div>
        </div>
        {loading?<div style={{color:"#666",textAlign:"center",padding:24}}>Carregando...</div>:usuarios.map(u=>(
          <div key={u.email} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#1a1a1a",borderRadius:10,marginBottom:8,border:"1px solid #2a2a2a"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:roleColor[u.role]||"#555",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:13,flexShrink:0}}>{u.nome?.[0]?.toUpperCase()||"?"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.nome||u.email}</div>
              <div style={{fontSize:11,color:"#666"}}>{u.email} · <span style={{color:roleColor[u.role]}}>{roleLabel[u.role]||u.role}</span></div>
            </div>
            <select value={u.role} onChange={e=>changeRole(u.email,e.target.value)} style={{padding:"4px 8px",background:"#222",color:"white",border:"1px solid #444",borderRadius:6,fontSize:12,cursor:"pointer"}}>
              <option value="consultor_varejo">Consultor Varejo</option>
              <option value="consultor_atacado">Consultor Atacado</option>
              <option value="administrativo">Administrativo</option>
              <option value="admin">Administrador</option>
            </select>
            <button onClick={()=>toggleAtivo(u.email,u.ativo)} style={{padding:"4px 12px",background:u.ativo?"#1b5e2020":"#b71c1c20",color:u.ativo?"#4caf50":"#f44336",border:`1px solid ${u.ativo?"#4caf5040":"#f4433640"}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>{u.ativo?"Ativo":"Inativo"}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CRM SCREEN (VAREJO) ───────────────────────────────────────────────────────
function CRMVarejo({usuario,token,onNew,onReopen,onRedit}){
  const[empresas,setEmpresas]=useState(null)
  const[search,setSearch]=useState("")
  const[expanded,setExpanded]=useState(null)
  useEffect(()=>{fetch(`${API}/api/proposta?crm=all`).then(r=>r.json()).then(d=>setEmpresas((d.empresas||[]).filter(e=>e.fd?.tipo==="varejo").sort((a,b)=>(b.ultimaAtualizacao||"").localeCompare(a.ultimaAtualizacao||""))))},[])
  const filtered=(empresas||[]).filter(e=>!search||e.nome?.toLowerCase().includes(search.toLowerCase()))
  const totalVolume=(empresas||[]).reduce((s,e)=>s+(e.propostas||[]).reduce((ps,p)=>ps+(Number(p.credito)||0),0),0)
  const totalProps=(empresas||[]).reduce((s,e)=>s+(e.propostas||[]).length,0)
  return(
    <div style={{padding:"20px 0"}}>
      {/* Page title */}
      <h1 style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",margin:"0 0 20px",letterSpacing:.5}}>Carteira de <em style={{fontStyle:"italic",color:VAREJO.primary}}>clientes</em></h1>

      {/* KPI cards — crm.html style */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[{l:"Clientes",v:empresas?.length??"—"},{l:"Propostas",v:totalProps||"—"},{l:"Volume Total",v:fmtI(totalVolume)||"—"}].map(k=>(
          <div key={k.l} style={{background:"white",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderTop:`3px solid ${VAREJO.primary}`}}>
            <div style={{fontSize:10,color:"#aaa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{k.l}</div>
            <div style={{fontSize:k.l==="Volume Total"?18:26,fontWeight:800,color:"#1a1a1a",fontFamily:FT,lineHeight:1}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Search toolbar */}
      <div style={{background:"white",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(0,0,0,0.07)"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..." style={{border:"none",outline:"none",fontSize:14,width:"100%",fontFamily:FB,background:"transparent",color:"#1a1a1a"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:16,lineHeight:1}}>✕</button>}
      </div>

      {empresas===null&&<div style={{textAlign:"center",padding:40,color:"#aaa"}}>Carregando...</div>}
      {empresas!==null&&filtered.length===0&&(
        <div style={{textAlign:"center",padding:48,background:"white",borderRadius:14}}>
          <div style={{fontSize:32,marginBottom:12}}>🏠</div>
          <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",fontFamily:FT,marginBottom:6}}>Nenhum cliente ainda</div>
          <div style={{fontSize:13,color:"#aaa",marginBottom:20}}>Inicie uma nova proposta de Varejo.</div>
          <button onClick={onNew} style={{padding:"11px 24px",background:VAREJO.primary,color:"white",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",letterSpacing:.5}}>+ Nova Proposta Varejo</button>
        </div>
      )}

      {/* Client list — crm.html style */}
      {filtered.map(emp=>(
        <div key={emp.nomeKey} style={{background:"white",borderRadius:12,marginBottom:10,overflow:"hidden",border:`1px solid ${expanded===emp.nomeKey?VAREJO.primary+"40":"rgba(0,0,0,0.07)"}`}}>
          <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setExpanded(expanded===emp.nomeKey?null:emp.nomeKey)}>
            <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${VAREJO.primary},${VAREJO.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:16,flexShrink:0}}>{emp.nome?.[0]?.toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",fontFamily:FT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{emp.nome}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{emp.propostas?.length||0} proposta{(emp.propostas?.length||0)!==1?"s":""} · {fmtI(emp.credito)}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:999,background:"rgba(0,20,137,0.08)",color:VAREJO.primary,letterSpacing:.5}}>Ativo</span>
              <div style={{fontSize:10,color:"#aaa"}}>{emp.ultimaAtualizacao?new Date(emp.ultimaAtualizacao).toLocaleDateString("pt-BR"):""}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" width="14" height="14" style={{transform:expanded===emp.nomeKey?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          {expanded===emp.nomeKey&&(
            <div style={{borderTop:"1px solid #f5f5f5",padding:"14px 20px",background:"#fafafa"}}>
              {emp.propostas?.map((p,i)=>(
                <div key={p.code} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 14px",background:"white",borderRadius:9,marginBottom:6,border:"1px solid rgba(0,0,0,0.05)"}}>
                  <div style={{width:26,height:26,borderRadius:7,background:VAREJO.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:700,flexShrink:0}}>#{i+1}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>Cód. <span style={{color:VAREJO.primary,letterSpacing:1,fontFamily:"monospace"}}>{p.code}</span></div><div style={{fontSize:11,color:"#aaa",marginTop:1}}>{p.data}</div></div>
                  <a href={`${API}/proposta/${p.code}`} target="_blank" rel="noreferrer" style={{padding:"5px 12px",background:VAREJO.primary+"10",color:VAREJO.primary,border:`1px solid ${VAREJO.primary}25`,borderRadius:7,fontSize:11,fontWeight:600,textDecoration:"none"}}>↗ Link</a>
                  <button onClick={()=>onReopen(p.code)} style={{padding:"5px 12px",background:"white",color:"#555",border:"1px solid rgba(0,0,0,0.12)",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600}}>Ver</button>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                <button onClick={()=>onRedit(emp.fd)} style={{padding:"8px 16px",background:VAREJO.primary,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:.5}}>+ Nova proposta</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── CRM SCREEN (ASSESSORIA) ───────────────────────────────────────────────────
function CRMAssessoria({usuario,token,onNew,onReopen,onRedit}){
  const[empresas,setEmpresas]=useState(null)
  const[search,setSearch]=useState("")
  const[expanded,setExpanded]=useState(null)
  useEffect(()=>{fetch(`${API}/api/proposta?crm=all`).then(r=>r.json()).then(d=>setEmpresas((d.empresas||[]).filter(e=>!e.fd?.tipo||e.fd?.tipo==="assessoria").sort((a,b)=>(b.ultimaAtualizacao||"").localeCompare(a.ultimaAtualizacao||""))))},[])
  const filtered=(empresas||[]).filter(e=>!search||e.nome?.toLowerCase().includes(search.toLowerCase())||e.setor?.toLowerCase().includes(search.toLowerCase()))
  const totalProps=(empresas||[]).reduce((s,e)=>s+(e.propostas?.length||0),0)
  const totalVolume=(empresas||[]).reduce((s,e)=>s+(e.propostas||[]).reduce((ps,p)=>ps+(Number(p.credito)||0),0),0)
  const setor=v=>SETORES.find(s=>s.v===v)?.l||v||"—"
  return(
    <div style={{padding:"24px 0"}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Empresas",v:empresas?.length??"—",icon:"🏢"},{l:"Propostas",v:totalProps||"—",icon:"📄"},{l:"Volume Total",v:fmtI(totalVolume)||"—",icon:"💰"},{l:"Última",v:empresas?.[0]?new Date(empresas[0].ultimaAtualizacao).toLocaleDateString("pt-BR"):"—",icon:"🕐"}].map(k=>(
          <div key={k.l} style={{background:"white",borderRadius:12,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.04)",borderTop:`3px solid ${SEC}`}}>
            <div style={{fontSize:20,marginBottom:4}}>{k.icon}</div>
            <div style={{fontSize:k.l==="Volume Total"?16:22,fontWeight:900,color:"#1a1a1a",fontFamily:FT}}>{k.v}</div>
            <div style={{fontSize:10,color:"#999"}}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:"white",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <span>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar empresa ou setor..." style={{border:"none",outline:"none",fontSize:14,width:"100%",fontFamily:FB,background:"transparent"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:18}}>✕</button>}
      </div>
      {empresas===null&&<div style={{textAlign:"center",padding:40,color:"#aaa"}}>Carregando...</div>}
      {empresas!==null&&filtered.length===0&&(
        <div style={{textAlign:"center",padding:48}}>
          <div style={{fontSize:40,marginBottom:12}}>🏢</div>
          <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>{search?"Nenhuma empresa encontrada":"Nenhuma empresa cadastrada ainda"}</div>
          <button onClick={onNew} style={{padding:"10px 24px",background:ASSESS.primary,color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Nova Proposta</button>
        </div>
      )}
      {filtered.map(emp=>(
        <div key={emp.nomeKey} style={{background:"white",borderRadius:12,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.04)",overflow:"hidden",border:`1px solid ${expanded===emp.nomeKey?SEC+"60":"transparent"}`}}>
          <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpanded(expanded===emp.nomeKey?null:emp.nomeKey)}>
            <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${ASSESS.primary},${ASSESS.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:15,flexShrink:0}}>{emp.nome?.[0]?.toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:800,color:"#1a1a1a",fontFamily:FT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{emp.nome}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{setor(emp.setor)} · {fmtI(emp.fat)}/ano · {emp.propostas?.length||0} proposta{(emp.propostas?.length||0)!==1?"s":""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:800,color:ASSESS.primary,fontFamily:FT}}>{fmtI(emp.credito)}</div>
              <div style={{fontSize:10,color:"#aaa"}}>{emp.ultimaAtualizacao?new Date(emp.ultimaAtualizacao).toLocaleDateString("pt-BR"):""}</div>
            </div>
            <div style={{fontSize:16,color:"#ccc",transform:expanded===emp.nomeKey?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</div>
          </div>
          {expanded===emp.nomeKey&&(
            <div style={{borderTop:"1px solid #f0ede8",padding:"14px 18px",background:"#fafaf8"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {[{l:"Setor",v:setor(emp.fd?.setor)},{l:"Faturamento",v:fmtI(emp.fd?.fat)},{l:"Crédito",v:fmtI(emp.fd?.credito)},{l:"Tempo",v:emp.fd?.anos?`${emp.fd.anos} anos`:"—"},{l:"Imóvel",v:{proprio:"Próprio",financiado:"Financiado",terceiro:"Terceiros",nao:"Não possui"}[emp.fd?.imovel]||"—"},{l:"Urgência",v:URGS.find(u=>u.v===emp.fd?.urg)?.l||"—"}].map(it=>(
                  <div key={it.l} style={{background:"white",borderRadius:8,padding:"8px 10px",border:`1px solid ${SEC}20`}}>
                    <div style={{fontSize:10,color:"#999",marginBottom:2}}>{it.l}</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{it.v||"—"}</div>
                  </div>
                ))}
              </div>
              {emp.propostas?.map((p,i)=>(
                <div key={p.code} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"white",borderRadius:8,marginBottom:6,border:"1px solid #f0ede8"}}>
                  <div style={{width:24,height:24,borderRadius:6,background:ASSESS.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800}}>#{i+1}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>Código: <span style={{color:ASSESS.primary,letterSpacing:1}}>{p.code}</span></div><div style={{fontSize:11,color:"#aaa"}}>{p.data} · {fmtI(p.credito)}</div></div>
                  <button onClick={()=>onReopen(p.code)} style={{padding:"4px 10px",background:`${ASSESS.primary}15`,color:ASSESS.primary,border:`1px solid ${ASSESS.primary}30`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>👁 Ver</button>
                </div>
              ))}
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
                <button onClick={()=>onRedit(emp.fd)} style={{padding:"7px 14px",background:ASSESS.primary,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700}}>✏️ Nova proposta</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── PROPOSAL PAGE ─────────────────────────────────────────────────────────────
function ProposalPage({data,usuario,onClose}){
  const{nome,fat,credito,imovel,fins,urg,ranked,heResults,hubcSim,destinos,estResult,garantias,propCode,propDate,isManual,manParceiros,manTotal,racional,tipoArea,tipoPessoa}=data
  const isVarejo=tipoArea==="varejo"
  const PAL=isVarejo?VAREJO:ASSESS
  const top3=(ranked||[]).filter(p=>p.score>=45).slice(0,3)
  const rk=["linear-gradient(135deg,#f59e0b,#d97706)","linear-gradient(135deg,#94a3b8,#64748b)","linear-gradient(135deg,#cd7f32,#a0522d)"]
  const finsLabel=(Array.isArray(fins)?fins:[]).map(f=>FINS_MAP[f]||f).join(", ")
  const totalGarantias=(garantias||[]).filter(g=>g.nome).reduce((s,g)=>s+(Number(g.valor)||0),0)
  const TIPOS_G=[{v:"terreno",l:"Terreno"},{v:"rural",l:"Rural"},{v:"comercial",l:"Comercial"},{v:"residencial",l:"Residencial"}]

  const downloadHTML=()=>{
    const el=document.getElementById("proposal-print-area")
    if(!el)return
    const styles=`*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:10mm 12mm}@media print{.no-print{display:none!important}body{zoom:0.88}}@media screen{body{max-width:960px;margin:0 auto;padding:20px}.pb{position:fixed;top:0;left:0;right:0;background:#0a0a0a;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;z-index:999;border-bottom:2px solid #CCA67F}.ps{height:52px}.pbtn{padding:9px 22px;background:#CCA67F;color:#1a1a1a;border:none;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer}}`
    const bar=`<div class="pb no-print"><span style="color:#CCA67F;font-weight:700;font-size:13px">📄 Proposta ${propCode} · Áxicon</span><button class="pbtn" onclick="window.print()">🖨 Salvar como PDF</button></div><div class="ps no-print"></div>`
    const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Proposta ${propCode}</title><style>${styles}</style></head><body>${bar}${el.innerHTML}</body></html>`
    const blob=new Blob([html],{type:"text/html;charset=utf-8"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a")
    a.href=url;a.download=`Proposta_${propCode}_${(nome||"Axicon").replace(/\s+/g,"_")}.html`
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url)
  }

  return(
    <div style={{position:"fixed",inset:0,zIndex:3000,overflow:"auto",background:"#0a0a0a",fontFamily:FB}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(10,10,10,.97)",backdropFilter:"blur(10px)",borderBottom:`1px solid ${PAL.primary}40`,padding:"10px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <AxLogo height={32} variant="icon" dark/>
          <span style={{fontSize:13,color:SEC,fontWeight:700}}>Proposta {propCode}{isVarejo?" · Varejo":""}</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{background:`${SEC}20`,border:`1px solid ${SEC}40`,borderRadius:8,padding:"4px 14px",fontSize:12,color:SEC}}>🔗 <strong>{propCode}</strong></div>
          <a href={`${API}/proposta/${propCode}`} target="_blank" rel="noreferrer" style={{padding:"7px 16px",background:PAL.primary,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,textDecoration:"none"}}>🌐 Ver link</a>
          <button onClick={downloadHTML} style={{padding:"7px 16px",background:SEC,color:"#1a1a1a",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>⬇ Baixar</button>
          <button onClick={onClose} style={{padding:"7px 14px",background:"#222",color:"#aaa",border:"1px solid #333",borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      </div>

      <div id="proposal-print-area" style={{maxWidth:920,margin:"0 auto",padding:"0 20px 80px"}}>
        {/* HERO */}
        <div style={{background:isVarejo?`linear-gradient(150deg,#000D52,${VAREJO.primary}ee,${VAREJO.secondary})`:`linear-gradient(150deg,#0d0d0d,${ASSESS.primary}ee,${ASSESS.secondary})`,borderRadius:"0 0 28px 28px",padding:"64px 52px 52px",marginBottom:36}}>
          <AxLogo height={64} variant="full" dark style={{marginBottom:28}}/>
          <div style={{fontSize:10,color:SEC,letterSpacing:4,marginBottom:14}}>PROPOSTA COMERCIAL CONFIDENCIAL{isManual?" · PERSONALIZADA":""}{isVarejo?" · VAREJO":""}</div>
          <h1 style={{fontSize:"clamp(26px,4vw,46px)",fontWeight:700,color:"white",fontFamily:FT,margin:"0 0 12px",lineHeight:1.2}}>{isVarejo?"Home Equity · Consultoria":"Estruturação de Crédito"}</h1>
          <p style={{fontSize:16,color:SEC,fontFamily:FT,margin:"0 0 36px"}}>Estratégia Financeira Personalizada</p>
          <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
            {[["CLIENTE",nome||"—"],["CRÉDITO",fmtI(credito)],["DATA",propDate],["REF.",propCode]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"12px 20px",border:`1px solid ${SEC}20`}}>
                <div style={{fontSize:9,color:"#888",letterSpacing:2,marginBottom:4}}>{l}</div>
                <div style={{fontSize:15,color:"white",fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CONSULTOR */}
        <div style={{background:"white",borderRadius:20,padding:"24px 32px",marginBottom:24,display:"flex",alignItems:"center",gap:16,border:`1px solid ${PAL.primary}15`}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:18,flexShrink:0}}>{usuario?.nome?.[0]?.toUpperCase()||"A"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#aaa",letterSpacing:.5,marginBottom:2}}>SEU CONSULTOR ÁXICON</div>
            <div style={{fontSize:16,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>{usuario?.nome||"Consultor Áxicon"}</div>
            <div style={{fontSize:12,color:"#888",marginTop:2,display:"flex",gap:16,flexWrap:"wrap"}}>
              {usuario?.email&&<span>✉️ {usuario.email}</span>}
              {usuario?.telefone&&<span>📞 {usuario.telefone}</span>}
              <span>🌐 axiconsolucoes.com</span>
            </div>
          </div>
        </div>

        {/* CARTA */}
        <div style={{background:"white",borderRadius:20,padding:"40px 44px",marginBottom:28,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:isVarejo?`linear-gradient(90deg,${VAREJO.primary},${VAREJO.secondary},${VAREJO.accent})`:`linear-gradient(90deg,${ASSESS.primary},${SEC},${ASSESS.secondary})`}}/>
          <PSec title="Mensagem" varejo={isVarejo}/>
          <p style={{fontSize:15,color:"#333",lineHeight:1.9,marginBottom:14}}>Prezado(a) <strong>{nome}</strong>,</p>
          <p style={{fontSize:14,color:"#555",lineHeight:1.95,marginBottom:12}}>É com satisfação que apresentamos esta <strong>Proposta {isVarejo?"de Home Equity":"de Estruturação de Crédito"}</strong>, desenvolvida com base no diagnóstico preciso das suas necessidades financeiras.</p>
          <p style={{fontSize:14,color:"#555",lineHeight:1.95}}>A estratégia foi modelada para atender <strong>a totalidade das suas demandas</strong>, otimizando custos, prazos e garantias disponíveis.</p>
        </div>

        {/* PERFIL */}
        <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
          <PSec title="Perfil Financeiro" varejo={isVarejo}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[{l:"Empresa/Cliente",v:nome},{l:"Tipo",v:tipoPessoa==="pf"?"Pessoa Física":tipoPessoa==="pj"?"Pessoa Jurídica":"—"},{l:"Faturamento Anual",v:fmtI(fat)},{l:"Crédito Desejado",v:fmtI(credito)},{l:"Garantia",v:{proprio:"Próprio quitado",financiado:"Financiado",terceiro:"Terceiros",nao:"Sem imóvel"}[imovel]},{l:"Finalidade",v:finsLabel||"—"},{l:"Urgência",v:URGS.find(u=>u.v===urg)?.l}].map(it=>(
              <div key={it.l} style={{background:isVarejo?VAREJO.light:ASSESS.light,borderRadius:10,padding:"12px 16px",border:`1px solid ${PAL.primary}20`}}>
                <div style={{fontSize:10,color:"#999",marginBottom:3}}>{it.l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{it.v||"—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RACIONAL */}
        {racional&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:isVarejo?`linear-gradient(90deg,${VAREJO.secondary},${VAREJO.primary},${VAREJO.accent})`:`linear-gradient(90deg,${SEC},${ASSESS.primary},${ASSESS.secondary})`}}/>
            <PSec title="Racional da Operação" varejo={isVarejo}/>
            <p style={{fontSize:14,color:"#444",lineHeight:1.9,whiteSpace:"pre-wrap"}}>{racional}</p>
          </div>
        )}

        {/* GARANTIAS */}
        {garantias?.filter(g=>g.nome).length>0&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Garantias Oferecidas" varejo={isVarejo}/>
            {garantias.filter(g=>g.nome).map((g,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid #f0ede8"}}>
                <div style={{width:28,height:28,borderRadius:8,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{g.nome}</div>
                  <div style={{fontSize:11,color:"#aaa"}}>{TIPOS_G.find(t=>t.v===g.tipo)?.l||""}{g.cidade?` · ${g.cidade}`:""}</div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:PAL.primary,fontFamily:FT}}>{fmtI(Number(g.valor)||0)}</div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",marginTop:4}}>
              <span style={{fontSize:13,fontWeight:700}}>Total de Garantias</span>
              <span style={{fontSize:17,fontWeight:900,color:"#4caf50",fontFamily:FT}}>{fmtI(totalGarantias)}</span>
            </div>
            {totalGarantias>0&&<div style={{marginTop:8,fontSize:12,color:"#888",background:"#f8f5f0",padding:"8px 14px",borderRadius:8}}>
              LTV solicitado: <strong style={{color:PAL.primary}}>{((credito/totalGarantias)*100).toFixed(1)}%</strong> sobre o total de garantias
            </div>}
          </div>
        )}

        {/* MANUAL — ESTRUTURA POR PARCEIRO */}
        {isManual&&manParceiros?.filter(p=>p.nome).length>0&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Estrutura da Proposta" varejo={isVarejo}/>
            <div style={{background:`${PAL.primary}08`,borderRadius:12,padding:"14px 18px",marginBottom:18,border:`1px solid ${PAL.primary}20`}}>
              <div style={{fontSize:11,color:PAL.primary,fontWeight:700,marginBottom:4}}>CRÉDITO TOTAL ESTRUTURADO</div>
              <div style={{fontSize:22,fontWeight:900,color:PAL.primary,fontFamily:FT}}>{fmtI(manTotal)}</div>
            </div>
            {manParceiros.filter(p=>p.nome).map((parc,pi)=>{
              const hasOld=!parc.produtos
              if(hasOld){
                const val=parc.val||Number(String(parc.valor||"0").replace(/\D/g,""))
                const pct=manTotal>0?((val/manTotal)*100).toFixed(0):0
                return(
                  <div key={pi} style={{border:`1px solid ${PAL.primary}25`,borderRadius:14,padding:20,marginBottom:14,borderLeft:`4px solid ${PAL.primary}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:24,height:24,borderRadius:6,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800}}>{pi+1}</div>
                        <div style={{fontSize:15,fontWeight:800,fontFamily:FT}}>{parc.nome}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:900,color:PAL.primary,fontFamily:FT}}>{fmtI(val)}</div>
                        <div style={{fontSize:11,color:"#aaa"}}>{pct}% do total</div>
                      </div>
                    </div>
                    <div style={{height:4,background:"#f0ede8",borderRadius:10,marginBottom:12}}>
                      <div style={{height:4,borderRadius:10,width:`${pct}%`,background:`linear-gradient(90deg,${PAL.primary},${PAL.secondary})`}}/>
                    </div>
                    {(parc.price||parc.sac1)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(parc.sistema==="sac"||parc.sistema==="ambos")&&<SimBox label={`SAC ${parc.prazo}m — 1ª`} val={fmtR(parc.sac1)} color={PAL.primary}/>}
                      {(parc.sistema==="sac"||parc.sistema==="ambos")&&<SimBox label={`SAC ${parc.prazo}m — ÚLTIMA`} val={fmtR(parc.sacl)} color="#888"/>}
                      {(parc.sistema==="price"||parc.sistema==="ambos"||!parc.sistema)&&<SimBox label={`PRICE ${parc.prazo}m`} val={fmtR(parc.price)} color={PAL.secondary}/>}
                    </div>}
                  </div>
                )
              }
              const parcTotal=parc.produtos.reduce((s,pr)=>s+(pr.val||0),0)
              const pct=manTotal>0?((parcTotal/manTotal)*100).toFixed(0):0
              return(
                <div key={pi} style={{border:`1px solid ${PAL.primary}25`,borderRadius:14,padding:20,marginBottom:16,borderLeft:`4px solid ${PAL.primary}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${PAL.primary}15`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>{pi+1}</div>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,fontFamily:FT}}>{parc.nome}</div>
                        <div style={{fontSize:11,color:"#aaa"}}>{parc.produtos.length} produto{parc.produtos.length!==1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:18,fontWeight:900,color:PAL.primary,fontFamily:FT}}>{fmtI(parcTotal)}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{pct}% do total</div>
                    </div>
                  </div>
                  <div style={{height:3,background:"#f0ede8",borderRadius:10,marginBottom:14}}>
                    <div style={{height:3,borderRadius:10,width:`${pct}%`,background:`linear-gradient(90deg,${PAL.primary},${PAL.secondary})`}}/>
                  </div>
                  {parc.produtos.map((pr,ki)=>(
                    <div key={ki} style={{background:isVarejo?VAREJO.light:ASSESS.light,borderRadius:10,padding:14,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{pr.tipo||`Produto ${ki+1}`}</div>
                          <div style={{fontSize:11,color:PAL.primary,fontWeight:600}}>{pr.taxa}% a.a. · {pr.prazo}m{pr.obs?` · ${pr.obs}`:""}{pr.priceEhCustom?" · parcela personalizada":""}</div>
                        </div>
                        <div style={{fontSize:15,fontWeight:800,color:PAL.primary,fontFamily:FT}}>{fmtI(pr.val)}</div>
                      </div>
                      {(pr.price||pr.sac1)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
                        {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC ${pr.prazo}m — 1ª`} val={fmtR(pr.sac1)} color={PAL.primary}/>}
                        {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC ${pr.prazo}m — ÚLTIMA`} val={fmtR(pr.sacl)} color="#888"/>}
                        {(pr.sistema==="price"||pr.sistema==="ambos"||!pr.sistema)&&<SimBox label={`PRICE ${pr.prazo}m${pr.priceEhCustom?" ★":""}`} val={fmtR(pr.price)} color={PAL.secondary}/>}
                      </div>}
                    </div>
                  ))}
                </div>
              )
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",borderTop:`2px solid ${SEC}30`,background:`${SEC}08`,borderRadius:10}}>
              <span style={{fontSize:13,fontWeight:700}}>Total estruturado</span>
              <span style={{fontSize:17,fontWeight:900,color:PAL.primary,fontFamily:FT}}>{fmtI(manTotal)}</span>
            </div>
          </div>
        )}

        {/* COMPARATIVO */}
        {isManual&&manParceiros?.filter(p=>p.nome&&p.produtos?.length).length>0&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Comparativo de Opções" varejo={isVarejo}/>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:isVarejo?VAREJO.light:ASSESS.light}}>
                    {["PARCEIRO","PRODUTO","CRÉDITO","TAXA A.A.","PRAZO","PRICE / SAC 1ª","SAC ÚLTIMA"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:h==="PARCEIRO"||h==="PRODUTO"?"left":"right",fontSize:10,letterSpacing:1,color:PAL.primary,fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manParceiros.filter(p=>p.nome&&p.produtos?.length).flatMap((parc,pi)=>
                    parc.produtos.map((pr,ki)=>(
                      <tr key={`${pi}-${ki}`} style={{borderBottom:"1px solid #f0ede8",background:ki%2===0?"transparent":"rgba(0,0,0,.015)"}}>
                        <td style={{padding:"10px 14px",fontWeight:ki===0?800:400,color:ki===0?"#1a1a1a":"transparent",verticalAlign:"top",whiteSpace:"nowrap"}}>{parc.nome}</td>
                        <td style={{padding:"10px 14px",color:"#1a1a1a",fontWeight:600}}>{pr.tipo||"—"}</td>
                        <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:PAL.primary,fontFamily:FT,whiteSpace:"nowrap"}}>{fmtI(pr.val)}</td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:"#555",whiteSpace:"nowrap"}}>{pr.taxa}%</td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:"#555",whiteSpace:"nowrap"}}>{pr.prazo}m</td>
                        <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:PAL.primary,whiteSpace:"nowrap"}}>
                          {(pr.sistema==="price"||pr.sistema==="ambos"||!pr.sistema)?fmtR(pr.price):(pr.sistema==="sac"?fmtR(pr.sac1):"—")}
                          {pr.priceEhCustom&&<span style={{fontSize:9,color:"#aaa",marginLeft:4}}>★</span>}
                        </td>
                        <td style={{padding:"10px 14px",textAlign:"right",color:"#888",whiteSpace:"nowrap"}}>{(pr.sistema==="sac"||pr.sistema==="ambos")?fmtR(pr.sacl):"—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:`2px solid ${PAL.primary}30`,background:isVarejo?VAREJO.light:ASSESS.light}}>
                    <td colSpan={2} style={{padding:"10px 14px",fontWeight:800,color:"#1a1a1a",fontSize:12}}>TOTAL ESTRUTURADO</td>
                    <td colSpan={5} style={{padding:"10px 14px",textAlign:"right",fontWeight:900,color:PAL.primary,fontFamily:FT,fontSize:15}}>{fmtI(manTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {manParceiros.some(p=>p.produtos?.some(pr=>pr.priceEhCustom))&&(
              <div style={{marginTop:12,fontSize:11,color:"#aaa",padding:"6px 14px",background:"#f8f8f8",borderRadius:8}}>★ Parcela personalizada (informada diretamente pelo parceiro)</div>
            )}
          </div>
        )}

        {/* HE */}
        {heResults?.length>0&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Simulação Home Equity / CGI" varejo={isVarejo}/>
            {heResults.map((r,i)=>(
              <div key={i} style={{border:`1px solid ${VAREJO.primary}30`,borderRadius:14,padding:22,marginBottom:14,borderLeft:`4px solid ${VAREJO.primary}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                  <div><div style={{fontSize:15,fontWeight:800,fontFamily:FT}}>{r.name}</div><div style={{fontSize:11,color:VAREJO.primary,fontWeight:600}}>{(r.taxa*100).toFixed(2)}%a.m.+IPCA · LTV {r.ltv}%</div></div>
                  <div style={{fontSize:18,fontWeight:900,color:VAREJO.primary,fontFamily:FT}}>{fmtI(r.valor)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <SimBox label="SAC 240m — 1ª" val={fmtR(r.sac1)} color={VAREJO.primary}/>
                  <SimBox label="SAC 240m — ÚLTIMA" val={fmtR(r.sacl)} color="#888"/>
                  <SimBox label="PRICE 180m — FIXA" val={fmtR(r.price)} color={VAREJO.primary}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HUB-C */}
        {!isManual&&hubcSim&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Hub-C · Capital de Giro + Internacional" varejo={false}/>
            <div style={{border:"1px solid #55555530",borderRadius:14,padding:20,marginBottom:16,borderLeft:"4px solid #555"}}>
              <div style={{fontSize:12,color:"#555",fontWeight:700,marginBottom:10}}>🇧🇷 Capital de Giro Nacional · 18%a.a.</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:15,fontWeight:800,fontFamily:FT}}>Hub-C · Capital de Giro</div><div style={{fontSize:18,fontWeight:900,color:"#555",fontFamily:FT}}>{fmtI(hubcSim.valor)}</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><SimBox label="SAC 48m — 1ª" val={fmtR(hubcSim.sac1_48)} color="#555"/><SimBox label="SAC 48m — ÚLTIMA" val={fmtR(hubcSim.sacl_48)} color="#888"/><SimBox label="PRICE 48m — FIXA" val={fmtR(hubcSim.price48)} color="#555"/></div>
            </div>
            <div style={{background:"#f0f4ff",border:`1px solid ${ASSESS.primary}30`,borderRadius:14,padding:20,borderLeft:`4px solid ${ASSESS.primary}`}}>
              <div style={{fontSize:12,color:ASSESS.primary,fontWeight:700,marginBottom:12}}>🌎 Internacional · 9,7%a.a. · 108m · Carência até 3 anos</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div style={{background:"white",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:10,color:"#999",marginBottom:3}}>VALOR LÍQUIDO</div><div style={{fontSize:18,fontWeight:900,color:ASSESS.primary,fontFamily:FT}}>{fmtI(hubcSim.valor)}</div></div>
                <div style={{background:"white",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:10,color:"#999",marginBottom:3}}>VALOR BRUTO</div><div style={{fontSize:18,fontWeight:900,color:"#555",fontFamily:FT}}>{fmtI(hubcSim.valorBruto)}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                <SimBox label="PRICE 108m — FIXA" val={fmtR(hubcSim.price108)} color={ASSESS.primary}/>
                <SimBox label="SAC 108m — 1ª" val={fmtR(hubcSim.sac1_108)} color={ASSESS.primary}/>
                <SimBox label="SAC 108m — ÚLTIMA" val={fmtR(hubcSim.sacl_108)} color="#888"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>ORIGINAÇÃO (0,5%)</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>{fmtI(hubcSim.originacao)}</div></div>
                <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>TRC (USD)</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>U$ {hubcSim.trcUSD?.toLocaleString("pt-BR")}</div></div>
                <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>1ª TRANCHE (90d)</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>{fmtI(hubcSim.tranche1)}</div></div>
              </div>
              <div style={{fontSize:11,color:ASSESS.primary,background:"#dde5ff",padding:"7px 12px",borderRadius:8,fontWeight:600}}>⏳ Carência padrão 1 ano · Negociável até 3 anos · Via Fundo Internacional</div>
            </div>
          </div>
        )}

        {/* PARCEIROS ASSESSORIA */}
        {!isManual&&top3.length>0&&(
          <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
            <PSec title="Parceiros Recomendados"/>
            {top3.map((p,i)=>(
              <div key={p.id} style={{border:`1px solid ${p.color}30`,borderRadius:14,padding:22,marginBottom:14,borderLeft:`4px solid ${p.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:10,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:12}}>{p.logo}</div>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,fontFamily:FT}}>{p.name}</div><div style={{fontSize:11,color:"#888"}}>{p.cat}</div></div>
                  <div style={{width:26,height:26,borderRadius:"50%",background:rk[i],display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800}}>#{i+1}</div>
                </div>
                <div style={{fontSize:12,color:"#555",background:"#f8f5f0",padding:"8px 12px",borderRadius:8,whiteSpace:"pre-line",lineHeight:1.6}}>📋 {p.conds}</div>
              </div>
            ))}
          </div>
        )}

        {/* PRÓXIMOS PASSOS */}
        <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
          <PSec title="Próximos Passos" varejo={isVarejo}/>
          {[{n:"01",t:"Alinhamento",d:"Reunião para validação da estratégia.",p:"Imediato"},{n:"02",t:"Mandato",d:"Formalização via contrato.",p:"Até 5 dias"},{n:"03",t:"Documentação",d:"Checklist e organização do dossiê.",p:"5–10 dias"},{n:"04",t:"Submissão",d:"Envio para análise e pré-aprovação.",p:"10–15 dias"},{n:"05",t:"Liberação",d:"Contratos e liberação dos recursos.",p:"30–60 dias"}].map((s,i,arr)=>(
            <div key={s.n} style={{display:"flex",gap:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginRight:16}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:800,flexShrink:0}}>{s.n}</div>
                {i<arr.length-1&&<div style={{width:2,flex:1,background:`${PAL.primary}20`,minHeight:18,margin:"3px 0"}}/>}
              </div>
              <div style={{paddingBottom:18,flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:FT}}>{s.t}</div>
                  <span style={{fontSize:10,background:`${SEC}40`,color:ASSESS.primary,padding:"2px 10px",borderRadius:20,fontWeight:600}}>{s.p}</span>
                </div>
                <div style={{fontSize:13,color:"#666"}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* BRIEF ÁXICON */}
        <div style={{background:"white",borderRadius:20,padding:"32px 40px",marginBottom:28}}>
          <PSec title="Sobre a Áxicon" varejo={isVarejo}/>
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
            <AxLogo height={56} variant="full" dark={false} style={{filter:"none"}}/>
          </div>
          <p style={{fontSize:14,color:"#555",lineHeight:1.9,marginBottom:24}}>
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
              <div key={v.t} style={{background:isVarejo?VAREJO.light:ASSESS.light,borderRadius:10,padding:16,border:"1px solid "+PAL.primary+"15"}}>
                <div style={{fontSize:10,color:PAL.primary,letterSpacing:2,fontWeight:700,marginBottom:6}}>{v.t}</div>
                <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>{v.d}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:24,fontSize:12,color:"#999",flexWrap:"wrap"}}>
            <span>📱 (44) 9.9114-72366</span>
            <span>🌐 www.axiconsolucoes.com</span>
            <span>📸 @axicon.solucoes</span>
          </div>
        </div>

        {/* RODAPÉ */}
        <div style={{background:"#0a0a0a",borderRadius:20,padding:"32px 40px",textAlign:"center",border:`1px solid ${SEC}25`}}>
          <AxLogo height={52} variant="full" dark style={{margin:"0 auto 12px"}}/>
          <div style={{fontSize:11,color:"#666",marginBottom:16}}>Inteligência Financeira · Performance · Governança</div>
          <div style={{display:"flex",justifyContent:"center",gap:24,fontSize:12,color:"#888",flexWrap:"wrap",marginBottom:8}}>
            <span>📍 Maringá, PR</span>
            <span>📞 {usuario?.telefone||"(44) 9 9114-7236"}</span>
            <span>✉️ {usuario?.email||"master@axiconsolucoes.com"}</span>
            <span>🌐 axiconsolucoes.com</span>
          </div>
          <div style={{fontSize:11,color:"#444",marginTop:8}}>Proposta nº <strong style={{color:SEC}}>{propCode}</strong> · Válida por 30 dias · Emitida em {propDate} por <strong style={{color:SEC}}>{usuario?.nome}</strong></div>
        </div>
      </div>
    </div>
  )
}

// ── DIAG SCREEN ───────────────────────────────────────────────────────────────
const FD0={nome:"",setor:"",anos:"",imovel:"nao",fat:"",credito:"",recebiveis:"",aplicacoes:"",fins:[],urg:"",tipoPessoa:"",cnpj:"",cpf:"",nomeFantasia:""}

function DiagScreen({usuario,token,onHome,onProposal,prefFd,tipoArea}){
  const isVarejo=tipoArea==="varejo"
  const PAL=isVarejo?VAREJO:ASSESS

  const[step,setStep]=useState(0)
  const[fd,setFd]=useState(prefFd?{...FD0,...prefFd,fins:Array.isArray(prefFd.fins)?prefFd.fins:[],tipoPessoa:prefFd.tipoPessoa||""}:FD0)
  const[garantias,setGarantias]=useState(prefFd?.garantias||[{nome:"",tipo:"",cidade:"",valor:""}])
  const[ranked,setRanked]=useState(null)
  const[heResults,setHeResults]=useState([])
  const[hubcSim,setHubcSim]=useState(null)
  const[destinos,setDest]=useState([{desc:"",val:""}])
  const[racional,setRacional]=useState("")
  const[estResult,setEstResult]=useState(null)
  const[cenarioSel,setCenarioSel]=useState(0)
  const[feeP,setFeeP]=useState({})
  const[abaResult,setAbaResult]=useState("auto")
  const[manParceiros,setManParceiros]=useState([{nome:"",produtos:[{tipo:"",valor:"",taxa:"",prazo:"",sistema:"price",parcelaCustom:"",obs:""}]}])
  const[manDestinos,setManDestinos]=useState([{desc:"",val:""}])
  const[manSims,setManSims]=useState([])
  const[salvando,setSalvando]=useState(false)
  const[proposal,setProposal]=useState(null)

  const[buscandoCNPJ,setBuscandoCNPJ]=useState(false)
  const[erroCNPJ,setErroCNPJ]=useState("")

  const sf=(k,v)=>setFd(p=>({...p,[k]:v}))
  const toggleFin=v=>setFd(p=>({...p,fins:p.fins.includes(v)?p.fins.filter(f=>f!==v):[...p.fins,v]}))
  const canNext=()=>{if(step===0)return fd.nome&&fd.setor&&fd.anos;if(step===1)return fd.fat&&fd.credito;if(step===2)return fd.fins.length>0&&fd.urg;return false}

  const buscarCNPJ=async()=>{
    const limpo=(fd.cnpj||"").replace(/\D/g,"")
    if(limpo.length!==14){setErroCNPJ("CNPJ deve ter 14 dígitos");return}
    setBuscandoCNPJ(true);setErroCNPJ("")
    try{
      const res=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`)
      if(!res.ok){setErroCNPJ(res.status===404?"CNPJ não encontrado":"Erro ao consultar");setBuscandoCNPJ(false);return}
      const d=await res.json()
      const fmt=limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5")
      setFd(p=>({...p,
        cnpj:fmt,
        nome:d.razao_social||d.nome_fantasia||p.nome,
        nomeFantasia:(d.nome_fantasia&&d.nome_fantasia!==d.razao_social)?d.nome_fantasia:p.nomeFantasia,
        anos:d.data_inicio_atividade?String(Math.floor((new Date()-new Date(d.data_inicio_atividade))/(1000*60*60*24*365))):p.anos,
        setor:(()=>{const c=Math.floor((d.cnae_fiscal||0)/100);if(c>=1&&c<=9)return"agronegocio";if(c>=10&&c<=33)return"industria";if(c>=41&&c<=43)return"construcao";if(c>=45&&c<=47)return"comercio";if(c>=49&&c<=53)return"transporte";if(c>=55&&c<=56)return"alimenticio";if(c>=58&&c<=63)return"tecnologia";if(c>=75&&c<=77)return"saude";if(c>=85&&c<=88)return"educacao";return p.setor||"servicos"})(),
      }))
    }catch(e){setErroCNPJ("Falha na conexão")}
    setBuscandoCNPJ(false)
  }

  const doRank=()=>{
    const vi=fd.imovel!=="nao"?garantias.reduce((s,g)=>s+Number(g.valor||0),0):0
    const cityOk=fd.imovel!=="nao"&&garantias.some(g=>(getCityPop(g.cidade)||0)>=50000)
    const d={fat:Number(fd.fat)||0,credito:Number(fd.credito)||0,anos:Number(fd.anos)||0,setor:fd.setor,imovel:fd.imovel,fins:fd.fins,urg:fd.urg,vi,cityOk}
    const r=PARTNERS.map(p=>{const raw=p.score(d);const al=p.alerts.filter(a=>a.c(d)).map(a=>a.m);return{...p,score:Math.max(0,Math.min(100,raw-al.length*20)),al}}).sort((a,b)=>b.score-a.score)
    setRanked(r)
    if(fd.imovel!=="nao"){const cred=Number(fd.credito)||0;setHeResults(r.filter(p=>p.isHE&&p.score>=30).map(p=>{const val=Math.min(cred,p.heMax);return{...p,valor:val,ltv:p.heLTV,price:CP(val,p.taxa,180),sac1:CS1(val,p.taxa,240),sacl:CSL(val,p.taxa,240),ltvPct:vi>0?((val/vi)*100).toFixed(1):null}}))}else setHeResults([])
    if(!isVarejo){
      const cred=Number(fd.credito)||0
      const hubcP=r.find(p=>p.id==="hubc")
      if(hubcP&&hubcP.score>=20&&cred>=100000&&(Number(fd.fat)||0)>=3600000){
        const tm18=taxaMes(0.18);const tm97=taxaMes(0.097)
        const vb=cred*1.2105;const trc=cred<=8000000?17000:cred<=20000000?Math.round(17000+(cred-8000000)/12000000*3000):Math.round(20000+(cred-20000000)/10000000*3000)
        setHubcSim({valor:cred,valorBruto:vb,originacao:vb*0.005,trcUSD:trc,tranche1:vb/3,sac1_48:CS1(cred,tm18,48),sacl_48:CSL(cred,tm18,48),price48:CP(cred,tm18,48),price108:CP(vb,tm97,108),sac1_108:CS1(vb,tm97,108),sacl_108:CSL(vb,tm97,108)})
      }else setHubcSim(null)
    }
    setStep(3)
  }

  const doEst=()=>{
    const valid=destinos.filter(d=>d.desc&&parseFloat(d.val)>0);if(!valid.length)return
    const total=valid.reduce((s,d)=>s+parseFloat(d.val)*1000000,0)
    const fat=Number(fd.fat)||0;const anos=Number(fd.anos)||0;const setor=fd.setor;const temIm=fd.imovel!=="nao"
    const mfm=setor==="construcao"?18000000:36000000
    const S={
      trinus:r=>temIm&&r>0?{p:"Trinus.co",val:Math.min(r,20000000),taxa:"1,39%a.m.+IPCA"}:null,
      pontte:r=>temIm&&fat>=3600000&&r>0?{p:"Pontte",val:Math.min(r,3000000),taxa:"1,19%a.m.+IPCA"}:null,
      multiplike:r=>fat>=mfm&&anos>=5&&r>0?{p:"Multiplike (CRI/CRA)",val:r,taxa:"CDI+"}:null,
      multA:r=>fat>=mfm*.5&&anos>=3&&r>0?{p:"Multiplike* (análise)",val:r,taxa:"CDI+"}:null,
      ecoagro:r=>["agronegocio","rural","alimenticio"].includes(setor)&&r>=20000000?{p:"EcoAgro (CRA)",val:r,taxa:"CDI+"}:null,
      hubc:r=>fat>=3600000&&r>0?{p:"Hub-C (9,7%a.a.·108m)",val:r,taxa:"9,7%a.a."}:null,
      intCom:r=>fat>=36000000&&r>0?{p:"Int. Comercial (USD/EUR)",val:r,taxa:"3–12%a.a."}:null,
      oporto:r=>fat>=36000000&&anos>=5&&r>0?{p:"Oporto Forte (USD/EUR)",val:r,taxa:"3–12%a.a."}:null,
    }
    const build=steps=>{let rest=total;const parc=[];const usados=new Set();for(const fn of steps){if(rest<=0)break;const item=fn(rest);if(item&&item.val>0&&!usados.has(item.p)){parc.push(item);rest-=item.val;usados.add(item.p)}}if(rest>0)parc.push({p:"⚠️ Sem alocação",val:rest,taxa:"—"});return{parc,coberto:total-Math.max(0,rest)}}
    setEstResult({total,racional,cenarios:[
      {id:0,nome:"Cenário A — Garantia Imobiliária",icone:"🏠",desc:"Âncora no imóvel. Menor taxa.",cor:ASSESS.primary,...build([S.trinus,S.pontte,S.multiplike,S.ecoagro,S.intCom,S.hubc,S.multA])},
      {id:1,nome:"Cenário B — Mercado de Capitais",icone:"📈",desc:"CRI/CRA como estrutura principal.",cor:ASSESS.secondary,...build([S.multiplike,S.ecoagro,S.trinus,S.pontte,S.intCom,S.hubc,S.multA])},
      {id:2,nome:"Cenário C — Velocidade + Mix",icone:"⚡",desc:"Hub-C libera em 48h.",cor:"#2E7D32",...build([S.hubc,S.trinus,S.pontte,S.multiplike,S.ecoagro,S.intCom,S.multA])},
      {id:3,nome:"Cenário D — Internacional",icone:"🌎",desc:"9,7%a.a. · 108m · Carência.",cor:"#8B1A1A",...build([S.hubc,S.intCom,S.oporto,S.trinus,S.multiplike,S.ecoagro,S.multA])},
    ]});setCenarioSel(0);setFeeP({})
  }

  const calcManSims=()=>{
    const result=manParceiros.filter(p=>p.nome).map(parc=>{
      const prods=parc.produtos.filter(pr=>pr.valor&&pr.taxa&&pr.prazo).map(pr=>{
        const val=Number(String(pr.valor).replace(/\D/g,""))
        const tm=taxaMes(parseFloat(pr.taxa)/100)
        const n=parseInt(pr.prazo)
        const custVal=pr.parcelaCustom?Number(String(pr.parcelaCustom).replace(/\D/g,"")):0
        return{...pr,val,price:custVal||CP(val,tm,n),sac1:CS1(val,tm,n),sacl:CSL(val,tm,n),priceEhCustom:custVal>0}
      })
      return{nome:parc.nome,produtos:prods}
    }).filter(p=>p.produtos.length)
    setManSims(result)
  }

  const openProposal=async(isManualMode=false)=>{
    setSalvando(true)
    const code=genCode()
    const sims=isManualMode?(manSims.length?manSims:manParceiros.filter(p=>p.nome).map(parc=>({nome:parc.nome,produtos:parc.produtos.filter(pr=>pr.valor).map(pr=>({...pr,val:Number(String(pr.valor||"0").replace(/\D/g,""))}))})).filter(p=>p.produtos.length)):null
    const data={
      nome:fd.nome,setor:fd.setor,credito:Number(fd.credito),fat:Number(fd.fat),
      imovel:fd.imovel,fins:fd.fins,urg:fd.urg,racional,tipoArea,tipoPessoa:fd.tipoPessoa||"",
      ranked:isManualMode?null:ranked,heResults:isManualMode?[]:heResults,hubcSim:isManualMode?null:hubcSim,
      destinos:isManualMode?manDestinos.filter(d=>d.desc&&parseFloat(d.val)>0):destinos.filter(d=>d.desc&&parseFloat(d.val)>0),
      estResult:isManualMode?null:estResult,garantias:garantias.filter(g=>g.nome),
      manParceiros:isManualMode?sims:null,manTotal:isManualMode?sims?.reduce((s,parc)=>s+(parc.produtos||[]).reduce((ss,pr)=>ss+(pr.val||0),0),0):null,
      propCode:code,propDate:today(),isManual:isManualMode
    }
    try{
      await fetch(`${API}/api/proposta`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({codigo:code,dados:data,crm:{nomeKey:fd.nome.trim().toLowerCase(),nome:fd.nome,dados:{nomeKey:fd.nome.trim().toLowerCase(),nome:fd.nome,setor:fd.setor,fat:Number(fd.fat)||0,credito:Number(fd.credito)||0,criado:nowTs(),ultimaAtualizacao:nowTs(),propostas:[{code,data:today(),credito:Number(fd.credito)||0}],fd:{...fd,tipo:tipoArea,garantias}}}})})
      if(prefFd?.negocioId){
        try{
          const r=await fetch(`${API}/api/crm-dados`,{headers:{Authorization:`Bearer ${token}`}})
          if(r.ok){
            const blob=(await r.json()).dados||{}
            const negs=Array.isArray(blob.negocios)?blob.negocios:[]
            const negIdx=negs.findIndex(x=>x.id===prefFd.negocioId)
            if(negIdx>=0){
              const neg=negs[negIdx]
              const propostasAntigas=neg.campos_extras?.propostas||[]
              const novasProp=[...propostasAntigas,{code,data:today(),credito:Number(fd.credito)||0,link:`/proposta/${code}`}]
              const negAtualizado={...neg,campos_extras:{...(neg.campos_extras||{}),propostas:novasProp}}
              const negsAtualizados=negs.map((x,i)=>i===negIdx?negAtualizado:x)
              await fetch(`${API}/api/crm-dados`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
                body:JSON.stringify({dados:{...blob,negocios:negsAtualizados}})})
            }
          }
        }catch(e2){console.warn('Erro ao salvar proposta no negócio CRM:',e2)}
      }
      window.open(`${API}/proposta/${code}`,"_blank")
    }catch(e){console.warn(e)}
    setSalvando(false)
    setProposal(data)
  }

  const badge=s=>{if(s>=75)return{l:"Alta Aderência",bg:"#e8f5e9",c:"#1b5e20"};if(s>=45)return{l:"Média Aderência",bg:"#fff8e1",c:"#795548"};if(s>=15)return{l:"Baixa Aderência",bg:"#ffebee",c:"#b71c1c"};return{l:"Não Elegível",bg:"#f5f5f5",c:"#757575"}}
  const STEPS=["Dados","Financeiro","Necessidade"]

  // Filtra parceiros: varejo só mostra HE
  const partnersToShow=isVarejo?PARTNERS.filter(p=>p.isHE):PARTNERS

  const stepperLine=(i)=>{
    const done=i<step
    return <div style={{height:2,flex:1,margin:"0 10px",marginTop:-20,borderRadius:2,background:done?PAL.primary:"rgba(113,63,42,0.12)"}}/>
  }

  return(
    <div style={{minHeight:"calc(100vh - 60px)",background:"#F5F1EC",fontFamily:FB}}>
      {proposal&&<ProposalPage data={proposal} usuario={usuario} onClose={()=>setProposal(null)}/>}

      {/* Breadcrumb */}
      <div style={{background:"white",borderBottom:"1px solid rgba(113,63,42,0.12)",padding:"0 28px",height:48,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onHome} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11,letterSpacing:2,textTransform:"uppercase",padding:0}}>Início</button>
        <span style={{color:"rgba(0,0,0,0.18)"}}>›</span>
        <span style={{fontSize:11,color:PAL.primary,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>{isVarejo?"Varejo · Home Equity":"Atacado · Diagnóstico"}</span>
      </div>

      <div style={{maxWidth:880,margin:"32px auto 56px",padding:"0 24px"}}>
        {/* Page heading */}
        {step<3&&<div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:PAL.primary,fontWeight:600,marginBottom:10}}>{isVarejo?"Varejo · Home Equity":"Atacado · Diagnóstico"}</div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:36,letterSpacing:.5,lineHeight:1.1,color:"#1a1a1a",margin:0}}>{isVarejo?"Estruture o ":("Estruture um ")}<em style={{fontStyle:"italic",color:PAL.primary,fontWeight:300}}>{isVarejo?"cliente":"novo cliente"}</em></h1>
          <p style={{fontSize:13,color:"#888",marginTop:8}}>Três etapas para mapear o perfil e gerar cenários estratégicos.</p>
        </div>}

        {/* Stepper */}
        {step<3&&<div style={{background:"white",borderRadius:18,padding:"28px 36px 24px",boxShadow:"0 1px 0 rgba(113,63,42,0.12), 0 24px 60px -30px rgba(113,63,42,0.20)",border:"1px solid rgba(113,63,42,0.10)",marginBottom:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",alignItems:"center",marginBottom:28}}>
            {STEPS.map((s,i)=>[
              <div key={`step-${i}`} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{
                  width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:600,transition:"all .18s",
                  ...(i<step
                    ? {background:PAL.primary,border:`1.5px solid ${PAL.primary}`,color:"white"}
                    : i===step
                    ? {background:"white",border:`1.5px solid ${PAL.primary}`,color:PAL.primary,boxShadow:`0 0 0 4px ${PAL.primary}1a`}
                    : {background:"white",border:"1.5px solid rgba(113,63,42,0.25)",color:"#888"})
                }}>
                  {i<step
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><path d="M5 12l5 5L20 7"/></svg>
                    : i+1}
                </div>
                <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",fontWeight:i===step?600:500,color:i===step?PAL.primary:i<step?PAL.primary:"#888"}}>{s}</div>
              </div>,
              i<STEPS.length-1&&<div key={`line-${i}`} style={{height:2,width:60,borderRadius:2,background:i<step?PAL.primary:"rgba(113,63,42,0.12)",marginTop:-20}}/>
            ])}
          </div>

        {/* STEP 0 */}
        {step===0&&<div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",marginBottom:4}}>{isVarejo?"Dados do cliente":"Dados da empresa"}</div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>Informações básicas para o diagnóstico.</div>
          <div style={{height:1,background:`linear-gradient(to right, ${PAL.accent||SEC}, transparent)`,opacity:.35,marginBottom:22}}/>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FL l="TIPO DE PESSOA *"><RG opts={[{v:"pf",l:"Pessoa Física (PF)"},{v:"pj",l:"Pessoa Jurídica (PJ)"}]} val={fd.tipoPessoa} onChange={v=>sf("tipoPessoa",v)} varejo={isVarejo}/></FL>

            {/* ── PJ ── */}
            {fd.tipoPessoa==="pj"&&<>
              <FL l="CNPJ *">
                <div style={{display:"flex",gap:8}}>
                  <input value={fd.cnpj} onChange={e=>sf("cnpj",e.target.value)} placeholder="00.000.000/0001-00" style={{...iSt,flex:1}}
                    onKeyDown={e=>e.key==="Enter"&&buscarCNPJ()}/>
                  <button onClick={buscarCNPJ} disabled={buscandoCNPJ||!fd.cnpj}
                    style={{padding:"10px 18px",background:buscandoCNPJ?"#aaa":PAL.primary,color:"white",border:"none",borderRadius:8,cursor:buscandoCNPJ?"not-allowed":"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"background .15s"}}>
                    {buscandoCNPJ?"⏳ Buscando…":"🔍 Buscar"}
                  </button>
                </div>
                {erroCNPJ&&<div style={{color:"#b71c1c",fontSize:11,marginTop:4}}>{erroCNPJ}</div>}
              </FL>
              <FL l="RAZÃO SOCIAL *"><input value={fd.nome} onChange={e=>sf("nome",e.target.value)} placeholder="Preenchido automaticamente ao buscar o CNPJ" style={iSt}/></FL>
              {fd.nomeFantasia&&<FL l="NOME FANTASIA"><input value={fd.nomeFantasia} onChange={e=>sf("nomeFantasia",e.target.value)} style={iSt}/></FL>}
            </>}

            {/* ── PF ── */}
            {fd.tipoPessoa==="pf"&&<>
              <FL l="NOME DO CLIENTE *"><input value={fd.nome} onChange={e=>sf("nome",e.target.value)} placeholder="Ex: Maria Aparecida Ferreira" style={iSt}/></FL>
              <FL l="CPF (opcional)"><input value={fd.cpf} onChange={e=>sf("cpf",e.target.value)} placeholder="000.000.000-00" style={iSt}/></FL>
            </>}

            {/* ── Sem tipo selecionado ── */}
            {!fd.tipoPessoa&&<FL l="NOME / RAZÃO SOCIAL *"><input value={fd.nome} onChange={e=>sf("nome",e.target.value)} placeholder="Selecione o tipo de pessoa acima" style={{...iSt,opacity:.6}} disabled/></FL>}

            <Grid2>
              <FL l="SETOR *"><select value={fd.setor} onChange={e=>sf("setor",e.target.value)} style={iSt}><option value="">Selecione...</option>{SETORES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></FL>
              <FL l={fd.tipoPessoa==="pj"?"TEMPO DE EMPRESA (anos) *":isVarejo?"TEMPO DE RESIDÊNCIA (anos) *":"TEMPO DE EMPRESA (anos) *"}><input type="number" value={fd.anos} onChange={e=>sf("anos",e.target.value)} placeholder="Ex: 8" style={iSt}/></FL>
            </Grid2>
            <FL l="SITUAÇÃO DO IMÓVEL *"><RG opts={IMOVEL_OPTS} val={fd.imovel} onChange={v=>sf("imovel",v)} varejo={isVarejo}/></FL>
            {fd.imovel!=="nao"&&<div style={{background:isVarejo?VAREJO.light:ASSESS.light,borderRadius:12,padding:16,border:`1px dashed ${PAL.primary}40`}}>
              <div style={{fontSize:11,fontWeight:700,color:PAL.primary,marginBottom:12}}>🏠 IMÓVEIS / GARANTIAS</div>
              {garantias.map((g,i)=>{const pop=getCityPop(g.cidade);return(
                <div key={i} style={{background:"white",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${PAL.primary}20`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:700}}>Garantia {i+1}</span>
                    {garantias.length>1&&<button onClick={()=>setGarantias(garantias.filter((_,j)=>j!==i))} style={{padding:"3px 8px",border:"1px solid #ddd",borderRadius:6,background:"white",color:"#999",cursor:"pointer",fontSize:11}}>✕</button>}
                  </div>
                  <Grid2>
                    <FL l="NOME"><input placeholder="Ex: Sede Comercial Centro" value={g.nome} onChange={e=>{const ng=[...garantias];ng[i]={...ng[i],nome:e.target.value};setGarantias(ng)}} style={iSt}/></FL>
                    <FL l="TIPO"><select value={g.tipo} onChange={e=>{const ng=[...garantias];ng[i]={...ng[i],tipo:e.target.value};setGarantias(ng)}} style={iSt}><option value="">Selecione...</option>{TIPOS_GARANTIA.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></FL>
                  </Grid2>
                  <Grid2>
                    <FL l="CIDADE">
                      <input placeholder="Ex: Campinas" value={g.cidade} onChange={e=>{const ng=[...garantias];ng[i]={...ng[i],cidade:e.target.value};setGarantias(ng)}} style={iSt}/>
                      {g.cidade&&pop&&<div style={{marginTop:4,fontSize:11,padding:"3px 10px",borderRadius:6,display:"inline-block",background:pop>=50000?"#e8f5e9":"#fff8e1",color:pop>=50000?"#2e7d32":"#795548",fontWeight:600}}>{fmtPop(pop)} {pop>=50000?"✅":"⚠️"}</div>}
                    </FL>
                    <FL l="VALOR (R$)"><PfxFmt pre="R$" val={g.valor} onChange={v=>{const ng=[...garantias];ng[i]={...ng[i],valor:v};setGarantias(ng)}} ph="3.500.000"/></FL>
                  </Grid2>
                </div>)})}
              <button onClick={()=>setGarantias(p=>[...p,{nome:"",tipo:"",cidade:"",valor:""}])} style={{padding:"8px 16px",border:`1.5px dashed ${PAL.primary}`,borderRadius:8,background:`${PAL.primary}10`,color:PAL.primary,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Adicionar imóvel</button>
            </div>}
          </div>
          <BtnRow onBack={null} onNext={()=>setStep(1)} dis={!canNext()} nxt="Próximo →" varejo={isVarejo}/>
        </div>}

        {/* STEP 1 */}
        {step===1&&<div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",marginBottom:4}}>Perfil financeiro</div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>Volumes, garantias e situação atual.</div>
          <div style={{height:1,background:`linear-gradient(to right, ${PAL.accent||SEC}, transparent)`,opacity:.35,marginBottom:22}}/>

          <Grid2>
            <FL l={isVarejo?"RENDA ANUAL *":"FATURAMENTO ANUAL *"}><PfxFmt pre="R$/ano" val={fd.fat} onChange={v=>sf("fat",v)} ph="8.000.000"/></FL>
            <FL l="CRÉDITO DESEJADO *"><PfxFmt pre="R$" val={fd.credito} onChange={v=>sf("credito",v)} ph="4.500.000"/></FL>
            <FL l={isVarejo?"RENDA MENSAL COMPROVADA":"RECEBÍVEIS MENSAIS"}><PfxFmt pre="R$" val={fd.recebiveis} onChange={v=>sf("recebiveis",v)} ph="450.000"/></FL>
            <FL l="APLICAÇÕES FINANCEIRAS"><PfxFmt pre="R$" val={fd.aplicacoes} onChange={v=>sf("aplicacoes",v)} ph="200.000"/></FL>
          </Grid2>
          <BtnRow onBack={()=>setStep(0)} onNext={()=>setStep(2)} dis={!canNext()} nxt="Próximo →" varejo={isVarejo}/>
        </div>}

        {/* STEP 2 */}
        {step===2&&<div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",marginBottom:4}}>Necessidade</div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>Finalidade e prazo da operação.</div>
          <div style={{height:1,background:`linear-gradient(to right, ${PAL.accent||SEC}, transparent)`,opacity:.35,marginBottom:22}}/>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FL l="FINALIDADE *"><MS opts={FINS} val={fd.fins} onChange={toggleFin} varejo={isVarejo}/></FL>
            <FL l="URGÊNCIA *"><RG opts={URGS} val={fd.urg} onChange={v=>sf("urg",v)} varejo={isVarejo}/></FL>
          </div>
          <BtnRow onBack={()=>setStep(1)} onNext={doRank} dis={!canNext()} nxt="🔍 Analisar" last varejo={isVarejo}/>
        </div>}
        </div>}

        {/* STEP 3 */}
        {step===3&&ranked&&<div>
          <div style={{background:isVarejo?VAREJO.dark:ASSESS.dark,borderRadius:14,padding:20,marginBottom:20,borderLeft:`4px solid ${SEC}`}}>
            <div style={{fontSize:10,color:SEC,letterSpacing:2,marginBottom:10}}>DIAGNÓSTICO — {fd.nome.toUpperCase()}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {[["Fat./Renda",fmtI(fd.fat)],["Crédito",fmtI(fd.credito)],["Imóvel",{proprio:"Próprio quitado",financiado:"Financiado",terceiro:"Terceiros",nao:"Não possui"}[fd.imovel]]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:10,color:"#888"}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:SEC,fontFamily:FT}}>{v}</div></div>
              ))}
            </div>
          </div>

          {/* ABAS — cenarios.html tab style */}
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
            <div style={{display:"flex",background:"white",padding:6,borderRadius:14,border:"1px solid rgba(113,63,42,0.12)",gap:4}}>
              {[{id:"auto",l:"Diagnóstico Automático"},{id:"manual",l:"Proposta Manual"}].map(a=>(
                <button key={a.id} onClick={()=>setAbaResult(a.id)} style={{padding:"11px 22px",borderRadius:9,fontSize:12,letterSpacing:1,fontWeight:500,color:abaResult===a.id?"white":"#555",background:abaResult===a.id?PAL.primary:"transparent",border:0,cursor:"pointer",fontFamily:FB,boxShadow:abaResult===a.id?`0 8px 18px -10px ${PAL.primary}88`:"none",transition:"all .15s"}}>{a.l}</button>
              ))}
            </div>
          </div>

          {/* ABA MANUAL */}
          {abaResult==="manual"&&<div>
            <SecBanner title="✏️ Parceiros e Produtos" varejo={isVarejo}/>
            <div style={{background:"white",borderRadius:14,padding:22,marginBottom:12}}>
              {manParceiros.map((parc,pi)=>(
                <div key={pi} style={{background:isVarejo?VAREJO.light:ASSESS.light,borderRadius:12,padding:16,marginBottom:14,border:`1px solid ${PAL.primary}20`}}>
                  {/* Cabeçalho do parceiro */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{width:24,height:24,borderRadius:6,background:PAL.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800,flexShrink:0}}>{pi+1}</div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:11,fontWeight:700,color:PAL.primary,display:"block",marginBottom:4}}>PARCEIRO {pi+1}</label>
                      <input placeholder="Nome do parceiro (ex: Trinus.co, Pontte...)" value={parc.nome} onChange={e=>{const n=[...manParceiros];n[pi]={...n[pi],nome:e.target.value};setManParceiros(n)}} style={iSt}/>
                    </div>
                    {manParceiros.length>1&&<button onClick={()=>setManParceiros(p=>p.filter((_,j)=>j!==pi))} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:8,background:"white",color:"#999",cursor:"pointer",fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>✕ Remover</button>}
                  </div>

                  {/* Produtos do parceiro */}
                  {parc.produtos.map((pr,ki)=>(
                    <div key={ki} style={{background:"white",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${PAL.primary}15`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <span style={{fontSize:12,fontWeight:700,color:PAL.primary}}>Produto {ki+1}</span>
                        {parc.produtos.length>1&&<button onClick={()=>{const n=[...manParceiros];n[pi]={...n[pi],produtos:n[pi].produtos.filter((_,j)=>j!==ki)};setManParceiros(n)}} style={{padding:"3px 8px",border:"1px solid #ddd",borderRadius:6,background:"white",color:"#999",cursor:"pointer",fontSize:11}}>✕</button>}
                      </div>
                      <Grid2>
                        <FL l="TIPO / PRODUTO"><input placeholder="Ex: Home Equity, Capital de Giro, CRI..." value={pr.tipo} onChange={e=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],tipo:e.target.value};setManParceiros([...n])}} style={iSt}/></FL>
                        <FL l="VALOR DO CRÉDITO (R$)"><PfxFmt pre="R$" val={pr.valor} onChange={v=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],valor:v};setManParceiros([...n])}} ph="1.000.000"/></FL>
                        <FL l="TAXA A.A. (%)"><div style={{display:"flex",alignItems:"center",border:"1.5px solid #ddd",borderRadius:8,overflow:"hidden",background:"#fafaf8"}}><input type="number" placeholder="16.8" value={pr.taxa} onChange={e=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],taxa:e.target.value};setManParceiros([...n])}} style={{border:"none",background:"transparent",padding:"9px 12px",fontSize:14,width:"100%",outline:"none"}}/><span style={{padding:"9px 10px",fontSize:11,color:"#888",background:"#f0ede8",borderLeft:"1px solid #ddd"}}>%a.a.</span></div></FL>
                        <FL l="PRAZO (meses)"><input type="number" placeholder="240" value={pr.prazo} onChange={e=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],prazo:e.target.value};setManParceiros([...n])}} style={iSt}/></FL>
                      </Grid2>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:10}}>
                        <FL l="AMORTIZAÇÃO"><RG opts={[{v:"price",l:"Price"},{v:"sac",l:"SAC"},{v:"ambos",l:"Ambos"}]} val={pr.sistema} onChange={v=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],sistema:v};setManParceiros([...n])}} varejo={isVarejo}/></FL>
                        <FL l="PARCELA (opcional — sobrescreve cálculo)"><PfxFmt pre="R$" val={pr.parcelaCustom||""} onChange={v=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],parcelaCustom:v};setManParceiros([...n])}} ph="Calcular automaticamente"/></FL>
                        <FL l="OBSERVAÇÃO"><input placeholder="Ex: +IPCA · Carência 3m" value={pr.obs} onChange={e=>{const n=[...manParceiros];n[pi].produtos[ki]={...n[pi].produtos[ki],obs:e.target.value};setManParceiros([...n])}} style={iSt}/></FL>
                      </div>
                    </div>
                  ))}

                  <button onClick={()=>{const n=[...manParceiros];n[pi]={...n[pi],produtos:[...n[pi].produtos,{tipo:"",valor:"",taxa:"",prazo:"",sistema:"price",parcelaCustom:"",obs:""}]};setManParceiros(n)}} style={{width:"100%",padding:"8px",border:`1.5px dashed ${PAL.primary}80`,borderRadius:8,background:"transparent",color:PAL.primary,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Adicionar produto em {parc.nome||`Parceiro ${pi+1}`}</button>
                </div>
              ))}

              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <button onClick={()=>setManParceiros(p=>[...p,{nome:"",produtos:[{tipo:"",valor:"",taxa:"",prazo:"",sistema:"price",parcelaCustom:"",obs:""}]}])} style={{padding:"8px 16px",border:`1.5px dashed ${PAL.primary}`,borderRadius:8,background:`${PAL.primary}10`,color:PAL.primary,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Parceiro</button>
                <button onClick={calcManSims} disabled={!manParceiros.some(p=>p.nome&&p.produtos.some(pr=>pr.valor&&pr.taxa&&pr.prazo))} style={{padding:"10px 24px",background:PAL.primary,color:"white",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",opacity:manParceiros.some(p=>p.nome&&p.produtos.some(pr=>pr.valor&&pr.taxa&&pr.prazo))?1:.5}}>⚡ Calcular</button>
              </div>

              {manSims.length>0&&<div style={{marginTop:20,paddingTop:20,borderTop:"2px solid #f0ede8"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>Preview do Comparativo</div>
                {manSims.map((parc,pi)=>(
                  <div key={pi} style={{border:`1px solid ${PAL.primary}30`,borderRadius:12,padding:16,marginBottom:10,borderLeft:`4px solid ${PAL.primary}`}}>
                    <div style={{fontSize:14,fontWeight:800,fontFamily:FT,marginBottom:10,color:"#1a1a1a"}}>{parc.nome}</div>
                    {parc.produtos.map((pr,ki)=>(
                      <div key={ki} style={{paddingBottom:ki<parc.produtos.length-1?10:0,marginBottom:ki<parc.produtos.length-1?10:0,borderBottom:ki<parc.produtos.length-1?`1px solid ${PAL.primary}15`:"none"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                          <div><div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{pr.tipo||`Produto ${ki+1}`}</div><div style={{fontSize:11,color:PAL.primary}}>{pr.taxa}%a.a. · {pr.prazo}m{pr.priceEhCustom?" · ★ parcela personalizada":""}</div></div>
                          <div style={{fontSize:15,fontWeight:800,color:PAL.primary,fontFamily:FT}}>{fmtI(pr.val)}</div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:6}}>
                          {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC — 1ª`} val={fmtR(pr.sac1)} color={PAL.primary}/>}
                          {(pr.sistema==="sac"||pr.sistema==="ambos")&&<SimBox label={`SAC — ÚLTIMA`} val={fmtR(pr.sacl)} color="#888"/>}
                          {(pr.sistema==="price"||pr.sistema==="ambos"||!pr.sistema)&&<SimBox label={`PRICE${pr.priceEhCustom?" ★":""}`} val={fmtR(pr.price)} color={PAL.secondary}/>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:`${PAL.primary}08`,borderRadius:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:PAL.primary}}>Total</span>
                  <span style={{fontSize:15,fontWeight:900,color:PAL.primary,fontFamily:FT}}>{fmtI(manSims.reduce((s,p)=>s+p.produtos.reduce((ss,pr)=>ss+(pr.val||0),0),0))}</span>
                </div>
              </div>}
            </div>
            <div style={{background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,borderRadius:14,padding:28,marginBottom:16,textAlign:"center",border:`2px solid ${SEC}`}}>
              <div style={{fontSize:20,fontWeight:800,color:"white",marginBottom:8,fontFamily:FT}}>Gerar Proposta com Comparativo</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:16}}>Gera o layout da LP e PDF com a tabela comparativa de parceiros</div>
              <button onClick={()=>openProposal(true)} disabled={salvando||!manParceiros.some(p=>p.nome)} style={{padding:"14px 40px",background:"white",color:PAL.primary,border:"none",borderRadius:10,fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:FT,opacity:manParceiros.some(p=>p.nome)?1:.5}}>{salvando?"Salvando...":"📄 GERAR PROPOSTA"}</button>
            </div>
            <button onClick={onHome} style={{width:"100%",padding:13,background:"#0a0a0a",color:SEC,border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>↩ Voltar</button>
          </div>}

          {/* ABA AUTO */}
          {abaResult==="auto"&&<div>
            {/* HE — sempre aparece se tiver imóvel */}
            {heResults.length>0&&<><SecBanner title="🏠 Home Equity / CGI" varejo={isVarejo}/>
              {heResults.map((r,i)=><div key={i} style={{background:"white",borderRadius:14,padding:22,marginBottom:12,borderLeft:`5px solid ${VAREJO.primary}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <div><div style={{fontSize:15,fontWeight:800,fontFamily:FT}}>{r.name}</div><div style={{fontSize:11,color:VAREJO.primary,fontWeight:600}}>{(r.taxa*100).toFixed(2)}%a.m.+IPCA · LTV {r.ltv}%</div></div>
                  <div style={{fontSize:20,fontWeight:900,color:VAREJO.primary,fontFamily:FT}}>{fmtI(r.valor)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <SimBox label="SAC 240m — 1ª" val={fmtR(r.sac1)} color={VAREJO.primary}/>
                  <SimBox label="SAC 240m — ÚLTIMA" val={fmtR(r.sacl)} color="#888"/>
                  <SimBox label="PRICE 180m — FIXA" val={fmtR(r.price)} color={VAREJO.primary}/>
                </div>
                {r.ltvPct&&<div style={{marginTop:10,fontSize:12,color:"#777",background:VAREJO.light,padding:"6px 12px",borderRadius:8}}>LTV: <strong style={{color:Number(r.ltvPct)>r.ltv?"#b71c1c":VAREJO.primary}}>{r.ltvPct}%</strong> {Number(r.ltvPct)>r.ltv?"⚠️ Excede limite":"✅ Dentro do limite"}</div>}
              </div>)}</>}

            {/* Seção assessoria — só aparece se NÃO for varejo */}
            {!isVarejo&&<>
              <SecBanner title="📋 Estratégia de Alocação"/>
              <div style={{background:"white",borderRadius:14,padding:22,marginBottom:12}}>
                <div style={{marginBottom:16}}>
                  <FL l="📝 RACIONAL / PITCH DE VENDAS (opcional)">
                    <textarea value={racional} onChange={e=>setRacional(e.target.value)} placeholder="Descreva o contexto e a estratégia..." rows={3} style={{...iSt,resize:"vertical",lineHeight:1.6}}/>
                  </FL>
                </div>
                {destinos.map((d,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px auto",gap:10,alignItems:"end",marginBottom:10}}>
                    <FL l={`DESTINO ${i+1}`}><input placeholder="Ex: Liquidação HE — Banco Meridiano" value={d.desc} onChange={e=>{const nd=[...destinos];nd[i]={...nd[i],desc:e.target.value};setDest(nd)}} style={iSt}/></FL>
                    <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,display:"block",marginBottom:5}}>R$ MM</label>
                      <div style={{display:"flex",alignItems:"center",border:"1.5px solid #ddd",borderRadius:8,overflow:"hidden",background:"#fafaf8"}}>
                        <span style={{padding:"8px 8px",fontSize:11,color:"#888",background:"#f0ede8",borderRight:"1px solid #ddd"}}>MM</span>
                        <input type="number" placeholder="5" value={d.val} onChange={e=>{const nd=[...destinos];nd[i]={...nd[i],val:e.target.value};setDest(nd)}} style={{border:"none",background:"transparent",padding:"8px 10px",fontSize:14,width:"100%",outline:"none"}}/>
                      </div>
                    </div>
                    {destinos.length>1&&<button onClick={()=>setDest(destinos.filter((_,j)=>j!==i))} style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:8,background:"white",color:"#999",cursor:"pointer",marginTop:22}}>✕</button>}
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                  <button onClick={()=>setDest(p=>[...p,{desc:"",val:""}])} style={{padding:"8px 16px",border:`1.5px dashed ${SEC}`,borderRadius:8,background:`${SEC}15`,color:ASSESS.primary,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Adicionar</button>
                  <button onClick={doEst} disabled={!destinos.some(d=>d.desc&&parseFloat(d.val)>0)} style={{padding:"10px 24px",background:ASSESS.primary,color:"white",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",opacity:destinos.some(d=>d.desc&&parseFloat(d.val)>0)?1:.5}}>⚡ Gerar Estratégia</button>
                </div>
                {estResult&&<div style={{marginTop:20,paddingTop:20,borderTop:"2px solid #f0ede8"}}>
                  <div style={{fontSize:20,fontWeight:900,color:"#1a1a1a",fontFamily:FT,marginBottom:14}}>{fmtI(estResult.total)}</div>
                  <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                    {estResult.cenarios.map(c=><button key={c.id} onClick={()=>setCenarioSel(c.id)} style={{padding:"8px 14px",borderRadius:9,border:`2px solid ${cenarioSel===c.id?c.cor:"#ddd"}`,background:cenarioSel===c.id?`${c.cor}12`:"white",color:cenarioSel===c.id?c.cor:"#888",fontSize:12,fontWeight:cenarioSel===c.id?700:400,cursor:"pointer"}}>{c.icone} {c.nome.split("—")[1]?.trim()}</button>)}
                  </div>
                  {estResult.cenarios.filter(c=>c.id===cenarioSel).map(c=>(
                    <div key={c.id}>
                      <div style={{background:`${c.cor}10`,borderRadius:10,padding:"10px 14px",marginBottom:12,borderLeft:`3px solid ${c.cor}`}}>
                        <div style={{fontSize:12,fontWeight:700,color:c.cor,marginBottom:2}}>{c.icone} {c.nome}</div>
                        <div style={{fontSize:11,color:"#666"}}>{c.desc}</div>
                      </div>
                      {c.parc.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:i%2===0?"#f8f5f0":"white",borderRadius:8,marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:600}}>{String(i+1).padStart(2,"0")} · {p.p}</span>
                        <div style={{display:"flex",gap:16}}><span style={{fontSize:11,color:"#888"}}>{p.taxa}</span><span style={{fontSize:14,fontWeight:800,color:c.cor,fontFamily:FT}}>{fmtI(p.val)}</span></div>
                      </div>)}
                      <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",borderTop:`2px solid ${c.cor}30`,background:`${c.cor}08`,borderRadius:8,marginTop:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:c.cor}}>Estruturado</span>
                        <span style={{fontSize:15,fontWeight:900,color:c.cor,fontFamily:FT}}>{((c.coberto/estResult.total)*100).toFixed(0)}% · {fmtI(c.coberto)}</span>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>

              {hubcSim&&<><SecBanner title="⚡ Hub-C · Nacional + Internacional"/>
                <div style={{background:"white",borderRadius:14,padding:22,marginBottom:12,borderLeft:"5px solid #555"}}>
                  <div style={{marginBottom:16,paddingBottom:14,borderBottom:"1px solid #f0ede8"}}>
                    <div style={{fontSize:12,color:"#555",fontWeight:700,marginBottom:10}}>🇧🇷 Nacional · 18%a.a.</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:14,fontWeight:800,fontFamily:FT}}>Hub-C · Capital de Giro</div><div style={{fontSize:18,fontWeight:900,color:"#555",fontFamily:FT}}>{fmtI(hubcSim.valor)}</div></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><SimBox label="SAC 48m — 1ª" val={fmtR(hubcSim.sac1_48)} color="#555"/><SimBox label="SAC 48m — ÚLTIMA" val={fmtR(hubcSim.sacl_48)} color="#888"/><SimBox label="PRICE 48m — FIXA" val={fmtR(hubcSim.price48)} color="#555"/></div>
                  </div>
                  <div style={{background:"#f0f4ff",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,color:ASSESS.primary,fontWeight:700,marginBottom:12}}>🌎 Internacional · 9,7%a.a. · 108m</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      <div style={{background:"white",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:10,color:"#999",marginBottom:3}}>VALOR LÍQUIDO</div><div style={{fontSize:16,fontWeight:900,color:ASSESS.primary,fontFamily:FT}}>{fmtI(hubcSim.valor)}</div></div>
                      <div style={{background:"white",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:10,color:"#999",marginBottom:3}}>VALOR BRUTO</div><div style={{fontSize:16,fontWeight:900,color:"#555",fontFamily:FT}}>{fmtI(hubcSim.valorBruto)}</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}><SimBox label="PRICE 108m — FIXA" val={fmtR(hubcSim.price108)} color={ASSESS.primary}/><SimBox label="SAC 108m — 1ª" val={fmtR(hubcSim.sac1_108)} color={ASSESS.primary}/><SimBox label="SAC 108m — ÚLTIMA" val={fmtR(hubcSim.sacl_108)} color="#888"/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                      <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>ORIGINAÇÃO (0,5%)</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>{fmtI(hubcSim.originacao)}</div></div>
                      <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>TRC (USD)</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>U$ {hubcSim.trcUSD?.toLocaleString("pt-BR")}</div></div>
                      <div style={{background:"#e8eeff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:ASSESS.primary,fontWeight:700,marginBottom:2}}>1ª TRANCHE</div><div style={{fontSize:13,fontWeight:800,color:ASSESS.primary}}>{fmtI(hubcSim.tranche1)}</div></div>
                    </div>
                    <div style={{fontSize:11,color:ASSESS.primary,background:"#dde5ff",padding:"7px 12px",borderRadius:8,fontWeight:600}}>⏳ Carência padrão 1 ano · Negociável até 3 anos · Via Fundo Internacional</div>
                  </div>
                </div></>}
            </>}

            {/* Parceiros — cenarios.html style */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:FT,fontWeight:300,fontSize:24,margin:0}}>{isVarejo?"Parceiros de Home Equity":"Parceiros recomendados"}</h2>
              <div style={{fontSize:11,color:"#888",letterSpacing:1.5,textTransform:"uppercase"}}>{(isVarejo?ranked.filter(p=>p.isHE):ranked).length} parceiros · por aderência</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:28}}>
            {(isVarejo?ranked.filter(p=>p.isHE):ranked).map((p,i)=>{const b=badge(p.score);const cor=isVarejo?VAREJO.primary:p.color;const eligible=p.score>=15;return(
              <div key={p.id} style={{background:"white",border:"1px solid rgba(113,63,42,0.12)",borderLeft:`4px solid ${eligible?cor:"#ddd"}`,borderRadius:12,padding:"20px 22px 18px",display:"flex",flexDirection:"column",gap:12,opacity:eligible?1:.5,transition:"transform .15s, box-shadow .15s"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontFamily:FT,fontSize:22,fontWeight:400,lineHeight:1.1}}>{p.name}</div>
                    <div style={{fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:"#888",marginTop:4}}>{p.cat}</div>
                  </div>
                  {p.score>=65&&<span style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",background:"rgba(204,166,127,0.18)",color:"#8B6340",padding:"4px 9px",borderRadius:999,fontWeight:600,whiteSpace:"nowrap"}}>Recomendado</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,minWidth:80}}>Aderência</span>
                  <div style={{flex:1,height:6,background:"#EFE9E0",borderRadius:99,overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${p.score}%`,background:`linear-gradient(90deg,${eligible?cor:"#ddd"},${SEC})`,borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:600,color:eligible?cor:"#ccc",minWidth:36,textAlign:"right"}}>{p.score}%</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(p.al||[]).length===0&&<span style={{fontSize:10,letterSpacing:.5,fontWeight:500,padding:"4px 9px",borderRadius:6,background:"rgba(46,138,78,0.10)",color:"#2e8a4e"}}>Sem restrições</span>}
                  {(p.al||[]).map((a,j)=><span key={j} style={{fontSize:10,letterSpacing:.5,fontWeight:500,padding:"4px 9px",borderRadius:6,background:"rgba(204,166,127,0.18)",color:"#8B6340"}}>⚠ {a}</span>)}
                  {(p.prods||[]).map(pr=><span key={pr} style={{fontSize:10,letterSpacing:.5,fontWeight:500,padding:"4px 9px",borderRadius:6,background:"#EFE9E0",color:"#555"}}>{pr}</span>)}
                </div>
              </div>)})}
            </div>

            {/* HE block — cenarios.html dark block */}
            {heResults.length>0&&<div style={{background:"radial-gradient(ellipse at 100% 0%,rgba(204,166,127,0.20),transparent 50%), linear-gradient(135deg,"+PAL.dark+" 0%,"+PAL.secondary+" 100%)",borderRadius:18,padding:"32px 36px",color:"white",marginBottom:28,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-60,bottom:-60,width:240,height:240,borderRadius:"50%",border:"1px solid rgba(204,166,127,0.18)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",right:-30,bottom:-30,width:180,height:180,borderRadius:"50%",border:"1px solid rgba(204,166,127,0.12)",pointerEvents:"none"}}/>
              <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:SEC,marginBottom:10}}>Simulação · Home Equity</div>
              <h3 style={{fontFamily:FT,fontWeight:300,fontSize:28,marginBottom:6,margin:"0 0 6px"}}>{isVarejo?"Imóvel como alavanca financeira":"Imóvel como garantia estrutural"}</h3>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",maxWidth:560,lineHeight:1.7,marginBottom:24}}>Valores estimados com base no imóvel informado. Confirmação após avaliação técnica do parceiro.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18,position:"relative",zIndex:1}}>
                {heResults[0]&&[
                  {k:"Crédito disponível",v:fmtI(heResults[0].valor),s:`LTV ${heResults[0].ltv}%`},
                  {k:"Parcela Price",v:fmtR(heResults[0].price),s:`180m · ${(heResults[0].taxa*100).toFixed(2)}% a.m.`},
                  {k:"SAC · 1ª parcela",v:fmtR(heResults[0].sac1),s:"decresce mensalmente"},
                  {k:"SAC · Última",v:fmtR(heResults[0].sacl),s:"240 meses"},
                ].map((cell,ci)=>(
                  <div key={ci} style={{borderLeft:ci===0?"none":"1px solid rgba(204,166,127,0.20)",paddingLeft:ci===0?0:16}}>
                    <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.5)",marginBottom:8}}>{cell.k}</div>
                    <div style={{fontFamily:FT,fontWeight:300,fontSize:24,color:SEC,lineHeight:1}}>{cell.v}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:6}}>{cell.s}</div>
                  </div>
                ))}
              </div>
              {/* Fee selector */}
              <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid rgba(204,166,127,0.20)"}}>
                <div style={{fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.5)",marginBottom:10}}>EXPECTATIVA DE FEE</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {heResults.map(r=><div key={r.id} style={{display:"flex",gap:4}}>
                    {["1","1.5","2","2.5"].map(f=><button key={f} onClick={()=>setFeeP(prev=>({...prev,[r.id]:f}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${feeP[r.id]===f?SEC:"rgba(204,166,127,0.30)"}`,background:feeP[r.id]===f?SEC:"transparent",color:feeP[r.id]===f?"#1a1a1a":"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",fontWeight:600}}>{f}%</button>)}
                  </div>)}
                  <div style={{marginLeft:16,fontSize:20,fontWeight:700,color:SEC,fontFamily:FT}}>{fmtR(heResults.reduce((s,r)=>s+(r.valor*(Number(feeP[r.id])||0)/100),0))}</div>
                </div>
              </div>
            </div>}

            {/* Gerar Proposta CTA — cenarios.html style */}
            <div style={{display:"flex",justifyContent:"center",marginTop:6,marginBottom:16}}>
              <button onClick={()=>openProposal(false)} disabled={salvando} style={{background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,color:"white",border:`1.5px solid ${SEC}`,padding:"18px 44px",borderRadius:14,fontSize:13,letterSpacing:3,fontWeight:600,textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:14,boxShadow:`0 20px 40px -18px ${PAL.primary}88`,cursor:salvando?"not-allowed":"pointer",opacity:salvando?.7:1,transition:"transform .15s, box-shadow .15s"}}>
                {salvando?"Salvando...":"GERAR PROPOSTA"}
                {!salvando&&<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
              </button>
            </div>
            <button onClick={onHome} style={{width:"100%",padding:13,background:"transparent",color:"#888",border:"1px solid rgba(113,63,42,0.20)",borderRadius:10,fontWeight:500,fontSize:13,cursor:"pointer",letterSpacing:1}}>↩ Voltar ao início</button>
          </div>}
        </div>}
      </div>
    </div>
  )
}

// ── PAINEL ADMIN ─────────────────────────────────────────────────────────────
function PainelAdmin({token}){
  const[empresas,setEmpresas]=useState([])
  const[load,setLoad]=useState(true)
  const[filtro,setFiltro]=useState("todos")
  const[busca,setBusca]=useState("")
  const[expanded,setExpanded]=useState(null)

  useEffect(()=>{
    setLoad(true)
    fetch(`${API}/api/proposta?crm=all`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{setEmpresas((d.empresas||[]).sort((a,b)=>(b.ultimaAtualizacao||"").localeCompare(a.ultimaAtualizacao||"")));setLoad(false)})
      .catch(()=>setLoad(false))
  },[token])

  const tipo=e=>e.fd?.tipo||"assessoria"
  const filtradas=empresas.filter(e=>{
    if(filtro!=="todos"&&tipo(e)!==filtro)return false
    if(busca&&!e.nome?.toLowerCase().includes(busca.toLowerCase()))return false
    return true
  })
  const totalV=empresas.filter(e=>tipo(e)==="varejo").length
  const totalA=empresas.filter(e=>tipo(e)==="assessoria").length
  const totalProp=empresas.reduce((s,e)=>s+(e.propostas?.length||0),0)
  const totalCred=empresas.reduce((s,e)=>s+(e.credito||0),0)

  return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"0 20px"}}>
      <div style={{padding:"20px 0 16px"}}>
        <div style={{fontSize:11,color:"#b71c1c",letterSpacing:2,fontWeight:700}}>ADMINISTRADOR</div>
        <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>Painel Geral · Propostas</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
        {[
          {label:"Empresas",val:empresas.length,color:"#1a1a1a"},
          {label:"Varejo",val:totalV,color:VAREJO.primary},
          {label:"Atacado",val:totalA,color:ASSESS.primary},
          {label:"Propostas",val:totalProp,color:"#4caf50"},
        ].map((k,i)=>(
          <div key={i} style={{background:"white",borderRadius:12,padding:"16px 20px",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <div style={{fontSize:10,color:"#aaa",letterSpacing:1.5,marginBottom:6}}>{k.label.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.color,fontFamily:FT}}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{background:`linear-gradient(135deg,${VAREJO.dark},${VAREJO.primary})`,borderRadius:12,padding:"18px 24px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 20px rgba(0,20,137,.2)"}}>
        <div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.6)",letterSpacing:2,fontWeight:700,marginBottom:4}}>VOLUME TOTAL EM PROPOSTAS</div>
          <div style={{fontSize:28,fontWeight:800,color:"white",fontFamily:FT}}>{fmtR(totalCred)}</div>
        </div>
        <div style={{fontSize:36,opacity:.3}}>💼</div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {[["todos","Todos"],["varejo","🏠 Varejo"],["assessoria","📊 Atacado"]].map(([f,l])=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${filtro===f?f==="varejo"?VAREJO.primary:f==="assessoria"?ASSESS.primary:"#1a1a1a":"#ddd"}`,background:filtro===f?f==="varejo"?VAREJO.primary+"15":f==="assessoria"?ASSESS.primary+"15":"#f0f0f0":"white",color:filtro===f?f==="varejo"?VAREJO.primary:f==="assessoria"?ASSESS.primary:"#1a1a1a":"#888",fontFamily:FB,fontSize:13,fontWeight:filtro===f?700:400,cursor:"pointer"}}>
            {l}
          </button>
        ))}
        <input placeholder="Buscar empresa..." value={busca} onChange={e=>setBusca(e.target.value)} style={{...iSt,flex:1,minWidth:160}}/>
      </div>
      {load&&<div style={{textAlign:"center",padding:32,color:"#aaa",fontSize:14}}>Carregando...</div>}
      {!load&&filtradas.map(emp=>{
        const isV=tipo(emp)==="varejo"
        const C=isV?VAREJO:ASSESS
        return(
          <div key={emp.nomeKey} style={{background:"white",borderRadius:12,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.04)",overflow:"hidden",border:`1px solid ${expanded===emp.nomeKey?C.primary+"60":"transparent"}`}}>
            <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpanded(expanded===emp.nomeKey?null:emp.nomeKey)}>
              <span style={{fontSize:10,background:C.primary+"15",color:C.primary,padding:"2px 8px",borderRadius:20,fontWeight:700,letterSpacing:1,flexShrink:0}}>{isV?"VAREJO":"ATACADO"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.nome}</div>
                <div style={{fontSize:12,color:"#aaa"}}>{emp.setor||"—"} · {fmtI(emp.credito)}</div>
              </div>
              <div style={{fontSize:12,color:"#ccc",flexShrink:0}}>{emp.ultimaAtualizacao?.slice(0,10)||"—"}</div>
              <div style={{fontSize:16,color:"#ccc",transform:expanded===emp.nomeKey?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▾</div>
            </div>
            {expanded===emp.nomeKey&&(
              <div style={{padding:"0 18px 18px",borderTop:"1px solid #f0f0f0"}}>
                {(emp.propostas||[]).map((p,pi)=>(
                  <div key={pi} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:pi<(emp.propostas||[]).length-1?"1px solid #f5f5f5":"none"}}>
                    <span style={{fontSize:12,color:"#888",fontFamily:"monospace",flexShrink:0}}>{p.code}</span>
                    <span style={{fontSize:12,color:"#aaa",flexShrink:0}}>{p.data}</span>
                    <span style={{fontSize:12,fontWeight:600,color:"#1a1a1a",flex:1}}>{fmtI(p.credito)}</span>
                    <a href={`/proposta/${p.code}`} target="_blank" rel="noreferrer" style={{padding:"5px 12px",background:C.primary,color:"white",borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none",flexShrink:0}}>Ver</a>
                  </div>
                ))}
                {(!emp.propostas||emp.propostas.length===0)&&<div style={{fontSize:13,color:"#aaa",padding:"10px 0"}}>Nenhuma proposta gerada.</div>}
              </div>
            )}
          </div>
        )
      })}
      {!load&&filtradas.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:14}}>Nenhuma empresa encontrada.</div>}
    </div>
  )
}

// ── CONSORCIO VIEW ────────────────────────────────────────────────────────────
const ADMINS_C={
  brconsorcio:{nome:"BR Consórcios",taxaAdm:{imoveis:0.19,veiculos:0.18,pesados:0.18,servicos:0.22},prazos:{imoveis:[60,120,180,240],veiculos:[36,48,60,72,84],pesados:[36,48,60,72,84,96],servicos:[24,36,48,60]}},
  ademicon:{nome:"Ademicon",taxaAdm:{imoveis:0.18,veiculos:0.17,pesados:0.17,servicos:0.21},prazos:{imoveis:[60,120,180,200],veiculos:[36,48,60,72],pesados:[36,48,60,72,84],servicos:[24,36,48]}},
  triangulo:{nome:"Triângulo",taxaAdm:{imoveis:0.175,veiculos:0.165,pesados:0.165,servicos:0.20},prazos:{imoveis:[60,100,180,200],veiculos:[36,48,60,72],pesados:[36,48,60,72,84],servicos:[24,36,48]}},
}
const TIPOS_CARTA_C=[{id:"imoveis",label:"Imóveis"},{id:"veiculos",label:"Veículos Leves"},{id:"pesados",label:"Pesados / Agro"},{id:"servicos",label:"Serviços"}]

function ConsorcioView(){
  const[admin,setAdmin]=useState("brconsorcio")
  const[tipo,setTipo]=useState("imoveis")
  const[credito,setCredito]=useState("")
  const[prazo,setPrazo]=useState(180)
  const[percLance,setPercLance]=useState(20)
  const[upgrade,setUpgrade]=useState("")
  const[result,setResult]=useState(null)
  const A=ADMINS_C[admin]
  const prazos=A.prazos[tipo]

  const calcular=()=>{
    const cred=Number(String(credito).replace(/\D/g,""))
    if(!cred)return
    const taxaAdm=A.taxaAdm[tipo]
    const creditoFinal=cred+Number(String(upgrade).replace(/\D/g,""))
    const totalPagar=creditoFinal*(1+taxaAdm)
    const parcela=totalPagar/prazo
    const lance=cred*(percLance/100)
    setResult({creditoFinal,totalPagar,parcela,lance,taxaAdm,admin:A.nome,tipo,prazo,percLance,cred})
  }

  const diagSt={background:"#F5F1EC",minHeight:"100%",fontFamily:FB}
  const cardSt={background:"white",borderRadius:18,padding:"28px 36px",boxShadow:"0 1px 0 rgba(113,63,42,0.12), 0 24px 60px -30px rgba(113,63,42,0.20)",border:"1px solid rgba(113,63,42,0.10)"}
  const lbl={fontSize:10,letterSpacing:2.5,textTransform:"uppercase",color:VAREJO.primary,fontWeight:600,marginBottom:8,display:"block"}
  const inp={width:"100%",height:44,background:"#EFE9E0",border:"1px solid rgba(0,20,137,0.18)",borderRadius:8,padding:"0 14px",fontFamily:FB,fontSize:14,color:"#1a1a1a",outline:"none",boxSizing:"border-box"}
  const sel={...inp,appearance:"none"}

  return(
    <div style={diagSt}>
      <div style={{background:"white",borderBottom:"1px solid rgba(0,20,137,0.08)",padding:"0 28px",height:48,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:11,color:"#888",letterSpacing:2,textTransform:"uppercase"}}>Varejo</span>
        <span style={{color:"rgba(0,0,0,0.18)"}}>›</span>
        <span style={{fontSize:11,color:VAREJO.primary,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>Simulação Consórcios</span>
      </div>
      <div style={{maxWidth:880,margin:"32px auto 56px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:VAREJO.primary,fontWeight:600,marginBottom:10}}>Varejo · Consórcios</div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:36,letterSpacing:.5,lineHeight:1.1,color:"#1a1a1a",margin:0}}>Simule e compare <em style={{fontStyle:"italic",color:VAREJO.primary,fontWeight:300}}>administradoras</em></h1>
          <p style={{fontSize:13,color:"#888",marginTop:8}}>Calcule parcelas, lance e total a pagar em cada administradora.</p>
        </div>

        <div style={cardSt}>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",marginBottom:4}}>Configuração</div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>Selecione a administradora e os parâmetros da carta.</div>
          <div style={{height:1,background:`linear-gradient(to right,${SEC},transparent)`,opacity:.35,marginBottom:22}}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
            <div>
              <label style={lbl}>Administradora</label>
              <select value={admin} onChange={e=>{setAdmin(e.target.value);setPrazo(ADMINS_C[e.target.value].prazos[tipo][0])}} style={sel}>
                {Object.entries(ADMINS_C).map(([k,v])=><option key={k} value={k}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tipo de Carta</label>
              <select value={tipo} onChange={e=>{setTipo(e.target.value);setPrazo(A.prazos[e.target.value][0])}} style={sel}>
                {TIPOS_CARTA_C.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Valor da Carta (R$)</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:SEC,fontSize:13,pointerEvents:"none"}}>R$</span>
                <input value={credito?Number(String(credito).replace(/\D/g,"")).toLocaleString("pt-BR"):""} onChange={e=>setCredito(e.target.value.replace(/\D/g,""))} placeholder="0" style={{...inp,paddingLeft:36}}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Upgrade (R$) — opcional</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:SEC,fontSize:13,pointerEvents:"none"}}>R$</span>
                <input value={upgrade?Number(String(upgrade).replace(/\D/g,"")).toLocaleString("pt-BR"):""} onChange={e=>setUpgrade(e.target.value.replace(/\D/g,""))} placeholder="0" style={{...inp,paddingLeft:36}}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Prazo (meses)</label>
              <select value={prazo} onChange={e=>setPrazo(Number(e.target.value))} style={sel}>
                {prazos.map(p=><option key={p} value={p}>{p} meses</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Lance ofertado — {percLance}%</label>
              <input type="range" min={0} max={40} value={percLance} onChange={e=>setPercLance(Number(e.target.value))} style={{width:"100%",marginTop:8,accentColor:VAREJO.primary}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:4}}><span>0%</span><span>40%</span></div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:28,paddingTop:22,borderTop:"1px solid rgba(0,20,137,0.10)"}}>
            <div style={{fontSize:11,color:"#aaa"}}>Taxa adm: <strong style={{color:VAREJO.primary}}>{(A.taxaAdm[tipo]*100).toFixed(1)}%</strong> ao total</div>
            <button onClick={calcular} disabled={!credito} style={{height:44,padding:"0 28px",borderRadius:10,border:"none",background:VAREJO.primary,color:"white",fontSize:12,fontWeight:500,letterSpacing:1,cursor:credito?"pointer":"not-allowed",opacity:credito?1:.5,boxShadow:`0 12px 28px -12px ${VAREJO.primary}88`,display:"inline-flex",alignItems:"center",gap:10}}>
              Calcular
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        {result&&<div style={{marginTop:20,...cardSt}}>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",marginBottom:4}}>Resultado — <em style={{fontStyle:"italic",color:VAREJO.primary}}>{result.admin}</em></div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>{TIPOS_CARTA_C.find(t=>t.id===result.tipo)?.label} · {result.prazo} meses · Lance {result.percLance}%</div>
          <div style={{height:1,background:`linear-gradient(to right,${SEC},transparent)`,opacity:.35,marginBottom:22}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[
              {k:"Carta de Crédito",v:fmtI(result.creditoFinal),s:"valor + upgrade"},
              {k:"Parcela Mensal",v:fmtI(Math.round(result.parcela)),s:`${result.prazo} meses`},
              {k:"Lance",v:fmtI(Math.round(result.lance)),s:`${result.percLance}% do crédito`},
              {k:"Total a Pagar",v:fmtI(Math.round(result.totalPagar)),s:`taxa ${(result.taxaAdm*100).toFixed(1)}%`},
            ].map(cell=>(
              <div key={cell.k} style={{borderLeft:"1px solid rgba(0,20,137,0.12)",paddingLeft:16,":first-child":{borderLeft:"none"}}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",marginBottom:8}}>{cell.k}</div>
                <div style={{fontFamily:FT,fontWeight:300,fontSize:24,color:VAREJO.primary,lineHeight:1}}>{cell.v}</div>
                <div style={{fontSize:11,color:"#aaa",marginTop:6}}>{cell.s}</div>
              </div>
            ))}
          </div>

          <div style={{background:"radial-gradient(ellipse at 100% 0%,rgba(204,166,127,0.15),transparent 50%),linear-gradient(135deg,#000D52,"+VAREJO.primary+")",borderRadius:14,padding:"24px 28px",marginTop:20}}>
            <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:SEC,marginBottom:8}}>Comparativo de administradoras</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {Object.entries(ADMINS_C).map(([k,a])=>{
                const cred=result.cred
                const ta=a.taxaAdm[result.tipo]
                const prz=a.prazos[result.tipo].includes(result.prazo)?result.prazo:a.prazos[result.tipo][a.prazos[result.tipo].length-1]
                const tot=(cred+Number(String(upgrade).replace(/\D/g,""))*(1+ta))
                const parc=tot/prz
                const isSelected=k===admin
                return(
                  <div key={k} style={{background:isSelected?"rgba(255,255,255,0.14)":"rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 16px",border:isSelected?`1px solid ${SEC}40`:"1px solid rgba(255,255,255,0.08)"}}>
                    <div style={{fontSize:11,color:isSelected?SEC:"rgba(255,255,255,0.6)",fontWeight:isSelected?700:400,marginBottom:8}}>{a.nome}{isSelected&&" ★"}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginBottom:4}}>Taxa adm: {(ta*100).toFixed(1)}%</div>
                    <div style={{fontFamily:FT,fontSize:20,color:isSelected?SEC:"rgba(255,255,255,0.85)",lineHeight:1}}>{fmtI(Math.round(parc))}<span style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginLeft:4}}>/ mês</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>}
      </div>
    </div>
  )
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
const DIAS=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]
const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
function dateLabel(){const d=new Date();return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}

const COR_PRESETS=["#001489","#713F2A","#2d6a4f","#8B1A1A","#4A2818","#0d5c8c","#555","#8B6914"]
const TIPO_LABELS={aviso:"Aviso",campanha:"Campanha",meta:"Meta",agenda:"Agenda"}

function ComunicadoModal({initial,onSave,onClose}){
  const[tipo,setTipo]=useState(initial?.tipo||"aviso")
  const[titulo,setTitulo]=useState(initial?.titulo||"")
  const[corpo,setCorpo]=useState(initial?.corpo||"")
  const[cor,setCor]=useState(initial?.cor||"#001489")
  const[icone,setIcone]=useState(initial?.icone||"📌")
  const[progresso,setProgresso]=useState(initial?.progresso??0)
  const[metaLabel,setMetaLabel]=useState(initial?.meta_label||"")
  const[saving,setSaving]=useState(false)
  const[saveErro,setSaveErro]=useState("")

  const save=async()=>{
    setSaving(true);setSaveErro("")
    try{
      const result=await onSave({tipo,titulo,corpo,cor,icone,progresso:Number(progresso),meta_label:metaLabel})
      if(result?.error){setSaveErro(result.error)}
    }catch(err){setSaveErro(err?.message||"Erro inesperado. Tente novamente.")}
    setSaving(false)
  }

  const iSt2={width:"100%",padding:"9px 12px",border:"1px solid rgba(113,63,42,0.22)",borderRadius:8,fontSize:13,fontFamily:FB,background:"#EFE9E0",outline:"none",boxSizing:"border-box"}
  const lbl={fontSize:10,letterSpacing:2,textTransform:"uppercase",fontWeight:600,color:"#713F2A",display:"block",marginBottom:6}
  return(
    <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB}}>
      <div style={{background:"white",borderRadius:20,padding:32,width:"100%",maxWidth:480,boxShadow:"0 40px 80px -30px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:22,color:"#1a1a1a"}}>{initial?"Editar":"Novo comunicado"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:20}}>✕</button>
        </div>

        <div style={{marginBottom:16}}>
          <label style={lbl}>Tipo</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["aviso","campanha","meta","agenda"].map(t=>(
              <button key={t} onClick={()=>setTipo(t)} style={{flex:1,minWidth:"fit-content",padding:"8px 10px",borderRadius:8,border:`1.5px solid ${tipo===t?"#713F2A":"#ddd"}`,background:tipo===t?"#F5F1EC":"white",color:tipo===t?"#713F2A":"#888",fontSize:12,fontWeight:tipo===t?700:400,cursor:"pointer"}}>{TIPO_LABELS[t]}</button>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:16}}>
          <div>
            <label style={lbl}>Título *</label>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: Reunião de equipe" style={iSt2}/>
          </div>
          <div>
            <label style={lbl}>Ícone</label>
            <input value={icone} onChange={e=>setIcone(e.target.value)} style={{...iSt2,width:56,textAlign:"center",fontSize:20}}/>
          </div>
        </div>

        {(tipo==="aviso"||tipo==="campanha")&&<div style={{marginBottom:16}}>
          <label style={lbl}>Descrição</label>
          <textarea value={corpo} onChange={e=>setCorpo(e.target.value)} rows={3} placeholder="Detalhes do aviso ou campanha..." style={{...iSt2,resize:"vertical",lineHeight:1.6}}/>
        </div>}

        {tipo==="agenda"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div>
            <label style={lbl}>Data / Horário</label>
            <input value={metaLabel} onChange={e=>setMetaLabel(e.target.value)} placeholder="Ex: 15 mai · 14h" style={iSt2}/>
          </div>
          <div>
            <label style={lbl}>Detalhes</label>
            <input value={corpo} onChange={e=>setCorpo(e.target.value)} placeholder="Local ou observação" style={iSt2}/>
          </div>
        </div>}

        {tipo==="meta"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div>
            <label style={lbl}>Progresso atual (%)</label>
            <input type="number" min={0} max={100} value={progresso} onChange={e=>setProgresso(e.target.value)} style={iSt2}/>
          </div>
          <div>
            <label style={lbl}>Referência (ex: R$500k)</label>
            <input value={metaLabel} onChange={e=>setMetaLabel(e.target.value)} placeholder="R$ 500k em HE" style={iSt2}/>
          </div>
        </div>}

        <div style={{marginBottom:24}}>
          <label style={lbl}>Cor de destaque</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {COR_PRESETS.map(c=>(
              <button key={c} onClick={()=>setCor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:cor===c?"3px solid #1a1a1a":"3px solid transparent",cursor:"pointer",transition:"transform .1s",transform:cor===c?"scale(1.2)":"scale(1)"}}/>
            ))}
            <input type="color" value={cor} onChange={e=>setCor(e.target.value)} style={{width:28,height:28,padding:0,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
          </div>
        </div>

        {saveErro&&<div style={{marginBottom:16,padding:"10px 14px",borderRadius:9,background:"#fde8e8",border:"1px solid #f4433640",color:"#c62828",fontSize:12,lineHeight:1.5}}>
          ⚠ {saveErro}
        </div>}

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"10px 20px",borderRadius:9,border:"1px solid #ddd",background:"white",color:"#555",fontSize:13,cursor:"pointer"}}>Cancelar</button>
          <button onClick={save} disabled={!titulo||saving} style={{padding:"10px 24px",borderRadius:9,border:"none",background:"#713F2A",color:"white",fontSize:13,fontWeight:600,cursor:titulo?"pointer":"not-allowed",opacity:titulo?1:.5}}>{saving?"Salvando...":"Salvar"}</button>
        </div>
      </div>
    </div>
  )
}

function HomeScreen({usuario,token,canAssessoria,onNav}){
  const[comunicados,setComunicados]=useState([])
  const[loading,setLoading]=useState(true)
  const[modal,setModal]=useState(null) // null | {item?:obj, defaultTipo?:string}
  const isAdmin=usuario.role==="admin"
  const h={Authorization:`Bearer ${token}`}

  useEffect(()=>{
    fetch(`${API}/api/comunicados`,{headers:h})
      .then(r=>r.json())
      .then(d=>setComunicados(d.comunicados||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  },[])

  const save=async(dados)=>{
    if(modal?.item){
      const r=await fetch(`${API}/api/comunicados`,{method:"PATCH",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify({id:modal.item.id,...dados})})
      const d=await r.json()
      if(d.error)return{error:d.error}
      if(d.comunicado)setComunicados(p=>p.map(c=>c.id===d.comunicado.id?d.comunicado:c))
    }else{
      const r=await fetch(`${API}/api/comunicados`,{method:"POST",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify(dados)})
      const d=await r.json()
      if(d.error)return{error:d.error}
      if(d.comunicado)setComunicados(p=>[d.comunicado,...p])
    }
    setModal(null)
  }
  const del=async(id)=>{
    await fetch(`${API}/api/comunicados`,{method:"DELETE",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify({id})})
    setComunicados(p=>p.filter(c=>c.id!==id))
  }

  const avisos=comunicados.filter(c=>c.tipo==="aviso")
  const campanhas=comunicados.filter(c=>c.tipo==="campanha")
  const metas=comunicados.filter(c=>c.tipo==="meta")
  const agenda=comunicados.filter(c=>c.tipo==="agenda")

  const hora=new Date().getHours()
  const saudacao=hora<12?"Bom dia":hora<18?"Boa tarde":"Boa noite"

  const secHead=(label,tipo)=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#888",fontWeight:600}}>{label}</div>
        <div style={{height:1,width:40,background:"linear-gradient(to right,rgba(113,63,42,0.35),transparent)"}}/>
      </div>
      {isAdmin&&<button onClick={()=>setModal({defaultTipo:tipo})} style={{width:26,height:26,borderRadius:"50%",border:"1.5px solid rgba(113,63,42,0.25)",background:"white",color:"#713F2A",fontSize:14,cursor:"pointer",display:"grid",placeItems:"center",lineHeight:1}}>+</button>}
    </div>
  )

  const cardBase={background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)",position:"relative"}

  return(
    <div style={{background:"#F5F1EC",minHeight:"100%",fontFamily:FB}}>
      {modal&&<ComunicadoModal initial={modal.item} onSave={save} onClose={()=>setModal(null)}/>}

      <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>

        {/* ── GREETING ── */}
        <div style={{marginBottom:36,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#713F2A",fontWeight:600,marginBottom:12}}>{dateLabel()}</div>
            <h1 style={{fontFamily:FT,fontWeight:300,fontSize:44,letterSpacing:.3,lineHeight:1.12,color:"#1a1a1a",margin:"0 0 12px"}}>
              {saudacao}, <em style={{fontStyle:"italic",fontWeight:300,color:"#713F2A"}}>{usuario.nome?.split(" ")[0]}.</em>
            </h1>
            <p style={{fontSize:14,color:"#888",maxWidth:520,lineHeight:1.7,margin:0}}>Aqui está o painel do dia. Consulte avisos, campanhas e metas antes de começar.</p>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <AxLogo height={36} variant="full" dark={false} style={{filter:"none",opacity:.35}}/>
          </div>
        </div>

        {/* ── MAIN GRID: avisos + metas ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,marginBottom:20}}>

          {/* MURAL DE AVISOS */}
          <div>
            {secHead("Mural de Avisos","aviso")}
            {loading&&<div style={{...cardBase,textAlign:"center",padding:32,color:"#aaa"}}>Carregando...</div>}
            {!loading&&avisos.length===0&&(
              <div style={{...cardBase,textAlign:"center",padding:32}}>
                <div style={{fontSize:28,marginBottom:8}}>📋</div>
                <div style={{fontSize:13,color:"#aaa"}}>{isAdmin?"Nenhum aviso publicado. Clique em + para adicionar.":"Nenhum aviso no momento."}</div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {avisos.map(av=>(
                <div key={av.id} style={{...cardBase,borderLeft:`4px solid ${av.cor}`}}>
                  {isAdmin&&<button onClick={()=>del(av.id)} style={{position:"absolute",top:10,right:10,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.06)",color:"#aaa",cursor:"pointer",fontSize:11,display:"grid",placeItems:"center"}}>✕</button>}
                  <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${av.cor}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{av.icone}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",marginBottom:av.corpo?4:0,fontFamily:FT}}>{av.titulo}</div>
                      {av.corpo&&<div style={{fontSize:12,color:"#666",lineHeight:1.65}}>{av.corpo}</div>}
                    </div>
                    {isAdmin&&<button onClick={()=>setModal({item:av})} style={{position:"absolute",bottom:10,right:10,fontSize:10,color:"#aaa",background:"none",border:"none",cursor:"pointer",letterSpacing:1}}>editar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* METAS DO MÊS */}
          <div>
            {secHead("Metas do Mês","meta")}
            {!loading&&metas.length===0&&(
              <div style={{...cardBase,textAlign:"center",padding:32}}>
                <div style={{fontSize:28,marginBottom:8}}>🎯</div>
                <div style={{fontSize:13,color:"#aaa"}}>{isAdmin?"Nenhuma meta definida. Clique em + para adicionar.":"Sem metas definidas."}</div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {metas.map(mt=>{
                const pct=Math.min(100,Math.max(0,mt.progresso||0))
                const cor=pct>=80?"#2e8a4e":pct>=50?mt.cor||"#713F2A":"#b71c1c"
                return(
                  <div key={mt.id} style={{...cardBase}}>
                    {isAdmin&&<button onClick={()=>del(mt.id)} style={{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.06)",color:"#aaa",cursor:"pointer",fontSize:10,display:"grid",placeItems:"center"}}>✕</button>}
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:16}}>{mt.icone}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{mt.titulo}</div>
                        {mt.meta_label&&<div style={{fontSize:11,color:"#aaa",marginTop:1}}>{mt.meta_label}</div>}
                      </div>
                      <div style={{fontFamily:FT,fontSize:20,fontWeight:300,color:cor}}>{pct}%</div>
                    </div>
                    <div style={{height:8,background:"#EFE9E0",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${cor},${SEC})`,borderRadius:99,transition:"width .6s ease"}}/>
                    </div>
                    {isAdmin&&<button onClick={()=>setModal({item:mt})} style={{marginTop:8,fontSize:10,color:"#aaa",background:"none",border:"none",cursor:"pointer",letterSpacing:1}}>editar progresso</button>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── CAMPANHAS ── */}
        <div style={{marginBottom:36}}>
          {secHead("Campanhas do Mês","campanha")}
          {!loading&&campanhas.length===0&&(
            <div style={{...cardBase,textAlign:"center",padding:"24px 20px"}}>
              <div style={{fontSize:28,marginBottom:8}}>📣</div>
              <div style={{fontSize:13,color:"#aaa"}}>{isAdmin?"Nenhuma campanha ativa. Clique em + para criar.":"Nenhuma campanha ativa no momento."}</div>
            </div>
          )}
          {campanhas.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {campanhas.map(cp=>(
              <div key={cp.id} style={{borderRadius:16,padding:"22px 24px",color:"white",background:`radial-gradient(ellipse at 110% 10%,rgba(255,255,255,.15),transparent 55%),linear-gradient(135deg,${cp.cor},${cp.cor}cc)`,position:"relative",minHeight:130,display:"flex",flexDirection:"column",gap:8}}>
                {isAdmin&&<button onClick={()=>del(cp.id)} style={{position:"absolute",top:10,right:10,width:22,height:22,borderRadius:"50%",border:"1px solid rgba(255,255,255,.3)",background:"rgba(0,0,0,.15)",color:"rgba(255,255,255,.8)",cursor:"pointer",fontSize:11,display:"grid",placeItems:"center"}}>✕</button>}
                <div style={{fontSize:26,marginBottom:4}}>{cp.icone}</div>
                <div style={{fontFamily:FT,fontSize:18,fontWeight:300,lineHeight:1.2}}>{cp.titulo}</div>
                {cp.corpo&&<div style={{fontSize:12,color:"rgba(255,255,255,.80)",lineHeight:1.55,marginTop:4}}>{cp.corpo}</div>}
                {isAdmin&&<button onClick={()=>setModal({item:cp})} style={{marginTop:"auto",fontSize:10,color:"rgba(255,255,255,.55)",background:"none",border:"none",cursor:"pointer",letterSpacing:1,textAlign:"left"}}>editar</button>}
              </div>
            ))}
          </div>}
        </div>

        {/* ── AGENDA DO MÊS ── */}
        <div style={{marginBottom:36}}>
          {secHead("Agenda do Mês","agenda")}
          {!loading&&agenda.length===0&&(
            <div style={{...cardBase,textAlign:"center",padding:"20px 24px",display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
              <span style={{fontSize:22}}>📅</span>
              <div style={{fontSize:13,color:"#aaa"}}>{isAdmin?"Nenhum evento agendado. Clique em + para adicionar.":"Nenhum evento agendado para este mês."}</div>
            </div>
          )}
          {agenda.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
            {agenda.map(ev=>(
              <div key={ev.id} style={{...cardBase,borderTop:`3px solid ${ev.cor}`,display:"flex",flexDirection:"column",gap:8}}>
                {isAdmin&&<button onClick={()=>del(ev.id)} style={{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.06)",color:"#aaa",cursor:"pointer",fontSize:10,display:"grid",placeItems:"center"}}>✕</button>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:`${ev.cor}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ev.icone}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",lineHeight:1.3}}>{ev.titulo}</div>
                    {ev.meta_label&&<div style={{fontSize:11,color:ev.cor,fontWeight:600,marginTop:2,letterSpacing:.5}}>{ev.meta_label}</div>}
                  </div>
                </div>
                {ev.corpo&&<div style={{fontSize:12,color:"#888",lineHeight:1.55,paddingTop:4,borderTop:"1px solid rgba(113,63,42,0.08)"}}>{ev.corpo}</div>}
                {isAdmin&&<button onClick={()=>setModal({item:ev})} style={{fontSize:10,color:"#aaa",background:"none",border:"none",cursor:"pointer",letterSpacing:1,textAlign:"left",marginTop:2}}>editar</button>}
              </div>
            ))}
          </div>}
        </div>

        {/* ── SEGMENTOS ── */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            Segmentos
            <div style={{height:1,width:40,background:"linear-gradient(to right,rgba(113,63,42,0.35),transparent)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:canAssessoria?"1fr 1fr":"1fr",gap:20,marginBottom:24}}>
            <div onClick={()=>onNav("varejo","crm")}
              style={{borderRadius:16,padding:"28px 32px 24px",minHeight:180,color:"#fff",cursor:"pointer",background:`radial-gradient(ellipse at 110% -10%,rgba(204,166,127,.35),transparent 55%),linear-gradient(135deg,${VAREJO.dark},${VAREJO.primary})`,transition:"transform .2s,box-shadow .2s",display:"flex",flexDirection:"column"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 24px 50px -24px rgba(0,11,74,.5)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
              <div style={{fontSize:9,letterSpacing:4,textTransform:"uppercase",marginBottom:10,opacity:.8}}>Pessoa Física · B2C</div>
              <div style={{fontFamily:FT,fontWeight:300,fontSize:38,lineHeight:1,marginBottom:10}}>Varejo</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.80)",lineHeight:1.6,marginBottom:14}}>Consórcios, Home Equity e alavancagem patrimonial.</div>
              <div style={{marginTop:"auto",display:"flex",gap:24,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.15)"}}>
                {[["CRM","Clientes"],["HE","Simulação"],["Consórcio","Produto"]].map(([v,k])=>(
                  <div key={k}><div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,.6)",marginBottom:4}}>{k}</div><div style={{fontFamily:FT,fontSize:18,lineHeight:1}}>{v}</div></div>
                ))}
              </div>
            </div>
            {canAssessoria&&<div onClick={()=>onNav("assessoria","crm")}
              style={{borderRadius:16,padding:"28px 32px 24px",minHeight:180,color:"#fff",cursor:"pointer",background:`radial-gradient(ellipse at 110% -10%,rgba(204,166,127,.35),transparent 55%),linear-gradient(135deg,${ASSESS.dark},${ASSESS.primary})`,transition:"transform .2s,box-shadow .2s",display:"flex",flexDirection:"column"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 24px 50px -24px rgba(113,63,42,.5)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
              <div style={{fontSize:9,letterSpacing:4,textTransform:"uppercase",marginBottom:10,opacity:.8}}>Pessoa Jurídica · B2B</div>
              <div style={{fontFamily:FT,fontWeight:300,fontSize:38,lineHeight:1,marginBottom:10}}>Atacado</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.80)",lineHeight:1.6,marginBottom:14}}>Operações estruturadas: capital de giro, expansão, engenharia financeira.</div>
              <div style={{marginTop:"auto",display:"flex",gap:24,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.15)"}}>
                {[["CRM","Empresas"],["Diagnóstico","Novo"],["Estratégia","Cenários"]].map(([v,k])=>(
                  <div key={k}><div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,.6)",marginBottom:4}}>{k}</div><div style={{fontFamily:FT,fontSize:18,lineHeight:1}}>{v}</div></div>
                ))}
              </div>
            </div>}
          </div>

          {/* Acesso rápido */}
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            Acesso rápido
            <div style={{height:1,width:40,background:"linear-gradient(to right,rgba(113,63,42,0.35),transparent)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              {icon:"🤝",t:"Simulação Consórcios",s:"Compare administradoras e prazos.",fn:()=>onNav("varejo","consorcio")},
              {icon:"🏦",t:"Simulação HE",s:"Calcule Home Equity em Price ou SAC.",fn:()=>onNav("varejo","diag")},
              {icon:"🎯",t:"Simulador de Estratégia",s:"Cenários de crédito estruturado.",fn:()=>onNav("varejo","estrategia")},
              {icon:"⬇️",t:"Downloads",s:"Apresentações, scripts e materiais.",fn:()=>onNav(null,"materiais")},
            ].map((q,i)=>(
              <div key={i} onClick={q.fn} style={{background:"white",border:"1px solid rgba(113,63,42,0.12)",borderRadius:12,padding:"16px 18px",cursor:"pointer",display:"flex",flexDirection:"column",gap:10,transition:"border-color .15s,transform .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#713F2A";e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(113,63,42,0.12)";e.currentTarget.style.transform=""}}>
                <div style={{width:34,height:34,borderRadius:8,background:"rgba(113,63,42,0.08)",display:"grid",placeItems:"center",fontSize:16}}>{q.icon}</div>
                <div style={{fontSize:13,color:"#1a1a1a",fontWeight:600}}>{q.t}</div>
                <div style={{fontSize:11,color:"#888",lineHeight:1.55}}>{q.s}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── FERRAMENTA COMERCIAL ───────────────────────────────────────────────────────
const FC_SYS=`Você é o assistente de comunicação comercial da Áxicon, uma consultoria de estratégia financeira premium.

TOM DE VOZ: "Sofisticação Acessível e Autoridade Técnica"
- Autoridade sem arrogância: fale com propriedade sobre dinheiro, investimentos e alavancagem
- Sofisticação acessível: premium mas não elitista
- Foco em solução, nunca em produto
- Firmeza e segurança: transmita estabilidade e previsibilidade

VOCABULÁRIO PROIBIDO: "barato","precinho","sorteio","tentar a sorte","vendedor","comprar","pegar","consórcio" (para descrever o serviço),"esquema"
VOCABULÁRIO CORRETO: "custo de capital eficiente","estratégia de contemplação","consultor de estratégia","adquirir","alavancar","solução de crédito","ferramenta de alavancagem","engenharia financeira","otimizar fluxo de caixa","eficiência fiscal"

REGRA CRÍTICA: NUNCA use travessão (— ou -). Tom humanizado, natural.

PÚBLICOS:
1. VAREJO: pessoa física/pequeno empreendedor. Produto: solução de crédito sem juros compostos. Tom acolhedor, educativo.
2. ATACADO: empresa/empresário. Produto: alavancagem patrimonial, crédito de fundos internacionais, eficiência fiscal. Tom consultivo, estratégico.

METODOLOGIA: Quem pergunta, domina. Quem assume, perde. Qualifique antes de apresentar solução. Crie rapport antes de posicionar estratégia.

QUALIFICAÇÃO BANT: Necessidade, Prazo, Orçamento, Autoridade.

TEMPERATURAS:
FRIO: Gerar curiosidade. Não explicar produto. Menos de 3 linhas.
MORNO: Reduzir resistência. Mostrar que é só uma conversa. Passar segurança.
QUENTE: Abordagem direta e consultiva. Tom de par a par.

Gere APENAS a mensagem solicitada, sem explicações, sem introdução, sem aspas. Pareça escrita por um consultor humano sofisticado.`

const FC_REGUAS={
  varejo:[
    {dia:1,canal:'WhatsApp',titulo:'Primeiro Contato',descricao:'Apresentação inicial leve. O objetivo é gerar curiosidade, não explicar o produto.',dica:'Menos de 3 linhas. Não explique nada ainda. Gere curiosidade. Use o nome do lead.',followup:'Trate como uma conversa, não como venda. O objetivo é abrir espaço para o lead falar.'},
    {dia:2,canal:'Ligação',titulo:'Qualificação',descricao:'Entender o momento de vida do lead: sonho, projeto, prazo. Escuta ativa.',dica:'Perguntas abertas: qual finalidade? Quando? Quanto consegue comprometer por mês? Decisão é sua ou envolve alguém?',followup:'Quem pergunta, domina. Quem assume, perde.'},
    {dia:4,canal:'E-mail',titulo:'Conteúdo de Valor',descricao:'Enviar material educativo sobre formação de patrimônio sem juros compostos.',dica:'Não tente vender aqui. Eduque. Compare custo de capital no consórcio vs. juros compostos do financiamento.',followup:null},
    {dia:7,canal:'WhatsApp',titulo:'Follow-up',descricao:'Retomar o contato de forma leve. Relembrar a conversa anterior sem pressão.',dica:'Curto e direto. Referência ao que foi conversado. Mostre disponibilidade para enviar simulação sem compromisso.',followup:'80% das vendas acontecem no follow-up. Raramente o lead decide na 1ª abordagem.'},
    {dia:10,canal:'Ligação',titulo:'Apresentação da Estratégia',descricao:'Apresentar a solução de crédito como estratégia personalizada para o projeto do cliente.',dica:'Use o objetivo específico do lead. Mostre a simulação completa. Nunca deixe sem próximo passo.',followup:null},
    {dia:14,canal:'E-mail',titulo:'Reengajamento',descricao:'Para quem não respondeu. Tom de parceria, não de cobrança.',dica:'Urgência sutil: condições do grupo podem mudar. Nunca soe desesperado. Reforce o valor, não o produto.',followup:'Se ainda fizer sentido para você, é só me dar um retorno que preparamos a simulação juntos.'},
    {dia:21,canal:'WhatsApp',titulo:'Último Contato',descricao:'Breakup message. Deixar a porta aberta com elegância.',dica:'Encerre com classe. Brevidade é sofisticação. O lead deve sentir que perdeu uma oportunidade.',followup:null},
  ],
  atacado:[
    {dia:1,canal:'LinkedIn / E-mail',titulo:'Primeiro Contato',descricao:'Abordagem direta e estratégica. Referência ao segmento ou empresa do prospect.',dica:'Demonstre que fez o dever de casa. Cite algo específico do negócio ou setor. Tom de par a par.',followup:null},
    {dia:2,canal:'Ligação',titulo:'Qualificação Estratégica',descricao:'Entender o ciclo de caixa, projetos de expansão e estrutura atual de crédito.',dica:'Como estão estruturando capital para o próximo ciclo? Qual o custo de capital atual? Há projetos travados por liquidez?',followup:'Quem pergunta, domina.'},
    {dia:4,canal:'E-mail',titulo:'Estudo de Caso / Proposta Conceitual',descricao:'Case de alavancagem patrimonial com dados reais ou simulados. Eficiência fiscal e ROI.',dica:'Números e percentuais. Empresários Middle/Corporate pensam em ROI, custo de capital e eficiência fiscal.',followup:null},
    {dia:7,canal:'WhatsApp',titulo:'Follow-up Executivo',descricao:'Mensagem curta e de alto nível. Checar se houve tempo para analisar o material.',dica:'Tom de par a par. Não é um consultor cobrando, é um estrategista verificando. Brevidade e objetividade.',followup:null},
    {dia:10,canal:'Ligação',titulo:'Reunião de Estruturação',descricao:'Propor reunião para apresentar a estrutura personalizada de alavancagem.',dica:'Propor datas específicas. Apresentar: crédito de fundos internacionais, eficiência fiscal, preservação de caixa.',followup:null},
    {dia:14,canal:'E-mail',titulo:'Proposta Formal',descricao:'Proposta estruturada com metodologia, benefícios fiscais e projeções.',dica:'Documento impecável. Mostre: custo de capital, impacto no fluxo de caixa, comparativo com crédito bancário.',followup:null},
    {dia:21,canal:'LinkedIn',titulo:'Último Contato',descricao:'Breakup executivo. Deixar espaço para retomada futura.',dica:'Brevidade é sofisticação. Três linhas no máximo. Uma janela estratégica se fechando, não cobrança.',followup:null},
  ],
}
const FC_OBJ=[
  {obj:'Tá caro',resp:'Redirecionar para custo de oportunidade. Qual o preço que está pagando hoje por não ter iniciado?'},
  {obj:'Não tenho dinheiro',resp:'Identificar: é o valor da parcela ou a condição de pagamento? Qualificar o real impedimento.'},
  {obj:'Vou pensar',resp:'Descobrir o que está impedindo a decisão agora. Dúvida sobre benefícios ou sobre o investimento?'},
  {obj:'Consórcio demora',resp:'Educar sobre estratégia de contemplação vs. esperar sorteio. Com planejamento, o prazo é controlável.'},
  {obj:'Prefiro financiamento',resp:'Comparar custo total. Quanto vale pagar a mais só para ter o bem alguns meses antes?'},
  {obj:'Não tenho lance',resp:'Mostrar alternativas: FGTS, 13º, venda de bem. Ou participar do sorteio mensal sem lance.'},
  {obj:'Não é o momento',resp:'Quanto antes começa, mais rápido contempla. Não começar hoje é adiar o resultado por exatamente esse tempo.'},
  {obj:'Quero tirar logo',resp:'Com planejamento de lance, o prazo é encurtável. Sem planejamento, qualquer caminho demora.'},
  {obj:'Vou pesquisar em outros',resp:'Oferecer simulação como base de comparação. Posicionar diferenciais: suporte, metodologia, solidez.'},
  {obj:'Preciso falar com cônjuge/sócio',resp:'Incluir o decisor. Oferecer call conjunta para apresentar a estratégia a todos os envolvidos.'},
]
const FC_CE={'WhatsApp':'💬','Ligação':'📞','E-mail':'📧','LinkedIn / E-mail':'💼','LinkedIn':'💼'}
const FC_TOM=[
  {val:'',label:'Padrão Áxicon'},
  {val:'jovem e descontraído, linguagem mais leve e próxima',label:'🧢 Jovem'},
  {val:'sério e objetivo, sem rodeios',label:'🎯 Direto'},
  {val:'executivo formal, vocabulário corporativo elevado',label:'🤝 Executivo'},
  {val:'técnico, aprecia dados e argumentos racionais',label:'📊 Analítico'},
]
const FC_TABS=[['regua','Régua de Comunicação'],['gerador','Gerador de Mensagens'],['objecoes','Objeções']]

function FerramentaComercialView(){
  const CN=VAREJO.primary,CN2='#2B367B',BG2='#EEF0F8'
  const[tab,setTab]=useState('regua')
  const[pub,setPub]=useState('varejo')
  const[openStep,setOpenStep]=useState(null)
  const[openObj,setOpenObj]=useState(null)
  const[gPub,setGPub]=useState('varejo')
  const[gTemp,setGTemp]=useState('frio')
  const[gCanal,setGCanal]=useState('whatsapp')
  const[gTom,setGTom]=useState('')
  const[gContexto,setGContexto]=useState('')
  const[gEtapa,setGEtapa]=useState('')
  const[generating,setGenerating]=useState(false)
  const[result,setResult]=useState(null)
  const[copied,setCopied]=useState(false)
  const[erro,setErro]=useState('')

  const goToGerador=(canal,etapa)=>{
    const map={'WhatsApp':'whatsapp','E-mail':'email','Ligação':'ligacao','LinkedIn / E-mail':'linkedin','LinkedIn':'linkedin'}
    setGCanal(map[canal]||'whatsapp');setGEtapa(etapa);setTab('gerador')
  }
  const gerar=async()=>{
    setGenerating(true);setErro('');setResult(null)
    const pubDesc=gPub==='varejo'?'VAREJO: pessoa física ou pequeno empreendedor':'ATACADO: empresário ou empresa'
    const tempDesc={frio:'FRIO: lead de tráfego pago. Gerar curiosidade. Menos de 3 linhas.',morno:'MORNO: lead inbound ou que esfriou. Reduzir resistência.',quente:'QUENTE: indicação ou interesse claro. Abordagem direta e consultiva.'}[gTemp]
    const canalDesc={whatsapp:'WhatsApp (informal mas sofisticado, curto e direto)',email:'E-mail (elaborado, estruturado, com próximo passo claro)',ligacao:'Ligação telefônica (script com perguntas BANT)',linkedin:'LinkedIn ou SMS (profissional e conciso)'}[gCanal]
    const prompt=`Gere uma mensagem comercial:\nPÚBLICO: ${pubDesc}\nTEMPERATURA: ${tempDesc}\nCANAL: ${canalDesc}\n${gEtapa?'ETAPA: '+gEtapa:''}\nCONTEXTO: ${gContexto||'Nenhum contexto adicional'}\n${gTom?'TOM: '+gTom:''}\nGere apenas a mensagem, pronta para uso.`
    try{
      const res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:FC_SYS,messages:[{role:'user',content:prompt}]})})
      const d=await res.json()
      if(d.error){setErro(d.error);setGenerating(false);return}
      setResult(d.text)
    }catch{setErro('Erro de conexão. Tente novamente.')}
    setGenerating(false)
  }
  const copiar=()=>{if(!result)return;navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000)}

  const chip=(active,color=CN)=>({padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:FB,fontSize:13,fontWeight:active?700:400,border:`1.5px solid ${active?color:'#ddd'}`,background:active?color+'14':'white',color:active?color:'#888'})
  const chipSm=(active,color=CN)=>({...chip(active,color),padding:'6px 12px',fontSize:12})
  const inp={padding:'10px 14px',border:'1.5px solid #ddd',borderRadius:8,fontSize:14,outline:'none',fontFamily:FB,background:'#fafaf8',width:'100%',boxSizing:'border-box'}
  const crd=(active)=>({background:'white',borderRadius:14,marginBottom:10,boxShadow:'0 2px 12px rgba(0,0,0,.05)',overflow:'hidden',border:`1px solid ${active?CN+'50':'transparent'}`})
  const lbl={fontSize:10,color:CN,letterSpacing:2,fontWeight:700,display:'block',marginBottom:6,fontFamily:FB}

  return(
    <div style={{padding:"24px 32px 60px",fontFamily:FB}}>
      <div style={{marginBottom:22}}>
        <div style={{fontSize:11,color:SEC,letterSpacing:3,fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>Comunicação Comercial</div>
        <h1 style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",margin:0,letterSpacing:.5}}>Ferramenta <em style={{fontStyle:'italic',color:CN}}>Comercial</em></h1>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:28,background:'white',padding:5,borderRadius:14,border:'1px solid rgba(0,0,0,0.08)',width:'fit-content'}}>
        {FC_TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'10px 20px',borderRadius:9,border:'none',fontSize:12,letterSpacing:.8,fontWeight:500,cursor:'pointer',background:tab===id?CN:'transparent',color:tab===id?'white':'#555'}}>{label}</button>
        ))}
      </div>

      {tab==='regua'&&(
        <div style={{maxWidth:860}}>
          <div style={{display:'flex',gap:10,marginBottom:24}}>
            {[['varejo','🏠 Varejo','Solução de Crédito'],['atacado','🏢 Atacado','Alavancagem Patrimonial']].map(([id,title,sub])=>(
              <button key={id} onClick={()=>{setPub(id);setOpenStep(null)}} style={{flex:1,textAlign:'left',padding:'14px 18px',borderRadius:12,border:`1.5px solid ${pub===id?CN:'#ddd'}`,background:pub===id?CN+'0d':'white',cursor:'pointer'}}>
                <div style={{fontSize:14,fontWeight:700,color:pub===id?CN:'#888',fontFamily:FT}}>{title}</div>
                <div style={{fontSize:11,color:'#aaa',marginTop:3}}>{sub}</div>
              </button>
            ))}
          </div>
          {FC_REGUAS[pub].map((s,i)=>(
            <div key={i} style={crd(openStep===i)} onClick={()=>setOpenStep(openStep===i?null:i)}>
              <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:openStep===i?CN:CN+'14',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:openStep===i?'white':CN,fontFamily:FB}}>D{s.dia}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1a1a',fontFamily:FT}}>{s.titulo}</span>
                    <span style={{fontSize:11,background:CN+'0d',color:CN,padding:'2px 10px',borderRadius:10,fontFamily:FB,fontWeight:600}}>{FC_CE[s.canal]||'📡'} {s.canal}</span>
                  </div>
                  <div style={{fontSize:12,color:'#888',marginTop:4}}>{s.descricao}</div>
                </div>
                <div style={{color:'#ccc',fontSize:12,flexShrink:0,transform:openStep===i?'rotate(180deg)':'none'}}>▼</div>
              </div>
              {openStep===i&&(
                <div style={{padding:'0 18px 18px',borderTop:'1px solid #f0f0f0'}} onClick={e=>e.stopPropagation()}>
                  <div style={{background:CN+'08',borderRadius:10,padding:'14px 16px',border:`1px solid ${CN}20`,marginBottom:10,marginTop:14}}>
                    <span style={lbl}>DICA DO CONSULTOR</span>
                    <p style={{fontSize:13,color:'#444',lineHeight:1.7,fontFamily:FB,margin:0}}>{s.dica}</p>
                  </div>
                  {s.followup&&<div style={{background:'rgba(100,130,200,0.06)',borderRadius:10,padding:'12px 16px',border:'1px solid rgba(100,130,200,0.2)',marginBottom:12}}>
                    <span style={{...lbl,color:'#5070b0'}}>LEMBRE-SE</span>
                    <p style={{fontSize:12,color:'#5070b0',fontStyle:'italic',fontFamily:FB,margin:0}}>{s.followup}</p>
                  </div>}
                  <button onClick={()=>goToGerador(s.canal,`Dia ${s.dia} — ${s.titulo}`)} style={{padding:'9px 18px',borderRadius:9,border:`1.5px solid ${CN}40`,background:CN+'0d',color:CN,cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:FB}}>✨ Gerar mensagem para esta etapa</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==='gerador'&&(
        <div style={{maxWidth:860}}>
          <div style={{background:'white',borderRadius:16,padding:28,boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>
            {gEtapa&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,padding:'10px 16px',borderRadius:9,background:CN+'0d',border:`1px solid ${CN}25`,fontSize:13,color:CN,fontFamily:FB,fontWeight:600}}>
              <span>📌 {gEtapa}</span>
              <button onClick={()=>setGEtapa('')} style={{background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:16}}>✕</button>
            </div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <div><span style={lbl}>PÚBLICO</span><div style={{display:'flex',gap:8}}>{[['varejo','🏠 Varejo'],['atacado','🏢 Atacado']].map(([v,l])=><button key={v} onClick={()=>setGPub(v)} style={chip(gPub===v)}>{l}</button>)}</div></div>
              <div><span style={lbl}>TEMPERATURA</span><div style={{display:'flex',gap:8}}>{[['frio','🧊 Frio'],['morno','🌡 Morno'],['quente','🔥 Quente']].map(([v,l])=><button key={v} onClick={()=>setGTemp(v)} style={chip(gTemp===v)}>{l}</button>)}</div></div>
            </div>
            <div style={{marginBottom:20}}>
              <span style={lbl}>CANAL</span>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[['whatsapp','💬 WhatsApp'],['email','📧 E-mail'],['ligacao','📞 Ligação'],['linkedin','💼 LinkedIn']].map(([v,l])=><button key={v} onClick={()=>setGCanal(v)} style={chip(gCanal===v)}>{l}</button>)}
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <span style={lbl}>TOM DO LEAD (opcional)</span>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>{FC_TOM.map(({val,label})=><button key={label} onClick={()=>setGTom(val)} style={chipSm(gTom===val)}>{label}</button>)}</div>
              <input type="text" placeholder="Ou descreva livremente o perfil do lead..." value={gTom} onChange={e=>setGTom(e.target.value)} style={inp}/>
            </div>
            <div style={{marginBottom:20}}>
              <span style={lbl}>CONTEXTO DO LEAD (opcional)</span>
              <textarea placeholder="Ex: Lead veio por anúncio no Instagram, perguntou sobre imóvel de R$ 400 mil, tem FGTS disponível..." value={gContexto} onChange={e=>setGContexto(e.target.value)} rows={4} style={{...inp,resize:'vertical',lineHeight:1.6}}/>
            </div>
            {erro&&<div style={{padding:'10px 16px',borderRadius:9,background:'#fde8e8',border:'1px solid #f4433640',color:'#c62828',fontSize:13,marginBottom:16}}>{erro}</div>}
            <button onClick={gerar} disabled={generating} style={{width:'100%',padding:'13px 0',borderRadius:10,border:'none',background:generating?'#ddd':`linear-gradient(135deg,${CN},${CN2})`,color:'white',fontWeight:700,fontSize:15,cursor:generating?'not-allowed':'pointer',fontFamily:FT,letterSpacing:1}}>
              {generating?'Gerando mensagem...':'✨ Gerar Mensagem'}
            </button>
            {result&&<div style={{marginTop:20,background:BG2,borderRadius:12,padding:'20px 22px',border:`1px solid ${CN}20`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={lbl}>MENSAGEM GERADA</span>
                <button onClick={copiar} style={{padding:'6px 16px',borderRadius:8,border:`1.5px solid ${copied?CN:'#ddd'}`,background:copied?CN+'14':'white',color:copied?CN:'#888',cursor:'pointer',fontSize:12,fontFamily:FB,fontWeight:600}}>{copied?'✓ Copiado!':'Copiar'}</button>
              </div>
              <div style={{fontSize:14,color:'#333',lineHeight:1.8,whiteSpace:'pre-wrap',fontFamily:FB}}>{result}</div>
              <button onClick={gerar} disabled={generating} style={{marginTop:14,padding:'8px 16px',borderRadius:8,border:'1.5px solid #ddd',background:'white',color:'#888',cursor:'pointer',fontSize:12,fontFamily:FB}}>🔄 Gerar outra versão</button>
            </div>}
          </div>
        </div>
      )}

      {tab==='objecoes'&&(
        <div style={{maxWidth:860}}>
          {FC_OBJ.map((o,i)=>(
            <div key={i} style={crd(openObj===i)} onClick={()=>setOpenObj(openObj===i?null:i)}>
              <div style={{padding:'16px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:14,fontWeight:700,color:openObj===i?CN:'#1a1a1a',fontFamily:FT}}>"{o.obj}"</div>
                <div style={{color:'#ccc',fontSize:12,transform:openObj===i?'rotate(180deg)':'none'}}>▼</div>
              </div>
              {openObj===i&&(
                <div style={{padding:'0 18px 18px',borderTop:'1px solid #f0f0f0'}} onClick={e=>e.stopPropagation()}>
                  <div style={{background:CN+'08',borderRadius:10,padding:'14px 16px',border:`1px solid ${CN}20`,marginBottom:12,marginTop:14}}>
                    <span style={lbl}>ABORDAGEM RECOMENDADA</span>
                    <p style={{fontSize:13,color:'#444',lineHeight:1.7,fontFamily:FB,margin:0}}>{o.resp}</p>
                  </div>
                  <button onClick={()=>{setGContexto(`O lead disse: "${o.obj}". Gere uma resposta que trate essa objeção dentro do contexto da Áxicon.`);setTab('gerador')}} style={{padding:'9px 18px',borderRadius:9,border:`1.5px solid ${CN}40`,background:CN+'0d',color:CN,cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:FB}}>✨ Gerar resposta para esta objeção</button>
                </div>
              )}
            </div>
          ))}
          <div style={{marginTop:20,background:'white',borderRadius:14,padding:'20px 22px',boxShadow:'0 2px 12px rgba(0,0,0,.05)',borderLeft:`4px solid ${CN2}`}}>
            <div style={{fontSize:10,color:CN2,letterSpacing:2,fontWeight:700,marginBottom:10,fontFamily:FB}}>REGRA DE OURO</div>
            <p style={{fontSize:13,color:'#555',lineHeight:1.8,fontFamily:FB,margin:0}}>Quem pergunta, domina. Quem assume, perde. Toda objeção é uma dúvida disfarçada ou um sinal de que o valor ainda não ficou claro. Antes de responder, identifique o que está por trás com uma pergunta.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── NAV ITEM ──────────────────────────────────────────────────────────────────
// ── RASTREAMENTO ──────────────────────────────────────────────────────────────
function useRastreamento(usuario) {
  const telaRef        = useRef(null)
  const telaStartRef   = useRef(null)
  const sessaoStartRef = useRef(null)

  const track = useCallback((tipo, valor, duracao_s = null, contexto = null) => {
    if (!usuario) return
    supabase.from('rastreamento').insert({
      user_id: usuario.id, user_email: usuario.email, user_nome: usuario.nome,
      tipo, valor, duracao_s, contexto, criado_em: new Date().toISOString()
    }).then(() => {})
  }, [usuario?.id])

  useEffect(() => {
    if (!usuario) return
    sessaoStartRef.current = Date.now()
    track('sessao', 'inicio')
    return () => {
      if (telaRef.current && telaStartRef.current) {
        const dur = Math.round((Date.now() - telaStartRef.current) / 1000)
        if (dur > 1) track('tela', telaRef.current, dur)
      }
      const dur = Math.round((Date.now() - sessaoStartRef.current) / 1000)
      track('sessao', 'fim', dur)
    }
  }, [usuario?.id])

  const trackTela = useCallback((nomeTela) => {
    if (!usuario || !nomeTela) return
    if (telaRef.current && telaStartRef.current) {
      const dur = Math.round((Date.now() - telaStartRef.current) / 1000)
      if (dur > 1) track('tela', telaRef.current, dur)
    }
    telaRef.current = nomeTela
    telaStartRef.current = Date.now()
  }, [track, usuario?.id])

  return { track, trackTela }
}

const TELA_LABEL = {
  inicio:'Início',crm_varejo:'Painel Varejo',crm_assessoria:'Painel Atacado',
  diag_varejo:'Simulação HE',diag_assessoria:'Diagnóstico Atacado',
  consorcio:'Consórcios',estrategia:'Simulador Estratégia',
  ferramenta:'Ferramenta Comercial',materiais:'Materiais',
  painelAdmin:'Painel Admin',rastreamento:'Rastreamento'
}
const fmtTempo = s => {
  if (!s || s < 1) return '< 1s'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60 > 0 ? `${s%60}s` : ''}`
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`
}
const fmtDataHora = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})
}

function PainelRastreamento({token}) {
  const [eventos, setEventos] = useState([])
  const [load, setLoad]       = useState(true)
  const [aba, setAba]         = useState('usuarios')
  const [filtroUsuario, setFiltroUsuario] = useState('todos')

  useEffect(() => {
    fetch(`${API}/api/rastreamento`, {headers:{Authorization:`Bearer ${token}`}})
      .then(r => r.json())
      .then(d => { setEventos(d.eventos || []); setLoad(false) })
      .catch(() => setLoad(false))
  }, [token])

  // Agrega por usuário
  const porUsuario = {}
  eventos.forEach(e => {
    if (!e.user_id) return
    if (!porUsuario[e.user_id]) porUsuario[e.user_id] = {
      id: e.user_id, email: e.user_email, nome: e.user_nome,
      sessoes: 0, tempoTotal: 0, telas: {}, acoes: [], ultimaAtividade: null
    }
    const u = porUsuario[e.user_id]
    if (e.tipo === 'sessao' && e.valor === 'inicio') u.sessoes++
    if (e.tipo === 'sessao' && e.valor === 'fim' && e.duracao_s) u.tempoTotal += e.duracao_s
    if (e.tipo === 'tela' && e.duracao_s) u.telas[e.valor] = (u.telas[e.valor]||0) + e.duracao_s
    if (e.tipo === 'acao') u.acoes.push(e)
    if (!u.ultimaAtividade || e.criado_em > u.ultimaAtividade) u.ultimaAtividade = e.criado_em
  })
  const usuarios = Object.values(porUsuario).sort((a,b) => (b.ultimaAtividade||'').localeCompare(a.ultimaAtividade||''))

  const hoje = new Date().toISOString().slice(0,10)
  const sessoesHoje = eventos.filter(e => e.tipo==='sessao' && e.valor==='inicio' && e.criado_em?.startsWith(hoje)).length
  const usuariosAtivosHoje = new Set(eventos.filter(e => e.criado_em?.startsWith(hoje)).map(e=>e.user_id)).size
  const mediasSessao = eventos.filter(e => e.tipo==='sessao' && e.valor==='fim' && e.duracao_s > 0)
  const mediaTempoSessao = mediasSessao.length ? Math.round(mediasSessao.reduce((s,e) => s+e.duracao_s,0) / mediasSessao.length) : 0
  const telasCount = {}
  eventos.filter(e => e.tipo==='tela').forEach(e => { telasCount[e.valor] = (telasCount[e.valor]||0) + (e.duracao_s||0) })
  const telaTop = Object.entries(telasCount).sort((a,b)=>b[1]-a[1])[0]

  const acoes = eventos.filter(e => e.tipo==='acao')
  const acoesHoje = acoes.filter(e => e.criado_em?.startsWith(hoje))

  const usuarioFiltro = filtroUsuario === 'todos' ? usuarios : usuarios.filter(u => u.id === filtroUsuario)
  const feedEventos = filtroUsuario === 'todos'
    ? eventos.slice(0, 80)
    : eventos.filter(e => e.user_id === filtroUsuario).slice(0, 80)

  const tipoIcon = {sessao:'🔑', tela:'📱', acao:'⚡'}
  const acaoLabel = {
    proposta_gerada:'Proposta gerada', material_baixado:'Material baixado',
    crm_aberto:'CRM aberto', logout:'Saiu do sistema'
  }

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'0 20px 60px'}}>
      <div style={{padding:'20px 0 16px'}}>
        <div style={{fontSize:11,color:'#b71c1c',letterSpacing:2,fontWeight:700}}>ADMINISTRADOR</div>
        <div style={{fontSize:20,fontWeight:800,color:'#1a1a1a',fontFamily:FT}}>Rastreamento de Atividades</div>
      </div>

      {/* CARDS RESUMO */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          {l:'Sessões Hoje',v:sessoesHoje,icon:'🔑',c:'#001489'},
          {l:'Usuários Ativos Hoje',v:usuariosAtivosHoje,icon:'👥',c:'#713F2A'},
          {l:'Tempo Médio de Sessão',v:fmtTempo(mediaTempoSessao),icon:'⏱',c:'#2e7d32'},
          {l:'Tela Mais Visitada',v:TELA_LABEL[telaTop?.[0]]||telaTop?.[0]||'—',icon:'📊',c:'#6a1b9a'},
        ].map((k,i)=>(
          <div key={i} style={{background:'white',borderRadius:12,padding:'16px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
            <div style={{fontSize:18,marginBottom:8}}>{k.icon}</div>
            <div style={{fontSize:10,color:'#aaa',letterSpacing:1.5,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c,fontFamily:FT}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* ABAS */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['usuarios','👤 Por Usuário'],['feed','📋 Feed de Atividade'],['telas','🗺 Tempo por Tela']].map(([id,l])=>(
          <button key={id} onClick={()=>setAba(id)} style={{padding:'8px 18px',borderRadius:8,border:'none',fontSize:13,fontWeight:aba===id?700:400,background:aba===id?'#1a1a1a':'white',color:aba===id?'white':'#888',cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
            {l}
          </button>
        ))}
        <div style={{flex:1}}/>
        <select value={filtroUsuario} onChange={e=>setFiltroUsuario(e.target.value)} style={{padding:'7px 12px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,background:'white',cursor:'pointer'}}>
          <option value="todos">Todos os usuários</option>
          {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome||u.email}</option>)}
        </select>
      </div>

      {load && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Carregando...</div>}

      {/* ABA: POR USUÁRIO */}
      {!load && aba==='usuarios' && (
        <div style={{background:'white',borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.5fr',padding:'10px 20px',borderBottom:'1px solid #f0f0f0',fontSize:10,color:'#aaa',letterSpacing:1.5,fontWeight:700}}>
            <span>USUÁRIO</span><span>SESSÕES</span><span>TEMPO TOTAL</span><span>PROPOSTAS</span><span>TELA FAVORITA</span><span>ÚLTIMA ATIVIDADE</span>
          </div>
          {usuarioFiltro.length === 0 && <div style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>Nenhum dado ainda.</div>}
          {usuarioFiltro.map((u,i)=>{
            const telaFav = Object.entries(u.telas).sort((a,b)=>b[1]-a[1])[0]
            const props = u.acoes.filter(a=>a.valor==='proposta_gerada').length
            return(
              <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.5fr',padding:'14px 20px',borderBottom:i<usuarioFiltro.length-1?'1px solid #f5f5f5':'none',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${SEC},#8B6340)`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:13,flexShrink:0}}>{u.nome?.[0]?.toUpperCase()||'?'}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>{u.nome||'—'}</div>
                    <div style={{fontSize:11,color:'#aaa'}}>{u.email}</div>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:VAREJO.primary}}>{u.sessoes}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#333'}}>{fmtTempo(u.tempoTotal)}</div>
                <div style={{fontSize:14,fontWeight:700,color:'#4caf50'}}>{props}</div>
                <div style={{fontSize:12,color:'#555'}}>{TELA_LABEL[telaFav?.[0]]||telaFav?.[0]||'—'}</div>
                <div style={{fontSize:12,color:'#aaa'}}>{fmtDataHora(u.ultimaAtividade)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA: FEED */}
      {!load && aba==='feed' && (
        <div style={{background:'white',borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)',overflow:'hidden'}}>
          {feedEventos.length === 0 && <div style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>Nenhum evento registrado.</div>}
          {feedEventos.map((e,i)=>{
            const isAcao = e.tipo==='acao'
            const isSessao = e.tipo==='sessao'
            const icon = tipoIcon[e.tipo]||'•'
            const label = e.tipo==='tela'
              ? (TELA_LABEL[e.valor]||e.valor) + (e.duracao_s ? ` — ${fmtTempo(e.duracao_s)}` : '')
              : e.tipo==='sessao'
              ? (e.valor==='inicio' ? 'Entrou no sistema' : `Saiu — sessão de ${fmtTempo(e.duracao_s)}`)
              : (acaoLabel[e.valor]||e.valor) + (e.contexto?.nome ? ` · ${e.contexto.nome}` : '')
            const cor = isAcao?'#2e7d32':isSessao?'#001489':'#888'
            return(
              <div key={e.id||i} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 20px',borderBottom:i<feedEventos.length-1?'1px solid #f5f5f5':'none'}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:cor+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,fontWeight:isAcao||isSessao?700:400,color:isAcao||isSessao?cor:'#555'}}>{label}</span>
                    <span style={{fontSize:11,color:'#bbb',whiteSpace:'nowrap',flexShrink:0}}>{fmtDataHora(e.criado_em)}</span>
                  </div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:2}}>{e.user_nome||e.user_email||'—'}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA: TELAS */}
      {!load && aba==='telas' && (
        <div style={{background:'white',borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)',padding:'20px 24px'}}>
          <div style={{fontSize:13,color:'#aaa',marginBottom:16}}>Tempo total acumulado em cada tela (todos os usuários)</div>
          {Object.entries(telasCount).sort((a,b)=>b[1]-a[1]).map(([tela, seg])=>{
            const max = Object.values(telasCount).reduce((a,b)=>Math.max(a,b),1)
            const pct = Math.round((seg/max)*100)
            return(
              <div key={tela} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:'#333'}}>{TELA_LABEL[tela]||tela}</span>
                  <span style={{fontSize:13,color:'#888'}}>{fmtTempo(seg)}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:'#f0f0f0',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,borderRadius:4,background:`linear-gradient(90deg,${VAREJO.primary},${ASSESS.primary})`}}/>
                </div>
              </div>
            )
          })}
          {Object.keys(telasCount).length === 0 && <div style={{textAlign:'center',color:'#aaa',fontSize:13}}>Nenhum dado de tela ainda.</div>}
        </div>
      )}
    </div>
  )
}

const NAV_SLUG_MAP={'ferramenta':{s:null,t:'ferramenta',c:null},'downloads':{s:null,t:'materiais',c:null},'painel-varejo':{s:'varejo',t:'crm',c:null},'home-equity':{s:'varejo',t:'diag',c:null},'consorcios':{s:'varejo',t:'consorcio',c:null},'diagnostico-varejo':{s:'varejo',t:'estrategia',c:null},'painel-atacado':{s:'assessoria',t:'crm',c:null},'novo-diagnostico':{s:'assessoria',t:'diag',c:null},'painel-geral':{s:'admin',t:'painelAdmin',c:null},'rastreamento':{s:'admin',t:'rastreamento',c:null},'dashboard':{s:'crm',t:'crm',c:'dashboard'},'pipeline':{s:'crm',t:'crm',c:'pipeline'},'pipeline-varejo':{s:'crm',t:'crm',c:'pipeline_varejo'},'pipeline-atacado':{s:'crm',t:'crm',c:'pipeline_atacado'},'contatos':{s:'crm',t:'crm',c:'contatos'},'atividades':{s:'crm',t:'crm',c:'atividades'},'agendamento':{s:'crm',t:'crm',c:'agendamento'},'hub-solicitacoes':{s:'crm',t:'crm',c:'hub_solicitacoes'},'tarefas':{s:'crm',t:'crm',c:'tarefas'},'relatorios':{s:'crm',t:'crm',c:'relatorios'},'campos-crm':{s:'crm',t:'crm',c:'campos_customizados'},'importar-dados':{s:'crm',t:'crm',c:'importar'},'personalizacao':{s:'crm',t:'crm',c:'personalizacao'},'automacoes':{s:'crm',t:'crm',c:'automacoes'},'visao-financeira':{s:'crm',t:'crm',c:'financeiro'},'contas-a-pagar':{s:'crm',t:'crm',c:'contas_pagar'},'contas-a-receber':{s:'crm',t:'crm',c:'contas_receber'},'dre':{s:'crm',t:'crm',c:'dre'},'extrato-bancario':{s:'crm',t:'crm',c:'extrato'},'calendario':{s:'crm',t:'crm',c:'calendario'},'comissoes':{s:'crm',t:'crm',c:'comissoes'},'conciliacao':{s:'crm',t:'crm',c:'conciliacao'},'fornecedores':{s:'crm',t:'crm',c:'fornecedores'},'rh':{s:'crm',t:'crm',c:'rh'},
  'negocio':{s:'crm',t:'crm',c:'negocio_detalhe'},'contato':{s:'crm',t:'crm',c:'contato_detalhe'},'tarefa':{s:'crm',t:'crm',c:'tarefa_detalhe'}}
function applyNavSlug(slug,setSecao,setSubTela,setCrmTela){const n=NAV_SLUG_MAP[slug];if(!n){setSecao(null);setSubTela(null);return}setSecao(n.s);setSubTela(n.t);if(n.c){const qp=typeof window!=='undefined'?new URLSearchParams(window.location.search).get('param'):null;const param=qp?(!isNaN(qp)?Number(qp):qp):null;setCrmTela({tela:n.c,param})}}
function crmTelToSlug(tela){return{'dashboard':'dashboard','pipeline':'pipeline','pipeline_varejo':'pipeline-varejo','pipeline_atacado':'pipeline-atacado','contatos':'contatos','atividades':'atividades','agendamento':'agendamento','hub_solicitacoes':'hub-solicitacoes','tarefas':'tarefas','relatorios':'relatorios','campos_customizados':'campos-crm','importar':'importar-dados','personalizacao':'personalizacao','automacoes':'automacoes','financeiro':'visao-financeira','contas_pagar':'contas-a-pagar','contas_receber':'contas-a-receber','dre':'dre','extrato':'extrato-bancario','calendario':'calendario','comissoes':'comissoes','conciliacao':'conciliacao','fornecedores':'fornecedores','rh':'rh','negocio_detalhe':'negocio','contato_detalhe':'contato','tarefa_detalhe':'tarefa'}[tela]||'dashboard'}

function NavItem({icon,label,active,onClick,href="#",admin=false}){
  const bg=active?(admin?"rgba(239,154,154,0.18)":"rgba(204,166,127,0.14)"):"transparent"
  const color=active?(admin?"#ef9a9a":"#fff"):"rgba(255,255,255,0.78)"
  const handleClick=e=>{if(e.metaKey||e.ctrlKey||e.button===1)return;e.preventDefault();onClick&&onClick(e)}
  return(
    <a href={href} onClick={handleClick} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",margin:"1px 0",borderRadius:8,fontSize:13,color,background:bg,cursor:"pointer",position:"relative",transition:"background .15s",textDecoration:"none"}}>
      {active&&<span style={{position:"absolute",left:-14,top:"50%",transform:"translateY(-50%)",width:3,height:20,borderRadius:"0 3px 3px 0",background:admin?"#ef9a9a":"#CCA67F"}}/>}
      <span style={{fontSize:15}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
    </a>
  )
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function Simulador(){
  const[session,setSession]=useState(null)
  const[usuario,setUsuario]=useState(null)
  const[loading,setLoading]=useState(true)
  const[erro,setErro]=useState("")
  const[secao,setSecao]=useState(null)
  const[subTela,setSubTela]=useState(null)
  const[crmTela,setCrmTela]=useState({tela:'dashboard',param:null})
  const[prefFd,setPrefFd]=useState(null)
  const[proposal,setProposal]=useState(null)
  const[showUsers,setShowUsers]=useState(false)
  const[menuOpen,setMenuOpen]=useState(true)
  const[notifs,setNotifs]=useState([])
  const[showNotifs,setShowNotifs]=useState(false)
  const[sub2,setSub2]=useState("he")
  const[matFiles,setMatFiles]=useState([])
  const[matLoad,setMatLoad]=useState(false)
  const[matUploading,setMatUploading]=useState(false)

  // Restaura navegação: URL primeiro, fallback sessionStorage (não pode ser lazy initializer — causa mismatch SSR)
  useEffect(()=>{
    const slug=window.location.pathname.replace(/^\//,'')
    if(slug&&NAV_SLUG_MAP[slug]){
      applyNavSlug(slug,setSecao,setSubTela,setCrmTela)
    } else {
      try{const s=sessionStorage.getItem('nav_secao');if(s)setSecao(s)}catch{}
      try{const s=sessionStorage.getItem('nav_subTela');if(s)setSubTela(s)}catch{}
      try{const s=sessionStorage.getItem('nav_crmTela');if(s){const p=JSON.parse(s);if(p&&typeof p==='object')setCrmTela(p)}}catch{}
    }
  },[])
  useEffect(()=>{try{sessionStorage.setItem('nav_secao',secao||'')}catch{}},[secao])
  useEffect(()=>{try{sessionStorage.setItem('nav_subTela',subTela||'')}catch{}},[subTela])
  useEffect(()=>{try{sessionStorage.setItem('nav_crmTela',JSON.stringify(crmTela))}catch{}},[crmTela])
  // Botão voltar/avançar do browser
  useEffect(()=>{
    const h=()=>applyNavSlug(window.location.pathname.replace(/^\//,''),setSecao,setSubTela,setCrmTela)
    window.addEventListener('popstate',h)
    return()=>window.removeEventListener('popstate',h)
  },[])

  useEffect(()=>{
    if(subTela!=="materiais")return
    setMatLoad(true)
    supabase.storage.from('materiais').list('',{limit:100,sortBy:{column:'name',order:'asc'}}).then(({data})=>{setMatFiles((data||[]).map(f=>f.name));setMatLoad(false)}).catch(()=>setMatLoad(false))
  },[subTela])

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){setLoading(false);return}
      setSession(session)
      try{const res=await fetch(`${API}/api/auth`,{headers:{Authorization:`Bearer ${session.access_token}`}});const data=await res.json();if(data.error){setErro(data.error);setLoading(false);return}setUsuario(data.user)}catch{setErro("Erro ao verificar acesso.")}
      setLoading(false)
    })
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_IN"&&session){
        setSession(session)
        try{
          const res=await fetch(`${API}/api/auth`,{headers:{Authorization:`Bearer ${session.access_token}`}})
          const data=await res.json()
          if(data.error){setErro(data.error)}else{setUsuario(data.user)}
        }catch{setErro("Erro ao verificar acesso.")}
        setLoading(false)
      }
      if(event==="SIGNED_OUT"){setSession(null);setUsuario(null);try{sessionStorage.removeItem('nav_secao');sessionStorage.removeItem('nav_subTela');sessionStorage.removeItem('nav_crmTela')}catch{}}
    })
    return()=>subscription.unsubscribe()
  },[])

  const logout=async()=>{track('acao','logout');await supabase.auth.signOut();setSession(null);setUsuario(null)}

  // Polling de notificações a cada 30s
  useEffect(()=>{
    if(!usuario?.email)return
    const buscar=async()=>{
      try{
        const res=await fetch(`/api/notificacoes?email=${encodeURIComponent(usuario.email)}`)
        const d=await res.json()
        if(d.notificacoes)setNotifs(d.notificacoes)
      }catch{}
    }
    buscar()
    const iv=setInterval(buscar,30000)
    return()=>clearInterval(iv)
  },[usuario?.email])

  const marcarLida=async(id)=>{
    await fetch('/api/notificacoes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).catch(()=>{})
    setNotifs(n=>n.map(x=>x.id===id?{...x,lida:true}:x))
  }

  const marcarTodasLidas=async()=>{
    notifs.filter(n=>!n.lida).forEach(n=>marcarLida(n.id))
  }

  const[matErro,setMatErro]=useState("")
  const baixarMaterial=async name=>{
    setMatErro("")
    const{data,error}=await supabase.storage.from('materiais').createSignedUrl(name,3600)
    if(error){setMatErro(`Erro ao gerar link: ${error.message}`);return}
    if(data?.signedUrl){track('acao','material_baixado',null,{arquivo:name});window.open(data.signedUrl,'_blank')}
  }
  const uploadMaterial=async e=>{
    const file=e.target.files?.[0];if(!file)return
    setMatErro("");setMatUploading(true)
    const{error}=await supabase.storage.from('materiais').upload(file.name,file,{upsert:true})
    if(error){
      setMatErro(`Falha no upload: ${error.message}`)
      setMatUploading(false);e.target.value="";return
    }
    const{data}=await supabase.storage.from('materiais').list('',{limit:100})
    setMatFiles((data||[]).map(f=>f.name))
    setMatUploading(false);e.target.value=""
  }

  const { track, trackTela } = useRastreamento(usuario)

  // Rastreia mudança de tela
  useEffect(() => {
    if (!usuario) return
    const nome = !subTela ? 'inicio'
      : subTela === 'diag' ? `diag_${secao||'varejo'}`
      : subTela === 'crm'  ? `crm_${secao||'varejo'}`
      : subTela
    trackTela(nome)
  }, [secao, subTela, usuario?.id])

  const role = usuario?.role
  const isAdmin       = role==="admin"
  const isAdm         = role==="admin"||role==="administrativo"
  const canVarejo     = role==="admin"||role==="administrativo"||role==="consultor_varejo"||role==="assessor"||role==="consultor"
  const canAtacado    = role==="admin"||role==="administrativo"||role==="consultor_atacado"||role==="assessor"
  const canAssessoria = canAtacado // backward-compat alias
  const canFinanceiro = role==="admin"||role==="administrativo"
  const canCRM        = true // todos têm acesso a alguma parte do CRM

  const roleColor={admin:"#b71c1c",administrativo:"#7c4d33",consultor_varejo:VAREJO.primary,consultor_atacado:"#2e7d32",assessor:ASSESS.primary,consultor:VAREJO.primary}
  const roleLabel={admin:"Administrador",administrativo:"Administrativo",consultor_varejo:"Consultor Varejo",consultor_atacado:"Consultor Atacado",assessor:"Assessor",consultor:"Consultor"}

  // Helper: navigate to a CRM sub-screen + atualiza URL
  const navCRM = (tela, param=null) => { setSecao("crm"); setSubTela("crm"); setCrmTela({tela, param}); window.history.pushState({},'','/'+crmTelToSlug(tela)) }

  if(loading)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0a"}}><div style={{color:SEC,fontSize:14,fontFamily:FB}}>Verificando acesso...</div></div>
  if(!session||!usuario)return <LoginScreen/>
  if(erro)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0a",fontFamily:FB}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>🚫</div><div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:8}}>{erro}</div><button onClick={logout} style={{marginTop:16,padding:"10px 24px",background:SEC,color:"#1a1a1a",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Sair</button></div></div>

  // Proposta aberta
  const proposalView = proposal&&<ProposalPage data={proposal} usuario={usuario} onClose={()=>setProposal(null)}/>
  const handleProposal = data => { track('acao','proposta_gerada',null,{nome:data.nome,credito:data.credito,tipo:data.tipoArea}); setProposal(data) }

  return(
    <div style={{height:"100vh",display:"grid",gridTemplateColumns:"248px 1fr",gridTemplateRows:"68px 1fr",fontFamily:SN,overflow:"hidden"}}>
      {proposalView}
      {showUsers&&usuario.role==="admin"&&<PainelUsuarios token={session.access_token} onClose={()=>setShowUsers(false)}/>}

      {/* BRAND */}
      <div style={{background:"#0E0E0E",borderRight:"1px solid rgba(255,255,255,0.08)",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <AxLogo height={40} variant="full" dark/>
      </div>

      {/* TOPBAR */}
      <div style={{background:"#FFFFFF",borderBottom:"1px solid #E6E2D8",display:"flex",alignItems:"center",gap:16,padding:"0 32px"}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#6B6B6B",display:"flex",alignItems:"center",gap:10}}>
          <span>Intranet</span><span style={{color:"#C9C3B3"}}>/</span>
          <span style={{color:"#B8895A",fontWeight:600}}>
            {secao==="crm"
              ? {dashboard:"Dashboard CRM",pipeline:"Pipeline",pipeline_varejo:"Pipeline Varejo",pipeline_atacado:"Pipeline Atacado",contatos:"Contatos",atividades:"Atividades",tarefas:"Tarefas",hub_solicitacoes:"Hub Solicitações",financeiro:"Financeiro",contas_pagar:"Contas a Pagar",contas_receber:"Contas a Receber",dre:"DRE",extrato:"Extrato Bancário",calendario:"Calendário",comissoes:"Comissões",conciliacao:"Conciliação",fornecedores:"Fornecedores",rh:"RH",contato_detalhe:"Detalhe Contato",negocio_detalhe:"Detalhe Negócio",tarefa_detalhe:"Detalhe Tarefa",agendamento:"Agendamento",relatorios:"Relatórios",campos_customizados:"Campos CRM",importar:"Importar Dados",personalizacao:"Personalização Visual",automacoes:"Automações"}[crmTela?.tela]||"CRM"
              : !subTela?"Painel"
              : subTela==="consorcio"?"Consórcios"
              : subTela==="ferramenta"?"Ferramenta Comercial"
              : subTela==="estrategia"?"Diagnóstico Varejo"
              : subTela==="rastreamento"?"Rastreamento"
              : subTela==="diag"?(secao==="assessoria"?"Novo Diagnóstico":"Simulação HE")
              : secao==="varejo"?"Varejo":secao==="assessoria"?"Atacado":secao==="admin"?"Admin":"Materiais"}
          </span>
        </div>
        <div style={{flex:1}}/>
        {isAdmin&&<button onClick={()=>setShowUsers(true)} style={{padding:"5px 12px",background:"#FAF8F3",color:"#6B6B6B",border:"1px solid #E6E2D8",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}>👥 Usuários</button>}

        {/* Sino de notificações */}
        <div style={{position:"relative"}}>
          <button onClick={()=>{setShowNotifs(s=>!s);if(!showNotifs)marcarTodasLidas()}}
            style={{width:36,height:36,borderRadius:8,border:"1px solid #E6E2D8",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",fontSize:18}}>
            🔔
            {notifs.filter(n=>!n.lida).length>0&&(
              <span style={{position:"absolute",top:4,right:4,width:16,height:16,borderRadius:"50%",background:"#b71c1c",color:"white",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                {notifs.filter(n=>!n.lida).length>9?'9+':notifs.filter(n=>!n.lida).length}
              </span>
            )}
          </button>
          {showNotifs&&(
            <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:340,background:"white",border:"1px solid #E6E2D8",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",zIndex:999,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #f0ebe3",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Notificações</span>
                {notifs.some(n=>!n.lida)&&<button onClick={marcarTodasLidas} style={{fontSize:11,color:"#888",background:"none",border:"none",cursor:"pointer",padding:0}}>Marcar todas como lidas</button>}
              </div>
              <div style={{maxHeight:320,overflowY:"auto"}}>
                {notifs.length===0&&<div style={{padding:"32px 18px",textAlign:"center",color:"#aaa",fontSize:13}}>Nenhuma notificação</div>}
                {notifs.map(n=>(
                  <div key={n.id} onClick={()=>marcarLida(n.id)}
                    style={{padding:"12px 18px",borderBottom:"1px solid #f5f0e8",cursor:"pointer",background:n.lida?"white":"#FBF8F4",display:"flex",flexDirection:"column",gap:3}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#CCA67F"}}>{n.remetente_nome}</div>
                    <div style={{fontSize:12,color:"#333",lineHeight:1.4}}>{n.mensagem}</div>
                    {n.contexto&&<div style={{fontSize:10,color:"#999",marginTop:2}}>📍 {n.contexto}</div>}
                    <div style={{fontSize:10,color:"#bbb"}}>{new Date(n.criado_em).toLocaleString("pt-BR")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 4px 4px 14px",border:"1px solid #E6E2D8",background:"#fff",borderRadius:999}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#0E0E0E",fontWeight:500}}>{usuario.nome}</div>
            <div style={{fontSize:10,color:roleColor[role]||"#888"}}>{roleLabel[role]||role}</div>
          </div>
          <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"#fff",display:"grid",placeItems:"center",fontWeight:600,fontSize:11}}>{usuario.nome?.[0]?.toUpperCase()}</div>
        </div>
        <button onClick={logout} style={{padding:"5px 10px",background:"#FAF8F3",color:"#6B6B6B",border:"1px solid #E6E2D8",borderRadius:7,cursor:"pointer",fontSize:11}}>Sair</button>
      </div>

      {/* SIDEBAR */}
      <aside style={{background:"#0E0E0E",borderRight:"1px solid rgba(255,255,255,0.08)",padding:"24px 14px 28px",display:"flex",flexDirection:"column",gap:0,overflowY:"auto",color:"#fff"}}>
        {/* ── SEÇÃO 1: INTRANET ── */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Intranet<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="🏠" label="Painel" href="/" active={!subTela&&secao!=="crm"} onClick={()=>{setSecao(null);setSubTela(null);window.history.pushState({},'','/')}}/>
          <NavItem icon="✉️" label="Ferramenta Comercial" href="/ferramenta" active={subTela==="ferramenta"} onClick={()=>{setSecao(null);setSubTela("ferramenta");window.history.pushState({},'','/ferramenta')}}/>
          <NavItem icon="⬇️" label="Downloads" href="/downloads" active={subTela==="materiais"} onClick={()=>{setSecao(null);setSubTela("materiais");window.history.pushState({},'','/downloads')}}/>
        </div>

        {/* ── SEÇÃO 2: CRM ── */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            CRM<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="📊" label="Dashboard CRM" href="/dashboard" active={secao==="crm"&&crmTela?.tela==="dashboard"} onClick={()=>navCRM("dashboard")}/>
          <NavItem icon="🔁" label="Pipeline Varejo" href="/pipeline-varejo" active={secao==="crm"&&crmTela?.tela==="pipeline_varejo"} onClick={()=>navCRM("pipeline_varejo")}/>
          <NavItem icon="🏦" label="Pipeline Atacado" href="/pipeline-atacado" active={secao==="crm"&&crmTela?.tela==="pipeline_atacado"} onClick={()=>navCRM("pipeline_atacado")}/>
          <NavItem icon="👥" label="Contatos" href="/contatos" active={secao==="crm"&&(crmTela?.tela==="contatos"||crmTela?.tela==="contato_detalhe")} onClick={()=>navCRM("contatos")}/>
          <NavItem icon="📅" label="Atividades" href="/atividades" active={secao==="crm"&&crmTela?.tela==="atividades"} onClick={()=>navCRM("atividades")}/>
          <NavItem icon="📆" label="Agendamento" href="/agendamento" active={secao==="crm"&&crmTela?.tela==="agendamento"} onClick={()=>navCRM("agendamento")}/>
          {isAdm&&<NavItem icon="📥" label="Hub Solicitações" href="/hub-solicitacoes" active={secao==="crm"&&crmTela?.tela==="hub_solicitacoes"} onClick={()=>navCRM("hub_solicitacoes")}/>}
        </div>

        {/* ── SEÇÃO 3: SIMULAÇÕES VAREJO ── */}
        {canVarejo&&<div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Simulações Varejo<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="📋" label="Painel Varejo" href="/painel-varejo" active={secao==="varejo"&&subTela==="crm"} onClick={()=>{setSecao("varejo");setSubTela("crm");window.history.pushState({},'','/painel-varejo')}}/>
          <NavItem icon="🏦" label="Home Equity" href="/home-equity" active={secao==="varejo"&&subTela==="diag"} onClick={()=>{setSecao("varejo");setPrefFd(null);setSubTela("diag");window.history.pushState({},'','/home-equity')}}/>
          <NavItem icon="🤝" label="Consórcios" href="/consorcios" active={subTela==="consorcio"} onClick={()=>{setSecao("varejo");setSubTela("consorcio");window.history.pushState({},'','/consorcios')}}/>
          <NavItem icon="🎯" label="Diagnóstico Varejo" href="/diagnostico-varejo" active={subTela==="estrategia"} onClick={()=>{setSecao("varejo");setPrefFd(null);setSubTela("estrategia");window.history.pushState({},'','/diagnostico-varejo')}}/>
        </div>}

        {/* ── SEÇÃO 4: ATACADO ── */}
        {canAtacado&&<div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Atacado<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="🏢" label="Painel Atacado" href="/painel-atacado" active={secao==="assessoria"&&subTela==="crm"} onClick={()=>{setSecao("assessoria");setSubTela("crm");window.history.pushState({},'','/painel-atacado')}}/>
          <NavItem icon="➕" label="Novo Diagnóstico" href="/novo-diagnostico" active={secao==="assessoria"&&subTela==="diag"} onClick={()=>{setSecao("assessoria");setPrefFd(null);setSubTela("diag");window.history.pushState({},'','/novo-diagnostico')}}/>
        </div>}

        {/* ── SEÇÃO 5: ADMINISTRATIVO ── */}
        {isAdm&&<div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Administrativo<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="✅" label="Tarefas" href="/tarefas" active={secao==="crm"&&(crmTela?.tela==="tarefas"||crmTela?.tela==="tarefa_detalhe")} onClick={()=>navCRM("tarefas")}/>
          <NavItem icon="📊" label="Relatórios" href="/relatorios" active={secao==="crm"&&crmTela?.tela==="relatorios"} onClick={()=>navCRM("relatorios")}/>
          <NavItem icon="⚙️" label="Campos CRM" href="/campos-crm" active={secao==="crm"&&crmTela?.tela==="campos_customizados"} onClick={()=>navCRM("campos_customizados")}/>
          <NavItem icon="⬆️" label="Importar Dados" href="/importar-dados" active={secao==="crm"&&crmTela?.tela==="importar"} onClick={()=>navCRM("importar")}/>
          <NavItem icon="🎨" label="Personalização" href="/personalizacao" active={secao==="crm"&&crmTela?.tela==="personalizacao"} onClick={()=>navCRM("personalizacao")}/>
          <NavItem icon="⚡" label="Automações" href="/automacoes" active={secao==="crm"&&crmTela?.tela==="automacoes"} onClick={()=>navCRM("automacoes")}/>
          {isAdmin&&<NavItem icon="📰" label="Curadoria de Notícias" href="/curadoria" active={false} onClick={()=>{window.location.href='/curadoria'}} admin/>}
          {isAdmin&&<NavItem icon="✉️" label="Newsletter (Daily)" href="/curadoria/newsletter" active={false} onClick={()=>{window.location.href='/curadoria/newsletter'}} admin/>}
          {isAdmin&&<NavItem icon="👥" label="Assinantes" href="/curadoria/assinantes" active={false} onClick={()=>{window.location.href='/curadoria/assinantes'}} admin/>}
          {isAdmin&&<NavItem icon="📚" label="Histórico de Edições" href="/curadoria/historico" active={false} onClick={()=>{window.location.href='/curadoria/historico'}} admin/>}
          <NavItem icon="👤" label="RH" href="/rh" active={secao==="crm"&&crmTela?.tela==="rh"} onClick={()=>navCRM("rh")}/>
        </div>}

        {/* ── SEÇÃO 6: FINANCEIRO ── */}
        {isAdm&&<div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#CCA67F",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Financeiro<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
          </div>
          <NavItem icon="💰" label="Visão Financeira" href="/visao-financeira" active={secao==="crm"&&crmTela?.tela==="financeiro"} onClick={()=>navCRM("financeiro")}/>
          <NavItem icon="📤" label="Contas a Pagar" href="/contas-a-pagar" active={secao==="crm"&&crmTela?.tela==="contas_pagar"} onClick={()=>navCRM("contas_pagar")}/>
          <NavItem icon="📥" label="Contas a Receber" href="/contas-a-receber" active={secao==="crm"&&crmTela?.tela==="contas_receber"} onClick={()=>navCRM("contas_receber")}/>
          <NavItem icon="📑" label="DRE Contábil" href="/dre" active={secao==="crm"&&crmTela?.tela==="dre"} onClick={()=>navCRM("dre")}/>
          <NavItem icon="🏦" label="Extrato Bancário" href="/extrato-bancario" active={secao==="crm"&&crmTela?.tela==="extrato"} onClick={()=>navCRM("extrato")}/>
          <NavItem icon="🗓️" label="Calendário" href="/calendario" active={secao==="crm"&&crmTela?.tela==="calendario"} onClick={()=>navCRM("calendario")}/>
          <NavItem icon="💼" label="Comissões" href="/comissoes" active={secao==="crm"&&crmTela?.tela==="comissoes"} onClick={()=>navCRM("comissoes")}/>
          <NavItem icon="🔗" label="Conciliação" href="/conciliacao" active={secao==="crm"&&crmTela?.tela==="conciliacao"} onClick={()=>navCRM("conciliacao")}/>
          <NavItem icon="🏭" label="Fornecedores" href="/fornecedores" active={secao==="crm"&&crmTela?.tela==="fornecedores"} onClick={()=>navCRM("fornecedores")}/>
        </div>}

        {/* ── ADMIN ── */}
        {isAdm&&<div style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#ef9a9a",fontWeight:600,padding:"0 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            Admin<span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(239,154,154,0.45),transparent)"}}/>
          </div>
          {isAdmin&&<NavItem icon="📊" label="Painel Geral" href="/painel-geral" active={secao==="admin"&&subTela==="painelAdmin"} onClick={()=>{setSecao("admin");setSubTela("painelAdmin");window.history.pushState({},'','/painel-geral')}} admin/>}
          <NavItem icon="⏱" label="Rastreamento" href="/rastreamento" active={secao==="admin"&&subTela==="rastreamento"} onClick={()=>{setSecao("admin");setSubTela("rastreamento");window.history.pushState({},'','/rastreamento')}} admin/>
        </div>}

        {/* FOOTER */}
        <div style={{marginTop:"auto",padding:"14px 12px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:10,fontSize:11,color:"rgba(255,255,255,0.55)",letterSpacing:1.5,textTransform:"uppercase"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#5cd28a",boxShadow:"0 0 0 4px rgba(92,210,138,0.18)",flexShrink:0}}/>
          Sistema operando
        </div>
      </aside>

      {/* MAIN */}
      <main style={{background:"#F5F4F0",overflowY:"auto"}}>

        {/* HOME */}
        {!subTela&&(
          <HomeScreen
            usuario={usuario}
            token={session.access_token}
            canAssessoria={canAssessoria}
            onNav={(sec,sub)=>{setSecao(sec);setSubTela(sub)}}
          />
        )}

          {/* MATERIAIS */}
          {subTela==="materiais"&&(
            <div style={{maxWidth:860,margin:"0 auto",padding:"0 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 16px"}}>
                <div>
                  <div style={{fontSize:11,color:SEC,letterSpacing:2,fontWeight:700}}>RECURSOS</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>Materiais para Download</div>
                </div>
                {usuario.role==="admin"&&(
                  <label style={{padding:"9px 18px",background:SEC,color:"#1a1a1a",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8,opacity:matUploading?.6:1}}>
                    {matUploading?"Enviando...":"⬆ Fazer Upload"}
                    <input type="file" style={{display:"none"}} onChange={uploadMaterial} disabled={matUploading}/>
                  </label>
                )}
              </div>
              {matErro&&<div style={{marginBottom:16,padding:"10px 16px",borderRadius:10,background:"#fde8e8",border:"1px solid #f4433640",color:"#c62828",fontSize:13}}>⚠ {matErro}</div>}
              {matLoad&&<div style={{textAlign:"center",padding:32,color:"#aaa",fontSize:14}}>Carregando materiais...</div>}
              {!matLoad&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,paddingBottom:40}}>
                {[
                  {icon:"🏠",titulo:"Flyer Casa MCA",desc:"Material de divulgação para crédito imobiliário residencial",cat:"Varejo",cor:VAREJO.primary,file:"flyer-casa-mca.pdf"},
                  {icon:"🚗",titulo:"Flyer Carro MCA",desc:"Material de divulgação para financiamento veicular",cat:"Varejo",cor:VAREJO.primary,file:"flyer-carro-mca.pdf"},
                  {icon:"📈",titulo:"Apresentação Institucional",desc:"Apresentação oficial da Áxicon Soluções Financeiras",cat:"Geral",cor:SEC,file:"apresentacao-institucional.pdf"},
                  {icon:"🔗",titulo:"Modelo de Apresentação",desc:"Template editável de apresentação para clientes",cat:"Geral",cor:ASSESS.primary,file:"modelo-apresentacao.pptx"},
                  {icon:"🤝",titulo:"Dados para Fechamento de Consórcios",desc:"Informações e checklist para fechamento de contratos de consórcio",cat:"Varejo",cor:VAREJO.primary,file:"dados-consorcio.pdf"},
                ].map((m,i)=>{
                  const disponivel=matFiles.includes(m.file)
                  return(
                    <div key={i} style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.05)",borderLeft:"4px solid "+m.cor,display:"flex",flexDirection:"column",gap:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:44,height:44,borderRadius:10,background:m.cor+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>{m.titulo}</div>
                          <span style={{fontSize:10,background:m.cor+"15",color:m.cor,padding:"2px 8px",borderRadius:20,fontWeight:600,marginTop:3,display:"inline-block"}}>{m.cat}</span>
                        </div>
                        {disponivel&&<div style={{width:8,height:8,borderRadius:"50%",background:"#4caf50",flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:13,color:"#888",lineHeight:1.5}}>{m.desc}</div>
                      {disponivel
                        ?<button onClick={()=>baixarMaterial(m.file)} style={{display:"block",background:m.cor,color:"white",borderRadius:8,padding:"10px 14px",textAlign:"center",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",width:"100%"}}>⬇ Baixar</button>
                        :<div style={{background:"#f5f5f5",borderRadius:8,padding:"10px 14px",textAlign:"center",fontSize:12,color:"#aaa",fontStyle:"italic"}}>
                          {usuario.role==="admin"?"Faça o upload do arquivo acima":"Em breve — aguardando publicação"}
                        </div>
                      }
                    </div>
                  )
                })}
                {/* Arquivos extras enviados pelo admin que não estão na lista estática */}
                {matFiles.filter(f=>!["flyer-casa-mca.pdf","flyer-carro-mca.pdf","apresentacao-institucional.pdf","modelo-apresentacao.pptx","dados-consorcio.pdf"].includes(f)).map((f,i)=>(
                  <div key={"extra-"+i} style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.05)",borderLeft:"4px solid "+SEC,display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:44,height:44,borderRadius:10,background:SEC+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📎</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>{f}</div>
                        <span style={{fontSize:10,background:SEC+"20",color:"#8B6914",padding:"2px 8px",borderRadius:20,fontWeight:600,marginTop:3,display:"inline-block"}}>Geral</span>
                      </div>
                    </div>
                    <button onClick={()=>baixarMaterial(f)} style={{display:"block",background:SEC,color:"#1a1a1a",borderRadius:8,padding:"10px 14px",textAlign:"center",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",width:"100%"}}>⬇ Baixar</button>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* CRM VAREJO */}
          {secao==="varejo"&&subTela==="crm"&&(
            <div style={{maxWidth:860,margin:"0 auto",padding:"0 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 8px"}}>
                <div>
                  <div style={{fontSize:11,color:VAREJO.primary,letterSpacing:2,fontWeight:700}}>VAREJO</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>Home Equity · Painel</div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setSubTela("consorcio")} style={{padding:"9px 18px",background:VAREJO.light,color:VAREJO.primary,border:`1.5px solid ${VAREJO.primary}40`,borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer"}}>🤝 Consórcios</button>
                  <button onClick={()=>{setPrefFd(null);setSubTela("diag")}} style={{padding:"9px 18px",background:VAREJO.primary,color:"white",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Nova Proposta HE</button>
                </div>
              </div>
              <CRMVarejo usuario={usuario} token={session.access_token}
                onNew={()=>{setPrefFd(null);setSubTela("diag")}}
                onReopen={async code=>{try{const r=await fetch(`${API}/api/proposta?codigo=${code}`);const d=await r.json();if(d.dados)setProposal(d.dados)}catch{}}}
                onRedit={fd=>{setPrefFd(fd);setSubTela("diag")}}
              />
            </div>
          )}

          {/* CRM ASSESSORIA */}
          {secao==="assessoria"&&subTela==="crm"&&canAssessoria&&(
            <div style={{maxWidth:860,margin:"0 auto",padding:"0 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 8px"}}>
                <div>
                  <div style={{fontSize:11,color:ASSESS.primary,letterSpacing:2,fontWeight:700}}>ATACADO</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a",fontFamily:FT}}>Crédito Estruturado · Painel</div>
                </div>
                <button onClick={()=>{setPrefFd(null);setSubTela("diag")}} style={{padding:"9px 18px",background:ASSESS.primary,color:"white",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Novo Diagnóstico</button>
              </div>
              <CRMAssessoria usuario={usuario} token={session.access_token}
                onNew={()=>{setPrefFd(null);setSubTela("diag")}}
                onReopen={async code=>{try{const r=await fetch(`${API}/api/proposta?codigo=${code}`);const d=await r.json();if(d.dados)setProposal(d.dados)}catch{}}}
                onRedit={fd=>{setPrefFd(fd);setSubTela("diag")}}
              />
            </div>
          )}

          {/* CONSÓRCIO SIMULADOR */}
          {subTela==="consorcio"&&<ConsorcioView/>}

          {/* FERRAMENTA COMERCIAL */}
          {subTela==="ferramenta"&&<FerramentaComercialView/>}

          {/* SIMULADOR DE ESTRATÉGIA (varejo — HE + consórcios) */}
          {subTela==="estrategia"&&(
            <ErrorBoundary key="estrategia">
              <DiagScreen usuario={usuario} token={session.access_token}
                prefFd={prefFd} tipoArea="varejo"
                onHome={()=>{setSubTela(null);setPrefFd(null)}}
                onProposal={data=>{handleProposal(data);setSubTela(null)}}
              />
            </ErrorBoundary>
          )}

          {/* DIAGNÓSTICO / SIMULAÇÃO */}
          {subTela==="diag"&&(
            <ErrorBoundary key="diag">
              <DiagScreen usuario={usuario} token={session.access_token}
                prefFd={prefFd} tipoArea={secao||"varejo"}
                onHome={()=>{setSubTela(null);setPrefFd(null)}}
                onProposal={data=>{handleProposal(data);setSubTela(null)}}
              />
            </ErrorBoundary>
          )}

          {/* CRM MODULE INLINE — renders all CRM/Financeiro/RH screens */}
          {secao==="crm"&&(
            <CrmModule
              inline
              telaProp={crmTela}
              navegarProp={(tela,param=null)=>{
                setCrmTela({tela,param})
                const slug=crmTelToSlug(tela)
                const qs=param!=null?`?param=${param}`:''
                window.history.pushState({},'',`/${slug}${qs}`)
              }}
              usuarioProp={{nome:usuario.nome,role:usuario.role,email:usuario.email}}
              onGerarProposta={(negocio, contato)=>{
                // Map CRM deal data to prefFd format and open DiagScreen
                const tipoNeg = negocio.produto?.toLowerCase().includes('giro')||negocio.produto?.toLowerCase().includes('cra')||negocio.produto?.toLowerCase().includes('cri')||negocio.produto?.toLowerCase().includes('estruturado')||negocio.produto?.toLowerCase().includes('recebíveis')||negocio.produto?.toLowerCase().includes('internacional') ? 'assessoria' : 'varejo'
                setPrefFd({
                  nome: contato?.nome || negocio.titulo,
                  setor: contato?.cargo || '',
                  fat: contato?.faturamento ? String(contato.faturamento) : '',
                  credito: String(negocio.valor || ''),
                  imovel: '',
                  fins: [],
                  urg: '',
                  cidade: contato?.cidade || '',
                  email: contato?.email || '',
                  tel: contato?.telefone || '',
                  tipoPessoa: '',
                  negocioId: negocio.id,
                })
                setSecao(tipoNeg === 'assessoria' ? 'assessoria' : 'varejo')
                setSubTela('diag')
              }}
            />
          )}

          {/* PAINEL ADMIN */}
          {secao==="admin"&&subTela==="painelAdmin"&&isAdmin&&(
            <PainelAdmin token={session.access_token}/>
          )}

          {/* RASTREAMENTO */}
          {secao==="admin"&&subTela==="rastreamento"&&isAdm&&(
            <PainelRastreamento token={session.access_token}/>
          )}
      </main>
    </div>
  )
}