import React, { useEffect, useMemo, useState } from 'react';
import { ToggleGroup, EMPTY_CONFIG, DEFAULT_CONFIG } from './components/ToggleGroup.jsx';
import { ModulesEditor } from './components/ModulesEditor.jsx';
import { TopConstructionFields } from './components/TopConstructionFields.jsx';
import { computeFromConfig } from './lib/compute.js';
import { collectSanityWarnings } from './lib/validate.js';
import { buildPreviewSvg } from './lib/svg.js';
import { buildPdfBase64 } from './lib/pdf.js';
import { fmt } from './lib/utils.js';
import { optimalShelves } from './lib/layout.js';

function hasApi() {
  return typeof window !== 'undefined' && window.formatka;
}

function numOrEmpty(v) {
  return v === '' || v == null ? '' : Number(v);
}

function inputVal(v) {
  return v === '' || v == null ? '' : v;
}

export default function App() {
  const [cfg, setCfg] = useState({ ...EMPTY_CONFIG });
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [status, setStatus] = useState('');
  const [pdfStatus, setPdfStatus] = useState('');

  const patch = (partial) => setCfg((c) => {
    const next = { ...c, ...partial };
    const nextType = partial.type != null ? partial.type : c.type;
    const nextMode = partial.mode != null ? partial.mode : c.mode;
    const nextLayout = partial.layout != null ? partial.layout : c.layout;
    const isCornerNext = (nextMode === 'single' && nextType === 'naroznik')
      || (nextMode === 'zabudowa' && nextLayout === 'rzad_naroznik');
    if (partial.door === 'przesuwne' && !isCornerNext && nextMode === 'single') next.leaves = 2;
    if (partial.type === 'naroznik') next.panel = 0;
    if (partial.mode === 'zabudowa' && !Array.isArray(next.modules)) next.modules = [];
    if (partial.mode != null && partial.mode !== c.mode) {
      if (partial.mode === 'zabudowa') next.type = '';
      if (partial.mode === 'single') next.modules = [];
      if (partial.catalogSlug === undefined) next.catalogSlug = '';
    }
    if (partial.type != null && partial.type !== c.type && partial.catalogSlug === undefined) {
      next.catalogSlug = '';
    }
    if (partial.door === 'szuflady') {
      next.shelves = 0;
      if (!next.topConstruction) next.topConstruction = 'countertop';
    }
    // przy zmianie wysokości — przelicz auto-półki w modułach zabudowy
    if (partial.h != null && Array.isArray(next.modules)) {
      next.modules = next.modules.map((m) => (
        m.shelvesAuto ? { ...m, shelves: optimalShelves(partial.h) } : m
      ));
    }
    return next;
  });

  function setModules(modules) {
    setCfg((c) => ({ ...c, modules }));
  }

  const { error, data } = useMemo(() => computeFromConfig(cfg), [cfg]);
  const warnings = useMemo(() => collectSanityWarnings(data, cfg), [data, cfg]);
  const preview = useMemo(() => buildPreviewSvg(data, cfg), [data, cfg]);

  useEffect(() => {
    async function boot() {
      if (!hasApi()) {
        setStatus('Tryb przeglądarki — SQLite tylko w Electron.');
        return;
      }
      const [plist, clist] = await Promise.all([
        window.formatka.listProjects(),
        window.formatka.listCatalog()
      ]);
      setProjects(plist);
      setCatalog(clist);
    }
    boot().catch((e) => setStatus('Błąd bazy: ' + e.message));
  }, []);

  async function refreshProjects() {
    if (!hasApi()) return;
    setProjects(await window.formatka.listProjects());
  }

  async function saveProject() {
    if (!hasApi()) {
      setStatus('Zapisz działa w aplikacji Electron.');
      return;
    }
    const saved = await window.formatka.saveProject({
      id: projectId,
      name: cfg.projectName || 'Bez nazwy',
      config: cfg,
      notes: ''
    });
    setProjectId(saved.id);
    await window.formatka.setSetting('lastProjectId', String(saved.id));
    await refreshProjects();
    setStatus(`Zapisano #${saved.id}: ${saved.name}`);
  }

  async function newProject() {
    setProjectId(null);
    setCfg({ ...EMPTY_CONFIG });
    setStatus('Nowy projekt — wybierz tryb lub pozycję z katalogu.');
  }

  async function loadProject(id) {
    if (!hasApi()) return;
    const p = await window.formatka.getProject(id);
    if (!p) return;
    setProjectId(p.id);
    setCfg({ ...DEFAULT_CONFIG, ...JSON.parse(p.config_json), projectName: p.name });
    await window.formatka.setSetting('lastProjectId', String(p.id));
    setStatus(`Wczytano: ${p.name}`);
  }

  async function deleteProject(id) {
    if (!hasApi()) return;
    await window.formatka.deleteProject(id);
    if (projectId === id) await newProject();
    await refreshProjects();
    setStatus('Usunięto projekt.');
  }

  function applyCatalog(slug) {
    if (!slug) {
      patch({ catalogSlug: '' });
      return;
    }
    const row = catalog.find((c) => c.slug === slug);
    if (!row) return;

    const isBlank = (v) => v === '' || v == null;
    const partial = { catalogSlug: slug };
    const typeSlugs = ['wiszaca', 'stojaca', 'regal', 'naroznik'];

    // Katalog uzupełnia tylko puste pola — nie nadpisuje wyborów użytkownika (front, szuflady, typ…)
    if (isBlank(cfg.h) && row.default_height != null) partial.h = row.default_height;
    if (isBlank(cfg.d) && row.default_depth != null) partial.d = row.default_depth;
    if (isBlank(cfg.mode)) partial.mode = 'single';
    if (isBlank(cfg.type) && typeSlugs.includes(slug)) partial.type = slug;

    if (slug === 'kuchenna_dol') {
      if (isBlank(cfg.type)) partial.type = 'stojaca';
      if (isBlank(cfg.topConstruction)) {
        partial.topConstruction = 'countertop';
        partial.frontCargo = true;
        partial.rearReinforcement = true;
      }
    }
    if (slug === 'szuflady') {
      if (isBlank(cfg.type)) partial.type = 'stojaca';
      if (isBlank(cfg.door)) {
        partial.door = 'szuflady';
        partial.shelves = 0;
      }
      if (isBlank(cfg.topConstruction)) {
        partial.topConstruction = 'countertop';
        partial.frontCargo = true;
        partial.rearReinforcement = true;
      }
    }
    patch(partial);
  }

  async function generatePdf() {
    setPdfStatus('');
    if (!data) {
      setPdfStatus(error || 'Uzupełnij wymiary.');
      return;
    }
    try {
      const buf = await buildPdfBase64(data, cfg);
      const bytes = new Uint8Array(buf);
      let binary = '';
      bytes.forEach((b) => { binary += String.fromCharCode(b); });
      const base64 = btoa(binary);

      if (hasApi()) {
        const filePath = await window.formatka.savePdfDialog('lista-rozkroju.pdf');
        if (!filePath) {
          setPdfStatus('Anulowano zapis PDF.');
          return;
        }
        await window.formatka.writeFile(filePath, base64);
        await window.formatka.addCutHistory({
          projectId,
          summary: { total: data.parts.reduce((s, p) => s + p.qty, 0), name: cfg.projectName },
          parts: data.parts
        });
        setPdfStatus('PDF zapisany.');
      } else {
        const blob = new Blob([buf], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'lista-rozkroju.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
        setPdfStatus('PDF pobrany.');
      }
    } catch (e) {
      setPdfStatus('Błąd PDF: ' + e.message);
    }
  }

  const hasMode = cfg.mode === 'single' || cfg.mode === 'zabudowa';
  const single = cfg.mode === 'single';
  const zabudowa = cfg.mode === 'zabudowa';
  const isCornerSingle = single && cfg.type === 'naroznik';
  const isCorner = isCornerSingle;
  const hidePanel = isCornerSingle;
  const totalPieces = data ? data.parts.reduce((s, p) => s + p.qty, 0) : 0;

  let zabudowaNote = '';
  if (data?.isZabudowa) {
    const n = data.moduleCount || 0;
    zabudowaNote = n
      ? `${n} szafek · zajęte ${fmt(data.occupiedW)} cm · wolne ${fmt(data.remainingW)} cm`
      : 'Dodaj szafki z palety typów.';
  }

  return (
    <div className="wrap">
      <header>
        <p className="eyebrow">FormatkaApp // desktop // SQLite</p>
        <h1>Kalkulator komponentów mebla</h1>
      </header>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="projects-bar">
          <div className="field">
            <label htmlFor="projectName">Projekt</label>
            <input
              id="projectName"
              type="text"
              placeholder="Nazwa projektu (opcjonalnie)"
              value={cfg.projectName}
              onChange={(e) => patch({ projectName: e.target.value })}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div className="field">
            <label>Katalog</label>
            <select
              value={cfg.catalogSlug || ''}
              onChange={(e) => applyCatalog(e.target.value)}
            >
              <option value="">— typ / wymiary —</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.slug}>{c.category}: {c.name}</option>
              ))}
            </select>
          </div>
          <div className="persist-row">
            <button type="button" onClick={saveProject}>Zapisz</button>
            <button type="button" onClick={newProject}>Nowy</button>
          </div>
          {projects.length > 0 && (
            <div className="projects-list">
              {projects.map((p) => (
                <div key={p.id} className="chip">
                  <button type="button" className={`chip-main${projectId === p.id ? ' active' : ''}`} onClick={() => loadProject(p.id)}>{p.name}</button>
                  <button type="button" className="chip-del" onClick={() => deleteProject(p.id)} title="Usuń">×</button>
                </div>
              ))}
            </div>
          )}
          {status && <div className="hint" style={{ gridColumn: '1 / -1' }}>{status}</div>}
        </div>
      </div>

      <div className="layout">
        <form className="panel form-wide" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            <div className="section-title"><span className="num">01</span>Układ</div>

            <div className="form-span-12 field">
              <label>Tryb</label>
              <ToggleGroup
                value={cfg.mode}
                onChange={(mode) => patch({ mode })}
                options={[
                  { value: 'single', label: 'Pojedynczy mebel' },
                  { value: 'zabudowa', label: 'Zabudowa (wiele szafek)' }
                ]}
              />
            </div>

            {single && (
              <div className="form-span-12 field">
                <label>Typ</label>
                <ToggleGroup
                  value={cfg.type}
                  onChange={(type) => patch({ type })}
                  options={[
                    { value: 'wiszaca', label: 'Wisząca' },
                    { value: 'stojaca', label: 'Stojąca' },
                    { value: 'regal', label: 'Regał' },
                    { value: 'naroznik', label: 'Narożna' }
                  ]}
                />
              </div>
            )}

            {hasMode && (!single || cfg.type) && (
              <>
            <div className="section-title"><span className="num">02</span>Powierzchnia / wymiary</div>

            {!(single && isCornerSingle) && (
              <div className="form-span-3 field">
                <label htmlFor="w">{single ? 'Szer. cm' : 'Dost. szer. cm'}</label>
                <input id="w" type="number" value={inputVal(cfg.w)} min={10} step={0.5} placeholder="—"
                  onChange={(e) => patch({ w: numOrEmpty(e.target.value) })} />
              </div>
            )}
            <div className="form-span-3 field">
              <label htmlFor="h">Wys. cm</label>
              <input id="h" type="number" value={inputVal(cfg.h)} min={10} step={0.5} placeholder="—"
                onChange={(e) => patch({ h: numOrEmpty(e.target.value) })} />
            </div>
            <div className="form-span-3 field">
              <label htmlFor="d">Głęb. cm</label>
              <input id="d" type="number" value={inputVal(cfg.d)} min={10} step={0.5} placeholder="—"
                onChange={(e) => patch({ d: numOrEmpty(e.target.value) })} />
            </div>
            {single && isCornerSingle && (
              <>
                <div className="form-span-3 field">
                  <label htmlFor="armA">Plecy A cm</label>
                  <input id="armA" type="number" value={inputVal(cfg.armA)} min={15} step={0.5} placeholder="—"
                    onChange={(e) => patch({ armA: numOrEmpty(e.target.value) })} />
                </div>
                <div className="form-span-3 field">
                  <label htmlFor="armB">Plecy B cm</label>
                  <input id="armB" type="number" value={inputVal(cfg.armB)} min={15} step={0.5} placeholder="—"
                    onChange={(e) => patch({ armB: numOrEmpty(e.target.value) })} />
                </div>
              </>
            )}
              </>
            )}

            {!hasMode && (
              <div className="form-span-12 hint" style={{ marginTop: 4 }}>
                Wybierz tryb pracy albo pozycję z katalogu, aby skonfigurować mebel.
              </div>
            )}

            {single && !cfg.type && (
              <div className="form-span-12 hint" style={{ marginTop: 4 }}>
                Wybierz typ mebla (wisząca, stojąca, regał lub narożna).
              </div>
            )}

            {(error || warnings.length > 0) && hasMode && (
              <div className="form-span-12">
                {error && <div className="error-msg show">{error}</div>}
                {warnings.length > 0 && (
                  <div className="warn-msg show">{warnings.map((m) => `• ${m}`).join('\n')}</div>
                )}
              </div>
            )}

            {zabudowa && (
              <>
                <TopConstructionFields cfg={cfg} patch={patch} inputVal={inputVal} numOrEmpty={numOrEmpty} />
                <div className="section-title"><span className="num">03</span>Sloty szafek na powierzchni</div>
                <ModulesEditor
                  modules={cfg.modules || []}
                  availW={cfg.w}
                  H={cfg.h}
                  d={cfg.d}
                  panelHeight={cfg.panelHeight}
                  panelThick={cfg.panelThick}
                  onChange={setModules}
                />
                <div className="form-span-2 field">
                  <label htmlFor="thick">Płyta mm</label>
                  <input id="thick" type="number" value={cfg.thick} min={8}
                    onChange={(e) => patch({ thick: Number(e.target.value) })} />
                </div>
                <div className="form-span-2 field">
                  <label htmlFor="back">Plecy mm</label>
                  <input id="back" type="number" value={cfg.back} min={2} step={0.5}
                    onChange={(e) => patch({ back: Number(e.target.value) })} />
                </div>
              </>
            )}

            {single && cfg.type && (
              <>
                <div className="section-title"><span className="num">03</span>Podział · drzwi · materiał</div>

                <TopConstructionFields cfg={cfg} patch={patch} inputVal={inputVal} numOrEmpty={numOrEmpty} />

                {!isCornerSingle && (
                  <div className="form-span-2 field">
                    <label htmlFor="sections">Sekcje</label>
                    <input id="sections" type="number" value={inputVal(cfg.sections)} min={1} max={6} placeholder="1"
                      onChange={(e) => patch({ sections: numOrEmpty(e.target.value) })} />
                  </div>
                )}
                <div className="form-span-2 field">
                  <label htmlFor="shelves">Półki</label>
                  <input id="shelves" type="number" value={inputVal(cfg.shelves)} min={0} max={8} placeholder="0"
                    onChange={(e) => patch({ shelves: numOrEmpty(e.target.value) })} />
                </div>
                <div className="form-span-2 field">
                  <label htmlFor="thick">Płyta mm</label>
                  <input id="thick" type="number" value={cfg.thick} min={8}
                    onChange={(e) => patch({ thick: Number(e.target.value) })} />
                </div>
                <div className="form-span-2 field">
                  <label htmlFor="back">Plecy mm</label>
                  <input id="back" type="number" value={cfg.back} min={2} step={0.5}
                    onChange={(e) => patch({ back: Number(e.target.value) })} />
                </div>

                <div className="form-span-12 field">
                  <label>Front</label>
                  <ToggleGroup
                    className="toggle-group--wrap"
                    value={cfg.door}
                    onChange={(door) => patch({ door })}
                    options={[
                      { value: 'brak', label: 'Brak' },
                      { value: 'uchylne', label: 'Uchylne' },
                      { value: 'gora', label: 'Do góry' },
                      { value: 'przesuwne', label: 'Przesuwne' },
                      { value: 'szuflady', label: 'Szuflady' }
                    ]}
                  />
                </div>
                {cfg.door === 'szuflady' && (
                  <>
                    <div className="form-span-3 field">
                      <label htmlFor="drawerCount">Liczba szuflad</label>
                      <input id="drawerCount" type="number" value={inputVal(cfg.drawerCount ?? 3)} min={1} max={5}
                        onChange={(e) => patch({ drawerCount: numOrEmpty(e.target.value) || 3, shelves: 0 })} />
                    </div>
                    <div className="form-span-9 field">
                      <label>Wysokość skrzyni</label>
                      <ToggleGroup
                        className="toggle-group--wrap"
                        value={cfg.drawerStyle || 'srednia'}
                        onChange={(drawerStyle) => patch({ drawerStyle })}
                        options={[
                          { value: 'niska', label: 'Niska (8–12 cm)' },
                          { value: 'srednia', label: 'Średnia (13–20 cm)' },
                          { value: 'wysoka', label: 'Wysoka (21+ cm)' }
                        ]}
                      />
                    </div>
                  </>
                )}
                {cfg.door && cfg.door !== 'brak' && cfg.door !== 'szuflady' && (
                  <div className="form-span-12 field">
                    <label>{isCorner ? 'Skrzydła narożnika' : 'Skrzydła'}</label>
                    <ToggleGroup
                      className="toggle-group--wrap"
                      value={cfg.leaves}
                      onChange={(leaves) => patch({ leaves })}
                      disabledValues={!isCorner && cfg.door === 'przesuwne' ? [1] : []}
                      options={isCorner
                        ? [
                            { value: 1, label: '1 — między bokami' },
                            { value: 2, label: '2 — po ramieniu' }
                          ]
                        : [
                            { value: 1, label: '1 skrzydło' },
                            { value: 2, label: '2 skrzydła' }
                          ]}
                    />
                  </div>
                )}

                {!hidePanel && (
                  <>
                    <div className="form-span-12 field">
                      <label>Montaż</label>
                      <ToggleGroup
                        className="toggle-group--wrap"
                        value={cfg.panel}
                        onChange={(panel) => patch({ panel })}
                        options={[
                          { value: 0, label: 'Plecy HDF' },
                          { value: 1, label: 'Wysoka płyta' }
                        ]}
                      />
                    </div>
                    {cfg.panel === 1 && (
                      <>
                        <div className="form-span-3 field">
                          <label htmlFor="panelHeight">Wys. płyty cm</label>
                          <input id="panelHeight" type="number" value={inputVal(cfg.panelHeight)} placeholder="—"
                            onChange={(e) => patch({ panelHeight: numOrEmpty(e.target.value) })} />
                        </div>
                        <div className="form-span-3 field">
                          <label htmlFor="panelThick">Gr. płyty mm</label>
                          <input id="panelThick" type="number" value={cfg.panelThick}
                            onChange={(e) => patch({ panelThick: Number(e.target.value) })} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </form>

        <div className="results-col">
          <div className="panel canvas-panel">
            <h2><span className="num">04</span>Widok</h2>
            {zabudowaNote && <div className="note" style={{ marginTop: 0, marginBottom: 6 }}>{zabudowaNote}</div>}
            <div className="canvas-wrap">
              {preview.svg ? (
                <div dangerouslySetInnerHTML={{ __html: preview.svg }} />
              ) : (
                <div className="canvas-empty">
                  {!hasMode
                    ? 'Wybierz tryb pracy lub pozycję z katalogu.'
                    : single && !cfg.type
                      ? 'Wybierz typ mebla.'
                      : 'Uzupełnij wymiary, aby zobaczyć podgląd.'}
                </div>
              )}
            </div>
            <div className="legend">
              {preview.legend.map((l) => (
                <span key={l.label}><span className="swatch" style={{ background: l.color }} />{l.label}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span><span className="num">05</span>Rozkrój</span>
              <button type="button" className="btn-primary" onClick={generatePdf}>PDF</button>
            </h2>
            {pdfStatus && (
              <div className="error-msg show" style={{ color: pdfStatus.startsWith('Błąd') ? 'var(--danger)' : 'var(--cyan)' }}>
                {pdfStatus}
              </div>
            )}
            {data && (
              <div className="summary-bar">
                <div className="stat"><div className="v">{totalPieces}</div><div className="l">elementów</div></div>
                <div className="stat"><div className="v">{data.parts.length}</div><div className="l">rodzajów</div></div>
                <div className="stat">
                  <div className="v">{data.isZabudowa ? (data.moduleCount || 0) : (data.isCorner ? 2 : (data.N || 0))}</div>
                  <div className="l">{data.isZabudowa ? 'szafki' : data.isCorner ? 'ramiona' : 'sekcje'}</div>
                </div>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>Element</th>
                  <th className="mono">mm</th>
                  <th className="mono">gr.</th>
                  <th className="qty">szt.</th>
                </tr>
              </thead>
              <tbody>
                {data?.parts.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td className="mono">{fmt(p.w * 10)}×{fmt(p.h * 10)}</td>
                    <td className="mono">{p.thickMm}</td>
                    <td className="qty">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
