type FollowUpIntent =
  | 'clarify_goal'
  | 'understand_constraint'
  | 'preference_depth'
  | 'confidence_check'
  | 'no_followup';

export type FollowUpQuestion = {
  intent: FollowUpIntent;
  question: string;
  options?: string[];
};


