import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Zap, 
  CreditCard, 
  History, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { UserCredit, CreditTransaction } from '../types';
import { getCreditBalance, getCreditTransactions, upgradeSubscription } from '../services/api';
import { CreditUpdateEventDetail } from '../utils/creditEvents';

interface CreditsCardProps {
  className?: string;
  onCreditUpdate?: (credits: UserCredit) => void;
}

const CreditsCard: React.FC<CreditsCardProps> = ({ className = '', onCreditUpdate }) => {
  const { t } = useTranslation();
  const [credits, setCredits] = useState<UserCredit | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load credit data
  const loadCredits = async () => {
    try {
      const result = await getCreditBalance();
      if (result.success && result.data) {
        setCredits(result.data);
        if (onCreditUpdate) {
          onCreditUpdate(result.data);
        }
      } else {
        setError(result.error || t('credits.loadError', 'Failed to load credits'));
      }
    } catch (err) {
      setError(t('credits.loadError', 'Failed to load credits'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load transaction history
  const loadTransactions = async () => {
    try {
      const result = await getCreditTransactions(20);
      if (result.success && result.data) {
        setTransactions(result.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  // Upgrade subscription
  const handleUpgrade = async (quota: number) => {
    setIsUpgrading(true);
    try {
      const result = await upgradeSubscription(quota);
      if (result.success && result.data) {
        setCredits(result.data);
        setShowUpgrade(false);
        if (onCreditUpdate) {
          onCreditUpdate(result.data);
        }
      } else {
        setError(result.error || t('credits.upgradeError', 'Failed to upgrade subscription'));
      }
    } catch (err) {
      setError(t('credits.upgradeError', 'Failed to upgrade subscription'));
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  // Listen for credit update events from other components
  useEffect(() => {
    const handleCreditUpdate = (event: CustomEvent<CreditUpdateEventDetail>) => {
      // Update credits when other components trigger credit changes
      loadCredits();
    };

    window.addEventListener('creditUpdate', handleCreditUpdate as EventListener);
    return () => window.removeEventListener('creditUpdate', handleCreditUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (showTransactions && transactions.length === 0) {
      loadTransactions();
    }
  }, [showTransactions]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-red-200 p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-4">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">{t('credits.errorTitle', 'Error Loading Credits')}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadCredits}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('credits.retry', 'Retry')}
        </button>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  // Calculate progress percentage
  const progressPercentage = credits.monthly_quota > 0 
    ? Math.min((credits.balance / credits.monthly_quota) * 100, 100)
    : credits.balance > 0 ? 100 : 0;

  // Determine status color
  const getStatusColor = () => {
    if (credits.balance < 10) return 'text-red-600';
    if (credits.balance < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (credits.balance < 10) return 'bg-red-500';
    if (credits.balance < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-2">
              <h3 className="text-sm font-semibold text-gray-900">{t('credits.title', 'Credits')}</h3>
              <p className="text-xs text-gray-500 capitalize">{t(`credits.status.${credits.subscription_status}`, credits.subscription_status.replace('_', ' '))}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowTransactions(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-xl font-bold ${getStatusColor()}`}>
              {credits.balance}
            </span>
            {credits.monthly_quota > 0 && (
              <span className="text-xs text-gray-500">
                / {credits.monthly_quota} {t('credits.credits', 'credits')}
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          {credits.monthly_quota > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          )}

          {/* Status Messages */}
          {credits.balance < 10 && (
            <div className="flex items-center text-red-600 text-xs mb-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>{t('credits.lowBalance', 'Low balance')}</span>
            </div>
          )}
          
          {credits.subscription_status === 'free_trial' && credits.balance > 30 && (
            <div className="flex items-center text-blue-600 text-xs mb-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>{t('credits.freeTrial', 'Free trial')}</span>
            </div>
          )}
        </div>

        {/* Renewal Date */}
        {credits.renewal_date && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {t('credits.renews', 'Renews')} {new Date(credits.renewal_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {credits.subscription_status === 'free_trial' || credits.balance < 50 ? (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('credits.upgrade', 'Upgrade')}
            </button>
          ) : (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              {t('credits.manage', 'Manage')}
            </button>
          )}
        </div>
      </div>

      {/* Transaction History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('credits.transactionHistory', 'Transaction History')}</h3>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('credits.noTransactions', 'No transactions yet')}</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        {transaction.tool_slug && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded mt-1">
                            {transaction.tool_slug}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('credits.balance', 'Balance')}: {transaction.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('credits.upgradeSubscription', 'Upgrade Subscription')}</h3>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => handleUpgrade(500)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('credits.plans.starter.title', 'Starter Plan')}</h4>
                      <p className="text-sm text-gray-500">{t('credits.plans.starter.description', '500 credits/month')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">$29/mo</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => handleUpgrade(1000)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('credits.plans.professional.title', 'Professional Plan')}</h4>
                      <p className="text-sm text-gray-500">{t('credits.plans.professional.description', '1000 credits/month')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">$49/mo</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => handleUpgrade(2500)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('credits.plans.business.title', 'Business Plan')}</h4>
                      <p className="text-sm text-gray-500">{t('credits.plans.business.description', '2500 credits/month')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">$99/mo</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {isUpgrading && (
                <div className="flex items-center justify-center mt-6 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">{t('credits.processingUpgrade', 'Processing upgrade...')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditsCard;