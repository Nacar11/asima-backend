export const OPEN_PLAY_DEFAULT_SKILL_LEVEL_CODE = 'all_levels';

export const OPEN_PLAY_SKILL_LEVEL_LABELS: Record<string, string> = {
  all_levels: 'All Levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const formatOpenPlaySkillLevelLabel = (
  skillLevelCode?: string | null,
): string => {
  const normalizedCode = String(skillLevelCode || '')
    .trim()
    .toLowerCase();

  if (!normalizedCode) {
    return OPEN_PLAY_SKILL_LEVEL_LABELS[OPEN_PLAY_DEFAULT_SKILL_LEVEL_CODE];
  }

  return (
    OPEN_PLAY_SKILL_LEVEL_LABELS[normalizedCode] ??
    normalizedCode
      .split(/[_-]+/)
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ')
  );
};
