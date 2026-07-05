import { ReactNode } from 'react';
export interface VenueGroundProps {
    children?: ReactNode;
}
/** Puts a component on the venue-black ground the whole panel is designed for. The design
 *  system is dark-only, so every component is meant to be seen on this surface — design-sync
 *  wires this as cfg.provider so each preview card renders on the right ground instead of a
 *  bare white card (and matches the Storybook reference's venue background). */
export declare function VenueGround({ children }: VenueGroundProps): import("react").JSX.Element;
