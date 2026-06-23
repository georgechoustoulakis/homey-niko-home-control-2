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

export type BaseAction = {
  readonly types: NikoType;
  readonly models: NikoModel[];
};

export const LIGHT_ACTION = {
  types: 'action',
  models: ['light', 'socket', 'switched-fan', 'switched-generic'],
} as const satisfies BaseAction;

export type LIGHT_PAYLOAD = {
  Properties: [{ Status: 'On' | 'Off' }];
};

export const MOTOR_ACTION = {
  types: 'action',
  models: ['rolldownshutter', 'sunblind', 'gate', 'venetianblind'],
} as const satisfies BaseAction;

export type MOTOR_PAYLOAD = {
  Properties: [
    { Action: 'Open' | 'Close' | 'Stop' },
    { Position: string },
    { Aligned: 'True' | 'False' },
    { Moving: 'True' | 'False' },
  ];
};

export const ALL_OFF_ACTION = {
  types: 'action',
  models: ['alloff'],
} as const satisfies BaseAction;

export type ALL_OFF_PAYLOAD = {
  Properties: [{ BasicState: 'On' | 'Off' | 'Triggered' }, { AllOffActive: 'True' | 'False' }];
};

export const MOOD_ACTION = {
  types: 'action',
  models: ['comfort'],
} as const satisfies BaseAction;

export type MOOD_PAYLOAD = {
  Properties: [{ BasicState: 'On' | 'Off' | 'Triggered' }, { MoodActive: 'True' | 'False' }];
};

export const FAN_ACTION = {
  types: 'action',
  models: ['fan'],
} as const satisfies BaseAction;

export type FAN_PAYLOAD = {
  Properties: [{ FanSpeed: 'Low' | 'Medium' | 'High' | 'Boost' }];
};

export const DIMMER_ACTION = {
  types: 'action',
  models: ['fan'],
} as const satisfies BaseAction;

export type DIMMER_PAYLOAD = {
  Properties: [{ Status: 'On' | 'Off' }, { Brightness: string }];
};

export const THERMO_SWITCH_X1 = {
  types: 'multisensor',
  models: ['thermoswitchx1', 'thermoswitchx1feedback'],
} as const satisfies BaseAction;

export const THERMO_SWITCH_X2 = {
  types: 'multisensor',
  models: ['thermoswitchx2feedback'],
} as const satisfies BaseAction;

export const THERMO_SWITCH_X4 = {
  types: 'multisensor',
  models: ['thermoswitchx4feedback', 'thermoventilationcontrollerfeedback'],
} as const satisfies BaseAction;

export const THERMO_SWITCH_X6 = {
  types: 'multisensor',
  models: ['thermoswitchx6feedback'],
} as const satisfies BaseAction;

export type THERMO_SWITCH_PAYLOAD = {
  Properties: [{ AmbientTemperature: string }, { Humidity: string }];
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
  [NikoDeviceKey.LIGHT]: LIGHT_ACTION,
  [NikoDeviceKey.MOTOR]: MOTOR_ACTION,
  [NikoDeviceKey.ALL_OFF]: ALL_OFF_ACTION,
  [NikoDeviceKey.MOOD]: MOOD_ACTION,
  [NikoDeviceKey.FAN]: FAN_ACTION,
  [NikoDeviceKey.DIMMER]: DIMMER_ACTION,
  [NikoDeviceKey.THERMO_SWITCH_X1]: THERMO_SWITCH_X1,
  [NikoDeviceKey.THERMO_SWITCH_X2]: THERMO_SWITCH_X2,
  [NikoDeviceKey.THERMO_SWITCH_X4]: THERMO_SWITCH_X4,
  [NikoDeviceKey.THERMO_SWITCH_X6]: THERMO_SWITCH_X6,
} as const satisfies Record<NikoDeviceKey, BaseAction>;

export interface NikoPayloadRegistry extends Record<NikoDeviceKey, { Properties: any }> {
  [NikoDeviceKey.LIGHT]: LIGHT_PAYLOAD;
  [NikoDeviceKey.MOTOR]: MOTOR_PAYLOAD;
  [NikoDeviceKey.ALL_OFF]: ALL_OFF_PAYLOAD;
  [NikoDeviceKey.MOOD]: MOOD_PAYLOAD;
  [NikoDeviceKey.FAN]: FAN_PAYLOAD;
  [NikoDeviceKey.DIMMER]: DIMMER_PAYLOAD;
  [NikoDeviceKey.THERMO_SWITCH_X1]: THERMO_SWITCH_PAYLOAD;
  [NikoDeviceKey.THERMO_SWITCH_X2]: THERMO_SWITCH_PAYLOAD;
  [NikoDeviceKey.THERMO_SWITCH_X4]: THERMO_SWITCH_PAYLOAD;
  [NikoDeviceKey.THERMO_SWITCH_X6]: THERMO_SWITCH_PAYLOAD;
}

export type AllNikoActions = (typeof NIKO_ACTIONS)[keyof typeof NIKO_ACTIONS];
