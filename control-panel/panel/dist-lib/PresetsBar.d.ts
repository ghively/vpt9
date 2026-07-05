import { Preset } from './types';
export interface PresetsBarProps {
    presets: Preset[];
    onRecall?: (id: string) => void;
    onSave?: (name: string) => void;
}
/** Recall cue buttons plus a name field and save button for capturing the current scene. */
export declare function PresetsBar({ presets, onRecall, onSave }: PresetsBarProps): import("react").JSX.Element;
