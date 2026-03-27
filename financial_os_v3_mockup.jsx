import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Line, LineChart, BarChart, Bar } from "recharts";

// ─── UTILS ───
const fmt = n => `$${n.toLocaleString("es-CL")}`;
const fK = n => n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n}`;
const fU = n => `US$${n.toFixed(2)}`;

// ─── COLOR PALETTE ───
const COLORS = ["#4361ee","#06d6a0","#7209b7","#f72585","#e9c46a","#f4a261","#4cc9f0","#e63946","#2ec4b6","#ff6b6b"];

// ─── DEFAULT PORTFOLIO ───
const DEFAULT_STOCKS = [
  { id:1, ticker:"IVV", name:"iShares S&P 500", price:648.14, high52:670, low52:490, change1y:13.76, category:"Core", color:"#4361ee", allocation:50, owned:1.04 },
  { id:2, ticker:"AAPL", name:"Apple Inc.", price:253.74, high52:288.62, low52:169.21, change1y:11.37, category:"Growth", color:"#06d6a0", allocation:17, owned:0 },
  { id:3, ticker:"MSFT", name:"Microsoft Corp.", price:370.33, high52:555.45, low52:344.79, change1y:-8.2, category:"Growth", color:"#7209b7", allocation:17, owned:0 },
  { id:4, ticker:"AMZN", name:"Amazon.com", price:210.96, high52:258.60, low52:161.38, change1y:11.05, category:"Growth", color:"#f72585", allocation:16, owned:0 },
];

const DOLLAR = { current:913.83, high52:1008.36, low52:850.90 };

// ─── MOCK TIME-SERIES DATA ───
const genSeries = (base, vol, pts) => {
  let v = base; const r = [];
  for(let i=0;i<pts;i++){v+=((Math.random()-0.48)*vol);v=Math.max(v*0.85,v);r.push(Math.round(v*100)/100);}
  return r;
};
const TIME_RANGES = ["1S","1M","3M","6M","1A","5A"];
const RANGE_PTS = {  "1S":5,"1M":22,"3M":66,"6M":132,"1A":252,"5A":1260 };
const RANGE_LABELS = {"1S":"Semana","1M":"Mes","3M":"3 Meses","6M":"6 Meses","1A":"1 Año","5A":"5 Años"};

function genTimeData(base, vol, range) {
  const pts = Math.min(RANGE_PTS[range]||22, 60);
  const series = genSeries(base, vol, pts);
  return series.map((v,i)=>({x:i,price:v}));
}

function genDollarData(range) {
  const pts = Math.min(RANGE_PTS[range]||22, 60);
  const s = genSeries(DOLLAR.current, 8, pts);
  return s.map((v,i)=>({x:i,rate:v}));
}

function genPortfolioEvolution(range, budget) {
  const pts = Math.min(RANGE_PTS[range]||22, 30);
  const data = [];
  let total = 624867, invested = 600000;
  for(let i=0;i<pts;i++){
    invested += budget/pts;
    total += budget/pts * (1 + (Math.random()-0.3)*0.05);
    data.push({x:i, total:Math.round(total), invested:Math.round(invested)});
  }
  return data;
}

// ─── TINY COMPONENTS ───
const ttStyle = {backgroundColor:"#0c1222",border:"1px solid #1e293b",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#e2e8f0"};

function KPI({icon,label,value,sub,accent="#06d6a0"}){
  return(
    <div style={{background:"linear-gradient(145deg,#0f172a,#162032)",border:"1px solid #1e293b",borderRadius:10,padding:"12px 14px",flex:1,minWidth:140}}>
      <div style={{fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:4,marginBottom:2}}><span style={{fontSize:13}}>{icon}</span>{label}</div>
      <div style={{fontSize:19,fontWeight:800,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:accent,marginTop:2}}>{sub}</div>}
    </div>
  );
}

function PBar({label,val,max,color,right}){
  const p=Math.min(val/max*100,100);
  return(<div style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginBottom:2}}><span>{label}</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{right||`${p.toFixed(0)}%`}</span></div>
    <div style={{height:4,background:"#1e293b",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:color,borderRadius:2,transition:"width 0.6s"}}/></div>
  </div>);
}

function TimeRangePicker({value,onChange}){
  return(<div style={{display:"flex",gap:2,background:"#020617",borderRadius:8,padding:2}}>
    {TIME_RANGES.map(r=>(<button key={r} onClick={()=>onChange(r)} style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,letterSpacing:0.5,background:value===r?"#1e293b":"transparent",color:value===r?"#f1f5f9":"#475569",transition:"all 0.2s"}}>{r}</button>))}
  </div>);
}

function GaugeArc({value,max,color,label,sub,size=150}){
  const pct=Math.min(value/max,1);const r=(size-18)/2;const ci=Math.PI*r;
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
    <svg width={size} height={size*0.62} viewBox={`0 0 ${size} ${size*0.62}`}>
      <path d={`M 9 ${size*0.57} A ${r} ${r} 0 0 1 ${size-9} ${size*0.57}`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round"/>
      <path d={`M 9 ${size*0.57} A ${r} ${r} 0 0 1 ${size-9} ${size*0.57}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pct*ci} ${ci}`} style={{filter:`drop-shadow(0 0 6px ${color}44)`}}/>
      <text x={size/2} y={size*0.44} textAnchor="middle" fill="#f1f5f9" fontSize="20" fontWeight="800" fontFamily="'JetBrains Mono',monospace">{value}</text>
      <text x={size/2} y={size*0.58} textAnchor="middle" fill="#64748b" fontSize="9">/{max}</text>
    </svg>
    <span style={{color,fontWeight:700,fontSize:11,letterSpacing:1.5,fontFamily:"'JetBrains Mono',monospace"}}>{label}</span>
    {sub&&<span style={{color:"#94a3b8",fontSize:10,textAlign:"center",marginTop:1}}>{sub}</span>}
  </div>);
}

function Card({children,style={}}){return <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:14,...style}}>{children}</div>}
function CardTitle({children}){return <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,letterSpacing:0.8,textTransform:"uppercase"}}>{children}</div>}

// ─── MAIN APP ───
export default function FinancialOS(){
  const [tab,setTab]=useState("Dashboard");
  const [stocks,setStocks]=useState(DEFAULT_STOCKS);
  const [monthlyBudget,setMonthlyBudget]=useState(350000);
  const [chartRange,setChartRange]=useState("1M");

  // Simulator
  const [simY,setSimY]=useState(15);
  const [simR,setSimR]=useState(10);
  const [simM,setSimM]=useState(350);

  // Config - new asset form
  const [newTicker,setNewTicker]=useState("");
  const [newName,setNewName]=useState("");
  const [newPrice,setNewPrice]=useState("");
  const [newAlloc,setNewAlloc]=useState("");
  const [newCat,setNewCat]=useState("Growth");

  // Telegram
  const [tgToken,setTgToken]=useState("");
  const [tgChatId,setTgChatId]=useState("");
  const [tgAlerts,setTgAlerts]=useState({market:true,dollar:true,stocks:true,daily:true});
  const [tgConnected,setTgConnected]=useState(false);
  const [tgTestSent,setTgTestSent]=useState(false);

  // Computed
  const totalAlloc = stocks.reduce((s,x)=>s+x.allocation,0);
  const totalWealth = stocks.reduce((s,x)=>s+x.owned*x.price*DOLLAR.current,0)+150000;
  const investRate = ((monthlyBudget/1075000)*100).toFixed(0);
  const marketScore = 8;
  const getSignal = s => {if(s>=75)return{c:"#e63946",l:"ALL-IN",a:"Máximo posible"};if(s>=55)return{c:"#f4a261",l:"AGRESIVO",a:"3x DCA"};if(s>=35)return{c:"#e9c46a",l:"REFORZADO",a:"2x DCA"};if(s>=15)return{c:"#4cc9f0",l:"LEVE",a:"1.5x DCA"};return{c:"#06d6a0",l:"NORMAL",a:"DCA regular"};};
  const signal = getSignal(marketScore);
  const dollarPos = ((DOLLAR.current-DOLLAR.low52)/(DOLLAR.high52-DOLLAR.low52))*100;
  const getDollarZone = () => {if(DOLLAR.current<860)return{l:"🟢 COMPRAR USD",c:"#06d6a0",s:"Dólar barato"};if(DOLLAR.current<900)return{l:"🔵 BUEN PRECIO",c:"#4cc9f0",s:"Bajo promedio"};if(DOLLAR.current<940)return{l:"🟡 NEUTRAL",c:"#e9c46a",s:"Precio promedio"};if(DOLLAR.current<980)return{l:"🟠 CARO",c:"#f4a261",s:"Sobre promedio"};return{l:"🔴 MUY CARO",c:"#e63946",s:"Máximos"};};
  const dZone = getDollarZone();

  const addStock = () => {
    if(!newTicker||!newPrice)return;
    const id = stocks.length+1;
    const color = COLORS[id % COLORS.length];
    setStocks([...stocks, {id,ticker:newTicker.toUpperCase(),name:newName||newTicker,price:parseFloat(newPrice),high52:parseFloat(newPrice)*1.15,low52:parseFloat(newPrice)*0.7,change1y:0,category:newCat,color,allocation:parseFloat(newAlloc)||0,owned:0}]);
    setNewTicker("");setNewName("");setNewPrice("");setNewAlloc("");
  };

  const updateAllocation = (id, val) => {
    setStocks(stocks.map(s=>s.id===id?{...s,allocation:Math.max(0,Math.min(100,parseInt(val)||0))}:s));
  };

  const removeStock = (id) => {
    if(stocks.length<=1)return;
    setStocks(stocks.filter(s=>s.id!==id));
  };

  const pieData = stocks.map(s=>({name:s.ticker,value:s.allocation,color:s.color}));

  const TABS = ["Dashboard","Acciones","Dólar","Simulador","Configuración","Telegram"];

  return(
    <div style={{background:"linear-gradient(180deg,#020617,#0a1128)",minHeight:"100vh",color:"#f1f5f9",fontFamily:"'Segoe UI','SF Pro Display',-apple-system,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* ═══ HEADER ═══ */}
      <div style={{background:"#020617dd",borderBottom:"1px solid #1e293b",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#4361ee,#f72585)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900}}>F</div>
          <div>
            <div style={{fontWeight:800,fontSize:13,letterSpacing:2,fontFamily:"'JetBrains Mono',monospace"}}>FINANCIAL OS</div>
            <div style={{fontSize:8,color:"#475569",letterSpacing:1}}>FINTUAL · {stocks.length} ACTIVOS · DCA {fmt(monthlyBudget)}/MES</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {tgConnected&&<div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10}}>🤖</span><span style={{fontSize:9,color:"#06d6a0",fontFamily:"'JetBrains Mono',monospace"}}>TG</span></div>}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:9,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>USD/CLP</span>
            <span style={{fontSize:11,fontWeight:700,color:dZone.c,fontFamily:"'JetBrains Mono',monospace"}}>${DOLLAR.current}</span>
          </div>
          <div style={{width:1,height:14,background:"#1e293b"}}/>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 6px #06d6a0"}}/>
          <span style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>26 MAR 2026</span>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{display:"flex",gap:1,padding:"0 16px",background:"#020617",borderBottom:"1px solid #1e293b",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 14px",background:tab===t?"#1e293b":"transparent",color:tab===t?"#f1f5f9":"#64748b",border:"none",borderBottom:tab===t?"2px solid #4361ee":"2px solid transparent",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:0.3,whiteSpace:"nowrap",transition:"all 0.15s"}}>{t==="Telegram"?"🤖 Telegram":t}</button>
        ))}
      </div>

      <div style={{padding:"14px 16px",maxWidth:1200,margin:"0 auto"}}>

        {/* ════════════════════ DASHBOARD ════════════════════ */}
        {tab==="Dashboard"&&(<>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            <KPI icon="💰" label="Patrimonio" value={fmt(Math.round(totalWealth))} sub={`${stocks.length} activos`} accent="#4361ee"/>
            <KPI icon="📊" label="DCA mensual" value={fmt(monthlyBudget)} sub={`${investRate}% del líquido`} accent="#06d6a0"/>
            <KPI icon="💵" label="Dólar" value={`$${DOLLAR.current.toFixed(0)}`} sub={dZone.l} accent={dZone.c}/>
            <KPI icon="🌡️" label="Señal" value={`${marketScore}/100`} sub={`${signal.l} — ${signal.a}`} accent={signal.c}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:12,marginBottom:12}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <CardTitle>Evolución Patrimonial</CardTitle>
                <TimeRangePicker value={chartRange} onChange={setChartRange}/>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={genPortfolioEvolution(chartRange,monthlyBudget)}>
                  <defs><linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4361ee" stopOpacity={0.35}/><stop offset="100%" stopColor="#4361ee" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="x" tick={false} axisLine={{stroke:"#1e293b"}}/>
                  <YAxis tick={{fill:"#475569",fontSize:9}} axisLine={{stroke:"#1e293b"}} tickFormatter={fK}/>
                  <Tooltip contentStyle={ttStyle} formatter={v=>fmt(v)}/>
                  <Area type="monotone" dataKey="total" stroke="#4361ee" fill="url(#gE)" strokeWidth={2} name="Portafolio"/>
                  <Line type="monotone" dataKey="invested" stroke="#334155" strokeDasharray="4 4" dot={false} name="Aportes"/>
                </AreaChart>
              </ResponsiveContainer>
              <div style={{textAlign:"center",fontSize:9,color:"#475569",marginTop:4}}>{RANGE_LABELS[chartRange]}</div>
            </Card>

            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card style={{textAlign:"center"}}>
                <CardTitle>Señal de mercado</CardTitle>
                <GaugeArc value={marketScore} max={100} color={signal.c} label={signal.l} sub={signal.a} size={140}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:8}}>
                  {[{l:"VIX",v:"18.2",c:"#e9c46a"},{l:"F&G",v:"62",c:"#f4a261"},{l:"Drawdown",v:"-3.2%",c:"#4361ee"},{l:"Dólar",v:`$${DOLLAR.current.toFixed(0)}`,c:dZone.c}].map(d=>(
                    <div key={d.l} style={{background:"#020617",borderRadius:6,padding:"3px 6px"}}>
                      <div style={{fontSize:8,color:"#475569"}}>{d.l}</div>
                      <div style={{fontSize:11,fontWeight:700,color:d.c,fontFamily:"'JetBrains Mono',monospace"}}>{d.v}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardTitle>Asignación ({totalAlloc}%)</CardTitle>
                <ResponsiveContainer width="100%" height={80}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} paddingAngle={3} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie></PieChart>
                </ResponsiveContainer>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
                  {pieData.map(d=>(<div key={d.name} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#94a3b8"}}><div style={{width:6,height:6,borderRadius:2,background:d.color}}/>{d.name} {d.value}%</div>))}
                </div>
              </Card>
            </div>
          </div>

          {/* Stock mini cards */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(stocks.length,4)},1fr)`,gap:8,marginBottom:12}}>
            {stocks.slice(0,8).map(s=>{
              const dd=((s.price-s.high52)/s.high52*100);
              const amt=Math.round(monthlyBudget*s.allocation/Math.max(totalAlloc,1));
              return(
                <Card key={s.id}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{background:`${s.color}22`,color:s.color,padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{s.ticker}</span>
                    <span style={{fontSize:10,color:s.change1y>=0?"#06d6a0":"#e63946",fontFamily:"'JetBrains Mono',monospace"}}>{s.change1y>=0?"+":""}{s.change1y}%</span>
                  </div>
                  <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{fU(s.price)}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9,color:"#64748b"}}>
                    <span>DD: {dd.toFixed(1)}%</span>
                    <span>DCA: {fmt(amt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card>
              <CardTitle>DCA Mensual — {fmt(monthlyBudget)}</CardTitle>
              {stocks.map(s=>{const amt=Math.round(monthlyBudget*s.allocation/Math.max(totalAlloc,1));return(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{background:`${s.color}22`,color:s.color,padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",minWidth:36,textAlign:"center"}}>{s.ticker}</span>
                  <div style={{flex:1,height:5,background:"#1e293b",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${s.allocation/Math.max(totalAlloc,1)*100}%`,background:s.color,borderRadius:3}}/></div>
                  <span style={{fontSize:11,fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",minWidth:65,textAlign:"right"}}>{fmt(amt)}</span>
                </div>
              );})}
            </Card>
            <Card>
              <CardTitle>Progreso Metas</CardTitle>
              <PBar label="🛡️ Fondo Emergencia" val={150000} max={2100000} color="#f4a261"/>
              <PBar label="🎯 Primer $1M" val={Math.round(totalWealth)} max={1000000} color="#4361ee"/>
              <PBar label="💰 $5M patrimonio" val={Math.round(totalWealth)} max={5000000} color="#06d6a0"/>
              <PBar label="📅 12 meses DCA" val={5} max={12} color="#f72585"/>
            </Card>
          </div>
        </>)}

        {/* ════════════════════ ACCIONES ════════════════════ */}
        {tab==="Acciones"&&(<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>{stocks.length} activos en portafolio</div>
            <TimeRangePicker value={chartRange} onChange={setChartRange}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {stocks.map(s=>{
              const dd=((s.price-s.high52)/s.high52*100);
              const fl=((s.price-s.low52)/s.low52*100);
              const sc=Math.min(100,Math.max(0,Math.round(Math.abs(dd)*2+(100-fl)*0.3)));
              const rc=sc>60?"#e63946":sc>40?"#e9c46a":sc>20?"#4cc9f0":"#06d6a0";
              const rl=sc>60?"COMPRAR AGRESIVO":sc>40?"REFORZAR":sc>20?"DCA NORMAL":"MANTENER";
              const td=genTimeData(s.price,s.price*0.01,chartRange);
              return(
                <Card key={s.id} style={{position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${s.color},transparent)`}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{background:`${s.color}22`,color:s.color,padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{s.ticker}</span>
                        <span style={{fontSize:9,color:"#475569",background:"#020617",padding:"1px 6px",borderRadius:4}}>{s.category}</span>
                      </div>
                      <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{s.name}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{fU(s.price)}</div>
                      <div style={{fontSize:10,color:s.change1y>=0?"#06d6a0":"#e63946",fontFamily:"'JetBrains Mono',monospace"}}>{s.change1y>=0?"+":""}{s.change1y}% 1Y</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={td}>
                      <defs><linearGradient id={`gs${s.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.25}/><stop offset="100%" stopColor={s.color} stopOpacity={0}/></linearGradient></defs>
                      <Area type="monotone" dataKey="price" stroke={s.color} fill={`url(#gs${s.id})`} strokeWidth={1.5} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginTop:6}}>
                    {[{l:"DD",v:`${dd.toFixed(1)}%`,c:dd<-10?"#e63946":"#f4a261"},{l:"Mín52",v:fU(s.low52),c:"#64748b"},{l:"Máx52",v:fU(s.high52),c:"#64748b"},{l:"Score",v:sc,c:rc}].map(d=>(
                      <div key={d.l} style={{background:"#020617",borderRadius:5,padding:"3px 6px",textAlign:"center"}}>
                        <div style={{fontSize:7,color:"#475569"}}>{d.l}</div>
                        <div style={{fontSize:10,fontWeight:700,color:d.c,fontFamily:"'JetBrains Mono',monospace"}}>{d.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid #1e293b"}}>
                    <span style={{fontSize:10,color:rc,fontWeight:600}}>{sc>60?"🔴":sc>40?"🟡":sc>20?"🔵":"🟢"} {rl}</span>
                    <span style={{fontSize:10,color:"#64748b"}}>Target: {s.allocation}% · {fmt(Math.round(monthlyBudget*s.allocation/Math.max(totalAlloc,1)))}/mes</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>)}

        {/* ════════════════════ DÓLAR ════════════════════ */}
        {tab==="Dólar"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:12,marginBottom:12}}>
            <Card style={{textAlign:"center",padding:20}}>
              <div style={{fontSize:11,color:"#64748b",letterSpacing:1,fontWeight:600,marginBottom:10}}>USD / CLP — DÓLAR OBSERVADO</div>
              <div style={{fontSize:40,fontWeight:800,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>${DOLLAR.current.toFixed(0)}</div>
              <div style={{fontSize:11,color:"#475569",marginBottom:14}}>Banco Central · 26 Mar 2026</div>
              <div style={{position:"relative",height:26,background:"linear-gradient(90deg,#06d6a0,#4cc9f0,#e9c46a,#f4a261,#e63946)",borderRadius:13,maxWidth:300,margin:"0 auto",marginBottom:6}}>
                <div style={{position:"absolute",left:`${dollarPos}%`,top:-5,transform:"translateX(-50%)",width:18,height:36,borderRadius:9,background:"#f1f5f9",border:"3px solid #020617",boxShadow:"0 0 10px rgba(255,255,255,0.2)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",maxWidth:300,margin:"0 auto",fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}><span>${DOLLAR.low52}</span><span>${DOLLAR.high52}</span></div>
              <div style={{marginTop:14,padding:"8px 14px",background:`${dZone.c}12`,border:`1px solid ${dZone.c}33`,borderRadius:8,display:"inline-block"}}>
                <div style={{color:dZone.c,fontWeight:700,fontSize:13}}>{dZone.l}</div>
                <div style={{color:"#94a3b8",fontSize:10}}>{dZone.s}</div>
              </div>
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card>
                <CardTitle>Variaciones</CardTitle>
                {[{l:"vs Ayer",d:-1.75},{l:"vs Semana",d:+8.83},{l:"vs Mes",d:+46.93}].map(v=>(
                  <div key={v.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #0f172a"}}>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{v.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:v.d>0?"#e63946":"#06d6a0",fontFamily:"'JetBrains Mono',monospace"}}>{v.d>0?"+":""}{v.d.toFixed(1)}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <CardTitle>Impacto Portafolio</CardTitle>
                <div style={{background:"#020617",borderRadius:7,padding:8,marginBottom:6}}>
                  <div style={{fontSize:9,color:"#475569"}}>Tu portafolio en CLP hoy</div>
                  <div style={{fontSize:16,fontWeight:800,color:"#4361ee",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.round(totalWealth))}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  <div style={{background:"#06d6a008",borderRadius:6,padding:6,textAlign:"center"}}><div style={{fontSize:8,color:"#475569"}}>Dólar→$850</div><div style={{fontSize:11,fontWeight:700,color:"#e63946",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.round(675*850))}</div></div>
                  <div style={{background:"#e6394608",borderRadius:6,padding:6,textAlign:"center"}}><div style={{fontSize:8,color:"#475569"}}>Dólar→$1000</div><div style={{fontSize:11,fontWeight:700,color:"#06d6a0",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.round(675*1000))}</div></div>
                </div>
              </Card>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <CardTitle>Historial USD/CLP</CardTitle>
                <TimeRangePicker value={chartRange} onChange={setChartRange}/>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={genDollarData(chartRange)}>
                  <defs><linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9c46a" stopOpacity={0.25}/><stop offset="100%" stopColor="#e9c46a" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="x" tick={false} axisLine={{stroke:"#1e293b"}}/>
                  <YAxis tick={{fill:"#475569",fontSize:9}} axisLine={{stroke:"#1e293b"}} domain={["auto","auto"]}/>
                  <Tooltip contentStyle={ttStyle}/>
                  <Area type="monotone" dataKey="rate" stroke="#e9c46a" fill="url(#gD)" strokeWidth={2} name="USD/CLP"/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <CardTitle>Zonas de Alerta Dólar</CardTitle>
              {[
                {r:"< $860",s:"🟢 COMPRAR",a:"Adelantar inversiones",c:"#06d6a0"},
                {r:"$860-900",s:"🔵 BUEN PRECIO",a:"DCA normal + extra",c:"#4cc9f0"},
                {r:"$900-940",s:"🟡 NEUTRAL",a:"DCA regular",c:"#e9c46a"},
                {r:"$940-980",s:"🟠 CARO",a:"Reducir compras USD",c:"#f4a261"},
                {r:"> $980",s:"🔴 MUY CARO",a:"Esperar corrección",c:"#e63946"},
              ].map(z=>(
                <div key={z.r} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:`${z.c}08`,borderRadius:6,marginBottom:4,border:`1px solid ${z.c}15`}}>
                  <span style={{fontSize:10,fontWeight:700,color:z.c,fontFamily:"'JetBrains Mono',monospace",minWidth:62}}>{z.r}</span>
                  <div><div style={{fontSize:10,fontWeight:600,color:z.c}}>{z.s}</div><div style={{fontSize:9,color:"#64748b"}}>{z.a}</div></div>
                </div>
              ))}
            </Card>
          </div>
        </>)}

        {/* ════════════════════ SIMULADOR ════════════════════ */}
        {tab==="Simulador"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:12,marginBottom:12}}>
            <Card style={{padding:18}}>
              <CardTitle>Parámetros</CardTitle>
              {[{l:"Aporte mensual",v:simM,u:"K",mn:50,mx:800,set:setSimM},{l:"Retorno anual",v:simR,u:"%",mn:4,mx:18,set:setSimR},{l:"Horizonte",v:simY,u:" años",mn:1,mx:30,set:setSimY}].map(s=>(
                <div key={s.l} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#94a3b8"}}>{s.l}</span><span style={{fontSize:13,fontWeight:800,color:"#4361ee",fontFamily:"'JetBrains Mono',monospace"}}>{s.v}{s.u}</span></div>
                  <input type="range" min={s.mn} max={s.mx} value={s.v} onChange={e=>s.set(Number(e.target.value))} style={{width:"100%",accentColor:"#4361ee",cursor:"pointer"}}/>
                </div>
              ))}
              <div style={{background:"#020617",borderRadius:8,padding:12,marginTop:6}}>
                <div style={{fontSize:8,color:"#475569",letterSpacing:0.5}}>PROYECCIÓN A {simY} AÑOS</div>
                <div style={{fontSize:26,fontWeight:800,color:"#06d6a0",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{fK(Math.round(simM*1000*12*(((1+simR/100/12)**(simY*12)-1)/(simR/100/12))))}</div>
                <div style={{fontSize:9,color:"#475569",marginTop:2}}>Aportado: {fK(simM*1000*12*simY)}</div>
              </div>
            </Card>
            <Card>
              <CardTitle>Proyección de Crecimiento</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({length:Math.min(simY,30)},(_,i)=>{const y=i+1;const v=Math.round(simM*1000*12*(((1+simR/100/12)**(y*12)-1)/(simR/100/12)));const o=Math.round(simM*1000*12*(((1+(simR+2)/100/12)**(y*12)-1)/((simR+2)/100/12)));return{year:2026+y,base:v,optimist:o,aportes:simM*1000*12*y};})}>
                  <defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4361ee" stopOpacity={0.3}/><stop offset="100%" stopColor="#4361ee" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="year" tick={{fill:"#475569",fontSize:9}} axisLine={{stroke:"#1e293b"}}/>
                  <YAxis tick={{fill:"#475569",fontSize:9}} axisLine={{stroke:"#1e293b"}} tickFormatter={fK}/>
                  <Tooltip contentStyle={ttStyle} formatter={v=>fmt(v)}/>
                  <Area type="monotone" dataKey="optimist" stroke="#06d6a0" fill="none" strokeWidth={1} strokeDasharray="4 4" name={`Optimista (${simR+2}%)`}/>
                  <Area type="monotone" dataKey="base" stroke="#4361ee" fill="url(#gS)" strokeWidth={2} name={`Base (${simR}%)`}/>
                  <Line type="monotone" dataKey="aportes" stroke="#334155" strokeDasharray="3 3" dot={false} name="Aportes"/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>)}

        {/* ════════════════════ CONFIGURACIÓN ════════════════════ */}
        {tab==="Configuración"&&(<>
          {/* Monthly Budget */}
          <Card style={{marginBottom:12}}>
            <CardTitle>Aporte Mensual Total</CardTitle>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:10,color:"#94a3b8"}}>Monto DCA mensual (CLP):</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                <input type="range" min={50000} max={800000} step={10000} value={monthlyBudget} onChange={e=>setMonthlyBudget(Number(e.target.value))} style={{flex:1,accentColor:"#4361ee",cursor:"pointer"}}/>
                <span style={{fontSize:18,fontWeight:800,color:"#4361ee",fontFamily:"'JetBrains Mono',monospace",minWidth:100,textAlign:"right"}}>{fmt(monthlyBudget)}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:12,marginTop:8,fontSize:10,color:"#64748b"}}>
              <span>Sueldo líquido: {fmt(1075000)}</span>
              <span>·</span>
              <span>Tasa inversión: {investRate}%</span>
              <span>·</span>
              <span>Disponible para gastos: {fmt(1075000-monthlyBudget)}</span>
            </div>
          </Card>

          {/* Portfolio Management */}
          <Card style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <CardTitle>Gestión de Portafolio</CardTitle>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:totalAlloc===100?"#06d6a0":totalAlloc>100?"#e63946":"#e9c46a"}}>Total: {totalAlloc}%{totalAlloc!==100&&" ⚠️"}</div>
            </div>

            {/* Existing stocks */}
            <div style={{display:"grid",gridTemplateColumns:"60px 1fr 100px 80px 80px 70px 40px",gap:6,alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1e293b",marginBottom:6}}>
              {["Ticker","Nombre","Categoría","Precio","Asignación","DCA/mes",""].map(h=>(
                <div key={h} style={{fontSize:9,color:"#475569",fontWeight:600,letterSpacing:0.3}}>{h}</div>
              ))}
            </div>

            {stocks.map(s=>{
              const amt=Math.round(monthlyBudget*s.allocation/Math.max(totalAlloc,1));
              return(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"60px 1fr 100px 80px 80px 70px 40px",gap:6,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0f172a"}}>
                  <span style={{background:`${s.color}22`,color:s.color,padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}>{s.ticker}</span>
                  <span style={{fontSize:11,color:"#e2e8f0"}}>{s.name}</span>
                  <span style={{fontSize:10,color:"#64748b",background:"#020617",padding:"2px 8px",borderRadius:4,textAlign:"center"}}>{s.category}</span>
                  <span style={{fontSize:11,fontWeight:600,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{fU(s.price)}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input type="number" value={s.allocation} onChange={e=>updateAllocation(s.id,e.target.value)}
                      style={{width:42,padding:"4px 6px",background:"#020617",border:"1px solid #334155",borderRadius:6,color:"#f1f5f9",fontSize:12,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                    <span style={{fontSize:10,color:"#64748b"}}>%</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(amt)}</span>
                  <button onClick={()=>removeStock(s.id)} style={{background:"#e6394618",border:"1px solid #e6394633",borderRadius:6,color:"#e63946",cursor:"pointer",padding:"3px 6px",fontSize:10}}>✕</button>
                </div>
              );
            })}

            {/* Visual allocation bar */}
            <div style={{marginTop:12,height:10,borderRadius:5,overflow:"hidden",display:"flex"}}>
              {stocks.map(s=>(<div key={s.id} style={{width:`${s.allocation/Math.max(totalAlloc,1)*100}%`,background:s.color,transition:"width 0.3s"}} title={`${s.ticker}: ${s.allocation}%`}/>))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
              {stocks.map(s=>(<div key={s.id} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#94a3b8"}}><div style={{width:8,height:8,borderRadius:2,background:s.color}}/>{s.ticker} {s.allocation}%</div>))}
            </div>
          </Card>

          {/* Add new asset */}
          <Card style={{marginBottom:12}}>
            <CardTitle>Agregar Nuevo Activo</CardTitle>
            <div style={{display:"grid",gridTemplateColumns:"100px 1fr 120px 100px 80px auto",gap:8,alignItems:"end"}}>
              <div>
                <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>Ticker *</div>
                <input value={newTicker} onChange={e=>setNewTicker(e.target.value)} placeholder="GOOGL"
                  style={{width:"100%",padding:"8px 10px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>Nombre</div>
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Alphabet Inc."
                  style={{width:"100%",padding:"8px 10px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>Categoría</div>
                <select value={newCat} onChange={e=>setNewCat(e.target.value)}
                  style={{width:"100%",padding:"8px 10px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:12}}>
                  <option value="Core">Core</option><option value="Growth">Growth</option><option value="Internacional">Internacional</option><option value="Cobertura">Cobertura</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>Precio USD *</div>
                <input type="number" value={newPrice} onChange={e=>setNewPrice(e.target.value)} placeholder="195.00"
                  style={{width:"100%",padding:"8px 10px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>Asignación %</div>
                <input type="number" value={newAlloc} onChange={e=>setNewAlloc(e.target.value)} placeholder="10"
                  style={{width:"100%",padding:"8px 10px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
              <button onClick={addStock} style={{padding:"8px 16px",background:"linear-gradient(135deg,#4361ee,#7209b7)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",height:38}}>+ Agregar</button>
            </div>
            <div style={{marginTop:10,padding:8,background:"#020617",borderRadius:8,fontSize:10,color:"#64748b"}}>
              💡 Al agregar un activo, ajusta los porcentajes de los demás para que sumen 100%. El sistema redistribuye el DCA mensual automáticamente.
            </div>
          </Card>

          {/* Presets */}
          <Card>
            <CardTitle>Presets Rápidos</CardTitle>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {l:"Solo IVV (100%)",s:[{t:"IVV",a:100}]},
                {l:"IVV + Big Tech",s:[{t:"IVV",a:50},{t:"AAPL",a:17},{t:"MSFT",a:17},{t:"AMZN",a:16}]},
                {l:"Diversificado",s:[{t:"IVV",a:40},{t:"AAPL",a:12},{t:"MSFT",a:12},{t:"AMZN",a:12},{t:"GOOGL",a:12},{t:"QQQ",a:12}]},
              ].map(p=>(
                <button key={p.l} onClick={()=>{
                  const newStocks = p.s.map((ps,i)=>{
                    const existing = stocks.find(s=>s.ticker===ps.t);
                    return existing ? {...existing,allocation:ps.a} : {id:100+i,ticker:ps.t,name:ps.t,price:200,high52:250,low52:150,change1y:0,category:"Growth",color:COLORS[(stocks.length+i)%COLORS.length],allocation:ps.a,owned:0};
                  });
                  setStocks(newStocks);
                }} style={{padding:"8px 14px",background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {p.l}
                </button>
              ))}
            </div>
          </Card>
        </>)}

        {/* ════════════════════ TELEGRAM ════════════════════ */}
        {tab==="Telegram"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {/* Connection */}
            <Card>
              <CardTitle>🤖 Conexión Bot Telegram</CardTitle>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Bot Token</div>
                <input value={tgToken} onChange={e=>setTgToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  style={{width:"100%",padding:"10px 12px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Chat ID</div>
                <input value={tgChatId} onChange={e=>setTgChatId(e.target.value)} placeholder="123456789"
                  style={{width:"100%",padding:"10px 12px",background:"#020617",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setTgConnected(true);setTgTestSent(false);}} style={{flex:1,padding:"10px",background:tgConnected?"#06d6a022":"linear-gradient(135deg,#4361ee,#7209b7)",border:tgConnected?"1px solid #06d6a044":"none",borderRadius:8,color:tgConnected?"#06d6a0":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {tgConnected?"✅ Conectado":"Conectar Bot"}
                </button>
                <button onClick={()=>setTgTestSent(true)} disabled={!tgConnected} style={{padding:"10px 16px",background:tgConnected?"#1e293b":"#0f172a",border:"1px solid #334155",borderRadius:8,color:tgConnected?"#e2e8f0":"#475569",fontSize:12,fontWeight:600,cursor:tgConnected?"pointer":"not-allowed"}}>
                  {tgTestSent?"✅ Enviado":"Enviar Test"}
                </button>
              </div>
              {!tgConnected&&(
                <div style={{marginTop:12,padding:10,background:"#020617",borderRadius:8,fontSize:10,color:"#94a3b8",lineHeight:1.6}}>
                  <strong style={{color:"#e2e8f0"}}>Cómo configurar:</strong><br/>
                  1. Abre Telegram y busca @BotFather<br/>
                  2. Envía /newbot y sigue las instrucciones<br/>
                  3. Copia el token y pégalo arriba<br/>
                  4. Envía un mensaje a tu bot, luego busca tu Chat ID en api.telegram.org/bot{"<TOKEN>"}/getUpdates
                </div>
              )}
            </Card>

            {/* Alert Config */}
            <Card>
              <CardTitle>Configuración de Alertas</CardTitle>
              {[
                {key:"market",icon:"🌡️",label:"Alertas de mercado",desc:"Cuando el scoring detecte oportunidad (>15/100)"},
                {key:"dollar",icon:"💵",label:"Alertas de dólar",desc:"Cuando USD/CLP entre en zona de compra o máximos"},
                {key:"stocks",icon:"📊",label:"Alertas por acción",desc:"Cuando una acción tenga score de oportunidad >60"},
                {key:"daily",icon:"📋",label:"Resumen diario",desc:"Resumen completo cada día a las 18:00 (post-cierre)"},
              ].map(a=>(
                <div key={a.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #0f172a"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{a.label}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>{a.desc}</div>
                    </div>
                  </div>
                  <button onClick={()=>setTgAlerts({...tgAlerts,[a.key]:!tgAlerts[a.key]})}
                    style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",position:"relative",background:tgAlerts[a.key]?"#4361ee":"#1e293b",transition:"background 0.2s"}}>
                    <div style={{width:18,height:18,borderRadius:9,background:"#f1f5f9",position:"absolute",top:3,left:tgAlerts[a.key]?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
                  </button>
                </div>
              ))}
            </Card>
          </div>

          {/* Message Preview */}
          <Card style={{marginBottom:12}}>
            <CardTitle>Vista Previa — Resumen Diario</CardTitle>
            <div style={{background:"#020617",borderRadius:10,padding:16,fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.8,color:"#e2e8f0",maxWidth:500}}>
              <div style={{color:"#4361ee",fontWeight:700,marginBottom:4}}>📊 FINANCIAL OS — Resumen 26 Mar 2026</div>
              <div style={{borderBottom:"1px solid #1e293b",paddingBottom:6,marginBottom:6}}>
                <div>💰 Patrimonio: {fmt(Math.round(totalWealth))}</div>
                <div>💵 USD/CLP: ${DOLLAR.current} {dZone.l}</div>
                <div>🌡️ Señal: {marketScore}/100 — {signal.l}</div>
              </div>
              <div style={{color:"#94a3b8",marginBottom:6}}>📈 Precios del día:</div>
              {stocks.map(s=>(<div key={s.id} style={{color:s.color}}>  {s.ticker}: {fU(s.price)} ({s.change1y>=0?"+":""}{s.change1y}%)</div>))}
              <div style={{borderTop:"1px solid #1e293b",paddingTop:6,marginTop:6}}>
                <div style={{color:"#06d6a0"}}>✅ Acción: {signal.a} — {fmt(monthlyBudget)} DCA</div>
              </div>
            </div>
          </Card>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Card style={{textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:6}}>🌡️</div>
              <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>Alerta de Mercado</div>
              <div style={{background:"#020617",borderRadius:8,padding:10,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#e9c46a",lineHeight:1.6,textAlign:"left"}}>
                🟡 OPORTUNIDAD MEDIA<br/>
                Score: 38/100<br/>
                IVV DD: -11.2% | VIX: 28<br/>
                → 2x DCA: {fmt(monthlyBudget*2)}
              </div>
            </Card>
            <Card style={{textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:6}}>💵</div>
              <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>Alerta de Dólar</div>
              <div style={{background:"#020617",borderRadius:8,padding:10,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#06d6a0",lineHeight:1.6,textAlign:"left"}}>
                🟢 DÓLAR EN MÍNIMOS<br/>
                USD/CLP: $855<br/>
                Posición: 3% del rango<br/>
                → Comprar USD agresivo
              </div>
            </Card>
            <Card style={{textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:6}}>📊</div>
              <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>Alerta por Acción</div>
              <div style={{background:"#020617",borderRadius:8,padding:10,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#e63946",lineHeight:1.6,textAlign:"left"}}>
                🔴 MSFT: Score 94/100<br/>
                Precio: $370 | DD: -33%<br/>
                Máx52: $555 | Mín52: $344<br/>
                → COMPRAR AGRESIVO
              </div>
            </Card>
          </div>
        </>)}

      </div>
    </div>
  );
}
