/**
 * Credit update event system for real-time UI updates
 */

export const CREDIT_UPDATE_EVENT = 'creditUpdate';

export interface CreditUpdateEventDetail {
  userId: string;
  newBalance: number;
  toolSlug?: string;
  deductedAmount?: number;
}

/**
 * Dispatch a credit update event to notify all listening components
 */
export const dispatchCreditUpdate = (detail: CreditUpdateEventDetail) => {
  const event = new CustomEvent(CREDIT_UPDATE_EVENT, { detail });
  window.dispatchEvent(event);
};

/**
 * Hook for listening to credit update events
 */
export const useCreditUpdateListener = (callback: (detail: CreditUpdateEventDetail) => void) => {
  const handleCreditUpdate = (event: CustomEvent<CreditUpdateEventDetail>) => {
    callback(event.detail);
  };

  return {
    subscribe: () => {
      window.addEventListener(CREDIT_UPDATE_EVENT, handleCreditUpdate as EventListener);
    },
    unsubscribe: () => {
      window.removeEventListener(CREDIT_UPDATE_EVENT, handleCreditUpdate as EventListener);
    }
  };
};