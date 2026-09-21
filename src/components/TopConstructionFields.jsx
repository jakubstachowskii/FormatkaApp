import React from 'react';
import { ToggleGroup } from './ToggleGroup.jsx';

export function TopConstructionFields({ cfg, patch, inputVal, numOrEmpty }) {
  const top = cfg.topConstruction || '';
  const isCounter = top === 'countertop';

  return (
    <>
      <div className="form-span-12 field">
        <label>Konstrukcja górna</label>
        <ToggleGroup
          className="toggle-group--wrap"
          value={top}
          onChange={(topConstruction) => patch({
            topConstruction,
            ...(topConstruction === 'countertop' ? { frontCargo: cfg.frontCargo !== false } : {})
          })}
          options={[
            { value: 'standard', label: 'Wieńce (góra + dół)' },
            { value: 'countertop', label: 'Pod blat kuchenny' }
          ]}
        />
        <div className="hint">
          Szafki pod blat nie mają wieńca górnego (WG). Blat opiera się na cargach — poprzeczkach
          przykręcanych między bokami; opcjonalnie wzmocnienie tylne stabilizuje korpus od pleców.
        </div>
      </div>

      {isCounter && (
        <>
          <div className="form-span-3 field">
            <label htmlFor="cargoDepth">Głęb. cargi cm</label>
            <input
              id="cargoDepth"
              type="number"
              value={inputVal(cfg.cargoDepth ?? 8)}
              min={4}
              max={25}
              step={0.5}
              onChange={(e) => patch({ cargoDepth: numOrEmpty(e.target.value) || 8 })}
            />
            <div className="hint">Typowo 6–10 cm.</div>
          </div>
          <div className="form-span-12 field">
            <label>Carga przednia (pod blat)</label>
            <ToggleGroup
              className="toggle-group--wrap"
              value={cfg.frontCargo !== false ? 1 : 0}
              onChange={(v) => patch({ frontCargo: v === 1 })}
              options={[
                { value: 1, label: 'Tak — montaż blatu' },
                { value: 0, label: 'Brak' }
              ]}
            />
          </div>
          <div className="form-span-12 field">
            <label>Wzmocnienie tylne</label>
            <ToggleGroup
              className="toggle-group--wrap"
              value={cfg.rearReinforcement ? 1 : 0}
              onChange={(v) => patch({ rearReinforcement: v === 1 })}
              options={[
                { value: 1, label: 'Tak' },
                { value: 0, label: 'Nie' }
              ]}
            />
          </div>
        </>
      )}
    </>
  );
}
