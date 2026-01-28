import { api } from './apiClient';
import { getAnonymousId } from './anonymousId';

type TrackEventInput = {
  event_name:
    | 'app_opened'
    | 'questionnaire_started'
    | 'questionnaire_completed'
    | 'recommendation_viewed'
    | 'facility_clicked';
  screen?: string;
  metadata?: Record<string, any>;
  event_version?: number;
};

export async function trackEvent(input: TrackEventInput) {
  try {
    const anonymous_id = await getAnonymousId();

    await api('/events-track', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        anonymous_id,
      }),
    });
  } catch {
    // Fail silently — analytics must never break UX
  }
}
