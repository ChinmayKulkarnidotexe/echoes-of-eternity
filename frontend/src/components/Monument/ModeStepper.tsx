import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ExperienceMode } from '../../types';
import { MODE_ICONS } from './icons';

interface Props {
  active: ExperienceMode;
  /** Modes the visitor has already been through, so they can go back to one. */
  unlocked: Set<ExperienceMode>;
  onSelect: (mode: ExperienceMode) => void;
}

const MODES: { id: ExperienceMode; label: string; caption: string; Icon: LucideIcon }[] = [
  { id: 'aerial', label: 'Aerial Orbit', caption: 'From above', Icon: MODE_ICONS.aerial },
  { id: 'tour', label: 'Guided Walk', caption: 'Three minutes', Icon: MODE_ICONS.tour },
  { id: 'freeroam', label: 'Free Roam', caption: 'Explore at will', Icon: MODE_ICONS.freeroam },
];

/**
 * The three-stage rail across the top of the experience.
 *
 * It doubles as navigation: stages the visitor has already seen stay clickable,
 * which matters when someone demoing wants to jump straight back to the orbit
 * without sitting through the walk again.
 */
export const ModeStepper: React.FC<Props> = ({ active, unlocked, onSelect }) => (
  <nav
    className="flex items-center gap-1 rounded-2xl p-1"
    style={{
      background: 'rgba(10,8,5,0.72)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(18px)',
    }}
    aria-label="Experience stages"
  >
    {MODES.map((mode, index) => {
      const isActive = mode.id === active;
      const isUnlocked = unlocked.has(mode.id);
      return (
        <React.Fragment key={mode.id}>
          {index > 0 && (
            <span
              className="w-4 h-px shrink-0"
              style={{
                background: isUnlocked ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)',
              }}
              aria-hidden="true"
            />
          )}
          <button
            id={`mode-${mode.id}`}
            onClick={() => isUnlocked && onSelect(mode.id)}
            disabled={!isUnlocked}
            aria-current={isActive ? 'step' : undefined}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
              isUnlocked ? 'cursor-pointer' : 'cursor-default'
            }`}
            style={
              isActive
                ? {
                    background: 'rgba(212,175,55,0.14)',
                    border: '1px solid rgba(212,175,55,0.35)',
                  }
                : { border: '1px solid transparent' }
            }
            title={isUnlocked ? `Go to ${mode.label}` : `${mode.label} unlocks as the tour plays`}
          >
            <mode.Icon
              className="w-3.5 h-3.5 shrink-0 transition-colors"
              strokeWidth={1.5}
              style={{ color: isActive ? '#f0d894' : isUnlocked ? '#9d9383' : '#4e483f' }}
              aria-hidden="true"
            />
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span
                className="text-[11px] font-medium tracking-wide transition-colors"
                style={{
                  color: isActive ? '#f0d894' : isUnlocked ? '#b9ad96' : '#5a5349',
                }}
              >
                {mode.label}
              </span>
              <span
                className="text-[9px] tracking-wide"
                style={{ color: isActive ? 'rgba(212,175,55,0.6)' : '#5a5349' }}
              >
                {mode.caption}
              </span>
            </span>
          </button>
        </React.Fragment>
      );
    })}
  </nav>
);
