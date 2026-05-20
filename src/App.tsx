import React, { useState, useEffect, useRef } from "react";
import { FileText, Save, Download, Search, Plus, ArrowLeft, ChevronRight, ChevronLeft, Trash2, Eye, Zap, Database, Check as CheckIcon } from "lucide-react";

// ============================================================
// ELECTRICAL INSTALLATION CERTIFICATE SYSTEM
// Bambu.AI — BS 7671 IEE Wiring Regulations
// ============================================================

const BRAND = {
  green: "#1f7a3a",
  greenDark: "#155a2a",
  greenLight: "#e8f3ec",
  ink: "#0f1612",
  paper: "#fafaf7",
  rule: "#2c3e34",
};

// -------------------- Empty certificate template --------------------
const emptyCert = () => ({
  // PAGE 1 — header
  client_name: "",
  install_address: "",
  install_extent: "",
  install_type: "New", // New | Addition | Alteration
  design_departures: "",
  design_sig_1: "", design_date_1: "", design_name_1: "",
  design_sig_2: "", design_date_2: "", design_name_2: "",
  construction_departures: "",
  construction_sig: "", construction_date: "", construction_name: "",
  inspection_departures: "",
  inspection_sig: "", inspection_date: "", inspection_name: "",
  inspection_review_sig: "", inspection_review_date: "", inspection_review_name: "",

  // PAGE 2 — Design/Construction/Inspection box + Organisation + Supply
  dci_departures: "",
  dci_sig_inspector: "", dci_date_inspector: "", dci_name_inspector: "",
  dci_sig_qs: "", dci_date_qs: "", dci_name_qs: "",
  org_design1_name: "", org_design1_address: "", org_design1_reg: "", org_design1_branch: "",
  org_design2_name: "", org_design2_address: "", org_design2_reg: "", org_design2_branch: "",
  org_construction_name: "Bambu.AI", org_construction_address: "1119 Hessle Road", org_construction_reg: "16800263", org_construction_branch: "",
  org_inspection_name: "Bambu.AI", org_inspection_address: "1119 Hessle Road", org_inspection_reg: "16800263", org_inspection_branch: "",
  sys_TN_S: false, sys_TN_C_S: false, sys_TN_C: false, sys_TT: false, sys_IT: false,
  ac_conductors: "", dc_conductors: "",
  live_1ph_2w: false, live_1ph_3w: false, live_2ph_3w: false, live_3ph_3w: false, live_3ph_4w: false, live_other: false,
  live_2pole: false, live_3pole: false, live_other_2: false,
  nominal_voltage: "", nominal_freq: "", prospective_fault: "", external_ze: "", num_supplies: "",
  oc_type_bsen: "", oc_nominal_rating: "", oc_short_circuit: "",

  // PAGE 3 — Particulars of installation
  earth_supplier_facility: false,
  earth_type: "",
  earth_location: "",
  earth_install_electrode: "",
  earth_resistance_ra: "",
  earth_method: "",
  max_demand: "", protection_method: "",
  ms_type_bsen: "", ms_no_poles: "", ms_voltage_rating: "", ms_current_rating: "", ms_rcd_idn: "", ms_rcd_at_idn: "",
  supply_cond_material: "", supply_cond_csa: "",
  earth_cond_material: "", earth_cond_csa: "", earth_cond_continuity: false,
  meb_cond_material: "", meb_cond_csa: "", meb_cond_continuity: false,
  bond_water: false, bond_gas: false, bond_oil: false, bond_structural: false, bond_lightning: false, bond_other: false, bond_list_notes: false,
  comments: "",
  next_inspection: "",

  // PAGE 4 — Schedule of items inspected
  inspections: {}, // dynamic checkboxes

  // PAGE 5 — Schedule of items tested + instruments
  tests: {}, // dynamic checkboxes
  additional_page_nos: "",
  inst_serial: "",
  inst_efli: "",
  inst_insulation: "",
  inst_continuity: "",
  inst_rcd: "",
  inst_other: "N/A",

  // PAGE 6 — Distribution board details + circuit rows
  db_ref: "", db_zs: "", db_ka: "", db_main_switch_bsen: "", db_rating: "", db_supply_conductors: "", db_earth: "",
  db_location: "", db_supplied_from: "", db_no_phases: "", db_protective_device_bsen: "", db_protective_rating: "",
  circuits: Array.from({ length: 12 }, () => ({
    ref: "", designation: "", wiring_type: "", ref_method: "", num_points: "",
    live_mm: "", cpc_mm: "", max_disconnect: "",
    oc_type: "", oc_rating: "", oc_short_circuit: "",
    rcd_idn: "", max_ze: "",
    r1: "", rn: "", r2: "", r1r2: "", rs: "",
    ins_pp: "", ins_pn: "", ins_pe: "", ins_ne: "",
    polarity: "", measured_ze: "", at_idn: "", at_5idn: "",
  })),

  // PAGE 7 — wiring codes (reference only, no inputs)
});

// -------------------- Helpers --------------------
const initials = (name) => {
  if (!name) return "XX";
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0, 3) || "XX";
};

const ddmm = (d = new Date()) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
};

const generateCertNumber = async (operatorName) => {
  const today = ddmm();
  const init = initials(operatorName);
  let seq = 1;
  try {
    const result = await window.storage.list("cert:");
    if (result?.keys) {
      const todayPrefix = `cert:${today}-${init}-`;
      const todays = result.keys.filter(k => k.startsWith(todayPrefix));
      seq = todays.length + 1;
    }
  } catch (e) { /* ignore */ }
  return `${today}-${init}-${String(seq).padStart(3, "0")}`;
};

// -------------------- Inspection & Test item definitions --------------------
const INSPECTION_ITEMS = [
  { section: "PROTECTIVE MEASURES AGAINST ELECTRIC SHOCK", items: [] },
  { section: "Basic and fault protection", items: ["SELV", "PELV"] },
  { section: "Basic protection", items: ["Insulation of live parts", "Barriers and enclosures", "Obstacles", "Placing out of reach", "Double or Reinforced insulation"] },
  { section: "Fault Protection (Automatic disconnection of supply)", items: ["Presence of earthing conductors", "Presence of circuit protection conductors", "Presence of main equipotential conductors", "Presence of earthing arrangements for combined protective and functional purposes", "Presence of adequate arrangements for alternative sources(s), where applicable", "PELV (fault)", "Choice and setting of protective and monitoring devices"] },
  { section: "Non-conducting location", items: ["Absence of protective conductors"] },
  { section: "Earth free equipotential bonding", items: ["Presence of earth free equipotential bonding conductors"] },
  { section: "Electrical separation", items: ["For one item of current using equipment", "For more than one item of current using equipment"] },
  { section: "Additional protection (For use in controlled supervised conditions only)", items: ["Presence of residual current device(s)", "Presence of supplementary bonding conductors"] },
  { section: "Prevention of mutual detrimental influences", items: ["Proximity of non-electrical services and other influences", "Segregation of band I and band II circuits or band II insulation used", "Segregation of safety circuits"] },
  { section: "Identification", items: ["Presence of diagrams, instructions, circuit charts and similar information", "Presence of danger notices and other warning signs", "Labelling of protective devices, switches and terminals", "Identification of conductors"] },
  { section: "Cables and conductors", items: ["Selection of conductors for current-carrying capacity and volt drop", "Erection methods", "Routing of cables in prescribed zones", "Cables incorporating earthed armour or sheath or run in an earthed wiring system or protected against nails, screws and the like", "Additional protection by a 30mA RCD for cables concealed in walls", "Connection of conductors", "Presence of fire barriers, suitable seals and protection against thermal effects"] },
  { section: "General", items: ["Adequacy of access to switchgear and other equipment", "Presence and correct location of appropriate devices for isolation and switching", "Particular protective measures for special installations and locations", "Connection of single pole devices for protection or switching in phase conductors only", "Correct connection of accessories and equipment", "Presence of under voltage protective devices", "Selection of equipment and protective measures appropriate to external influences", "Selection of appropriate functional switching devices"] },
];

const TEST_ITEMS = [
  "External earth loop impedance, Ze",
  "Installation earth electrode resistance, Ra",
  "Continuity of protective conductors",
  "Continuity of ring circuit conductors",
  "Insulation resistance between live conductors",
  "Insulation resistance between live conductors and earth",
  "Protection by separation of circuits",
  "Basic protection against direct contact by barrier or enclosure provided during erection",
  "Insulation of non-conducting floors or walls",
  "Polarity",
  "Earth fault loop impedance Zs",
  "Verification of phase sequence",
  "Operation of residual current devices",
  "Functional testing of assemblies",
  "Verification of voltage drop",
];

const WIRING_CODES = [
  { code: "A", desc: "PVC/PVC CABLES" },
  { code: "B", desc: "PVC CABLES IN METALLIC CONDUIT" },
  { code: "C", desc: "PVC CABLES IN NON-METALIC CONDUIT" },
  { code: "D", desc: "PVC CABLES IN METALIC TRUNKING" },
  { code: "E", desc: "PVC CABLES IN NON-METALIC TRUNKING" },
  { code: "F", desc: "PVC/SWA CABLES" },
  { code: "G", desc: "XLPE/SWA CABLES" },
  { code: "H", desc: "MINERAL-INSULATED CABLES" },
  { code: "O", desc: "other please state" },
];

// ============================================================
// PDF Generation
// ============================================================
// ============================================================
// PDF Generation — uses browser's native print-to-PDF
// (no external libraries; works on any network)
// ============================================================

const escapeHtml = (s) => {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const tick = (b) => (b ? "✓" : "");

const buildCertificateHtml = (cert, certNumber) => {
  const e = escapeHtml;
  const today = new Date().toLocaleDateString("en-GB");

  // Inspection rows
  const inspectionHtml = INSPECTION_ITEMS
    .filter(s => s.items.length > 0)
    .map(sec => `
      <div class="ins-section">
        <div class="ins-title">${e(sec.section)}</div>
        ${sec.items.map(item => {
          const key = `${sec.section}__${item}`;
          const val = cert.inspections[key] || "";
          return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
        }).join("")}
      </div>
    `).join("");

  const testHtml = TEST_ITEMS.map(item => {
    const val = cert.tests[item] || "";
    return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
  }).join("");

  // Circuit rows
  const circuitRows = cert.circuits.map(row => `
    <tr>
      <td>${e(row.ref)}</td>
      <td class="designation">${e(row.designation)}</td>
      <td>${e(row.wiring_type)}</td>
      <td>${e(row.ref_method)}</td>
      <td>${e(row.num_points)}</td>
      <td>${e(row.live_mm)}</td>
      <td>${e(row.cpc_mm)}</td>
      <td>${e(row.max_disconnect)}</td>
      <td>${e(row.oc_type)}</td>
      <td>${e(row.oc_rating)}</td>
      <td>${e(row.oc_short_circuit)}</td>
      <td>${e(row.rcd_idn)}</td>
      <td>${e(row.max_ze)}</td>
      <td>${e(row.r1)}</td>
      <td>${e(row.rn)}</td>
      <td>${e(row.r2)}</td>
      <td>${e(row.r1r2)}</td>
      <td>${e(row.rs)}</td>
      <td>${e(row.ins_pp)}</td>
      <td>${e(row.ins_pn)}</td>
      <td>${e(row.ins_pe)}</td>
      <td>${e(row.ins_ne)}</td>
      <td>${e(row.polarity)}</td>
      <td>${e(row.measured_ze)}</td>
      <td>${e(row.at_idn)}</td>
      <td>${e(row.at_5idn)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Electrical Installation Certificate ${e(certNumber)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  @page landscape-page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 9pt; line-height: 1.25; }
  .page { page-break-after: always; padding: 0; position: relative; min-height: 270mm; }
  .page:last-child { page-break-after: auto; }
  .page-landscape { page: landscape-page; min-height: 190mm; }
  .header-bar { background: #1f7a3a; color: white; padding: 4px 8px; font-weight: bold; font-size: 9.5pt; letter-spacing: 0.5px; }
  .panel { background: #ececea; padding: 6px; border: 1px solid #c8c8c2; border-top: none; }
  .cell { border: 1px dashed #888; padding: 3px 5px; min-height: 16px; }
  .cell .label { font-size: 7pt; font-weight: bold; color: #444; display: block; margin-bottom: 1px; }
  .cell .value { font-size: 9pt; min-height: 11px; }
  .grid { display: grid; gap: 2px; margin-bottom: 2px; }
  .g2 { grid-template-columns: 1fr 1fr; }
  .g3 { grid-template-columns: 1fr 1fr 1fr; }
  .g4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .g-1-3 { grid-template-columns: 1fr 3fr; }
  .footer { position: absolute; bottom: 4mm; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7pt; font-style: italic; color: #555; padding: 0 4mm; }
  .title-block { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
  .logo { display: flex; align-items: center; gap: 8px; }
  .logo-mark { width: 32px; height: 32px; background: #1f7a3a; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14pt; border-radius: 3px; }
  .logo-text { font-weight: bold; font-size: 12pt; }
  .logo-sub { font-size: 7pt; color: #666; letter-spacing: 1px; }
  .title-box { border: 2px solid #1f7a3a; padding: 5px 10px; text-align: right; }
  .title-box h1 { margin: 0; color: #1f7a3a; font-size: 14pt; font-weight: bold; }
  .title-box .sub { font-size: 8pt; color: #333; margin-top: 2px; }
  .cert-num { font-size: 9pt; font-weight: bold; margin-top: 4px; }
  .sign-row { display: grid; grid-template-columns: 2fr 1fr 2fr 1fr; gap: 2px; margin-top: 2px; }
  .body-text { font-size: 7.5pt; padding: 3px 5px; line-height: 1.3; }
  .checkbox-line { display: flex; align-items: center; gap: 6px; padding: 2px 0; font-size: 8pt; }
  .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #555; text-align: center; line-height: 9px; font-weight: bold; font-size: 9pt; flex-shrink: 0; }
  .section-spacer { height: 4px; }
  /* Inspection page */
  .ins-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .ins-section { margin-bottom: 6px; break-inside: avoid; }
  .ins-title { font-weight: bold; font-size: 8pt; text-decoration: underline; margin-bottom: 2px; }
  .ins-row { display: grid; grid-template-columns: 26px 1fr; gap: 6px; padding: 2px 0; font-size: 8pt; align-items: center; }
  .ins-box { border: 1px solid #555; height: 16px; text-align: center; font-weight: bold; line-height: 14px; font-size: 8pt; padding: 0 2px; }
  .ins-label { line-height: 1.2; }
  /* Circuit table */
  .circuit-table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
  .circuit-table th { background: #e8f3ec; border: 1px solid #999; padding: 2px; font-weight: bold; vertical-align: middle; height: 72px; text-align: center; }
  .circuit-table th .rot { transform: rotate(-90deg); transform-origin: center; white-space: nowrap; display: inline-block; font-size: 6.5pt; }
  .circuit-table td { border: 1px solid #aaa; padding: 2px 3px; height: 18px; vertical-align: middle; text-align: center; font-size: 7pt; word-break: break-word; overflow: hidden; }
  .circuit-table td.designation { white-space: normal; font-size: 6.5pt; text-align: left; }
  /* Wiring codes */
  .codes-grid { display: grid; grid-template-columns: repeat(9, 1fr); border: 1px solid #999; }
  .code-cell { border: 1px solid #ccc; padding: 6px 4px; text-align: center; }
  .code-cell.head { background: #1f7a3a; color: white; font-weight: bold; padding: 4px; }
  .code-cell .letter { font-weight: bold; font-size: 11pt; }
  .code-cell .desc { font-size: 7pt; margin-top: 4px; }
  /* Legend */
  .legend { margin-top: 8px; }
  .legend-row { display: flex; gap: 6px; align-items: center; font-size: 7.5pt; margin-bottom: 2px; }
  .legend-box { width: 22px; text-align: center; border: 1px solid #555; font-weight: bold; padding: 1px; }
  .note-block { border: 1px dashed #888; padding: 5px 8px; margin-bottom: 3px; font-size: 7.5pt; line-height: 1.3; }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="title-block">
    <div class="logo">
      <div class="logo-mark">⚡</div>
      <div>
        <div class="logo-text">BAMBU.AI</div>
        <div class="logo-sub">ELECTRICAL INSTALLATION</div>
        <div class="cert-num">Certificate No: ${e(certNumber)}</div>
      </div>
    </div>
    <div class="title-box">
      <h1>ELECTRICAL INSTALLATION<br>CERTIFICATE</h1>
      <div class="sub">(Requirements for Electrical Installations – BS 7671<br>IEE Wiring Regulations)</div>
    </div>
  </div>

  <div class="header-bar">DETAILS OF THE CLIENT</div>
  <div class="panel">
    <div class="cell"><span class="label">Client / Address:</span><span class="value">${e(cert.client_name)}</span></div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">DETAILS OF THE INSTALLATION</div>
  <div class="panel">
    <div class="grid" style="grid-template-columns: 3fr 1fr;">
      <div class="cell"><span class="label">Address:</span><span class="value">${e(cert.install_address)}</span></div>
      <div class="cell"><span class="label">New</span><span class="value">${tick(cert.install_type === "New")}</span></div>
      <div class="cell" style="grid-row: span 3;"><span class="label">Extent of the installation covered by this Certificate:</span><span class="value">${e(cert.install_extent)}</span></div>
      <div class="cell"><span class="label">An Addition</span><span class="value">${tick(cert.install_type === "Addition")}</span></div>
      <div class="cell"><span class="label">An Alteration</span><span class="value">${tick(cert.install_type === "Alteration")}</span></div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">DESIGN</div>
  <div class="panel">
    <div class="body-text">I/We, being the person(s) responsible for the design of the electrical installation (as indicated by my/our signature(s) below), particulars of which are described above, having exercised reasonable skill and care when carrying out the design, hereby Certify that the design work for which I/We have been responsible is, to the best of my/our knowledge and belief, in accordance with BS 7671:2008 amended to N/A except for the departures, if any, detailed as follows:</div>
    <div class="cell"><span class="label">Details of departures from BS 7671, as amended (Regulations 120.3.120.4)</span><span class="value">${e(cert.design_departures)}</span></div>
    <div class="body-text">The extent of liability of the signatory/signatories is limited to the work described above as the subject of this certificate. For the DESIGN of the installation:</div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.design_sig_1)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.design_date_1)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.design_name_1)}</span></div>
      <div class="cell"><span class="label">Designer 1</span><span class="value"></span></div>
    </div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.design_sig_2)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.design_date_2)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.design_name_2)}</span></div>
      <div class="cell"><span class="label">Designer 2 **</span><span class="value"></span></div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">CONSTRUCTION</div>
  <div class="panel">
    <div class="body-text">I/We, being the person(s) responsible for the construction of the electrical installation, having exercised reasonable skill and care, hereby Certify that the construction work for which I/We have been responsible is, to the best of my/our knowledge and belief, in accordance with BS 7671:2008 amended to N/A except for the departures, if any, detailed as follows:</div>
    <div class="cell"><span class="label">Details of departures from BS 7671 (Regulations 120.3.120.4)</span><span class="value">${e(cert.construction_departures)}</span></div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.construction_sig)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.construction_date)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.construction_name)}</span></div>
      <div class="cell"><span class="label">Constructor</span><span class="value"></span></div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">INSPECTION AND TESTING</div>
  <div class="panel">
    <div class="body-text">I/We, being the person(s) responsible for the inspection and testing of the electrical installation, having exercised reasonable skill and care, hereby Certify that the inspection and testing work for which I/We have been responsible is, to the best of my/our knowledge and belief, in accordance with BS 7671:2008 amended to N/A except for the departures, if any, detailed as follows:</div>
    <div class="cell"><span class="label">Details of departures from BS 7671 (Regulations 120.3.120.4)</span><span class="value">${e(cert.inspection_departures)}</span></div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.inspection_sig)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.inspection_date)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.inspection_name)}</span></div>
      <div class="cell"><span class="label">INSPECTOR</span><span class="value"></span></div>
    </div>
    <div class="body-text" style="font-weight:bold;">Reviewed by</div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.inspection_review_sig)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.inspection_review_date)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.inspection_review_name)}</span></div>
      <div class="cell"><span class="label">Qualified Supervisor</span><span class="value"></span></div>
    </div>
  </div>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 1 of 7</span>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="header-bar">DESIGN, CONSTRUCTION, INSPECTION AND TESTING</div>
  <div class="panel">
    <div class="body-text"><em>* This box is to be completed only where the design, construction, inspection and testing have been the responsibility of one person.</em></div>
    <div class="body-text">I, being the person responsible for the design, construction, inspection and testing of the electrical installation, having exercised reasonable skill and care, hereby CERTIFY that the inspection and testing work for which I have been responsible is, to the best of my knowledge and belief, in accordance with BS 7671:2008 amended to N/A except for the departures, if any, detailed as follows:</div>
    <div class="cell"><span class="label">Details of departures from BS 7671 (Regulations 120.3.120.4)</span><span class="value">${e(cert.dci_departures)}</span></div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.dci_sig_inspector)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.dci_date_inspector)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.dci_name_inspector)}</span></div>
      <div class="cell"><span class="label">INSPECTOR</span><span class="value"></span></div>
    </div>
    <div class="body-text" style="font-weight:bold;">Reviewed by</div>
    <div class="sign-row">
      <div class="cell"><span class="label">Signature</span><span class="value">${e(cert.dci_sig_qs)}</span></div>
      <div class="cell"><span class="label">Date</span><span class="value">${e(cert.dci_date_qs)}</span></div>
      <div class="cell"><span class="label">Name (CAPITALS)</span><span class="value">${e(cert.dci_name_qs)}</span></div>
      <div class="cell"><span class="label">Qualified Supervisor</span><span class="value"></span></div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">PARTICULARS OF THE ORGANISATION(S) RESPONSIBLE FOR THE ELECTRICAL INSTALLATION</div>
  ${["design1", "design2", "construction", "inspection"].map(k => {
    const labels = { design1: "DESIGN (1) Organisation", design2: "DESIGN (2) Organisation", construction: "CONSTRUCTION Organisation", inspection: "INSPECTION & TESTING Organisation" };
    return `<div class="panel">
      <div class="grid" style="grid-template-columns: 1fr 3fr 2fr;">
        <div class="cell"><span class="label">${labels[k]}</span><span class="value">${e(cert[`org_${k}_name`])}</span></div>
        <div class="cell"><span class="label">Address</span><span class="value">${e(cert[`org_${k}_address`])}</span></div>
        <div>
          <div class="cell"><span class="label">Registration No.</span><span class="value">${e(cert[`org_${k}_reg`])}</span></div>
          <div class="cell"><span class="label">Branch number</span><span class="value">${e(cert[`org_${k}_branch`])}</span></div>
        </div>
      </div>
    </div>`;
  }).join('<div class="section-spacer"></div>')}

  <div class="section-spacer"></div>
  <div class="header-bar">SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS</div>
  <div class="panel">
    <div class="grid" style="grid-template-columns: 1fr 2fr 2fr;">
      <div>
        <div style="font-weight:bold;font-size:8pt;padding:2px;">System Types</div>
        ${[["TN-S","TN_S"],["TN-C-S","TN_C_S"],["TN-C","TN_C"],["TT","TT"],["IT","IT"]].map(([l,k]) => `<div class="checkbox-line"><span class="checkbox">${tick(cert[`sys_${k}`])}</span>${l}</div>`).join("")}
      </div>
      <div>
        <div style="font-weight:bold;font-size:8pt;padding:2px;">Number and types of live conductors</div>
        <div class="grid g2">
          <div class="cell"><span class="label">A.C.</span><span class="value">${e(cert.ac_conductors)}</span></div>
          <div class="cell"><span class="label">D.C.</span><span class="value">${e(cert.dc_conductors)}</span></div>
        </div>
        ${[["1-Phase 2 wire","live_1ph_2w"],["1-Phase 3 wire","live_1ph_3w"],["2-Phase 3 wire","live_2ph_3w"],["3-Phase 3 wire","live_3ph_3w"],["3-Phase 4 wire","live_3ph_4w"],["2 pole","live_2pole"],["3 pole","live_3pole"],["Other","live_other"]].map(([l,k]) => `<div class="checkbox-line"><span class="checkbox">${tick(cert[k])}</span>${l}</div>`).join("")}
      </div>
      <div>
        <div style="font-weight:bold;font-size:8pt;padding:2px;">Nature of supply Parameters</div>
        <div class="cell"><span class="label">Nominal Voltage U/Uo (Volts)</span><span class="value">${e(cert.nominal_voltage)}</span></div>
        <div class="cell"><span class="label">Nominal Frequency (Hz)</span><span class="value">${e(cert.nominal_freq)}</span></div>
        <div class="cell"><span class="label">Prospective fault current (kA)</span><span class="value">${e(cert.prospective_fault)}</span></div>
        <div class="cell"><span class="label">External Ze (Ohms)</span><span class="value">${e(cert.external_ze)}</span></div>
        <div class="cell"><span class="label">Number of supplies</span><span class="value">${e(cert.num_supplies)}</span></div>
      </div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">CHARACTERISTICS OF THE SUPPLY OVERCURRENT PROTECTIVE DEVICE</div>
  <div class="panel">
    <div class="grid g3">
      <div class="cell"><span class="label">Type BS/EN</span><span class="value">${e(cert.oc_type_bsen)}</span></div>
      <div class="cell"><span class="label">Nominal current rating (Amps)</span><span class="value">${e(cert.oc_nominal_rating)}</span></div>
      <div class="cell"><span class="label">Short circuit capacity (kA)</span><span class="value">${e(cert.oc_short_circuit)}</span></div>
    </div>
  </div>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 2 of 7</span>
  </div>
</div>

<!-- PAGE 3 -->
<div class="page">
  <div class="header-bar">PARTICULARS OF INSTALLATION AT THE ORIGIN</div>
  <div class="panel">
    <div style="font-weight:bold;font-size:8pt;">Means of earthing &nbsp;&nbsp;&nbsp; Details of installation Earth Electrode (where applicable)</div>
    <div class="grid g3">
      <div class="cell"><span class="label">Supplier's facility</span><span class="value">${tick(cert.earth_supplier_facility)}</span></div>
      <div class="cell"><span class="label">Type (e.g. rods, tape ect)</span><span class="value">${e(cert.earth_type)}</span></div>
      <div class="cell"><span class="label">Location</span><span class="value">${e(cert.earth_location)}</span></div>
      <div class="cell"><span class="label">Installation earth electrode</span><span class="value">${e(cert.earth_install_electrode)}</span></div>
      <div class="cell"><span class="label">Electrode resistance, RA (Ohms)</span><span class="value">${e(cert.earth_resistance_ra)}</span></div>
      <div class="cell"><span class="label">Method of measurement</span><span class="value">${e(cert.earth_method)}</span></div>
      <div class="cell"><span class="label">Maximum Demand (Load) Per phase (Amps)</span><span class="value">${e(cert.max_demand)}</span></div>
      <div class="cell" style="grid-column: span 2;"><span class="label">Method of protection against indirect contact</span><span class="value">${e(cert.protection_method)}</span></div>
    </div>
    <div style="font-weight:bold;font-size:8pt;margin-top:6px;">Main Switch or circuit-Breaker</div>
    <div class="grid" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;">
      <div class="cell"><span class="label">Type BSEN</span><span class="value">${e(cert.ms_type_bsen)}</span></div>
      <div class="cell"><span class="label">No. Of poles</span><span class="value">${e(cert.ms_no_poles)}</span></div>
      <div class="cell"><span class="label">Voltage rating (V)</span><span class="value">${e(cert.ms_voltage_rating)}</span></div>
      <div class="cell"><span class="label">Current rating (A)</span><span class="value">${e(cert.ms_current_rating)}</span></div>
      <div class="cell"><span class="label">RCD IΔn (mA)</span><span class="value">${e(cert.ms_rcd_idn)}</span></div>
      <div class="cell"><span class="label">RCD at IΔn (ms)</span><span class="value">${e(cert.ms_rcd_at_idn)}</span></div>
    </div>
    <div style="font-weight:bold;font-size:8pt;margin-top:6px;">Supply conductors</div>
    <div class="grid g2">
      <div class="cell"><span class="label">Conductor material</span><span class="value">${e(cert.supply_cond_material)}</span></div>
      <div class="cell"><span class="label">Conductor csa (mm²)</span><span class="value">${e(cert.supply_cond_csa)}</span></div>
    </div>
    <div style="font-weight:bold;font-size:8pt;margin-top:6px;">Earthing conductors</div>
    <div class="grid g3">
      <div class="cell"><span class="label">Conductor material</span><span class="value">${e(cert.earth_cond_material)}</span></div>
      <div class="cell"><span class="label">Conductor csa (mm²)</span><span class="value">${e(cert.earth_cond_csa)}</span></div>
      <div class="cell"><span class="label">Continuity check (✓) OK</span><span class="value">${tick(cert.earth_cond_continuity)}</span></div>
    </div>
    <div style="font-weight:bold;font-size:8pt;margin-top:6px;">Main equipotential bonding conductors</div>
    <div class="grid g3">
      <div class="cell"><span class="label">Conductor material</span><span class="value">${e(cert.meb_cond_material)}</span></div>
      <div class="cell"><span class="label">Conductor csa (mm²)</span><span class="value">${e(cert.meb_cond_csa)}</span></div>
      <div class="cell"><span class="label">Continuity check (✓) OK</span><span class="value">${tick(cert.meb_cond_continuity)}</span></div>
    </div>
    <div style="font-weight:bold;font-size:8pt;margin-top:6px;">Bonding of extraneous conductive parts (✓)</div>
    <div class="grid" style="grid-template-columns: repeat(7,1fr);">
      <div class="cell"><span class="label">Water service</span><span class="value">${tick(cert.bond_water)}</span></div>
      <div class="cell"><span class="label">Gas service</span><span class="value">${tick(cert.bond_gas)}</span></div>
      <div class="cell"><span class="label">Oil service</span><span class="value">${tick(cert.bond_oil)}</span></div>
      <div class="cell"><span class="label">Structural steel</span><span class="value">${tick(cert.bond_structural)}</span></div>
      <div class="cell"><span class="label">Lightning protection</span><span class="value">${tick(cert.bond_lightning)}</span></div>
      <div class="cell"><span class="label">Other services</span><span class="value">${tick(cert.bond_other)}</span></div>
      <div class="cell"><span class="label">List in report notes</span><span class="value">${tick(cert.bond_list_notes)}</span></div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">COMMENTS ON THE EXISTING INSTALLATION</div>
  <div class="panel" style="min-height:120px;">
    <div style="font-weight:bold;text-align:center;font-size:8pt;">Additional information and report notes</div>
    <div style="white-space:pre-wrap;font-size:9pt;padding:6px;">${e(cert.comments)}</div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">NEXT INSPECTION</div>
  <div class="panel">
    <div class="cell"><span class="label">I/We the designer(s), recommend that this installation is further inspected and tested after an interval of not more than</span><span class="value">${e(cert.next_inspection)}</span></div>
  </div>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 3 of 7</span>
  </div>
</div>

<!-- PAGE 4 -->
<div class="page">
  <div class="header-bar">SCHEDULE OF ITEMS INSPECTED</div>
  <div class="panel">
    <div class="ins-cols">
      <div>${INSPECTION_ITEMS.slice(0,9).filter(s=>s.items.length).map(sec => `
        <div class="ins-section">
          <div class="ins-title">${e(sec.section)}</div>
          ${sec.items.map(item => {
            const key = `${sec.section}__${item}`;
            const val = cert.inspections[key] || "";
            return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
          }).join("")}
        </div>`).join("")}</div>
      <div>${INSPECTION_ITEMS.slice(9).filter(s=>s.items.length).map(sec => `
        <div class="ins-section">
          <div class="ins-title">${e(sec.section)}</div>
          ${sec.items.map(item => {
            const key = `${sec.section}__${item}`;
            const val = cert.inspections[key] || "";
            return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
          }).join("")}
        </div>`).join("")}</div>
    </div>
    <div class="legend">
      <div class="legend-row"><div class="legend-box">✓</div><em>To indicate that an inspection or test has been carried out and the result is satisfactory</em></div>
      <div class="legend-row"><div class="legend-box">X</div><em>To indicate that an inspection or test has been carried out and the result was unsatisfactory</em></div>
      <div class="legend-row"><div class="legend-box">LIM</div><em>To indicate that an inspection or test has not been carried out following agreed limitations of inspection or testing</em></div>
      <div class="legend-row"><div class="legend-box">N/A</div><em>To indicate the inspection or test is not applicable</em></div>
      <div class="legend-row"><div class="legend-box">N/V</div><em>To indicate that details could not be verified</em></div>
    </div>
  </div>
  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 4 of 7</span>
  </div>
</div>

<!-- PAGE 5 -->
<div class="page">
  <div class="header-bar">SCHEDULE OF ITEMS TESTED</div>
  <div class="panel">
    <div class="ins-cols">
      <div>${TEST_ITEMS.slice(0, Math.ceil(TEST_ITEMS.length/2)).map(item => {
        const val = cert.tests[item] || "";
        return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
      }).join("")}</div>
      <div>${TEST_ITEMS.slice(Math.ceil(TEST_ITEMS.length/2)).map(item => {
        const val = cert.tests[item] || "";
        return `<div class="ins-row"><div class="ins-box">${e(val)}</div><div class="ins-label">${e(item)}</div></div>`;
      }).join("")}</div>
    </div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">SCHEDULE OF ADDITIONAL RECORDS (See attached schedule)</div>
  <div class="panel">
    <div class="body-text"><em>Note: Additional page(s) must be identified by the Electrical Installation Certificate serial number and page number(s).</em></div>
    <div class="cell"><span class="label">Page No(s)</span><span class="value">${e(cert.additional_page_nos)}</span></div>
  </div>

  <div class="section-spacer"></div>
  <div class="header-bar">TEST INSTRUMENTS USED</div>
  <div class="panel">
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">Instrument Serial No(s)</span></div><div class="cell"><span class="value">${e(cert.inst_serial)}</span></div></div>
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">Earth fault loop impedance</span></div><div class="cell"><span class="value">${e(cert.inst_efli)}</span></div></div>
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">Insulation resistance</span></div><div class="cell"><span class="value">${e(cert.inst_insulation)}</span></div></div>
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">Continuity</span></div><div class="cell"><span class="value">${e(cert.inst_continuity)}</span></div></div>
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">RCD</span></div><div class="cell"><span class="value">${e(cert.inst_rcd)}</span></div></div>
    <div class="grid g-1-3"><div class="cell" style="background:#f5f5f0;"><span class="label">Other</span></div><div class="cell"><span class="value">${e(cert.inst_other)}</span></div></div>
  </div>

  <div class="section-spacer"></div>
  <div style="text-align:center;font-weight:bold;font-size:9pt;margin-top:6px;">NOTES FOR RECIPIENT</div>
  <div style="text-align:center;font-weight:bold;font-size:9pt;margin-bottom:4px;">THIS CERTIFICATE IS A VALUABLE DOCUMENT AND SHOULD BE RETAINED FOR FUTURE REFERENCE</div>
  <div class="note-block">This safety certificate has been issued to confirm that the electrical installation work to which it relates has been designed, constructed and inspected and tested in accordance with British Standard 7671 (The IEE Wiring regulations).</div>
  <div class="note-block">You should have received an original Certificate and the contractor should have retained a duplicate Certificate. If you were the person ordering the work, but not the owner of the installation, you should pass this Certificate, or a full copy of it including the schedules immediately to the user.</div>
  <div class="note-block">The original certificate should be retained in a safe place and be shown to any person inspecting or undertaking further work on the electrical installation in the future. If you later vacate the property, this Certificate will demonstrate to the new owner that the electrical installation complied with the requirements of British Standard 7671 at the time the Certificate was issued.</div>
  <div class="note-block">For safety reasons, the electrical installation will need to be inspected at appropriate intervals by a competent person. The maximum time interval recommended before the next inspection is stated in the Certificate under "Next Inspection."</div>
  <div class="note-block">This Certificate is intended to be issued only for a new electrical installation or for new work associated with an alteration or addition to an existing installation. A "Periodic Inspection Report" should be issued for periodic inspection.</div>
  <div class="note-block" style="text-align:center;">The Certificate is only valid if a Schedule of Inspection of Test Results is appended.</div>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 5 of 7</span>
  </div>
</div>

<!-- PAGE 6 LANDSCAPE -->
<div class="page page-landscape">
  <div class="header-bar">DISTRIBUTION BOARD DETAILS</div>
  <div class="panel">
    <div class="grid" style="grid-template-columns: repeat(8, 1fr);">
      <div class="cell"><span class="label">DB ref.</span><span class="value">${e(cert.db_ref)}</span></div>
      <div class="cell"><span class="label">Zs at this board (Ω)</span><span class="value">${e(cert.db_zs)}</span></div>
      <div class="cell"><span class="label">If at this board (kA)</span><span class="value">${e(cert.db_ka)}</span></div>
      <div class="cell"><span class="label">Main switch type BSEN</span><span class="value">${e(cert.db_main_switch_bsen)}</span></div>
      <div class="cell"><span class="label">Rating (Amps)</span><span class="value">${e(cert.db_rating)}</span></div>
      <div class="cell"><span class="label">Supply conductors (mm²)</span><span class="value">${e(cert.db_supply_conductors)}</span></div>
      <div class="cell"><span class="label">Earth (mm²)</span><span class="value">${e(cert.db_earth)}</span></div>
      <div class="cell"><span class="label">No. Of phases</span><span class="value">${e(cert.db_no_phases)}</span></div>
      <div class="cell" style="grid-column: span 2;"><span class="label">Distribution board location</span><span class="value">${e(cert.db_location)}</span></div>
      <div class="cell" style="grid-column: span 2;"><span class="label">Supplied from</span><span class="value">${e(cert.db_supplied_from)}</span></div>
      <div class="cell" style="grid-column: span 2;"><span class="label">Supply protective device type BSEN</span><span class="value">${e(cert.db_protective_device_bsen)}</span></div>
      <div class="cell" style="grid-column: span 2;"><span class="label">Rating (Amps)</span><span class="value">${e(cert.db_protective_rating)}</span></div>
    </div>
  </div>

  <div class="header-bar" style="margin-top:4px;">CIRCUIT DETAILS &nbsp;&nbsp;&nbsp; TEST RESULTS</div>
  <table class="circuit-table">
    <thead>
      <tr>
        <th><span class="rot">Circuit Ref</span></th>
        <th><span class="rot">Circuit designation</span></th>
        <th><span class="rot">Type of wiring</span></th>
        <th><span class="rot">Ref method</span></th>
        <th><span class="rot">No. of points</span></th>
        <th><span class="rot">Live (mm²)</span></th>
        <th><span class="rot">cpc (mm²)</span></th>
        <th><span class="rot">Max Disc time (s)</span></th>
        <th><span class="rot">Type BS EN</span></th>
        <th><span class="rot">Rating (A)</span></th>
        <th><span class="rot">Short circ (kA)</span></th>
        <th><span class="rot">IΔn mA</span></th>
        <th><span class="rot">Max Ze Ω</span></th>
        <th><span class="rot">r₁</span></th>
        <th><span class="rot">rₙ</span></th>
        <th><span class="rot">r₂</span></th>
        <th><span class="rot">R₁+R₂</span></th>
        <th><span class="rot">Rₛ</span></th>
        <th><span class="rot">P/P MΩ</span></th>
        <th><span class="rot">P/N MΩ</span></th>
        <th><span class="rot">P/E MΩ</span></th>
        <th><span class="rot">N/E MΩ</span></th>
        <th><span class="rot">Polarity</span></th>
        <th><span class="rot">Meas Ze Ω</span></th>
        <th><span class="rot">At IΔn ms</span></th>
        <th><span class="rot">At 5×IΔn ms</span></th>
      </tr>
    </thead>
    <tbody>
      ${circuitRows}
    </tbody>
  </table>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 6 of 7</span>
  </div>
</div>

<!-- PAGE 7 -->
<div class="page">
  <div class="codes-grid">
    ${WIRING_CODES.map(wc => `<div class="code-cell head">${e(wc.code)}</div>`).join("")}
    ${WIRING_CODES.map(wc => `<div class="code-cell"><div class="desc">${e(wc.desc)}</div></div>`).join("")}
  </div>
  <div style="text-align:center;font-weight:bold;font-size:10pt;margin-top:8px;">CODES FOR TYPES OF WIRING</div>

  <div class="footer">
    <span>Report reference: ELECTRICAL INSTALLATION - BAMBU.AI - ${e(certNumber)}</span>
    <span>Page 7 of 7</span>
  </div>
</div>

</body>
</html>`;
};

// Download certificate as a self-contained HTML file
// The user opens it in any browser and prints to PDF (Ctrl/Cmd+P → Save as PDF)
// This avoids pop-up blockers entirely — it's a regular file download.
const generatePDF = async (cert, certNumber, filename) => {
  const html = buildCertificateHtml(cert, certNumber);

  // Add an auto-print script + nicer wrapper so opening the file is one click to save
  const wrapped = html.replace(
    "</body>",
    `<script>
       // Show a banner with a "Save as PDF" button at the top
       (function(){
         var bar = document.createElement('div');
         bar.id = 'savebar';
         bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1f7a3a;color:white;padding:10px 16px;font-family:Arial,sans-serif;font-size:14px;z-index:9999;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
         bar.innerHTML = '<span><strong>BAMBU.AI Certificate</strong> &nbsp; — &nbsp; ${certNumber}</span><span><button onclick="document.getElementById(\\'savebar\\').style.display=\\'none\\';window.print();setTimeout(function(){document.getElementById(\\'savebar\\').style.display=\\'flex\\';},500);" style="background:white;color:#1f7a3a;border:none;padding:6px 14px;border-radius:3px;font-weight:bold;cursor:pointer;font-size:13px;">📄 Save as PDF</button></span>';
         bar.querySelector('button').onclick = function(){
           bar.style.display = 'none';
           window.print();
           setTimeout(function(){ bar.style.display = 'flex'; }, 800);
         };
         document.body.insertBefore(bar, document.body.firstChild);
         document.body.style.paddingTop = '50px';
         var style = document.createElement('style');
         style.textContent = '@media print { #savebar { display: none !important; } body { padding-top: 0 !important; } }';
         document.head.appendChild(style);
       })();
     </script></body>`
  );

  // Create downloadable blob
  const blob = new Blob([wrapped], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Trigger download via temporary anchor
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${certNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Free memory after a moment
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { save: () => {} };
};

// ============================================================
// React UI
// ============================================================
export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | form | viewer
  const [cert, setCert] = useState(emptyCert());
  const [currentPage, setCurrentPage] = useState(1);
  const [savedCerts, setSavedCerts] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [operator, setOperator] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Load saved certs on mount
  useEffect(() => {
    (async () => {
      try {
        const keys = await window.storage.list("cert:");
        if (keys?.keys?.length) {
          const certs = [];
          for (const k of keys.keys) {
            try {
              const r = await window.storage.get(k);
              if (r?.value) certs.push({ key: k, ...JSON.parse(r.value) });
            } catch (e) { /* ignore */ }
          }
          certs.sort((a, b) => (a.certNumber || "").localeCompare(b.certNumber || ""));
          setSavedCerts(certs);
        }
        const op = await window.storage.get("settings:operator").catch(() => null);
        if (op?.value) setOperator(op.value);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const update = (path, value) => {
    setCert((prev) => {
      const next = { ...prev };
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateCircuit = (idx, field, value) => {
    setCert((prev) => {
      const circuits = [...prev.circuits];
      circuits[idx] = { ...circuits[idx], [field]: value };
      return { ...prev, circuits };
    });
  };

  const newCert = () => {
    setCert(emptyCert());
    setEditId(null);
    setCurrentPage(1);
    setView("form");
  };

  const saveCert = async () => {
    if (!operator) {
      showToast("Set operator name in dashboard first.");
      return;
    }
    let certNumber = editId || await generateCertNumber(operator);
    const record = {
      certNumber,
      operator,
      data: cert,
      client: cert.client_name || "(no client)",
      address: cert.install_address || "(no address)",
      created: editId ? (savedCerts.find(c => c.certNumber === editId)?.created || new Date().toISOString()) : new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    try {
      await window.storage.set(`cert:${certNumber}`, JSON.stringify(record));
      const keys = await window.storage.list("cert:");
      const certs = [];
      for (const k of keys.keys) {
        const r = await window.storage.get(k);
        if (r?.value) certs.push({ key: k, ...JSON.parse(r.value) });
      }
      certs.sort((a, b) => (a.certNumber || "").localeCompare(b.certNumber || ""));
      setSavedCerts(certs);
      setEditId(certNumber);
      showToast(`Saved ${certNumber}`);
    } catch (e) {
      showToast("Save failed: " + e.message);
    }
  };

  const downloadPDF = async () => {
    setPdfBusy(true);
    try {
      const certNumber = editId || await generateCertNumber(operator || "XX");
      const safeClient = (cert.client_name || "Client").replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Client";
      const filename = `${certNumber}__${safeClient}.html`;
      await generatePDF(cert, certNumber, filename);
      showToast(`Downloaded ${filename} — open it, then click 'Save as PDF'`);
    } catch (e) {
      console.error("Download error:", e);
      showToast("Download failed: " + (e.message || "unknown error"));
    } finally {
      setPdfBusy(false);
    }
  };

  const loadCert = (record) => {
    setCert(record.data);
    setEditId(record.certNumber);
    setCurrentPage(1);
    setView("form");
  };

  const deleteCert = async (certNumber) => {
    if (!confirm(`Delete certificate ${certNumber}? This cannot be undone.`)) return;
    try {
      await window.storage.delete(`cert:${certNumber}`);
      setSavedCerts(s => s.filter(c => c.certNumber !== certNumber));
      showToast(`Deleted ${certNumber}`);
    } catch (e) {
      showToast("Delete failed");
    }
  };

  const saveOperator = async (v) => {
    setOperator(v);
    try { await window.storage.set("settings:operator", v); } catch (e) {}
  };

  // Filter & sort by client name
  const filteredCerts = savedCerts
    .filter(c => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (c.client || "").toLowerCase().includes(q) ||
             (c.address || "").toLowerCase().includes(q) ||
             (c.certNumber || "").toLowerCase().includes(q) ||
             (c.operator || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (a.client || "").localeCompare(b.client || ""));

  // ============================================================
  // Styles
  // ============================================================
  const styles = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f4f1ea 0%, #ede8dc 100%)",
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: BRAND.ink,
    },
  };

  // Fonts: use system fallback stack (no external dependencies)

  if (loading) {
    return (
      <div style={styles.app}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", color: BRAND.green }}>
          LOADING ARCHIVE…
        </div>
      </div>
    );
  }

  // ====================== DASHBOARD ======================
  if (view === "dashboard") {
    return (
      <div style={styles.app}>
        <Toast message={toast} />
        <Header operator={operator} setOperator={saveOperator} />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.18em", color: BRAND.green, marginBottom: 8 }}>
                BAMBU.AI / CERTIFICATE ARCHIVE
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>
                Electrical Installation<br />Certificates
              </h1>
              <div style={{ marginTop: 10, color: "#6a6a60", fontSize: 14 }}>
                BS 7671 / IEE Wiring Regulations · {savedCerts.length} certificate{savedCerts.length === 1 ? "" : "s"} on file
              </div>
            </div>
            <button onClick={newCert} style={btnPrimary}>
              <Plus size={18} /> New certificate
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative", maxWidth: 420 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#999" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by client, address, cert number…"
                style={searchInput}
              />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
              SORTED BY CLIENT NAME
            </div>
          </div>

          {filteredCerts.length === 0 ? (
            <div style={emptyState}>
              <Database size={48} color={BRAND.green} style={{ opacity: 0.4 }} />
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 16 }}>No certificates yet</div>
              <div style={{ color: "#888", marginTop: 4 }}>Create your first certificate to begin the archive.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {filteredCerts.map(c => (
                <div key={c.certNumber} style={certCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: BRAND.green, letterSpacing: "0.12em" }}>
                        {c.certNumber}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.client}
                      </div>
                      <div style={{ fontSize: 13, color: "#777", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.address}
                      </div>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {new Date(c.created).toLocaleDateString("en-GB")} · {c.operator}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                    <button onClick={() => loadCert(c)} style={btnGhost}><Eye size={14} /> Open</button>
                    <button onClick={async () => {
                      try {
                        const safe = (c.client || "Client").replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Client";
                        const fn = `${c.certNumber}__${safe}.html`;
                        await generatePDF(c.data, c.certNumber, fn);
                        showToast(`Downloaded ${fn}`);
                      } catch (e) {
                        console.error("Download error:", e);
                        showToast("Download failed: " + (e.message || "unknown error"));
                      }
                    }} style={btnGhost}><Download size={14} /> Download</button>
                    <button onClick={() => deleteCert(c.certNumber)} style={{ ...btnGhost, marginLeft: "auto", color: "#a33" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ====================== FORM ======================
  const pages = ["Details", "Design/Construction", "Installation Origin", "Inspection", "Tested + Instruments", "Distribution Board", "Wiring Codes"];

  return (
    <div style={styles.app}>
      <Toast message={toast} />
      <Header operator={operator} setOperator={saveOperator} />
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(244,241,234,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BRAND.green}22` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setView("dashboard")} style={btnGhost}><ArrowLeft size={14} /> Archive</button>
            <div>
              <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: BRAND.green, letterSpacing: "0.12em" }}>
                {editId ? `EDITING · ${editId}` : "NEW CERTIFICATE"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                Page {currentPage} of 7 — {pages[currentPage - 1]}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveCert} style={btnSecondary}><Save size={14} /> Save</button>
            <button onClick={downloadPDF} disabled={pdfBusy} style={{ ...btnPrimary, opacity: pdfBusy ? 0.6 : 1, cursor: pdfBusy ? "wait" : "pointer" }}>
              <Download size={14} /> {pdfBusy ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
        {/* Page tabs */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 12px", display: "flex", gap: 4, overflowX: "auto" }}>
          {pages.map((p, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} style={{
              ...tabBtn,
              background: currentPage === i + 1 ? BRAND.green : "transparent",
              color: currentPage === i + 1 ? "white" : "#666",
              fontWeight: currentPage === i + 1 ? 600 : 500,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, opacity: 0.7, marginRight: 6 }}>0{i + 1}</span>
              {p}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <div style={formPaper}>
          {currentPage === 1 && <Page1 cert={cert} update={update} />}
          {currentPage === 2 && <Page2 cert={cert} update={update} />}
          {currentPage === 3 && <Page3 cert={cert} update={update} />}
          {currentPage === 4 && <Page4 cert={cert} update={update} />}
          {currentPage === 5 && <Page5 cert={cert} update={update} />}
          {currentPage === 6 && <Page6 cert={cert} update={update} updateCircuit={updateCircuit} />}
          {currentPage === 7 && <Page7 />}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ ...btnGhost, opacity: currentPage === 1 ? 0.3 : 1 }}>
            <ChevronLeft size={16} /> Previous
          </button>
          <button onClick={() => setCurrentPage(p => Math.min(7, p + 1))} disabled={currentPage === 7} style={{ ...btnGhost, opacity: currentPage === 7 ? 0.3 : 1 }}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================
function Header({ operator, setOperator }) {
  return (
    <header style={{ borderBottom: `1px solid ${BRAND.green}22`, background: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: BRAND.green, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
            <Zap size={20} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>BAMBU.AI</div>
            <div style={{ fontSize: 10, color: "#888", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>ELECTRICAL CERTIFICATION SYSTEM</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", color: "#888" }}>OPERATOR:</label>
          <input value={operator} onChange={e => setOperator(e.target.value)} placeholder="Your full name" style={{ ...searchInput, padding: "7px 10px", maxWidth: 180, fontSize: 13, paddingLeft: 10 }} />
          {operator && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: BRAND.green, padding: "4px 8px", background: BRAND.greenLight, borderRadius: 3 }}>{initials(operator)}</span>}
        </div>
      </div>
    </header>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", top: 80, right: 24, zIndex: 100,
      background: BRAND.ink, color: "white", padding: "12px 18px",
      borderRadius: 4, fontSize: 13, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 8,
      animation: "slideIn 0.2s ease-out",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    }}>
      <CheckIcon size={16} color={BRAND.green} />
      {message}
    </div>
  );
}

// ====================== Form pages ======================
const FormSection = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ background: BRAND.green, color: "white", padding: "10px 14px", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em" }}>
      {title}
    </div>
    <div style={{ background: "#f7f6f1", padding: 16, border: `1px solid ${BRAND.green}22`, borderTop: "none" }}>
      {children}
    </div>
  </div>
);

const Row = ({ children, cols }) => (
  <div style={{ display: "grid", gridTemplateColumns: cols || "1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>
);

const Field = ({ label, value, onChange, type = "text", placeholder, rows, hint }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
      {hint && <span style={{ marginLeft: 6, fontWeight: 400, color: "#999", textTransform: "none" }}>{hint}</span>}
    </span>
    {rows ? (
      <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={fieldInput} />
    ) : (
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={fieldInput} />
    )}
  </label>
);

const Check = ({ label, checked, onChange }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", border: `1px solid ${checked ? BRAND.green : "#ddd"}`, background: checked ? BRAND.greenLight : "white", borderRadius: 3, fontSize: 13, transition: "all 0.15s" }}>
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: BRAND.green }} />
    <span>{label}</span>
  </label>
);

const Radio = ({ label, name, value, current, onChange }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px", border: `1px solid ${value === current ? BRAND.green : "#ddd"}`, background: value === current ? BRAND.greenLight : "white", borderRadius: 3, fontSize: 13 }}>
    <input type="radio" name={name} checked={value === current} onChange={() => onChange(value)} style={{ accentColor: BRAND.green }} />
    {label}
  </label>
);

const SignBlock = ({ label, sig, date, name, onChange, prefix }) => (
  <div style={{ background: "white", padding: 12, border: "1px solid #e0ddd2", marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
    <Row cols="2fr 1fr 2fr">
      <Field label="Signature" value={sig} onChange={v => onChange(`${prefix}_sig`, v)} placeholder="Type name as signature" />
      <Field label="Date" value={date} onChange={v => onChange(`${prefix}_date`, v)} type="date" />
      <Field label="Name (CAPITALS)" value={name} onChange={v => onChange(`${prefix}_name`, v.toUpperCase())} />
    </Row>
  </div>
);

function Page1({ cert, update }) {
  return (
    <>
      <FormSection title="DETAILS OF THE CLIENT">
        <Field label="Client / Address" value={cert.client_name} onChange={v => update("client_name", v)} />
      </FormSection>

      <FormSection title="DETAILS OF THE INSTALLATION">
        <Field label="Address" value={cert.install_address} onChange={v => update("install_address", v)} />
        <div style={{ marginTop: 10 }}>
          <Field label="Extent of the installation covered by this Certificate" value={cert.install_extent} onChange={v => update("install_extent", v)} rows={3} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Radio name="install_type" label="New" value="New" current={cert.install_type} onChange={v => update("install_type", v)} />
          <Radio name="install_type" label="An Addition" value="Addition" current={cert.install_type} onChange={v => update("install_type", v)} />
          <Radio name="install_type" label="An Alteration" value="Alteration" current={cert.install_type} onChange={v => update("install_type", v)} />
        </div>
      </FormSection>

      <FormSection title="DESIGN">
        <Field label="Details of departures from BS 7671 (Regulations 120.3.120.4)" value={cert.design_departures} onChange={v => update("design_departures", v)} />
        <SignBlock label="Designer 1" sig={cert.design_sig_1} date={cert.design_date_1} name={cert.design_name_1} onChange={(k, v) => update(k.replace("design_sig", "design_sig_1").replace("design_date", "design_date_1").replace("design_name", "design_name_1"), v)} prefix="design" />
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature (Designer 1)" value={cert.design_sig_1} onChange={v => update("design_sig_1", v)} />
          <Field label="Date" value={cert.design_date_1} onChange={v => update("design_date_1", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.design_name_1} onChange={v => update("design_name_1", v.toUpperCase())} />
        </Row>
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature (Designer 2)" value={cert.design_sig_2} onChange={v => update("design_sig_2", v)} />
          <Field label="Date" value={cert.design_date_2} onChange={v => update("design_date_2", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.design_name_2} onChange={v => update("design_name_2", v.toUpperCase())} />
        </Row>
      </FormSection>

      <FormSection title="CONSTRUCTION">
        <Field label="Details of departures from BS 7671" value={cert.construction_departures} onChange={v => update("construction_departures", v)} />
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature (Constructor)" value={cert.construction_sig} onChange={v => update("construction_sig", v)} />
          <Field label="Date" value={cert.construction_date} onChange={v => update("construction_date", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.construction_name} onChange={v => update("construction_name", v.toUpperCase())} />
        </Row>
      </FormSection>

      <FormSection title="INSPECTION AND TESTING">
        <Field label="Details of departures from BS 7671" value={cert.inspection_departures} onChange={v => update("inspection_departures", v)} />
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature (Inspector)" value={cert.inspection_sig} onChange={v => update("inspection_sig", v)} />
          <Field label="Date" value={cert.inspection_date} onChange={v => update("inspection_date", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.inspection_name} onChange={v => update("inspection_name", v.toUpperCase())} />
        </Row>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginTop: 8, marginBottom: 6 }}>Reviewed by (Qualified Supervisor)</div>
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature" value={cert.inspection_review_sig} onChange={v => update("inspection_review_sig", v)} />
          <Field label="Date" value={cert.inspection_review_date} onChange={v => update("inspection_review_date", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.inspection_review_name} onChange={v => update("inspection_review_name", v.toUpperCase())} />
        </Row>
      </FormSection>
    </>
  );
}

function Page2({ cert, update }) {
  return (
    <>
      <FormSection title="DESIGN, CONSTRUCTION, INSPECTION AND TESTING (single-responsibility)">
        <Field label="Details of departures from BS 7671" value={cert.dci_departures} onChange={v => update("dci_departures", v)} />
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature (Inspector)" value={cert.dci_sig_inspector} onChange={v => update("dci_sig_inspector", v)} />
          <Field label="Date" value={cert.dci_date_inspector} onChange={v => update("dci_date_inspector", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.dci_name_inspector} onChange={v => update("dci_name_inspector", v.toUpperCase())} />
        </Row>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginTop: 8, marginBottom: 6 }}>Reviewed by (Qualified Supervisor)</div>
        <Row cols="2fr 1fr 2fr">
          <Field label="Signature" value={cert.dci_sig_qs} onChange={v => update("dci_sig_qs", v)} />
          <Field label="Date" value={cert.dci_date_qs} onChange={v => update("dci_date_qs", v)} type="date" />
          <Field label="Name (CAPITALS)" value={cert.dci_name_qs} onChange={v => update("dci_name_qs", v.toUpperCase())} />
        </Row>
      </FormSection>

      <FormSection title="PARTICULARS OF THE ORGANISATION(S) RESPONSIBLE">
        {["design1", "design2", "construction", "inspection"].map(key => {
          const labels = { design1: "DESIGN (1)", design2: "DESIGN (2)", construction: "CONSTRUCTION", inspection: "INSPECTION & TESTING" };
          return (
            <div key={key} style={{ background: "white", padding: 12, marginBottom: 10, border: "1px solid #e0ddd2" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{labels[key]} Organisation</div>
              <Row cols="2fr 3fr">
                <Field label="Organisation Name" value={cert[`org_${key}_name`]} onChange={v => update(`org_${key}_name`, v)} />
                <Field label="Address" value={cert[`org_${key}_address`]} onChange={v => update(`org_${key}_address`, v)} />
              </Row>
              <Row>
                <Field label="Registration No." value={cert[`org_${key}_reg`]} onChange={v => update(`org_${key}_reg`, v)} />
                <Field label="Branch Number" value={cert[`org_${key}_branch`]} onChange={v => update(`org_${key}_branch`, v)} />
              </Row>
            </div>
          );
        })}
      </FormSection>

      <FormSection title="SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS">
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Types</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {["TN_S", "TN_C_S", "TN_C", "TT", "IT"].map(k => (
            <Check key={k} label={k.replace(/_/g, "-")} checked={cert[`sys_${k}`]} onChange={v => update(`sys_${k}`, v)} />
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Number and types of live conductors</div>
        <Row cols="1fr 1fr">
          <Field label="A.C." value={cert.ac_conductors} onChange={v => update("ac_conductors", v)} />
          <Field label="D.C." value={cert.dc_conductors} onChange={v => update("dc_conductors", v)} />
        </Row>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          <Check label="1-Phase 2 wire" checked={cert.live_1ph_2w} onChange={v => update("live_1ph_2w", v)} />
          <Check label="1-Phase 3 wire" checked={cert.live_1ph_3w} onChange={v => update("live_1ph_3w", v)} />
          <Check label="2-Phase 3 wire" checked={cert.live_2ph_3w} onChange={v => update("live_2ph_3w", v)} />
          <Check label="3-Phase 3 wire" checked={cert.live_3ph_3w} onChange={v => update("live_3ph_3w", v)} />
          <Check label="3-Phase 4 wire" checked={cert.live_3ph_4w} onChange={v => update("live_3ph_4w", v)} />
          <Check label="2 pole" checked={cert.live_2pole} onChange={v => update("live_2pole", v)} />
          <Check label="3 pole" checked={cert.live_3pole} onChange={v => update("live_3pole", v)} />
          <Check label="Other" checked={cert.live_other} onChange={v => update("live_other", v)} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nature of supply parameters</div>
        <Row cols="1fr 1fr 1fr">
          <Field label="Nominal Voltage U/Uo" value={cert.nominal_voltage} onChange={v => update("nominal_voltage", v)} hint="Volts" />
          <Field label="Nominal Frequency" value={cert.nominal_freq} onChange={v => update("nominal_freq", v)} hint="Hz" />
          <Field label="Prospective fault current" value={cert.prospective_fault} onChange={v => update("prospective_fault", v)} hint="kA" />
        </Row>
        <Row cols="1fr 1fr">
          <Field label="External Ze" value={cert.external_ze} onChange={v => update("external_ze", v)} hint="Ohms" />
          <Field label="Number of supplies" value={cert.num_supplies} onChange={v => update("num_supplies", v)} />
        </Row>
      </FormSection>

      <FormSection title="CHARACTERISTICS OF THE SUPPLY OVERCURRENT PROTECTIVE DEVICE">
        <Row cols="1fr 1fr 1fr">
          <Field label="Type BS/EN" value={cert.oc_type_bsen} onChange={v => update("oc_type_bsen", v)} />
          <Field label="Nominal current rating" value={cert.oc_nominal_rating} onChange={v => update("oc_nominal_rating", v)} hint="Amps" />
          <Field label="Short circuit capacity" value={cert.oc_short_circuit} onChange={v => update("oc_short_circuit", v)} hint="kA" />
        </Row>
      </FormSection>
    </>
  );
}

function Page3({ cert, update }) {
  return (
    <>
      <FormSection title="PARTICULARS OF INSTALLATION AT THE ORIGIN — Means of earthing">
        <div style={{ marginBottom: 10 }}>
          <Check label="Supplier's facility" checked={cert.earth_supplier_facility} onChange={v => update("earth_supplier_facility", v)} />
        </div>
        <Row cols="1fr 1fr 1fr">
          <Field label="Type (e.g. rods, tape etc)" value={cert.earth_type} onChange={v => update("earth_type", v)} />
          <Field label="Location" value={cert.earth_location} onChange={v => update("earth_location", v)} />
          <Field label="Installation earth electrode" value={cert.earth_install_electrode} onChange={v => update("earth_install_electrode", v)} />
        </Row>
        <Row cols="1fr 1fr">
          <Field label="Electrode resistance, RA" value={cert.earth_resistance_ra} onChange={v => update("earth_resistance_ra", v)} hint="Ohms" />
          <Field label="Method of measurement" value={cert.earth_method} onChange={v => update("earth_method", v)} />
        </Row>
        <Row cols="1fr 2fr">
          <Field label="Maximum Demand (Load) Per phase" value={cert.max_demand} onChange={v => update("max_demand", v)} hint="Amps" />
          <Field label="Method of protection against indirect contact" value={cert.protection_method} onChange={v => update("protection_method", v)} />
        </Row>
      </FormSection>

      <FormSection title="Main Switch or Circuit-Breaker">
        <Row cols="1fr 1fr 1fr 1fr">
          <Field label="Type BSEN" value={cert.ms_type_bsen} onChange={v => update("ms_type_bsen", v)} />
          <Field label="No. Of poles" value={cert.ms_no_poles} onChange={v => update("ms_no_poles", v)} />
          <Field label="Voltage rating" value={cert.ms_voltage_rating} onChange={v => update("ms_voltage_rating", v)} hint="V" />
          <Field label="Current rating" value={cert.ms_current_rating} onChange={v => update("ms_current_rating", v)} hint="A" />
        </Row>
        <Row>
          <Field label="RCD IΔn" value={cert.ms_rcd_idn} onChange={v => update("ms_rcd_idn", v)} hint="mA" />
          <Field label="RCD at IΔn" value={cert.ms_rcd_at_idn} onChange={v => update("ms_rcd_at_idn", v)} hint="ms" />
        </Row>
      </FormSection>

      <FormSection title="Supply conductors">
        <Row>
          <Field label="Conductor material" value={cert.supply_cond_material} onChange={v => update("supply_cond_material", v)} />
          <Field label="Conductor csa" value={cert.supply_cond_csa} onChange={v => update("supply_cond_csa", v)} hint="mm²" />
        </Row>
      </FormSection>

      <FormSection title="Earthing conductors">
        <Row cols="1fr 1fr 1fr">
          <Field label="Conductor material" value={cert.earth_cond_material} onChange={v => update("earth_cond_material", v)} />
          <Field label="Conductor csa" value={cert.earth_cond_csa} onChange={v => update("earth_cond_csa", v)} hint="mm²" />
          <Check label="Continuity check OK" checked={cert.earth_cond_continuity} onChange={v => update("earth_cond_continuity", v)} />
        </Row>
      </FormSection>

      <FormSection title="Main equipotential bonding conductors">
        <Row cols="1fr 1fr 1fr">
          <Field label="Conductor material" value={cert.meb_cond_material} onChange={v => update("meb_cond_material", v)} />
          <Field label="Conductor csa" value={cert.meb_cond_csa} onChange={v => update("meb_cond_csa", v)} hint="mm²" />
          <Check label="Continuity check OK" checked={cert.meb_cond_continuity} onChange={v => update("meb_cond_continuity", v)} />
        </Row>
      </FormSection>

      <FormSection title="Bonding of extraneous conductive parts">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Check label="Water service" checked={cert.bond_water} onChange={v => update("bond_water", v)} />
          <Check label="Gas service" checked={cert.bond_gas} onChange={v => update("bond_gas", v)} />
          <Check label="Oil service" checked={cert.bond_oil} onChange={v => update("bond_oil", v)} />
          <Check label="Structural steel" checked={cert.bond_structural} onChange={v => update("bond_structural", v)} />
          <Check label="Lightning protection" checked={cert.bond_lightning} onChange={v => update("bond_lightning", v)} />
          <Check label="Other services" checked={cert.bond_other} onChange={v => update("bond_other", v)} />
          <Check label="List in report notes" checked={cert.bond_list_notes} onChange={v => update("bond_list_notes", v)} />
        </div>
      </FormSection>

      <FormSection title="COMMENTS ON THE EXISTING INSTALLATION — Additional information and report notes">
        <Field label="Notes" value={cert.comments} onChange={v => update("comments", v)} rows={10} />
      </FormSection>

      <FormSection title="NEXT INSPECTION">
        <Field label="I/We recommend further inspection after an interval of not more than" value={cert.next_inspection} onChange={v => update("next_inspection", v)} placeholder="e.g. 5 years" />
      </FormSection>
    </>
  );
}

function Page4({ cert, update }) {
  const setInspection = (key, value) => {
    update("inspections", { ...cert.inspections, [key]: value });
  };
  const OPTIONS = ["", "✓", "X", "LIM", "N/A", "N/V"];
  return (
    <>
      <FormSection title="SCHEDULE OF ITEMS INSPECTED">
        <div style={{ background: BRAND.greenLight, padding: 10, fontSize: 12, marginBottom: 14, border: `1px solid ${BRAND.green}33` }}>
          <strong>Legend:</strong> ✓ satisfactory · X unsatisfactory · LIM agreed limitations · N/A not applicable · N/V not verified
        </div>
        {INSPECTION_ITEMS.filter(s => s.items.length > 0).map(sec => (
          <div key={sec.section} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, borderBottom: `1px solid ${BRAND.green}33`, paddingBottom: 4 }}>
              {sec.section}
            </div>
            {sec.items.map(item => {
              const key = `${sec.section}__${item}`;
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0ede4" }}>
                  <div style={{ fontSize: 13 }}>{item}</div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {OPTIONS.map(opt => (
                      <button key={opt} onClick={() => setInspection(key, opt)} style={{
                        flex: 1, padding: "5px 4px", fontSize: 11, fontWeight: 600,
                        border: `1px solid ${cert.inspections[key] === opt ? BRAND.green : "#ddd"}`,
                        background: cert.inspections[key] === opt ? BRAND.green : "white",
                        color: cert.inspections[key] === opt ? "white" : "#555",
                        cursor: "pointer", borderRadius: 3,
                      }}>{opt || "—"}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </FormSection>
    </>
  );
}

function Page5({ cert, update }) {
  const setTest = (key, value) => update("tests", { ...cert.tests, [key]: value });
  const OPTIONS = ["", "✓", "X", "LIM", "N/A", "N/V"];
  return (
    <>
      <FormSection title="SCHEDULE OF ITEMS TESTED">
        <div style={{ background: BRAND.greenLight, padding: 10, fontSize: 12, marginBottom: 14, border: `1px solid ${BRAND.green}33` }}>
          <strong>Legend:</strong> ✓ satisfactory · X unsatisfactory · LIM agreed limitations · N/A not applicable · N/V not verified
        </div>
        {TEST_ITEMS.map(item => (
          <div key={item} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0ede4" }}>
            <div style={{ fontSize: 13 }}>{item}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {OPTIONS.map(opt => (
                <button key={opt} onClick={() => setTest(item, opt)} style={{
                  flex: 1, padding: "5px 4px", fontSize: 11, fontWeight: 600,
                  border: `1px solid ${cert.tests[item] === opt ? BRAND.green : "#ddd"}`,
                  background: cert.tests[item] === opt ? BRAND.green : "white",
                  color: cert.tests[item] === opt ? "white" : "#555",
                  cursor: "pointer", borderRadius: 3,
                }}>{opt || "—"}</button>
              ))}
            </div>
          </div>
        ))}
      </FormSection>

      <FormSection title="SCHEDULE OF ADDITIONAL RECORDS">
        <Field label="Page No(s)" value={cert.additional_page_nos} onChange={v => update("additional_page_nos", v)} />
      </FormSection>

      <FormSection title="TEST INSTRUMENTS USED">
        <Field label="Instrument Serial No(s)" value={cert.inst_serial} onChange={v => update("inst_serial", v)} />
        <div style={{ marginTop: 10 }}>
          <Field label="Earth fault loop impedance" value={cert.inst_efli} onChange={v => update("inst_efli", v)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Insulation resistance" value={cert.inst_insulation} onChange={v => update("inst_insulation", v)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Continuity" value={cert.inst_continuity} onChange={v => update("inst_continuity", v)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="RCD" value={cert.inst_rcd} onChange={v => update("inst_rcd", v)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Other" value={cert.inst_other} onChange={v => update("inst_other", v)} />
        </div>
      </FormSection>
    </>
  );
}

function Page6({ cert, update, updateCircuit }) {
  return (
    <>
      <FormSection title="DISTRIBUTION BOARD DETAILS">
        <Row cols="1fr 1fr 1fr 1fr">
          <Field label="DB ref." value={cert.db_ref} onChange={v => update("db_ref", v)} />
          <Field label="Zs at this board" value={cert.db_zs} onChange={v => update("db_zs", v)} hint="Ω" />
          <Field label="If at this board" value={cert.db_ka} onChange={v => update("db_ka", v)} hint="kA" />
          <Field label="Main switch type BSEN" value={cert.db_main_switch_bsen} onChange={v => update("db_main_switch_bsen", v)} />
        </Row>
        <Row cols="1fr 1fr 1fr">
          <Field label="Rating" value={cert.db_rating} onChange={v => update("db_rating", v)} hint="Amps" />
          <Field label="Supply conductors" value={cert.db_supply_conductors} onChange={v => update("db_supply_conductors", v)} hint="mm²" />
          <Field label="Earth" value={cert.db_earth} onChange={v => update("db_earth", v)} hint="mm²" />
        </Row>
        <Row cols="1fr 1fr 1fr 1fr 1fr">
          <Field label="DB location" value={cert.db_location} onChange={v => update("db_location", v)} />
          <Field label="Supplied from" value={cert.db_supplied_from} onChange={v => update("db_supplied_from", v)} />
          <Field label="No. of phases" value={cert.db_no_phases} onChange={v => update("db_no_phases", v)} />
          <Field label="Protective device BSEN" value={cert.db_protective_device_bsen} onChange={v => update("db_protective_device_bsen", v)} />
          <Field label="Rating" value={cert.db_protective_rating} onChange={v => update("db_protective_rating", v)} hint="Amps" />
        </Row>
      </FormSection>

      <FormSection title="CIRCUIT DETAILS & TEST RESULTS">
        <div style={{ overflowX: "auto", border: "1px solid #ddd" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%", minWidth: 1800 }}>
            <thead>
              <tr style={{ background: BRAND.green, color: "white" }}>
                {["Ref", "Designation", "Wiring", "Method", "Pts", "Live mm²", "cpc mm²", "Max Disc(s)", "Type BSEN", "Rating A", "kA", "IΔn mA", "Max Ze Ω",
                  "r₁", "rₙ", "r₂", "R₁+R₂", "Rₛ",
                  "P/P MΩ", "P/N MΩ", "P/E MΩ", "N/E MΩ", "Polarity", "Meas Ze Ω", "At IΔn", "At 5×IΔn"].map(h => (
                    <th key={h} style={{ padding: "6px 4px", fontSize: 10, fontWeight: 600, borderRight: "1px solid #fff3" }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {cert.circuits.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f0ede4" }}>
                  {["ref", "designation", "wiring_type", "ref_method", "num_points", "live_mm", "cpc_mm", "max_disconnect",
                    "oc_type", "oc_rating", "oc_short_circuit", "rcd_idn", "max_ze",
                    "r1", "rn", "r2", "r1r2", "rs",
                    "ins_pp", "ins_pn", "ins_pe", "ins_ne", "polarity", "measured_ze", "at_idn", "at_5idn"].map(field => (
                      <td key={field} style={{ padding: 0, borderRight: "1px solid #eee" }}>
                        <input
                          value={row[field] || ""}
                          onChange={e => updateCircuit(idx, field, e.target.value)}
                          style={{ width: "100%", border: "none", padding: "5px 4px", fontSize: 11, background: "transparent", outline: "none", minWidth: 50 }}
                        />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#888" }}>Scroll horizontally to see all columns. 12 circuit rows provided.</div>
      </FormSection>
    </>
  );
}

function Page7() {
  return (
    <FormSection title="CODES FOR TYPES OF WIRING (reference)">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {WIRING_CODES.map(wc => (
          <div key={wc.code} style={{ background: "white", padding: 14, border: `1px solid ${BRAND.green}33`, borderRadius: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.green, fontFamily: "'IBM Plex Mono', monospace" }}>{wc.code}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: "#444" }}>{wc.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: 12, background: BRAND.greenLight, fontSize: 12, color: "#444", border: `1px solid ${BRAND.green}33` }}>
        These codes are included automatically as page 7 of every generated PDF. Use them in the "Type of wiring" column on the Distribution Board page.
      </div>
    </FormSection>
  );
}

// ============================================================
// Style objects
// ============================================================
const btnPrimary = {
  background: BRAND.green, color: "white", border: "none", padding: "10px 18px",
  borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s",
  letterSpacing: "0.02em",
};
const btnSecondary = {
  background: "white", color: BRAND.green, border: `1px solid ${BRAND.green}`, padding: "10px 16px",
  borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const btnGhost = {
  background: "transparent", color: "#555", border: "1px solid #d8d4c5", padding: "8px 14px",
  borderRadius: 3, fontSize: 12, fontWeight: 500, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};
const tabBtn = {
  padding: "8px 14px", border: "none", borderRadius: 3, fontSize: 13,
  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
  fontFamily: "'IBM Plex Sans', sans-serif",
};
const searchInput = {
  width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #d8d4c5",
  borderRadius: 3, fontSize: 14, background: "white", outline: "none",
  fontFamily: "'IBM Plex Sans', sans-serif",
};
const fieldInput = {
  padding: "8px 10px", border: "1px solid #d8d4c5", borderRadius: 3, fontSize: 13,
  background: "white", outline: "none", fontFamily: "'IBM Plex Sans', sans-serif", width: "100%",
};
const formPaper = {
  background: "white", padding: 24, border: "1px solid #e0ddd2", borderRadius: 4,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const certCard = {
  background: "white", padding: 16, border: "1px solid #e0ddd2", borderRadius: 4,
  transition: "all 0.15s", cursor: "default",
};
const emptyState = {
  background: "white", padding: 60, border: "1px dashed #d8d4c5", borderRadius: 4,
  textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
};
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
