/** Pusty stan — nic nie wybrane; użytkownik zaczyna od zera. */
export const EMPTY_CONFIG = {
  mode: '',
  type: '',
  layout: '',
  door: '',
  leaves: 1,
  panel: '',
  w: '',
  h: '',
  d: '',
  sections: '',
  shelves: '',
  thick: 18,
  back: 3,
  armA: '',
  armB: '',
  panelHeight: '',
  panelThick: 18,
  modWidth: '',
  modules: [],
  projectName: '',
  catalogSlug: '',
  topConstruction: '',
  frontCargo: true,
  rearReinforcement: false,
  cargoDepth: 8,
  drawerCount: 3,
  drawerStyle: 'srednia'
};

/** Domyślne wartości przy wczytywaniu zapisanego projektu (uzupełnienie brakujących pól). */
export const DEFAULT_CONFIG = {
  mode: 'single',
  type: 'wiszaca',
  layout: 'wiszaca',
  door: 'uchylne',
  leaves: 1,
  panel: 0,
  w: 60,
  h: 45,
  d: 30,
  sections: 1,
  shelves: 0,
  thick: 18,
  back: 3,
  armA: 60,
  armB: 60,
  panelHeight: 120,
  panelThick: 18,
  modWidth: 60,
  modules: [],
  projectName: 'Nowy projekt',
  catalogSlug: '',
  topConstruction: 'standard',
  frontCargo: true,
  rearReinforcement: false,
  cargoDepth: 8,
  drawerCount: 3,
  drawerStyle: 'srednia'
};

export function ToggleGroup({ options, value, onChange, disabledValues = [], className = '' }) {
  return (
    <div className={`toggle-group${className ? ` ${className}` : ''}`}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={value === opt.value ? 'active' : ''}
          disabled={disabledValues.includes(opt.value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
