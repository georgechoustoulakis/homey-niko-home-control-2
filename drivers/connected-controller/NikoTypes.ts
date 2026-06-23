export const NIKO_MODELS = [
  'light',
  'socket',
  'switched-fan',
  'switched-generic',
  'dimmer',
  'rolldownshutter',
  'sunblind',
  'gate',
  'venetianblind',
  'alloff',
  'generic',
  'flag',
  'thermoswitchx1',
  'thermoswitchx1feedback',
  'thermoswitchx2feedback',
  'thermoswitchx4feedback',
  'thermoswitchx6feedback',
  'thermoventilationcontrollerfeedback',
  'overallcomfort',
  'fan',
  'comfort',
] as const;

export const NIKO_TYPES = ['relay', 'dimmer', 'motor', 'action', 'multisensor'] as const;

export type NikoType = (typeof NIKO_TYPES)[number];
export type NikoModel = (typeof NIKO_MODELS)[number];

export type NikoBoolean = 'True' | 'False';
export type NikoOnOff = 'On' | 'Off';
export type NikoTriggerable = NikoOnOff | 'Triggered';

export type BaseAction = {
  readonly types: NikoType;
  readonly models: NikoModel[];
};

export enum NikoDeviceKey {
  LIGHT = 'LIGHT',
  MOTOR = 'MOTOR',
  ALL_OFF = 'ALL_OFF',
  MOOD = 'MOOD',
  FAN = 'FAN',
  DIMMER = 'DIMMER',
  THERMO_SWITCH_X1 = 'THERMO_SWITCH_X1',
  THERMO_SWITCH_X2 = 'THERMO_SWITCH_X2',
  THERMO_SWITCH_X4 = 'THERMO_SWITCH_X4',
  THERMO_SWITCH_X6 = 'THERMO_SWITCH_X6',
}

export const NIKO_ACTIONS = {
  [NikoDeviceKey.LIGHT]: {
    types: 'action',
    models: ['light', 'socket', 'switched-fan', 'switched-generic'],
  },
  [NikoDeviceKey.MOTOR]: {
    types: 'action',
    models: ['rolldownshutter', 'sunblind', 'gate', 'venetianblind'],
  },
  [NikoDeviceKey.ALL_OFF]: {
    types: 'action',
    models: ['alloff'],
  },
  [NikoDeviceKey.MOOD]: {
    types: 'action',
    models: ['comfort'],
  },
  [NikoDeviceKey.FAN]: {
    types: 'action',
    models: ['fan'],
  },
  [NikoDeviceKey.DIMMER]: {
    types: 'action',
    models: ['fan'],
  },
  [NikoDeviceKey.THERMO_SWITCH_X1]: {
    types: 'multisensor',
    models: ['thermoswitchx1', 'thermoswitchx1feedback'],
  },
  [NikoDeviceKey.THERMO_SWITCH_X2]: {
    types: 'multisensor',
    models: ['thermoswitchx2feedback'],
  },
  [NikoDeviceKey.THERMO_SWITCH_X4]: {
    types: 'multisensor',
    models: ['thermoswitchx4feedback', 'thermoventilationcontrollerfeedback'],
  },
  [NikoDeviceKey.THERMO_SWITCH_X6]: {
    types: 'multisensor',
    models: ['thermoswitchx6feedback'],
  },
} as const satisfies Record<NikoDeviceKey, BaseAction>;

export interface NikoPayloadRegistry extends Record<NikoDeviceKey, { Properties: any }> {
  [NikoDeviceKey.LIGHT]: {
    Properties: [{ Status: NikoOnOff }];
  };
  [NikoDeviceKey.MOTOR]: {
    Properties: [
      { Action: 'Open' | 'Close' | 'Stop' },
      { Position: string },
      { Aligned: NikoBoolean },
      { Moving: NikoBoolean },
    ];
  };
  [NikoDeviceKey.ALL_OFF]: {
    Properties: [{ BasicState: NikoTriggerable }, { AllOffActive: NikoBoolean }];
  };
  [NikoDeviceKey.MOOD]: {
    Properties: [{ BasicState: NikoTriggerable }, { MoodActive: NikoBoolean }];
  };
  [NikoDeviceKey.FAN]: {
    Properties: [{ FanSpeed: 'Low' | 'Medium' | 'High' | 'Boost' }];
  };
  [NikoDeviceKey.DIMMER]: {
    Properties: [{ Status: NikoOnOff }, { Brightness: string }];
  };
  [NikoDeviceKey.THERMO_SWITCH_X1]: {
    Properties: [{ AmbientTemperature: string }, { Humidity: string }];
  };
}

export type AllNikoActions = (typeof NIKO_ACTIONS)[keyof typeof NIKO_ACTIONS];
