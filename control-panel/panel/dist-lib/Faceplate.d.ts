import { ReactNode } from 'react';
export interface FaceplateProps {
    /** Center slot — the audio-owner picker in the app. */
    center?: ReactNode;
    /** Right slot — the status readout in the app. */
    right?: ReactNode;
}
/** The equipment faceplate: nameplate + breathing power lamp on the left, with center
 *  and right slots for the audio-owner picker and status readout. */
export declare function Faceplate({ center, right }: FaceplateProps): import("react").JSX.Element;
