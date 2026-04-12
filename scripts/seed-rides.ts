/**
 * Seed script: stakeholder demo — realistic ride data across every scenario.
 *
 * Three demo personas:
 *   Riley Bennett  (rider)       — rich history, upcoming signups, waitlisted
 *   Leo Marchetti  (ride_leader) — creates/leads/cancels rides, manages signups
 *   Alex Turner    (admin)       — creates rides with real Strava/RWGPS routes
 *
 * Usage: npx tsx scripts/seed-rides.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Persona IDs ────────────────────────────────────────────────────────────

const RILEY_ID = '8f8178fd-2aa4-4c09-85b3-b324d2dd1c93'; // rider
const LEO_ID = '75064912-ae78-48ac-8a20-6ca8071b2a07'; // ride_leader
const ALEX_ID = '5e00600f-7974-4051-93d9-470b6220ea30'; // admin

// ─── Helpers ────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function minutesFromNow(m: number): Date {
  return new Date(Date.now() + m * 60 * 1000);
}

function formatTime(h: number, m: number = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// ─── Real Routes (fetched from Alex's integrations) ─────────────────────────

const REAL_ROUTES = [
  {
    name: 'Red Bulb Espresso Loop',
    distance_km: 66.9,
    elevation_m: 329,
    url: 'https://www.strava.com/routes/3401245527053729724',
    source: 'strava' as const,
    polyline:
      'wncjGdyybNs@wCa[jIauCr`ApMvhAzBjE~N|JzEzXmu@zUuPnLwhCb}@_[wCob@pKeSl@aOvCeeAx^oZ}Ga^vEmLnEsL^}Q~IgTnB{WdUi|@{kG}GcYeX{lB_HqTib@gwC_YvE}Vt@iLjGsShDiiJnuA}a@oyCd~KwaB~VxArQkLnbFqv@bIvl@|E~JO`PxO~lAnFnSe@x]|BpRExPjJ|n@_@vQjEnM|EtG`BdJdvAxtJbNoDdSm@nb@qKpZ|Cr_Bmj@cGc[gJmSwEmXoOpGnOqGwE{Y`I{D_AePbb@aOxPiMdyBuq@vJmGlwAwb@r@vC',
  },
  {
    name: "SCBC >> Annina's Loop",
    distance_km: 79.9,
    elevation_m: 588,
    url: 'https://www.strava.com/routes/3404296934595228110',
    source: 'strava' as const,
    polyline:
      'swljGbm_cNbA]nByA~KwDlDnTh@|Bb@nAt@pAhAvAhApBVn@hAxDhCpJpChQwHpCcBh@}WhJ}E~AMEaCj@MVmPfGiIrCQEyAb@k@PKVsL~D_ANyAG{IyAiBQoDk@cAIk@@qAXmTtF}AZqGdB}@HqFTuIL}G|AiARQGgCl@e@XIP]Nc^`Mi@VgKpDmCt@sAx@eH`CiBd@_BHONeAEwBSqBk@sDyA}DqAqAYi@GqAIgB?[?UHkBXMEiEtA_Bb@cDd@uDr@q@GGIOGOHGNm@b@mAPwFtBa@HsANuG?iANmCnAuJjFyAb@]F}@?c@FkE@yAFu@H_BXkBp@k@Tq@b@oAdAcLhMwAbAm@\\cAXEUKMIk@Hj@GDQuAQYkDkVDy@UyAUgAWsBWk@wD}WeCqQg@aD?_@i@uEQUc@uE[eCFa@i@iDKQoCuSmGsb@BWs@iFO]oCgS?e@s@wFS_@uDqW@a@YoBc@kCSc@sBsO@g@k@mEu@mEq@sB_A}BUs@_BoIyDoX@]MgAa@gCWy@oF{^F_@MeAe@oCS]{D}Xy@uGgA}DaBuCa@gAa@mBW}AKSMu@}D{WsAyJyE{[cAoH@WcAgH[sBKQaI}h@aBuLFSs@wE}ARMPyJ~AgF~@qBPOG{@DwBJMLiJJMGq@?m@FsAPIPkAZkErCmAn@y@XsShDiEl@cDXiLfBUK{AVkAZSP{F~@u_ApNgU|DyGdAQGsBV}@LQNgCb@aWpD_TxCwPdCcJbBMAkDb@uAXKLeK|AqCVWEmAH}AXILkRjCQI}ATsATKPwVhDsBb@aKvAUOqBXi@HQPgRnCqAXuObCq@Ne@Bc@Gk@Se@c@Uc@g@k@]Qe@Gg@?e@FsL`BsM`BsP|B{Ed@q@?a@S]?KRk@h@o@H{U`DaInA{JnAyPnC}x@bLsS~C_BZqCZwJxA}@DaIhA_AFud@jGw[tEaZnEsBXmCR_NxBuGx@mDn@o@UwA}@sJaFe@c@a@u@eAiDSa@[c@WKW@c@FkAv@KXKt@WzF]lC?nARrBAb@GXMP_@JwGv@cPvBkZdEmBRe@mBO}@eCeQoMm`A_@_C_AaHs@sGqA{JtAqAf@u@xD_FvAoA^QfBc@jQiD`C[_Fi^kXmlBg@aB{D{WSkB_L}x@qLc}@pw@qWrQqFlE{AnHsBlAk@h@jAi@kAbJmCnE{AnPgFnBu@vHsBrmA{_@~\\mKboAi`@@b@lJ|q@xFf`@|Gvf@`EnXNXPt@p@lE~Hzi@bH`h@lJbo@jPoFba@cNbEqAbFiB|EoAf@|C`BvLbBdLzBlQ`BjKlJ{AdSuChGw@X?VFHFJ@JGHMn@YpHkAfFq@l@BFHJ?JCBI`A_@`MeBlALz@m@j]_Fre@gH`LwArCc@tw@eLxVuDlC_@pPmCpJqAbj@{I~m@oJbe@uGbAQ^AnAJpD|@tCZ~ANjBGzBQbAc@pAs@tB{AzBcC`Au@z@_@lA]`YgE~LsBdu@eLnIoA`Cc@bBWzr@}KhOwBhh@aI`Ek@pE|[\\~@`@z@`CxC~AlCz@rBPt@L|@D~@?|@G|@QtAKT_@rCWhCF`@A`ARdCjDzWVhAz@rGCt@r@vEFJvD`XRhBT~Cl@zC^vA~ArDh@nBVvBFrBCrBSrB[xODbBvBzPDt@?j@SdJBxAHlA`F~\\CZt@~ELPhAnHBlCKjB]nCAfAFnADVE\\RnA`AnCRH`AfD^|@`@l@n@l@L`@v@l@j@r@Xt@VdAf@jD`@rBjIzj@r@pFnKft@nAlGFh@GZ~@bGPPHx@tBpNx@xGhZluB\\vCGZd@pDNJj@~ElD|UCXLdAxAnJPPtIrj@CZ`@bClBk@LQhAS|G}AlJM`EUV?|@IpGeB|A[lTuFpAYj@AbAHnDj@hBPzIxAxAFp@I`@M~KwDPJvAe@l@WJUhIsClPgGRBzBm@LS|E_B|WiJbBi@vHqCqCiQiCqJiAyDWo@iAqBiAwAu@qAc@oAi@}BmDoT_LvDoBxAcA\\',
  },
  {
    name: 'U-Ville Hatchet',
    distance_km: 81.0,
    elevation_m: 458,
    url: 'https://www.strava.com/routes/3398372233630793062',
    source: 'strava' as const,
    polyline:
      'gtpiGdcfcNk@gE}@TkAaIA[B[AYeCiRiQhFqHbCeDbAuDjA_Bb@ge@fOmMlEm@ZuIdC_A`@q@bAmAnBg@j@]Xg@PBPoCkSyCwUmHcj@cBaNsHij@Ak@PeLQwBqAaJAYFe@VY~CkAaBmLNkAYgCFi@^SnKmDy@eGLCMBES}A{K?ODK`@QdMcEk@cEa@wJwG`@qCHgCQ]IyCc@{@GiE?aPc@{D?kFGyA[oDeBwFkCcASm@EKGGIIk@uHdCoBb@sAf@k@Vi@TaFtAgLxDwDjAuKlDyH~Ba_@xLWEiQpFmHrBSZeIdC}@RwObFeCn@yMdEaJlCkKhD{PdF}Dx@a@X]HwHhBqD|@[?cDz@uA\\CFaGxAmD~@eMvCcBZ{Cz@mKbCsEhAy@X{Dz@uCt@UK}A`@s@XQX{KtDgIlC}DxAmExA[IaGrBcCt@iEfAoFhBqPrG{DrAmCdAsC~@}JjD_A`@SPsTrIeF`B{KlEyC|@{DzAi^vM_RbHa@CeDfAiAb@SVkZhK_UpHwF|ByEdAyAl@OPcC~@_RnG}NvE}M~DQ?cAToCx@uI`DYVi@RqLdEcAj@oAx@_KzHaDlCsAr@}Al@Q\\',
  },
  {
    name: 'DHF | Oakville Danish Pastry House',
    distance_km: 78.7,
    elevation_m: 303,
    url: 'https://www.strava.com/routes/3378903247189826460',
    source: 'strava' as const,
    polyline:
      'eliiG`ptcN_@x@hBwB|KrHzFv\\|FtfAaFvk@eTja@oOpi@LnIqD`_@c@fV~AbSnEhP~AnQcKhGpBvWrE`N~VxY`Hh]zP`mAbl@gQpU`iBrSoGrJpt@~OuEtEvC~s@|kF}@|EpX{JbAqOrCmGnI@~E|B~GkBvEoPv{@b|@w[vf@|BtE`kAxqA~S`RjCzDuDfFaA|GxdAljAtJaS|LvMUeKjDuc@bCiFlExE~DrEaB~NDfO|BfCy@zBzGtHcK~j@pr@zw@`g@niBdTc\\zKz`@f^dj@vPdOdSfHrIpKzLrDl\\~a@vIjGfJ~_@jPtSxGtN`DfBlWg@nX|NjKtPw@rZzA`Dz}Au@`PcU~HpMxb@xe@bOaUdK~GeK_H|_A}wAwiGk~GeEeAsDbCii@hw@cm@}s@WsDjCsG_AmEyGvCqFvHwCfW}QrXamEw_FwDpH_Dnb@A`RkEdQ}vAk~AfA_HlDqEuCiE_TaR_kAyqA_CuEf\\mg@glAeoAm}@mtGu@oNeFwPqEcHsH{D}i@wEwa@iRqEcEwCkNmNaKbB}GkBqFmf@iPcGkIkCvH_LoSwCiP_Sgl@}Bok@pEwm@GiKnOqi@xKeSzDkSNaPrGmZoFw`A{Fw\\}KsHsDtC',
  },
  {
    name: 'BCC // U-Ville Shorty',
    distance_km: 61.2,
    elevation_m: 353,
    url: 'https://www.strava.com/routes/3376412608419019038',
    source: 'strava' as const,
    polyline:
      'gtpiGdcfcNk@gE}@TkAaIA[B[AYeCiRiQhFqHbCeDbAuDjA_Bb@kGrBTGo@_Fa@mCiCqSMi@YuBgBuNMyAGEeB{MMs@_A_HA[GYg@cEC?_@iDi@{DEe@EGc@{DiEq[yAoJGk@EIcDgUcCmSeBoLoBkN?OEYWAaIXeGb@mLl@sBNqCHgCQ]IyCc@{@GiE?aPc@{D?kFGyA[oDeBwFkCcASm@EKGGIIk@uHdCoBb@sAf@k@Vi@TaFtAgLxDwDjAuKlDyH~Ba_@xLWEiQpFmHrBSZeIdC}@RwObFeCn@yMdEaJlCkKhD{PdF}Dx@a@X',
  },
  {
    name: 'Cafe des Femmes 100km',
    distance_km: 104.1,
    elevation_m: 496,
    url: 'https://www.strava.com/routes/3344424768280684988',
    source: 'strava' as const,
    polyline:
      '{okiGn_tcNiA^fIlg@zz@sUtAsB|JfGjGp]nFv`AsGlZO`P{DjScKpQuO|h@yEh|@fArUsJzBq\\dc@sDFyDeCoOxAqUu@aGbBlY|vBnFjIhAbIg@`PuJhc@i@`RmDnQgJdOHrWcGlUkXxMp@xFgXbJh@xDkJ|JmVxl@mFz`@hA|P}@vJa]pi@iCrJzAlc@tBhNiGn@eBrIsDrBtErWtDfd@jKlXjKrmAdCdGjPdKgBtK}CzDk]bQnCtI~J~CxChFnBjGZtNfEdJxIvFp\\laAfWvi@bAdHmDjG}F@yBjB{F|Io@dHmEnJkMzK{P`^oFhDkPvC{CxVeClJwFdJjG`NbzAhgBfOt[hXz}@vRt\\nJjI|PpHr`AzhAnDlC~T~EtFlEvFhK|Grj@hOdZFpR~AvFic@np@p{@fbA|OoTzDcBCjIxEv_@qMb]i@bK~Gv]nPfWdDvB`Nt@~ExBjGiLb@sIlPxFlrAdxAnaAnnAntA|{A]}BfyByeDpwB`eCd|@krAdQig@bP}EdnAugBzBgA',
  },
  {
    name: 'BCC // X-town',
    distance_km: 41.0,
    elevation_m: 210,
    url: 'https://www.strava.com/routes/3288687821981921954',
    source: 'strava' as const,
    polyline:
      '{spiGxdfcNx@zFmBj@so@|SoByPky@xV_GfBi@JmH|BgNbEs@j@Wb@Ob@yHp`@qVnL_Av@k@x@gArCQKSz@@HIv@IpDp@hP?pBEnAR^U~AkArDw@rBu@|@g@`@WNTf@vBvCbKdKhBnBdFfHxEdH`@r@pA|KhA`I?l@v@~Jr@rGnDlXx@|Ft@dCR`@vAvBR`@~BfRpDdXJBFAdF{AJGLFFM`DgAdD_APa@xEz^@fA^tC\\hDZtBlEn^z@lJ|Fff@N|@nDbXpC~TdBjO|@pGpArLx@bIbBdObAjHr@bGbBjMpDpY`EbYrCvTh@`Dj@vEzCbUx@nFT|BfCzQx@xGvBnODj@`BjLFn@bC|PZAWmB}@_Gs@qFYHBXjC~QxBxPfA~IfBhMhAzIRt@l@vCbBvM`DjUv@`FzHdk@x@rGrBbOZ~CdHuBFpHElFCdUNnDXtDT`BfArFTvAh@rBl@hApBbFjJpSb@tAPOPY',
  },
  {
    name: 'Tuesday Nuclear',
    distance_km: 54.6,
    elevation_m: 363,
    url: 'https://ridewithgps.com/routes/54625038',
    source: 'ridewithgps' as const,
    polyline:
      'q_niGhnicNiCx@]oBsDnACWqAd@mAZkF|A_@aD}DaXkAqIk@kH]cFK}@SeAWaA{B_GK_@Ig@g@uDYoBmB}NcAkQy@{Gw@eFm@sEkBmMIuAGwBBmCc@gWgAoIiBqMK}B@iBwAoLM}DGiAOgAS{@}@wBYmAE[K{EkAg@gAc@gDuA[MeAo@_@[_JoKoBaC_CmCwEuFs@iAIOSc@sAgDaG}RSmAmAgKM}@oAmImC}QOyAEq@c@mOIqCMcDCm@S{Ec@oKA]OuDGsAOaBWyAqAkGsDoM]eAc@eAg@aAaAaBgBoCmPeXoCyEgBuCyImOi@aA{AcD}IaSmBiDkBwCaAmA_DqEOa@eLmPoByBq@q@w@q@kBqAcAm@oM{GmH}D_EsB{KeGyNwHwBeA_IgEeAm@gD{B{BcBy@y@kCwCqO_RkLaNiC_D~IsCtDqA`GkBxBu@bC_Ah@Op@MfAAh@DnCb@tDx@hAJjA@|@K^Md@UZWZ_@dAoBxAeCHUL]HKJWj@oC?MTUUT_Ar@BZ?v@Ex@M\\ITyAdCeAnB[^[Ve@T_@L}@JkAAiAKuDy@oCc@i@EgA@q@Li@NcC~@gIjCiFfBcEpAgA\\sAb@sPeSyNmQcDwDsHeJaCqCsL{N_NwOwCaDoEkFwFmGyFyGaRcTy@iAmFeGaIyIkByBwFiGyAgBoG}GkMgLoAmA}IeI_H_GeAaAyMwK{GaG_H{GsM{KmKsJwU{SwAuA{DeDgFwEkB}Am@eFaAyFa@gEiBwMi@wDWu@_Fs^oFq_@UmBaCuPgAqIwCuSq@mFFS_@eD{Fw`@i@gESEi@aEkA}HqEa\\oEq\\wBeOg@kEoE{ZiBaN}@gGKgAi@eEOu@Sa@_AeA_GgFsTgSkLkKsHcFG?IDGHsBfFi@lAc@r@_@b@g@\\aA\\w@\\c@\\o@`AiBzEoAxCY|@}@dDiAbGo@tBUj@iArBeApAu@n@u@b@o@Xk@PcAPeAFS?oAKwAEg@?e@De@FoAZe@N}Ap@?XFr@dF``@|AbLNx@DVHTXr@f@r@~BtBZ\\b@r@d@rAh@pDH\\lBq@h@[`@OrCu@nV}HtAc@hA]lIiChHaCjXqIrCy@`H_CT@lBk@`ClPpAvJNXx@bGBAhFf`@pE`\\jA|Hh@`EGPvAlK~El]RfALHp@lFvCtSfApI`CtPTlBnFp_@~Er^D|@hBrMd@xDvBlO\\lD|a@~^pRdQ`OhMdKlJx@x@hPdNnRtPxDpDzDhDLJx@x@jG~FrAxAhLvMhBhBpN~Ot@~@hQhSf@l@pEjFfHlI~CnDVXlUxWrF|G@@lDfE`HhI|RfVNLfDbEFFxOlRrJ`LdHrIfNfPlAtAz@x@`CpBzDdChHxDtHfEpDfBtJfFtEjCh@\\h@f@h@n@t@hA`AhAp@j@~@j@f@T`@LrAXpCd@rAZfAZhA`@tB`ApChBhA~@dBdBdAnAfLbPZR~CpE`AlAjBvClBhD|I`SzAbDh@`AxIlOfBtCnCxElPdXfBnC`A`Bf@`Ab@dA\\dArDnMpAjGVxAN`BFrANtD@\\b@nKRzEBl@LbDHpCb@lODp@NxAlC|QnAlIL|@lAfKRlA`G|RrAfDRb@HNr@hAvEtF~BlCnB`CpErFxBfCh@f@nAv@ZLfDtAfAd@jAd@BbCFvALt@Pr@|@vBVnAHp@HlEFx@lArIJbAL~FrCrS\\pCBrCXlPAbEBfALbCLhAfElYj@pEP`Ch@vJF~APhBZlB`@tD`@tCDX\\jBb@bDLx@J^h@Q',
  },
];

// ─── Content ────────────────────────────────────────────────────────────────

const RIDE_TITLES = [
  'Morning Espresso Loop',
  'Lakeshore Sunrise Ride',
  'Don Valley Classic',
  'Saturday Social Spin',
  'Humber River Out & Back',
  'Rouge Valley Ramble',
  'Scarborough Bluffs Blast',
  'Etobicoke Creek Roll',
  'Highland Creek Hustle',
  'Credit River Cruise',
  'Caledon Hills Crusher',
  'Halton Hills Gran Fondo',
  'Bronte Creek Loop',
  'Burlington Waterfront Ride',
  'Oakville Evening Hammerfest',
  'Port Credit Sunset Spin',
  'Leslie Spit Recon',
  'Tommy Thompson Loop',
  'Bayview Brevet Prep',
  'Lawrence Park Tempo',
  'Thornhill Tuesday Ride',
  'North York Chain Gang',
  'Richmond Hill Roaster',
  'Markham Morning Blast',
  'Ajax to Pickering Loop',
  "Frenchman's Bay Ride",
  'Aurora Dawn Patrol',
  'King City Kicker',
  'Peel Loop Recovery',
  'Dundas Valley Descent',
  'Hamilton Harbour Loop',
];

const START_LOCATIONS = [
  { name: 'High Park', address: '1873 Bloor St W, Toronto, ON', lat: 43.6465, lng: -79.4637 },
  {
    name: 'Evergreen Brick Works',
    address: '550 Bayview Ave, Toronto, ON',
    lat: 43.6853,
    lng: -79.359,
  },
  {
    name: 'Tommy Thompson Park',
    address: '1 Leslie St, Toronto, ON',
    lat: 43.6285,
    lng: -79.3363,
  },
  {
    name: 'Humber Bay Park East',
    address: '100 Humber Bay Park Rd E, Toronto, ON',
    lat: 43.6246,
    lng: -79.4695,
  },
  {
    name: 'Woodbine Beach',
    address: '1675 Lake Shore Blvd E, Toronto, ON',
    lat: 43.6595,
    lng: -79.3114,
  },
  {
    name: 'Sunnybrook Park',
    address: '1132 Leslie St, Toronto, ON',
    lat: 43.7201,
    lng: -79.3509,
  },
  { name: 'Cherry Beach', address: '1 Cherry St, Toronto, ON', lat: 43.638, lng: -79.3508 },
  {
    name: 'Ontario Place',
    address: '955 Lake Shore Blvd W, Toronto, ON',
    lat: 43.6283,
    lng: -79.4163,
  },
  {
    name: 'Earl Bales Park',
    address: '4169 Bathurst St, Toronto, ON',
    lat: 43.7558,
    lng: -79.4311,
  },
  {
    name: 'Centennial Park',
    address: '256 Centennial Park Rd, Etobicoke, ON',
    lat: 43.6454,
    lng: -79.5801,
  },
];

const COMMENTS = [
  'Great legs everyone — see you next week!',
  'That headwind on the return was brutal.',
  'Perfect conditions this morning.',
  "Who's bringing the coffee next time?",
  'Solid pace. Legs are toast.',
  'Really enjoyed the new route section.',
  'Thanks for the lead today — smooth pacing.',
  'The climb at km 38 nearly broke me.',
  'Good one today folks. Proper suffering.',
  'Legs felt surprisingly fresh.',
  'The regroup at the top was appreciated!',
  "Best ride of the month. Let's do it again.",
  'Thanks for waiting at the lights — great group.',
  'Weather held up perfectly.',
  'That last 10 km was a slog into the wind.',
  'Perfect amount of climbing today.',
  'See you all Saturday for the longer one.',
];

const CANCELLATION_REASONS = [
  'Heavy rain forecast for the morning — safety first.',
  'Strong winds and thunderstorm warning issued. Rescheduling next week.',
  'Ice on roads reported along the route. Cancelled for safety.',
  'Ride leader unavailable due to illness. See you next week.',
  'Air quality advisory in effect. Ride postponed.',
  'Severe weather warning in effect. Stay safe.',
];

const REACTION_TYPES = ['thumbs_up', 'fire', 'heart', 'cycling'] as const;

// ─── Types ──────────────────────────────────────────────────────────────────

type RideDef = {
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  ride_date: string;
  start_time: string;
  end_time: string;
  pace_group_id: string;
  distance_km: number;
  elevation_m: number;
  capacity: number | null;
  route_url: string;
  route_name: string;
  route_polyline: string | null;
  is_drop_ride: boolean;
  status: 'scheduled' | 'weather_watch' | 'completed' | 'cancelled';
  cancellation_reason?: string;
  weather_watch_auto?: boolean;
  start_location_name: string;
  start_location_address: string;
  start_latitude: number;
  start_longitude: number;
  // metadata for signup generation (not inserted)
  _tag?: string;
};

type SignupRow = {
  ride_id: string;
  user_id: string;
  status: string;
  signed_up_at: string;
  waitlist_position?: number;
  checked_in_at?: string;
  cancelled_at?: string;
};

type CommentRow = {
  ride_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type ReactionRow = {
  ride_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
};

type WeatherRow = {
  ride_id: string;
  temperature_c: number;
  feels_like_c: number;
  humidity: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  pop: number;
  precipitation_mm: number;
  weather_code: number;
  weather_main: string;
  weather_icon: string;
  is_day: boolean;
  source: string;
};

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Draftr Demo Seeder — Stakeholder Demo\n');

  // ── 1. Fetch club ─────────────────────────────────────────────────────────

  const { data: clubs, error: clubErr } = await supabase.from('clubs').select('id, name').limit(1);
  if (clubErr || !clubs?.length) {
    console.error('✗ No clubs found.');
    process.exit(1);
  }
  const clubId = clubs[0].id;
  console.log(`✓ Club: ${clubs[0].name}`);

  // ── 2. Validate personas ──────────────────────────────────────────────────

  const { data: personas, error: personaErr } = await supabase
    .from('club_memberships')
    .select('user_id, role, users(full_name)')
    .eq('club_id', clubId)
    .in('user_id', [RILEY_ID, LEO_ID, ALEX_ID]);

  if (personaErr || !personas || personas.length < 3) {
    console.error('✗ Missing demo personas. Need Riley, Leo, and Alex.');
    process.exit(1);
  }

  for (const p of personas) {
    const user = Array.isArray(p.users) ? p.users[0] : p.users;
    console.log(`✓ Persona: ${(user as { full_name: string })?.full_name} (${p.role})`);
  }

  // ── 3. Fetch all leaders + members ────────────────────────────────────────

  const { data: leaderMemberships } = await supabase
    .from('club_memberships')
    .select('user_id, role')
    .eq('club_id', clubId)
    .in('role', ['ride_leader', 'admin'])
    .eq('status', 'active');

  const leaderIds = (leaderMemberships ?? []).map((m) => m.user_id);
  // Leaders excluding Alex (for non-admin rides)
  const nonAdminLeaders = leaderIds.filter((id) => id !== ALEX_ID);

  const { data: allMemberships } = await supabase
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('status', 'active');

  const allUserIds = (allMemberships ?? []).map((m) => m.user_id);
  // Other riders (exclude the 3 personas for controlled signup)
  const otherRiders = allUserIds.filter((id) => id !== RILEY_ID && id !== LEO_ID && id !== ALEX_ID);

  console.log(`✓ Leaders: ${leaderIds.length} | Members: ${allUserIds.length}`);

  // ── 4. Fetch pace groups ──────────────────────────────────────────────────

  const { data: paceGroups } = await supabase
    .from('pace_groups')
    .select('id, name')
    .eq('club_id', clubId)
    .order('sort_order');

  if (!paceGroups?.length) {
    console.error('✗ No pace groups found.');
    process.exit(1);
  }
  console.log(`✓ Pace groups: ${paceGroups.map((p) => p.name).join(', ')}`);

  // ── 5. Wipe existing rides ────────────────────────────────────────────────

  // Also wipe ride_leaders (not always cascaded)
  const { error: leaderDelErr } = await supabase
    .from('ride_leaders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (leaderDelErr) console.warn('⚠ ride_leaders delete:', leaderDelErr.message);

  const { count: deletedCount, error: deleteErr } = await supabase
    .from('rides')
    .delete({ count: 'exact' })
    .eq('club_id', clubId);

  if (deleteErr) {
    console.error('✗ Delete failed:', deleteErr.message);
    process.exit(1);
  }
  console.log(`\n✓ Cleanup: deleted ${deletedCount ?? 0} existing rides (+ cascaded data)\n`);

  // ── 6. Build ride definitions ─────────────────────────────────────────────

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const rideDefs: RideDef[] = [];

  function makeRide(
    overrides: Partial<RideDef> & {
      created_by: string;
      ride_date: string;
      status: RideDef['status'];
    },
  ): RideDef {
    const route = pick(REAL_ROUTES);
    const loc = pick(START_LOCATIONS);
    return {
      club_id: clubId,
      title: pick(RIDE_TITLES),
      description: null,
      start_time: pick(['06:30:00', '07:00:00', '07:30:00', '08:00:00', '08:30:00', '09:00:00']),
      end_time: pick(['09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '12:00:00']),
      pace_group_id: pick(paceGroups).id,
      distance_km: route.distance_km,
      elevation_m: route.elevation_m,
      capacity: pick([null, null, 12, 15, 18, 20, 25]),
      route_url: route.url,
      route_name: route.name,
      route_polyline: route.polyline,
      is_drop_ride: Math.random() < 0.15,
      weather_watch_auto: false,
      start_location_name: loc.name,
      start_location_address: loc.address,
      start_latitude: loc.lat,
      start_longitude: loc.lng,
      ...overrides,
    };
  }

  // ── DISTANT PAST — completed rides (8 rides, 30-90 days ago) ──────────
  for (let i = 0; i < 8; i++) {
    rideDefs.push(
      makeRide({
        created_by: pick(nonAdminLeaders),
        ride_date: formatDate(addDays(today, -randInt(30, 90))),
        status: 'completed',
        _tag: 'distant_past',
      }),
    );
  }

  // ── RECENT PAST — completed rides last week (6 rides) ─────────────────
  for (let i = 0; i < 6; i++) {
    rideDefs.push(
      makeRide({
        created_by: i < 3 ? LEO_ID : pick(nonAdminLeaders),
        ride_date: formatDate(addDays(today, -randInt(2, 8))),
        status: 'completed',
        _tag: 'recent_past',
      }),
    );
  }

  // ── LEO's CANCELLED RIDE — recent past ────────────────────────────────
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(addDays(today, -randInt(3, 10))),
      status: 'cancelled',
      cancellation_reason: 'Ride leader unavailable due to illness. See you next week.',
      _tag: 'leo_cancelled',
    }),
  );

  // ── PAST CANCELLED — weather (3 rides) ────────────────────────────────
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, -randInt(5, 30))),
      status: 'cancelled',
      cancellation_reason: 'Heavy rain forecast for the morning — safety first.',
      _tag: 'weather_cancelled_past',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, -randInt(10, 40))),
      status: 'cancelled',
      cancellation_reason: 'Strong winds and thunderstorm warning issued. Rescheduling next week.',
      _tag: 'weather_cancelled_past',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, -randInt(15, 50))),
      status: 'cancelled',
      cancellation_reason: 'Ice on roads reported along the route. Cancelled for safety.',
      _tag: 'weather_cancelled_past',
    }),
  );

  // ── ALEX's PAST RIDES with real routes (4 rides) ──────────────────────
  const alexRoutes = [...REAL_ROUTES]; // use them all
  for (let i = 0; i < 4; i++) {
    const route = alexRoutes[i % alexRoutes.length];
    rideDefs.push(
      makeRide({
        created_by: ALEX_ID,
        ride_date: formatDate(addDays(today, -randInt(5, 60))),
        status: 'completed',
        route_url: route.url,
        route_name: route.name,
        route_polyline: route.polyline,
        distance_km: route.distance_km,
        elevation_m: route.elevation_m,
        _tag: 'alex_past',
      }),
    );
  }

  // ── IN PROGRESS — started within the last hour (2 rides) ──────────────
  const ipStartH = Math.max(currentHour - 1, 5);
  const ipStartM = currentMinute > 30 ? 0 : 30;
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(today),
      start_time: formatTime(ipStartH, ipStartM),
      end_time: formatTime(Math.min(ipStartH + 3, 23), 0),
      status: 'scheduled',
      capacity: 20,
      _tag: 'in_progress',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(today),
      start_time: formatTime(Math.max(ipStartH - 1, 5), 30),
      end_time: formatTime(Math.min(ipStartH + 2, 23), 30),
      status: 'scheduled',
      capacity: 15,
      is_drop_ride: true,
      _tag: 'in_progress',
    }),
  );

  // ── ABOUT TO START — within 30-60 minutes (1 ride) ────────────────────
  const aboutToStartTime = minutesFromNow(45);
  const atsH = aboutToStartTime.getHours();
  const atsM = aboutToStartTime.getMinutes() < 30 ? 0 : 30;
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(today),
      start_time: formatTime(atsH, atsM),
      end_time: formatTime(Math.min(atsH + 3, 23), 0),
      status: 'scheduled',
      capacity: 18,
      _tag: 'about_to_start',
    }),
  );

  // ── UPCOMING TODAY — later this afternoon/evening (2 rides) ───────────
  const laterHour = Math.max(currentHour + 3, 17);
  rideDefs.push(
    makeRide({
      created_by: ALEX_ID,
      ride_date: formatDate(today),
      start_time: formatTime(laterHour, 0),
      end_time: formatTime(Math.min(laterHour + 2, 23), 30),
      status: 'scheduled',
      route_url: REAL_ROUTES[4].url,
      route_name: REAL_ROUTES[4].name,
      route_polyline: REAL_ROUTES[4].polyline,
      _tag: 'today_later',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(today),
      start_time: formatTime(Math.min(laterHour + 1, 21), 30),
      end_time: formatTime(Math.min(laterHour + 3, 23), 0),
      status: 'scheduled',
      _tag: 'today_later',
    }),
  );

  // ── UPCOMING THIS WEEK (6 rides, days 1-6) ────────────────────────────
  for (let d = 1; d <= 6; d++) {
    rideDefs.push(
      makeRide({
        created_by: d <= 2 ? LEO_ID : d <= 4 ? ALEX_ID : pick(nonAdminLeaders),
        ride_date: formatDate(addDays(today, d)),
        status: 'scheduled',
        _tag: 'this_week',
      }),
    );
  }

  // ── UPCOMING NEXT WEEK (5 rides, days 7-13) ───────────────────────────
  for (let d = 7; d <= 11; d++) {
    rideDefs.push(
      makeRide({
        created_by: d <= 8 ? LEO_ID : d <= 10 ? ALEX_ID : pick(nonAdminLeaders),
        ride_date: formatDate(addDays(today, d)),
        status: 'scheduled',
        _tag: 'next_week',
      }),
    );
  }

  // ── ALEX's FUTURE RIDES with real routes (3 rides) ────────────────────
  for (let i = 0; i < 3; i++) {
    const route = alexRoutes[(i + 4) % alexRoutes.length];
    rideDefs.push(
      makeRide({
        created_by: ALEX_ID,
        ride_date: formatDate(addDays(today, randInt(3, 14))),
        status: 'scheduled',
        route_url: route.url,
        route_name: route.name,
        route_polyline: route.polyline,
        distance_km: route.distance_km,
        elevation_m: route.elevation_m,
        _tag: 'alex_future',
      }),
    );
  }

  // ── FULL CAPACITY ride (Riley gets waitlisted) ────────────────────────
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(addDays(today, 3)),
      status: 'scheduled',
      capacity: 8,
      title: 'Saturday Social Spin',
      _tag: 'full_capacity_waitlist',
    }),
  );

  // ── WEATHER WATCH rides — 2-4 days out (3 rides) ──────────────────────
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, 2)),
      status: 'weather_watch',
      weather_watch_auto: true,
      _tag: 'weather_watch_rain',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(addDays(today, 3)),
      status: 'weather_watch',
      weather_watch_auto: true,
      _tag: 'weather_watch_wind',
    }),
  );
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, 4)),
      status: 'weather_watch',
      weather_watch_auto: true,
      _tag: 'weather_watch_rain',
    }),
  );

  // ── WEATHER CLEARED ride (was weather_watch, now scheduled) ───────────
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, 5)),
      status: 'scheduled', // cleared
      weather_watch_auto: false,
      _tag: 'weather_cleared',
    }),
  );

  // ── WEATHER CANCELLED ride — future ───────────────────────────────────
  rideDefs.push(
    makeRide({
      created_by: pick(nonAdminLeaders),
      ride_date: formatDate(addDays(today, -1)),
      status: 'cancelled',
      cancellation_reason: 'Severe thunderstorm warning — ride cancelled due to unsafe conditions.',
      _tag: 'weather_cancelled_recent',
    }),
  );

  // ── LEO's ride with many signups to manage ────────────────────────────
  rideDefs.push(
    makeRide({
      created_by: LEO_ID,
      ride_date: formatDate(addDays(today, 2)),
      status: 'scheduled',
      capacity: 20,
      title: 'Lakeshore Sunrise Ride',
      _tag: 'leo_manage_signups',
    }),
  );

  // ── DISTANT FUTURE rides (3-6 weeks out, 4 rides) ────────────────────
  for (const daysOut of [18, 25, 32, 40]) {
    rideDefs.push(
      makeRide({
        created_by: pick([...nonAdminLeaders, ALEX_ID]),
        ride_date: formatDate(addDays(today, daysOut)),
        status: 'scheduled',
        _tag: 'distant_future',
      }),
    );
  }

  // Strip _tag before insert
  const insertDefs = rideDefs.map(({ _tag, ...rest }) => rest);

  // ── 7. Insert rides ───────────────────────────────────────────────────────

  const { data: insertedRides, error: insertErr } = await supabase
    .from('rides')
    .insert(insertDefs)
    .select('id, status, ride_date, start_time, capacity, created_by');

  if (insertErr || !insertedRides) {
    console.error('✗ Failed to insert rides:', insertErr?.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${insertedRides.length} rides`);

  // Pair inserted rides with their tags for signup logic
  const taggedRides = insertedRides.map((ride, i) => ({
    ...ride,
    _tag: rideDefs[i]._tag ?? '',
    capacity: ride.capacity as number | null,
  }));

  // ── 8. Ride leaders (co-leaders) ──────────────────────────────────────────

  type RideLeaderRow = { ride_id: string; user_id: string };
  const rideLeaderRows: RideLeaderRow[] = [];

  for (const ride of taggedRides) {
    // Add a co-leader to ~40% of rides (different from creator)
    if (Math.random() < 0.4) {
      const coLeader = pick(leaderIds.filter((id) => id !== ride.created_by));
      if (coLeader) {
        rideLeaderRows.push({ ride_id: ride.id, user_id: coLeader });
      }
    }
  }

  if (rideLeaderRows.length > 0) {
    const { error: rlErr } = await supabase.from('ride_leaders').insert(rideLeaderRows);
    if (rlErr) console.warn('⚠ ride_leaders insert:', rlErr.message);
    else console.log(`✓ Co-leaders: ${rideLeaderRows.length} assigned`);
  }

  // ── 9. Signups, comments, reactions, weather ──────────────────────────────

  const signups: SignupRow[] = [];
  const comments: CommentRow[] = [];
  const reactions: ReactionRow[] = [];
  const weatherRows: WeatherRow[] = [];

  for (const ride of taggedRides) {
    const rideDate = new Date(ride.ride_date + 'T00:00:00');
    const isPast = rideDate < today;
    const isToday = rideDate.getTime() === today.getTime();
    const isFuture = rideDate > today;
    const isCompleted = ride.status === 'completed';
    const isCancelled = ride.status === 'cancelled';
    const cap = ride.capacity;

    // ── Helper: add persona signups ──────────────────────────────────────
    function addSignup(
      userId: string,
      status: string,
      opts: { waitlistPos?: number; checkedIn?: boolean; cancelledAt?: string } = {},
    ) {
      const signedUpAt = addDays(rideDate, -randInt(1, 10));
      const row: SignupRow = {
        ride_id: ride.id,
        user_id: userId,
        status,
        signed_up_at: signedUpAt.toISOString(),
      };
      if (opts.waitlistPos) row.waitlist_position = opts.waitlistPos;
      if (opts.checkedIn) row.checked_in_at = rideDate.toISOString();
      if (opts.cancelledAt) row.cancelled_at = opts.cancelledAt;
      signups.push(row);
    }

    // ── FULL CAPACITY + WAITLIST ride ────────────────────────────────────
    if (ride._tag === 'full_capacity_waitlist') {
      // Fill to capacity with other riders
      const fillers = pickN(otherRiders, (cap ?? 8) - 2); // -2 for Leo + Alex
      addSignup(LEO_ID, 'confirmed');
      addSignup(ALEX_ID, 'confirmed');
      for (const uid of fillers) addSignup(uid, 'confirmed');
      // Riley is waitlisted
      addSignup(RILEY_ID, 'waitlisted', { waitlistPos: 1 });
      // A couple more waitlisted
      const extraWait = pickN(
        otherRiders.filter((id) => !fillers.includes(id)),
        2,
      );
      extraWait.forEach((uid, i) => addSignup(uid, 'waitlisted', { waitlistPos: i + 2 }));
      continue;
    }

    // ── LEO's ride with many signups ─────────────────────────────────────
    if (ride._tag === 'leo_manage_signups') {
      addSignup(RILEY_ID, 'confirmed');
      addSignup(ALEX_ID, 'confirmed');
      const fillers = pickN(otherRiders, randInt(12, 16));
      for (const uid of fillers) addSignup(uid, 'confirmed');
      continue;
    }

    // ── PAST COMPLETED rides ────────────────────────────────────────────
    if (isPast && isCompleted) {
      const numRiders = randInt(8, Math.min(18, otherRiders.length));
      const riders = pickN(otherRiders, numRiders);
      let confirmed = 0;

      // Riley attends most past rides
      if (Math.random() < 0.85) {
        addSignup(RILEY_ID, 'checked_in', { checkedIn: true });
      }
      // Leo attends his rides + some others
      if (ride.created_by === LEO_ID || Math.random() < 0.5) {
        addSignup(LEO_ID, 'checked_in', { checkedIn: true });
      }
      // Alex rides occasionally
      if (ride.created_by === ALEX_ID || Math.random() < 0.4) {
        addSignup(ALEX_ID, 'checked_in', { checkedIn: true });
      }

      for (const uid of riders) {
        if (cap && confirmed >= cap) {
          addSignup(uid, 'waitlisted');
          continue;
        }
        const rand = Math.random();
        if (rand < 0.06) {
          addSignup(uid, 'cancelled', {
            cancelledAt: addDays(rideDate, -randInt(0, 2)).toISOString(),
          });
        } else {
          const st = Math.random() < 0.75 ? 'checked_in' : 'confirmed';
          addSignup(uid, st, { checkedIn: st === 'checked_in' });
          confirmed++;
        }
      }

      // Comments on ~70% completed rides
      if (Math.random() < 0.7) {
        const commenters = pickN([...riders, RILEY_ID, LEO_ID], randInt(1, 4));
        for (const uid of commenters) {
          const ts = new Date(rideDate.getTime() + randInt(1, 8) * 3600 * 1000);
          comments.push({
            ride_id: ride.id,
            user_id: uid,
            body: pick(COMMENTS),
            created_at: ts.toISOString(),
            updated_at: ts.toISOString(),
          });
        }
      }

      // Reactions on ~60% completed rides
      if (Math.random() < 0.6) {
        const reactors = pickN([...riders, RILEY_ID], randInt(2, 6));
        const used = new Set<string>();
        for (const uid of reactors) {
          const reaction = pick(REACTION_TYPES);
          const key = `${ride.id}:${uid}:${reaction}`;
          if (used.has(key)) continue;
          used.add(key);
          reactions.push({
            ride_id: ride.id,
            user_id: uid,
            reaction,
            created_at: new Date(rideDate.getTime() + randInt(1, 48) * 3600 * 1000).toISOString(),
          });
        }
      }
      continue;
    }

    // ── PAST CANCELLED rides ────────────────────────────────────────────
    if (isPast && isCancelled) {
      const riders = pickN(otherRiders, randInt(4, 10));
      // Riley was signed up for at least one cancelled ride
      if (ride._tag === 'weather_cancelled_recent' || Math.random() < 0.5) {
        addSignup(RILEY_ID, 'cancelled', { cancelledAt: rideDate.toISOString() });
      }
      if (ride.created_by === LEO_ID) {
        addSignup(LEO_ID, 'cancelled', { cancelledAt: rideDate.toISOString() });
      }
      for (const uid of riders) {
        addSignup(uid, 'cancelled', { cancelledAt: rideDate.toISOString() });
      }
      continue;
    }

    // ── IN-PROGRESS rides (today, started) ──────────────────────────────
    if (isToday && ride._tag === 'in_progress') {
      const riders = pickN(otherRiders, randInt(8, 14));
      addSignup(RILEY_ID, 'checked_in', { checkedIn: true });
      addSignup(LEO_ID, 'checked_in', { checkedIn: true });
      for (const uid of riders) {
        const checkedIn = Math.random() < 0.65;
        addSignup(uid, checkedIn ? 'checked_in' : 'confirmed', { checkedIn });
      }
      continue;
    }

    // ── ABOUT TO START ──────────────────────────────────────────────────
    if (ride._tag === 'about_to_start') {
      const riders = pickN(otherRiders, randInt(8, 14));
      addSignup(RILEY_ID, 'confirmed');
      addSignup(LEO_ID, 'confirmed');
      addSignup(ALEX_ID, 'confirmed');
      for (const uid of riders) addSignup(uid, 'confirmed');
      continue;
    }

    // ── WEATHER WATCH rides — seed weather snapshots ────────────────────
    if (ride._tag?.startsWith('weather_watch')) {
      const isRain = ride._tag === 'weather_watch_rain';
      weatherRows.push({
        ride_id: ride.id,
        temperature_c: randFloat(8, 14),
        feels_like_c: randFloat(5, 11),
        humidity: randInt(75, 95),
        wind_speed_kmh: isRain ? randFloat(15, 25) : randFloat(35, 55),
        wind_gust_kmh: isRain ? randFloat(25, 40) : randFloat(55, 80),
        pop: isRain ? randFloat(0.6, 0.9) : randFloat(0.2, 0.4),
        precipitation_mm: isRain ? randFloat(3, 12) : randFloat(0, 2),
        weather_code: isRain ? 61 : 71, // drizzle vs light snow (WMO)
        weather_main: isRain ? 'Rain' : 'Wind',
        weather_icon: isRain ? 'CloudRain' : 'Wind',
        is_day: true,
        source: 'open-meteo',
      });

      // Still add signups
      const riders = pickN(otherRiders, randInt(5, 10));
      addSignup(RILEY_ID, 'confirmed');
      if (ride.created_by === LEO_ID) addSignup(LEO_ID, 'confirmed');
      for (const uid of riders) addSignup(uid, 'confirmed');
      continue;
    }

    // ── FUTURE SCHEDULED rides ──────────────────────────────────────────
    if (isFuture || isToday) {
      const wantSignups = cap
        ? randInt(Math.floor(cap * 0.3), Math.floor(cap * 0.85))
        : randInt(3, 12);
      const riders = pickN(otherRiders, Math.min(wantSignups, otherRiders.length));

      // Riley signs up for most upcoming rides
      if (Math.random() < 0.75) addSignup(RILEY_ID, 'confirmed');
      // Leo signs up for rides he leads + some others
      if (ride.created_by === LEO_ID || Math.random() < 0.3) addSignup(LEO_ID, 'confirmed');
      // Alex signs up occasionally
      if (ride.created_by === ALEX_ID || Math.random() < 0.25) addSignup(ALEX_ID, 'confirmed');

      let confirmed = 0;
      for (const uid of riders) {
        if (cap && confirmed >= cap) {
          addSignup(uid, 'waitlisted', { waitlistPos: confirmed - cap + 1 });
        } else {
          addSignup(uid, 'confirmed');
          confirmed++;
        }
      }

      // Seed weather for rides within forecast range (good weather)
      if (isFuture && rideDate <= addDays(today, 7)) {
        weatherRows.push({
          ride_id: ride.id,
          temperature_c: randFloat(14, 22),
          feels_like_c: randFloat(12, 20),
          humidity: randInt(40, 65),
          wind_speed_kmh: randFloat(5, 18),
          wind_gust_kmh: randFloat(10, 25),
          pop: randFloat(0, 0.15),
          precipitation_mm: 0,
          weather_code: pick([0, 1, 2]), // clear, partly cloudy
          weather_main: pick(['Clear', 'Partly Cloudy', 'Mostly Sunny']),
          weather_icon: pick(['Sun', 'CloudSun', 'Sun']),
          is_day: true,
          source: 'open-meteo',
        });
      }
    }
  }

  // ── 10. Insert signups ────────────────────────────────────────────────────

  // Deduplicate signups (ride_id + user_id must be unique)
  const signupMap = new Map<string, SignupRow>();
  for (const s of signups) {
    const key = `${s.ride_id}:${s.user_id}`;
    if (!signupMap.has(key)) signupMap.set(key, s);
  }
  const dedupedSignups = [...signupMap.values()];

  if (dedupedSignups.length > 0) {
    // Insert in batches to avoid payload limits
    const BATCH = 200;
    for (let i = 0; i < dedupedSignups.length; i += BATCH) {
      const batch = dedupedSignups.slice(i, i + BATCH);
      const { error } = await supabase.from('ride_signups').insert(batch);
      if (error) {
        console.error(`✗ Signup batch ${i} failed:`, error.message);
      }
    }
    console.log(`✓ Signups:   ${dedupedSignups.length} inserted`);
  }

  // ── 11. Insert comments ───────────────────────────────────────────────────

  if (comments.length > 0) {
    const { error } = await supabase.from('ride_comments').insert(comments);
    if (error) console.error('✗ Comments failed:', error.message);
    else console.log(`✓ Comments:  ${comments.length} inserted`);
  }

  // ── 12. Insert reactions ──────────────────────────────────────────────────

  if (reactions.length > 0) {
    const { error } = await supabase.from('ride_reactions').insert(reactions);
    if (error) console.error('✗ Reactions failed:', error.message);
    else console.log(`✓ Reactions: ${reactions.length} inserted`);
  }

  // ── 13. Insert weather snapshots ──────────────────────────────────────────

  if (weatherRows.length > 0) {
    const { error } = await supabase.from('ride_weather_snapshots').insert(weatherRows);
    if (error) console.error('✗ Weather failed:', error.message);
    else console.log(`✓ Weather:   ${weatherRows.length} snapshots inserted`);
  }

  // ── 14. AUDIT — zero orphaned rides ───────────────────────────────────────

  console.log('\n─── Audit ──────────────────────────────────────────────────');

  const { data: orphans } = await supabase
    .from('rides')
    .select('id, title')
    .eq('club_id', clubId)
    .is('created_by', null);

  if (orphans && orphans.length > 0) {
    console.error(`✗ FAIL: ${orphans.length} rides with no created_by (orphaned)!`);
    orphans.forEach((r) => console.error(`    - ${r.id}: ${r.title}`));
    process.exit(1);
  }
  console.log('✓ All rides have a leader (created_by set)');

  // Verify Riley's coverage
  const { count: rileySignups } = await supabase
    .from('ride_signups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', RILEY_ID);
  console.log(`✓ Riley signups: ${rileySignups}`);

  const { count: rileyWaitlisted } = await supabase
    .from('ride_signups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', RILEY_ID)
    .eq('status', 'waitlisted');
  console.log(`✓ Riley waitlisted: ${rileyWaitlisted}`);

  // Verify Leo's created rides
  const { count: leoCreated } = await supabase
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', LEO_ID);
  console.log(`✓ Leo created rides: ${leoCreated}`);

  // Verify Alex's rides have polylines
  const { data: alexRides } = await supabase
    .from('rides')
    .select('id, route_name, route_polyline')
    .eq('created_by', ALEX_ID)
    .not('route_polyline', 'is', null);
  console.log(`✓ Alex rides with real routes: ${alexRides?.length ?? 0}`);

  // ── 15. Summary ───────────────────────────────────────────────────────────

  const completed = taggedRides.filter((r) => r.status === 'completed').length;
  const cancelled = taggedRides.filter((r) => r.status === 'cancelled').length;
  const weatherWatch = taggedRides.filter((r) => r.status === 'weather_watch').length;
  const todayCount = taggedRides.filter(
    (r) => new Date(r.ride_date + 'T00:00:00').getTime() === today.getTime(),
  ).length;
  const futureCount = taggedRides.filter((r) => new Date(r.ride_date + 'T00:00:00') > today).length;

  console.log('\n─── Summary ────────────────────────────────────────────────');
  console.log(`  Past completed:  ${completed}`);
  console.log(`  Past cancelled:  ${cancelled}`);
  console.log(`  Weather watch:   ${weatherWatch}`);
  console.log(`  Today (in-progress + upcoming): ${todayCount}`);
  console.log(`  Future:          ${futureCount}`);
  console.log(`  Total rides:     ${taggedRides.length}`);
  console.log(`  Total signups:   ${dedupedSignups.length}`);
  console.log(`  Total comments:  ${comments.length}`);
  console.log(`  Total reactions: ${reactions.length}`);
  console.log(`  Total weather:   ${weatherRows.length}`);
  console.log(`  Co-leaders:      ${rideLeaderRows.length}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log('✓ Done — ready for demo\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
