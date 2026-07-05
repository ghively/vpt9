// Public barrel for the presentational component library. This is the design-sync
// entry: the bundle exposes every export here on window.VPTPanelKit.*.

export { Chip } from "./primitives/Chip";
export type { ChipProps } from "./primitives/Chip";
export { ToggleSquare } from "./primitives/ToggleSquare";
export type { ToggleSquareProps } from "./primitives/ToggleSquare";
export { Fader } from "./primitives/Fader";
export type { FaderProps } from "./primitives/Fader";
export { Button } from "./primitives/Button";
export type { ButtonProps } from "./primitives/Button";
export { Select } from "./primitives/Select";
export type { SelectProps, SelectOption } from "./primitives/Select";
export { TextField } from "./primitives/TextField";
export type { TextFieldProps } from "./primitives/TextField";
export { StatusLamp } from "./primitives/StatusLamp";
export type { StatusLampProps } from "./primitives/StatusLamp";

export { Faceplate } from "./Faceplate";
export type { FaceplateProps } from "./Faceplate";
export { AudioOwner } from "./AudioOwner";
export type { AudioOwnerProps, AudioOwnerScreen } from "./AudioOwner";
export { ChannelRack } from "./ChannelRack";
export type { ChannelRackProps } from "./ChannelRack";
export { LayerStrip } from "./LayerStrip";
export type { LayerStripProps, LayerNeighbors } from "./LayerStrip";
export { ConfidenceMonitor } from "./ConfidenceMonitor";
export type { ConfidenceMonitorProps, ConfidenceMonitorHandle } from "./ConfidenceMonitor";
export { WarpEditor } from "./WarpEditor";
export type { WarpEditorProps } from "./WarpEditor";
export { WarpHandle } from "./WarpHandle";
export type { WarpHandleProps } from "./WarpHandle";
export { PipWindows } from "./PipWindows";
export type { PipWindowsProps } from "./PipWindows";
export { PipBox } from "./PipBox";
export type { PipBoxProps } from "./PipBox";
export { PresetsBar } from "./PresetsBar";
export type { PresetsBarProps } from "./PresetsBar";
export { FxDrawer } from "./FxDrawer";
export type { FxDrawerProps } from "./FxDrawer";
export { CueList } from "./CueList";
export type { CueListProps } from "./CueList";
export { TimerBank } from "./TimerBank";
export type { TimerBankProps } from "./TimerBank";
export { LfoRack } from "./LfoRack";
export type { LfoRackProps } from "./LfoRack";
export { MidiMapPanel } from "./MidiMapPanel";
export type { MidiMapPanelProps } from "./MidiMapPanel";

// Preview/provider wrapper (design-sync cfg.provider) — not a card component itself.
export { VenueGround } from "./VenueGround";
export type { VenueGroundProps } from "./VenueGround";

export * from "./types";
