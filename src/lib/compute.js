import { buildLinearParts, buildCornerParts } from './parts.js';
import { mergePartsLists, optimalShelves } from './layout.js';

function materialFromCfg(cfg) {
  return {
    t: (Number(cfg.thick) || 18) / 10,
    backT: (Number(cfg.back) || 3) / 10
  };
}

function buildOneModule(mod, cfg, { t, backT }) {
  const H = Number(mod.h != null ? mod.h : cfg.h);
  const D = Number(mod.d != null ? mod.d : cfg.d);
  const doorType = mod.kind === 'szuflady' ? 'szuflady' : (mod.door || 'uchylne');
  const shelves = doorType === 'szuflady' ? 0 : (
    mod.shelvesAuto ? optimalShelves(H) : Math.max(0, parseInt(mod.shelves, 10) || 0)
  );
  const leaves = Number(mod.leaves) || 1;
  const drawerCount = Number(mod.drawerCount ?? cfg.drawerCount) || 3;
  const drawerStyle = mod.drawerStyle || cfg.drawerStyle || 'srednia';
  const drawerOpts = { drawerCount, drawerStyle };
  const panelMode = !!mod.panel;
  const panelHeight = Number(mod.panelHeight) || Math.max(H + 40, 120);
  const panelThick = (Number(mod.panelThick) || 18) / 10;
  const topConstruction = mod.topConstruction || cfg.topConstruction || 'standard';
  const frontCargo = mod.frontCargo != null ? mod.frontCargo : (cfg.frontCargo !== false);
  const rearReinforcement = !!(mod.rearReinforcement ?? cfg.rearReinforcement);
  const cargoDepth = Number(mod.cargoDepth ?? cfg.cargoDepth) || 8;
  const railOpts = { topConstruction, frontCargo, rearReinforcement, cargoDepth };

  if (mod.kind === 'naroznik') {
    const armA = Number(mod.armA) || Number(mod.width) || 60;
    const armB = Number(mod.armB) || armA;
    const data = buildCornerParts({
      armA, armB, H, D, t, backT, shelvesPer: shelves, doorType, leaves, ...railOpts
    });
    return {
      ...data,
      moduleId: mod.id,
      kind: mod.kind,
      label: 'Narożna',
      displayW: armA,
      shelves
    };
  }

  const W = Number(mod.width) || 60;
  const data = buildLinearParts({
    W, H, D, N: 1, t, backT, shelvesPer: shelves,
    doorType: mod.kind === 'regal' ? 'brak' : doorType,
    leaves: mod.kind === 'przesuwne' ? 2 : leaves,
    skipBack: mod.kind === 'regal',
    panelMode,
    panelHeight,
    panelThick,
    ...railOpts,
    ...drawerOpts
  });
  return {
    ...data,
    moduleId: mod.id,
    kind: mod.kind,
    label: mod.kind,
    displayW: W,
    shelves
  };
}

export function computeFromConfig(cfg) {
  if (!cfg.mode) {
    return { error: null, data: null };
  }
  if (cfg.mode === 'single' && !cfg.type) {
    return { error: null, data: null };
  }

  const H = Number(cfg.h);
  const D = Number(cfg.d);
  const { t, backT } = materialFromCfg(cfg);

  if (cfg.mode === 'zabudowa') {
    const availW = Number(cfg.w);
    if (!availW || !H || !D || availW <= 0 || H <= 0 || D <= 0) {
      return { error: 'Podaj dostępną szerokość, wysokość i głębokość (> 0).', data: null };
    }

    const modules = Array.isArray(cfg.modules) ? cfg.modules : [];
    if (!modules.length) {
      return {
        error: null,
        data: {
          isZabudowa: true,
          isCorner: false,
          W: availW,
          H, D, t, backT,
          modules: [],
          moduleCount: 0,
          occupiedW: 0,
          remainingW: availW,
          parts: [],
          empty: true
        }
      };
    }

    const built = modules.map((m) => buildOneModule(m, cfg, { t, backT }));
    const parts = mergePartsLists(built.map((b) => b.parts));
    const occupiedW = built.reduce((s, b) => s + (b.displayW || 0), 0);
    const hasCorner = built.some((b) => b.isCorner);

    return {
      error: null,
      data: {
        isZabudowa: true,
        isCorner: hasCorner && built.length === 1,
        W: availW,
        H, D, t, backT,
        modules: built,
        moduleCount: built.length,
        occupiedW,
        remainingW: Math.max(0, availW - occupiedW),
        parts,
        // do kompatybilności rysunku liniowego gdy brak narożnika-single
        N: built.length,
        sectionOpening: built[0]?.sectionOpening,
        uprights: built[0]?.uprights,
        shelvesPer: built[0]?.shelves || 0
      }
    };
  }

  const shelvesPer = Math.max(0, parseInt(cfg.shelves, 10) || 0);
  const doorType = cfg.door;
  const leaves = Number(cfg.leaves) || 1;
  const topConstruction = cfg.topConstruction || 'standard';
  const frontCargo = cfg.frontCargo !== false;
  const rearReinforcement = !!cfg.rearReinforcement;
  const cargoDepth = Number(cfg.cargoDepth) || 8;
  const railOpts = { topConstruction, frontCargo, rearReinforcement, cargoDepth };
  const drawerCount = Number(cfg.drawerCount) || 3;
  const drawerStyle = cfg.drawerStyle || 'srednia';
  const drawerOpts = { drawerCount, drawerStyle };

  if (cfg.type === 'naroznik') {
    const armA = Number(cfg.armA);
    const armB = Number(cfg.armB);
    if (!armA || !armB || !H || !D || armA <= 0 || armB <= 0 || H <= 0 || D <= 0) {
      return { error: 'Wszystkie wymiary muszą być liczbami większymi od 0.', data: null };
    }
    return {
      error: null,
      data: buildCornerParts({ armA, armB, H, D, t, backT, shelvesPer, doorType, leaves, ...railOpts })
    };
  }

  const W = Number(cfg.w);
  const N = Math.max(1, parseInt(cfg.sections, 10) || 1);
  const panelMode = !!cfg.panel;
  const panelHeight = Number(cfg.panelHeight);
  const panelThick = (Number(cfg.panelThick) || 18) / 10;

  if (!W || !H || !D || W <= 0 || H <= 0 || D <= 0 || (panelMode && (!panelHeight || panelHeight < H))) {
    return { error: 'Wszystkie wymiary muszą być liczbami większymi od 0.', data: null };
  }

  return {
    error: null,
    data: buildLinearParts({
      W, H, D, N, t, backT, shelvesPer, doorType, leaves,
      skipBack: cfg.type === 'regal', panelMode, panelHeight, panelThick,
      ...railOpts,
      ...drawerOpts
    })
  };
}
