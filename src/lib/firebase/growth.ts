import { FeedbackEntry, Invite, TransactionEvent, OnboardingEvent } from '@/types/growth';

const MOCK_FEEDBACK_KEY = 'trustlance_mock_feedback_growth';
const MOCK_INVITES_KEY = 'trustlance_mock_invites';
const MOCK_TX_EVENTS_KEY = 'trustlance_mock_tx_events';
const MOCK_ONBOARDING_KEY = 'trustlance_mock_onboarding_events';

function getLocalData<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalData<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const submitFeedback = async (feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>) => {
  const local = getLocalData<FeedbackEntry>(MOCK_FEEDBACK_KEY);
  const id = "feedback_" + Math.random().toString(36).substring(2, 11);
  const newEntry: FeedbackEntry = {
    ...feedback,
    id,
    createdAt: new Date(),
  };
  saveLocalData(MOCK_FEEDBACK_KEY, [...local, newEntry]);
  return id;
};

export const createInvite = async (invite: Omit<Invite, 'id' | 'createdAt'>) => {
  const local = getLocalData<Invite>(MOCK_INVITES_KEY);
  const id = "invite_" + Math.random().toString(36).substring(2, 11);
  const newEntry: Invite = {
    ...invite,
    id,
    createdAt: new Date(),
  };
  saveLocalData(MOCK_INVITES_KEY, [...local, newEntry]);
  return id;
};

export const logTransactionEvent = async (event: Omit<TransactionEvent, 'id' | 'timestamp'>) => {
  const local = getLocalData<TransactionEvent>(MOCK_TX_EVENTS_KEY);
  const id = "tx_event_" + Math.random().toString(36).substring(2, 11);
  const newEntry: TransactionEvent = {
    ...event,
    id,
    timestamp: new Date(),
  };
  saveLocalData(MOCK_TX_EVENTS_KEY, [...local, newEntry]);
  return id;
};

export const logOnboardingEvent = async (event: Omit<OnboardingEvent, 'id' | 'timestamp'>) => {
  const local = getLocalData<OnboardingEvent>(MOCK_ONBOARDING_KEY);
  const id = "onboard_" + Math.random().toString(36).substring(2, 11);
  const newEntry: OnboardingEvent = {
    ...event,
    id,
    timestamp: new Date(),
  };
  saveLocalData(MOCK_ONBOARDING_KEY, [...local, newEntry]);
  return id;
};

export const getTransactionEvents = async (contractId: string) => {
  const local = getLocalData<TransactionEvent>(MOCK_TX_EVENTS_KEY);
  return local
    .filter(e => e.contractId === contractId)
    .map(e => ({
      ...e,
      timestamp: new Date(e.timestamp as any)
    }))
    .sort((a, b) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime());
};
