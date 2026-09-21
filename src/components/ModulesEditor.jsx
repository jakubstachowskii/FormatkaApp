import React, { useState } from 'react';
import {
  MODULE_KINDS,
  remainingWidth,
  occupiedWidth,
  optimalShelves,
  redistributeWidths,
  applyKindToModule,
  addModuleToList
} from '../lib/layout.js';

export function ModulesEditor({ modules, availW, H, d, panelHeight, panelThick, onChange }) {
  const [addKind, setAddKind] = useState('wiszaca');
  const rem = remainingWidth(availW, modules);
  const occ = occupiedWidth(modules);

  function update(id, patch) {
    onChange(modules.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, ...patch };
      if (patch.shelves != null) next.shelvesAuto = false;
      if (patch.width != null || patch.armA != null) next.widthLocked = true;
      if (patch.shelvesAuto === true) next.shelves = optimalShelves(H);
      return next;
    }));
  }

  function changeKind(id, kindId) {
    onChange(modules.map((m) => (m.id === id ? applyKindToModule(m, kindId, H) : m)));
  }

  function remove(id) {
    const next = modules.filter((m) => m.id !== id);
    onChange(availW > 0 ? redistributeWidths(next, availW) : next);
  }

  function move(id, dir) {
    const i = modules.findIndex((m) => m.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= modules.length) return;
    const next = modules.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function addSlot() {
    onChange(addModuleToList(modules, addKind, {
      h: H, d, panelHeight, panelThick, availW
    }));
  }

  function fillWidth() {
    onChange(redistributeWidths(modules, availW));
  }

  return (
    <div className="form-span-12 modules-list">
      <div className="slot-toolbar">
        <div className="field" style={{ flex: '1 1 140px', marginBottom: 0 }}>
          <label>Nowy slot — typ</label>
          <select value={addKind} onChange={(e) => setAddKind(e.target.value)}>
            {MODULE_KINDS.map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </div>
        <div className="persist-row" style={{ alignItems: 'flex-end' }}>
          <button type="button" className="btn-primary" onClick={addSlot}>+ Dodaj slot</button>
          <button type="button" onClick={fillWidth} disabled={!modules.length}>Wypełnij szerokość</button>
        </div>
      </div>

      <div className="hint" style={{ marginBottom: 6 }}>
        Sloty po kolei na {availW} cm · zajęte {Math.round(occ * 10) / 10} · wolne{' '}
        <strong style={{ color: rem < 0 ? 'var(--danger)' : 'var(--cyan)' }}>
          {Math.round(rem * 10) / 10} cm
        </strong>
        . Półki startują optymalnie (możesz zmienić).
      </div>

      {!modules.length && (
        <div className="hint">Brak slotów — wybierz typ i kliknij „Dodaj slot”. Nowy slot bierze wolną szerokość.</div>
      )}

      {modules.map((m, idx) => {
        const isCorner = m.kind === 'naroznik';
        return (
          <div key={m.id} className="module-card">
            <div className="module-head">
              <strong>Slot {idx + 1}</strong>
              <div className="persist-row">
                <button type="button" onClick={() => move(m.id, -1)} title="W lewo">←</button>
                <button type="button" onClick={() => move(m.id, 1)} title="W prawo">→</button>
                <button type="button" onClick={() => remove(m.id)} title="Usuń">×</button>
              </div>
            </div>
            <div className="module-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Typ szafki</label>
                <select value={m.kind} onChange={(e) => changeKind(m.id, e.target.value)}>
                  {MODULE_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
              </div>

              {isCorner ? (
                <>
                  <div className="field">
                    <label>Plecy A cm</label>
                    <input type="number" value={m.armA} min={20} step={1}
                      onChange={(e) => update(m.id, { armA: Number(e.target.value), width: Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label>Plecy B cm</label>
                    <input type="number" value={m.armB} min={20} step={1}
                      onChange={(e) => update(m.id, { armB: Number(e.target.value) })} />
                  </div>
                </>
              ) : (
                <div className="field">
                  <label>Szer. cm {m.widthLocked ? '' : '(auto)'}</label>
                  <input type="number" value={m.width} min={25} step={1}
                    onChange={(e) => update(m.id, { width: Number(e.target.value) })} />
                </div>
              )}

              <div className="field">
                <label>Półki {m.shelvesAuto ? '(opt.)' : ''}</label>
                <input type="number" value={m.shelves} min={0} max={8}
                  onChange={(e) => update(m.id, { shelves: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button type="button" className="btn-secondary" style={{ width: '100%' }}
                  onClick={() => update(m.id, { shelvesAuto: true, shelves: optimalShelves(H) })}>
                  Auto półki
                </button>
              </div>

              {m.kind !== 'regal' && m.kind !== 'szuflady' && (
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Front</label>
                  <div className="toggle-group toggle-group--wrap">
                    {['brak', 'uchylne', 'gora', 'przesuwne', 'szuflady'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={m.door === d ? 'active' : ''}
                        onClick={() => update(m.id, {
                          door: d,
                          leaves: d === 'przesuwne' ? 2 : (m.leaves || 1),
                          shelves: d === 'szuflady' ? 0 : m.shelves
                        })}
                      >
                        {d === 'brak' ? 'Brak' : d === 'uchylne' ? 'Uchylne' : d === 'gora' ? 'Do góry' : d === 'przesuwne' ? 'Przesuwne' : 'Szuflady'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(m.door === 'szuflady' || m.kind === 'szuflady') && (
                <>
                  <div className="field">
                    <label>Liczba szuflad</label>
                    <input type="number" value={m.drawerCount ?? 3} min={1} max={5}
                      onChange={(e) => update(m.id, { drawerCount: Number(e.target.value), shelves: 0 })} />
                  </div>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label>Wys. skrzyni</label>
                    <div className="toggle-group toggle-group--wrap">
                      {['niska', 'srednia', 'wysoka'].map((st) => (
                        <button key={st} type="button" className={(m.drawerStyle || 'srednia') === st ? 'active' : ''}
                          onClick={() => update(m.id, { drawerStyle: st })}>
                          {st === 'niska' ? 'Niska' : st === 'srednia' ? 'Średnia' : 'Wysoka'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {m.kind === 'panel' && (
                <>
                  <div className="field">
                    <label>Wys. płyty cm</label>
                    <input type="number" value={m.panelHeight} min={H}
                      onChange={(e) => update(m.id, { panelHeight: Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label>Gr. płyty mm</label>
                    <input type="number" value={m.panelThick} min={8}
                      onChange={(e) => update(m.id, { panelThick: Number(e.target.value) })} />
                  </div>
                </>
              )}

              {m.door !== 'brak' && m.door !== 'szuflady' && m.kind !== 'regal' && m.kind !== 'przesuwne' && (
                <div className="field">
                  <label>Skrzydła</label>
                  <div className="toggle-group">
                    <button type="button" className={m.leaves === 1 ? 'active' : ''} onClick={() => update(m.id, { leaves: 1 })}>1</button>
                    <button type="button" className={m.leaves === 2 ? 'active' : ''} onClick={() => update(m.id, { leaves: 2 })}>2</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// kompatybilność ze starym importem
export function ModulePalette() {
  return null;
}

export { addModuleToList };
