export interface AudioOwnerScreen {
    id: string;
    name: string;
}
export interface AudioOwnerProps {
    screens: AudioOwnerScreen[];
    /** The single screen currently allowed to un-mute; null if none. */
    ownerId: string | null;
    onSelect?: (screenId: string) => void;
}
/** Picks the one screen that owns audio (every other render client mutes itself). */
export declare function AudioOwner({ screens, ownerId, onSelect }: AudioOwnerProps): import("react").JSX.Element;
