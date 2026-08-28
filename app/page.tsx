'use client';

import { useEffect, useMemo, useState } from 'react';

type Part = { name: string; desc: string };
type Robot = { id: number; battery: number; urgency: number; waited: number };
type PolicyKey = 'fifo' | 'battery' | 'fair';

const PARTS: Part[] = [
  {name:'LiDAR',desc:'레이저로 주변 거리와 지형을 측정'}, {name:'ToF 센서',desc:'빛의 왕복 시간으로 거리를 측정'},
  {name:'초음파 센서',desc:'초음파 반사로 장애물을 감지'}, {name:'적외선 센서',desc:'적외선으로 물체와 선을 감지'},
  {name:'카메라',desc:'주변 영상을 촬영하고 인식'}, {name:'IMU',desc:'가속도와 회전 자세를 측정'},
  {name:'엔코더',desc:'바퀴 회전량과 이동 거리를 측정'}, {name:'조도 센서',desc:'주변 밝기를 감지'},
  {name:'압력 센서',desc:'가해지는 힘과 압력을 측정'}, {name:'온도 센서',desc:'장치와 환경의 온도를 측정'},
  {name:'DC 모터',desc:'바퀴를 연속 회전시켜 구동'}, {name:'스테퍼 모터',desc:'정해진 각도 단위로 정밀 회전'},
  {name:'서보 모터',desc:'목표 각도로 정밀하게 움직임'}, {name:'모터 드라이버',desc:'제어 신호로 모터 전력을 조절'},
  {name:'감속기',desc:'회전 속도를 낮추고 힘을 높임'}, {name:'구동 바퀴',desc:'모터 힘을 바닥에 전달'},
  {name:'캐스터 휠',desc:'차체를 지지하며 자유롭게 방향 전환'}, {name:'배터리',desc:'로봇에 전력을 공급'},
  {name:'충전 모듈',desc:'배터리 충전 전압과 전류를 관리'}, {name:'ESP32',desc:'센서와 통신을 제어하는 보드'},
  {name:'Arduino Mega',desc:'다수의 입출력 장치를 제어'}, {name:'Raspberry Pi',desc:'영상과 고수준 연산을 처리'},
  {name:'비상 정지 버튼',desc:'위험 시 즉시 구동을 멈춤'}, {name:'통신 안테나',desc:'관제 시스템과 무선 통신'},
  {name:'컨베이어 벨트',desc:'화물을 일정 방향으로 이송'}, {name:'로봇 팔',desc:'화물을 들어 위치를 이동'},
  {name:'그리퍼',desc:'물체를 집고 놓는 말단 장치'}, {name:'QR 리더기',desc:'QR 코드에서 위치·화물 정보를 읽음'},
  {name:'RFID 리더기',desc:'무선 태그의 정보를 인식'}, {name:'범퍼 센서',desc:'접촉 충돌을 감지'},
  {name:'경고등',desc:'로봇의 상태와 위험을 시각 표시'},
];
const BIT_VALUES = [1,2,4,8,16];
const POLICIES: {key:PolicyKey; label:string; desc:string}[] = [
  {key:'fifo',label:'A. 선착순',desc:'기존 대기 시간이 긴 순서'},
  {key:'battery',label:'B. 배터리 우선',desc:'배터리 잔량이 낮은 순서'},
  {key:'fair',label:'C. 공정 배분',desc:'배터리·긴급도·대기 시간을 함께 반영'},
];
const PROMPTS = [
  '로봇공학과 관련된 비둘기집 원리의 실생활 문제를 제안하고, 비둘기와 비둘기집에 해당하는 요소를 구분해줘.',
  '물류 로봇 수가 충전기 수보다 많을 때 발생하는 문제를 충전기 수를 늘리지 않고 해결할 정책을 제안해줘.',
  '배터리 잔량, 작업 긴급도, 대기 시간을 이용한 충전 우선순위 정책의 허점과 예상되는 부작용을 비판해줘.',
];
const RED_TEAM = [
  ['배터리가 적은 로봇만 계속 우선될 수 있음','대기 시간이 길어질수록 우선순위 점수가 증가하도록 함'],
  ['관리자가 작업 긴급도를 임의로 높일 수 있음','주문 마감 시간과 작업 지연 가능성으로 긴급도를 자동 계산'],
  ['충전 중 로봇이 고장 나면 전체 일정이 밀릴 수 있음','충전량이 일정 시간 증가하지 않으면 다음 로봇을 자동 재배정'],
  ['예약 로봇이 한꺼번에 이동하면 앞에서 충돌할 수 있음','예약 시작 5분 전부터 해당 로봇만 이동하도록 제한'],
  ['점수 가중치가 절대적으로 공정하지 않을 수 있음','가중치를 조정하고 정책별 실제 결과를 비교'],
];
const PAGES = [
  {id:'intro',label:'관제실 소개'}, {id:'binary',label:'부품 추적'}, {id:'principle',label:'이진 원리'},
  {id:'charging',label:'혼잡 분석'}, {id:'policy',label:'정책 비교'}, {id:'reflection',label:'AI·탐구'},
];

function makeRobots(count:number, random=false):Robot[] {
  const seed = [12,44,8,57,21,15,33,6,49,27,10,38,18,52,24,9,41,14,31,7,55,19,36,11,47,23,5,29,16,53];
  return Array.from({length:count},(_,i)=>({
    id:i+1,
    battery: random ? Math.floor(Math.random()*56)+5 : seed[i%seed.length],
    urgency: random ? Math.floor(Math.random()*10)+1 : ((i*7+3)%10)+1,
    waited: random ? Math.floor(Math.random()*31) : (i*11+5)%31,
  }));
}

export default function Home() {
  const [active,setActive]=useState('intro');
  const [tracking,setTracking]=useState(false), [step,setStep]=useState(0), [answers,setAnswers]=useState<boolean[]>([]), [done,setDone]=useState(false);
  const [binaryPick,setBinaryPick]=useState(13);
  const [robotCount,setRobotCount]=useState(13), [chargerCount,setChargerCount]=useState(5), [chargeTime,setChargeTime]=useState(30);
  const [robots,setRobots]=useState<Robot[]>(()=>makeRobots(13));
  const [policy,setPolicy]=useState<PolicyKey>('fair');
  const [weights,setWeights]=useState({battery:50,urgency:30,wait:20});

  useEffect(()=>{ setRobots(old=>makeRobots(robotCount).map((r,i)=>old[i]??r)); },[robotCount]);
  useEffect(()=>{
    const syncPage=()=>{const id=location.hash.slice(1);setActive(PAGES.some(p=>p.id===id)?id:'intro')};
    syncPage(); window.addEventListener('hashchange',syncPage); return()=>window.removeEventListener('hashchange',syncPage);
  },[]);
  const goPage=(id:string)=>{history.pushState(null,'',`#${id}`);setActive(id);window.scrollTo({top:0,behavior:'smooth'})};
  const pageIndex=PAGES.findIndex(p=>p.id===active);

  // 비트가 1인 번호만 각 점검 카드에 자동 포함한다.
  const cards=useMemo(()=>BIT_VALUES.map(bit=>PARTS.map((_,i)=>i+1).filter(n=>(n&bit)!==0)),[]);
  // 모든 1~31 번호가 자신의 이진 비트와 정확히 일치하는지 검사한다.
  const cardsValid=useMemo(()=>PARTS.every((_,i)=>BIT_VALUES.every((b,j)=>cards[j].includes(i+1)===(((i+1)&b)!==0))),[cards]);
  const foundNumber=answers.reduce((sum,yes,i)=>sum+(yes?BIT_VALUES[i]:0),0), found=PARTS[foundNumber-1];
  const answer=(yes:boolean)=>{const next=[...answers,yes];setAnswers(next);if(step===4)setDone(true);else setStep(step+1)};
  const resetTracking=()=>{setTracking(false);setStep(0);setAnswers([]);setDone(false)};

  const distribution=useMemo(()=>Array.from({length:chargerCount},(_,i)=>Math.floor(robotCount/chargerCount)+(i<robotCount%chargerCount?1:0)),[robotCount,chargerCount]);
  const normalized=useMemo(()=>{const sum=weights.battery+weights.urgency+weights.wait||1;return {battery:weights.battery/sum,urgency:weights.urgency/sum,wait:weights.wait/sum}},[weights]);
  const score=(r:Robot)=>normalized.battery*(100-r.battery)+normalized.urgency*(r.urgency*10)+normalized.wait*(r.waited/30*100);
  const results=useMemo(()=>Object.fromEntries(POLICIES.map(p=>{
    const sorted=[...robots].sort((a,b)=>{
      const d=p.key==='fifo'?b.waited-a.waited:p.key==='battery'?a.battery-b.battery:score(b)-score(a);
      return d||b.waited-a.waited||a.id-b.id;
    });
    const rows=sorted.map((r,i)=>({...r,charger:i%chargerCount+1,wait:Math.floor(i/chargerCount)*chargeTime,score:score(r)}));
    const avg=(items:typeof rows)=>items.length?items.reduce((s,r)=>s+r.wait,0)/items.length:0;
    return [p.key,{rows,low:avg(rows.filter(r=>r.battery<=15)),urgent:avg(rows.filter(r=>r.urgency>=8)),max:Math.max(0,...rows.map(r=>r.wait))}];
  })),[robots,chargerCount,chargeTime,normalized]);
  const current=results[policy] as {rows:(Robot&{charger:number;wait:number;score:number})[];low:number;urgent:number;max:number};
  const bestLow=Math.min(...POLICIES.map(p=>results[p.key].low)), bestUrgent=Math.min(...POLICIES.map(p=>results[p.key].urgent));
  const ceil=Math.ceil(robotCount/chargerCount), waiting=Math.max(0,robotCount-chargerCount);
  const proofCapacity=chargerCount*Math.max(0,ceil-1);

  return <main className={`page-${active}`}>
    <header className="topbar"><button className="brand" onClick={()=>goPage('intro')}>ROBO-LOG</button><nav aria-label="현재 영역">
      {PAGES.map(({id,label})=><button key={id} className={active===id?'active':''} onClick={()=>goPage(id)}>{label}</button>)}
    </nav></header>

    <section id="intro" className="hero section"><div className="hero-copy"><p className="eyebrow">LOGISTICS CONTROL / DISCRETE MATH LAB</p><h1><span>ROBO-LOG</span>물류센터 로봇 관제실</h1><p className="lead">이진법으로 분실된 로봇 부품을 추적하고, 비둘기집 원리로 충전소 혼잡을 해결해 보세요.</p><div className="mission-grid"><a className="mission" href="#binary"><b>MISSION 01</b><span>분실된 로봇 부품 추적</span><em>이진법으로 시작 →</em></a><a className="mission warm" href="#charging"><b>MISSION 02</b><span>로봇 충전소 혼잡 해결</span><em>시뮬레이션 시작 →</em></a></div></div><div className="radar"><div className="radar-core">31<small>부품 등록</small></div><div className="status-line"><span>시스템 상태</span><b>● 정상 운영</b></div><div className="status-line"><span>활성 로봇</span><b>13 UNIT</b></div><div className="status-line"><span>충전 포트</span><b>05 PORT</b></div></div></section>

    <section id="binary" className="section"><SectionHead n="01" tag="BINARY TRACKING" title="이진법 부품 추적" desc="물류 로봇 한 대가 작동을 멈췄습니다. 정비 기록에는 사라진 부품이 포함된 점검 목록만 남아 있습니다. 다섯 개의 기록을 확인해 분실된 부품을 찾아내세요." />
      <div className="validation"><b>{cardsValid?'✓ 카드 자동 검증 완료':'! 카드 규칙 오류'}</b><span>31개 부품 · 5비트 · 중복/누락 검사</span></div>
      <details className="parts"><summary>31개 부품 목록과 기능 확인</summary><div className="part-grid">{PARTS.map((p,i)=><article key={p.name}><i>{String(i+1).padStart(2,'0')}</i><div><b>{p.name}</b><p>{p.desc}</p></div></article>)}</div></details>
      <div className="game panel">{!tracking?<div className="game-start"><span className="big-icon">⌁</span><h3>부품 하나를 마음속으로 선택하세요</h3><p>추적을 시작하면 값이 1, 2, 4, 8, 16인 점검 기록을 차례로 확인합니다.</p><button onClick={()=>setTracking(true)}>추적 시작</button></div>:done?<div className="result"><p className="eyebrow">TRACKING COMPLETE</p>{found?<><div className="result-number">{String(foundNumber).padStart(2,'0')}</div><h3>{found.name}</h3><p>{found.desc}</p><div className="formula">{answers.map((a,i)=>a?BIT_VALUES[i]:0).join(' + ')} = <b>{foundNumber}</b><br/><code>{foundNumber} = {foundNumber.toString(2).padStart(5,'0')}₂</code></div></>:<div className="error">응답에 해당하는 부품이 없습니다. 선택한 부품과 응답을 다시 확인해 주세요.</div>}<button onClick={resetTracking}>다시 추적하기</button></div>:<div><div className="game-progress"><span>점검 기록 {String.fromCharCode(65+step)}</span><b>{step+1} / 5</b></div><h3>선택한 부품이 이 기록에 있나요?</h3><p>이 기록의 값은 <strong>{BIT_VALUES[step]}</strong>입니다.</p><div className="record-list">{cards[step].map(n=><span key={n}>{n}. {PARTS[n-1].name}</span>)}</div><div className="answer-row"><button className="secondary" onClick={()=>answer(false)}>없음</button><button onClick={()=>answer(true)}>있음</button></div></div>}</div>
    </section>

    <section id="principle" className="section alt"><SectionHead n="02" tag="WHY BINARY?" title="다섯 장이면 충분한 이유" desc="각 질문은 ‘있음/없음’ 두 가지 답을 만들고, 다섯 질문은 2⁵ = 32개의 서로 다른 응답 조합을 만듭니다." />
      <div className="explain-grid"><article className="panel"><b className="metric">2⁵ = 32</b><h3>31개 부품 + 오류 1개</h3><p>00000을 오류 응답으로 남기고 00001부터 11111까지를 부품 번호 1~31에 연결합니다.</p></article><article className="panel"><b className="metric">1·2·4·8·16</b><h3>자릿값의 두 배 규칙</h3><p>이진수 각 자리는 2⁰부터 2⁴까지의 값을 가집니다. ‘있음’인 카드의 자릿값을 더하면 원래 번호가 복원됩니다.</p></article></div>
      <div className="binary-lab panel"><div><label htmlFor="binaryPick">번호를 직접 바꿔 보세요</label><input id="binaryPick" type="range" min="1" max="31" value={binaryPick} onChange={e=>setBinaryPick(+e.target.value)}/></div><div className="binary-output"><b>{binaryPick}</b><code>{binaryPick.toString(2).padStart(5,'0')}₂</code><span>포함 카드: {BIT_VALUES.filter(b=>(binaryPick&b)!==0).join(', ')}</span></div></div>
    </section>

    <section id="charging" className="section"><SectionHead n="03" tag="PIGEONHOLE LAB" title="충전소 혼잡 시뮬레이션" desc={`배터리가 부족한 물류 로봇 ${robotCount}대가 동시에 충전을 요청했지만 사용할 수 있는 충전기는 ${chargerCount}대뿐입니다.`}/>
      <div className="pigeon-row"><span><b>비둘기</b> 충전이 필요한 로봇</span><span><b>비둘기집</b> 사용할 수 있는 충전기</span></div>
      <div className="control-grid panel"><Control label="로봇 수" min={2} max={30} value={robotCount} unit="대" onChange={setRobotCount}/><Control label="충전기 수" min={1} max={10} value={chargerCount} unit="대" onChange={setChargerCount}/><Control label="1회 충전 시간" min={10} max={60} value={chargeTime} unit="분" onChange={setChargeTime}/></div>
      <div className="formula wide"><div>최소 최대 배정량</div><strong>⌈ {robotCount} ÷ {chargerCount} ⌉ = {ceil}</strong><p>{robotCount}대를 {chargerCount}대의 충전기에 배정하면, 아무리 고르게 배정해도 적어도 한 충전기에는 로봇 {ceil}대 이상이 배정됩니다. 현재 즉시 충전하지 못하고 대기하는 로봇은 <b>{waiting}대</b>입니다.</p></div>
      <div className="chargers">{distribution.map((count,i)=><article key={i} className={count>=3?'crowded':''}><header><b>CHG-{String(i+1).padStart(2,'0')}</b><span>{count>=3?'⚠ 혼잡':'✓ 정상'} · {count}대</span></header><div className="robot-dots">{Array.from({length:count},(_,j)=><i key={j} title={`로봇 ${i+1+j*chargerCount}`}>▣</i>)}</div></article>)}</div>
      <div className="data-head"><div><h3>로봇별 상태 데이터</h3><p>정책 비교에 쓰이는 입력값입니다.</p></div><button className="secondary" onClick={()=>setRobots(makeRobots(robotCount,true))}>데이터 다시 생성</button></div><div className="table-wrap"><table><thead><tr><th>로봇 ID</th><th>배터리</th><th>긴급도</th><th>기존 대기</th></tr></thead><tbody>{robots.map(r=><tr key={r.id}><td>RB-{String(r.id).padStart(2,'0')}</td><td><div className="battery"><i style={{width:`${r.battery}%`}}/ ></div>{r.battery}%</td><td>{r.urgency} / 10</td><td>{r.waited}분</td></tr>)}</tbody></table></div>
    </section>

    <section id="policy" className="section alt"><SectionHead n="04" tag="FAIR SCHEDULING" title="충전 정책 비교" desc="같은 로봇 데이터도 어떤 기준으로 줄을 세우느냐에 따라 위험 로봇과 긴급 작업의 대기 시간이 달라집니다."/>
      <div className="policy-tabs" role="tablist">{POLICIES.map(p=><button role="tab" aria-selected={policy===p.key} key={p.key} onClick={()=>setPolicy(p.key)}><b>{p.label}</b><span>{p.desc}</span></button>)}</div>
      <div className="weight-box panel"><div><h3>공정 배분 가중치 실험</h3><p>원시 가중치의 합을 자동으로 100%로 정규화합니다.</p></div>{(['battery','urgency','wait'] as const).map((k,i)=><label key={k}>{['배터리','긴급도','대기 시간'][i]} <b>{Math.round(normalized[k]*100)}%</b><input type="range" min="0" max="100" value={weights[k]} onChange={e=>setWeights({...weights,[k]:+e.target.value})}/></label>)}</div>
      <div className="formula">공정 점수 = {normalized.battery.toFixed(2)}(100−배터리) + {(normalized.urgency*10).toFixed(2)}(긴급도) + {(normalized.wait/0.3).toFixed(2)}(대기 시간)</div>
      <div className="metrics">{[['저전력(≤15%) 평균',current.low],['긴급(≥8) 평균',current.urgent],['최장 대기',current.max]].map(([l,v])=><article key={String(l)}><span>{l}</span><b>{Number(v).toFixed(1)}분</b></article>)}</div>
      <div className="table-wrap"><table><thead><tr><th>순서</th><th>로봇</th><th>배터리</th><th>긴급도</th><th>충전기</th><th>예상 대기</th>{policy==='fair'&&<th>점수</th>}</tr></thead><tbody>{current.rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td>RB-{String(r.id).padStart(2,'0')}</td><td>{r.battery}%</td><td>{r.urgency}</td><td>CHG-{String(r.charger).padStart(2,'0')}</td><td><b>{r.wait}분</b></td>{policy==='fair'&&<td>{r.score.toFixed(1)}</td>}</tr>)}</tbody></table></div>
      <div className="compare"><h3>세 정책 실제 결과</h3>{POLICIES.map(p=><div key={p.key}><b>{p.label}</b><span>저전력 {results[p.key].low.toFixed(1)}분</span><i style={{width:`${Math.max(3,results[p.key].low/(Math.max(...POLICIES.map(x=>results[x.key].low))||1)*100)}%`}}/><span>긴급 {results[p.key].urgent.toFixed(1)}분</span></div>)}</div>
      <p className="interpret">계산 결과, 저전력 로봇 평균 대기는 <b>{POLICIES.filter(p=>results[p.key].low===bestLow).map(p=>p.label).join(', ')}</b>이 가장 짧고, 긴급 작업 로봇은 <b>{POLICIES.filter(p=>results[p.key].urgent===bestUrgent).map(p=>p.label).join(', ')}</b>이 가장 짧습니다. 데이터와 가중치를 바꾸면 해석도 함께 바뀝니다.</p>
      <div className="solution-grid"><article><small>문제의 원인</small><p>로봇 수가 충전기 수보다 많으면 비둘기집 원리에 따라 중복 배정과 대기가 발생합니다.</p></article><article><small>제한 조건</small><p>충전기 수와 물리적 공간은 늘리지 않습니다.</p></article><article><small>제안한 해결책</small><p>배터리·긴급도·대기 시간을 함께 반영한 예약형 정책을 사용하고, 예약 5분 전 로봇만 이동시킵니다.</p></article></div>
      <div className="insight"><b>해결책의 의미</b><p>비둘기집 원리에 따르면 충전 대기 자체를 완전히 없앨 수는 없습니다. 목표는 충돌을 없다고 가정하는 것이 아니라, 제한된 충전기를 더 공정하게 배분하고 위험한 배터리 부족과 작업 중단을 줄이는 것입니다.</p></div>
    </section>

    <section id="reflection" className="section"><SectionHead n="05–06" tag="RED TEAM & PROOF" title="AI 검증 및 탐구 정리" desc="AI의 제안을 그대로 받아들이지 않고 허점, 예외 상황, 공정성 기준을 비판적으로 검토합니다."/>
      <h3 className="sub-title">AI Red Team 검증</h3><div className="red-grid">{RED_TEAM.map((x,i)=><article key={x[0]}><i>{String(i+1).padStart(2,'0')}</i><div><b>문제</b><p>{x[0]}</p><b className="fix">보완</b><p>{x[1]}</p></div></article>)}</div>
      <h3 className="sub-title">AI 활용 과정 기록</h3><div className="prompt-list">{PROMPTS.map((p,i)=><details key={p}><summary><b>프롬프트 {i+1}</b><span>“{p}”</span></summary><div className="reflection-grid">{['AI가 제안한 내용','발견한 문제점','내가 수정한 내용','수정한 이유'].map((label,j)=><label key={label}>{label}<textarea defaultValue={j===0?'AI가 문제 상황과 기본 정책의 초안을 제안했다.':j===1?'한 기준만 사용하면 특정 로봇이 오래 기다리는 공정성 문제가 있었다.':j===2?'가중치 조정, 동점 처리, 입력 범위와 예외 처리를 직접 추가했다.':'실제 데이터가 바뀌어도 결과를 계산하고 검증할 수 있게 하기 위해서다.'}/></label>)}</div></details>)}</div>
      <div className="proof"><p className="eyebrow">MATHEMATICAL PROOF</p><h3>{robotCount}대의 로봇을 {chargerCount}대의 충전기에 배정하면 적어도 한 충전기에는 {ceil}대 이상의 로봇이 배정된다.</h3><ol><li>모든 충전기에 최대 <b>{Math.max(0,ceil-1)}대</b>만 배정된다고 가정합니다.</li><li>그러면 배정 가능한 로봇은 최대 <b>{chargerCount} × {Math.max(0,ceil-1)} = {proofCapacity}대</b>입니다.</li><li>하지만 실제 로봇은 <b>{robotCount}대</b>이고 {robotCount} &gt; {proofCapacity}이므로 모두 배정할 수 없습니다.</li><li>가정과 모순이므로 적어도 한 충전기에는 반드시 <b>{ceil}대 이상</b>이 배정됩니다.</li></ol><p className="proof-note">기본값 13대와 5대에서는 5 × 2 = 10 &lt; 13이므로 적어도 한 곳에 3대 이상이 배정됩니다.</p></div>
    </section>
    <div className="page-nav"><button className="secondary" disabled={pageIndex===0} onClick={()=>goPage(PAGES[pageIndex-1].id)}>← 이전</button><span><b>{pageIndex+1}</b> / {PAGES.length} · {PAGES[pageIndex].label}</span><button disabled={pageIndex===PAGES.length-1} onClick={()=>goPage(PAGES[pageIndex+1].id)}>다음 →</button></div>
    <footer><b>ROBO-LOG</b><span>고등학교 「인공지능을 위한 이산수학」 수행평가 교육 시뮬레이터</span><button onClick={()=>goPage('intro')}>처음으로 ↑</button></footer>
  </main>;
}

function SectionHead({n,tag,title,desc}:{n:string;tag:string;title:string;desc:string}){return <header className="section-head"><div><span>{n}</span><p>{tag}</p></div><h2>{title}</h2><p>{desc}</p></header>}
function Control({label,min,max,value,unit,onChange}:{label:string;min:number;max:number;value:number;unit:string;onChange:(n:number)=>void}){return <label className="control"><span>{label}<b>{value}{unit}</b></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}/><small>{min}{unit} — {max}{unit}</small></label>}

