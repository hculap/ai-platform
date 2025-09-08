import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Zap,
  PenTool,
  Target,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  ChevronDown,
  Bot,
  Lightbulb
} from 'lucide-react';
import { getScripts, getUserStyles, getScriptsCount, getOffers, getCampaigns, getScript, updateScript, deleteScript } from '../services/api';
import { Offer, Campaign } from '../types';
import StyleCopyTool from './StyleCopyTool';
import ScriptHooksGenerator from './ScriptHooksGenerator';
import ScriptGenerator from './ScriptGenerator';

interface Script {
  id: string;
  business_profile_id: string;
  user_id: string;
  style_id?: string;
  title: string;
  content: string;
  script_type: string;
  offer_id?: string;
  campaign_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserStyle {
  id: string;
  user_id: string;
  language: string;
  style_name?: string;
  sample_texts?: string[] | string;
  style_card: any;
  created_at: string;
  updated_at: string;
}


interface ScriptsProps {
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (newToken: string) => void;
  onScriptsChanged?: () => void;
}

const Scripts: React.FC<ScriptsProps> = ({ 
  businessProfileId, 
  authToken, 
  onTokenRefreshed,
  onScriptsChanged 
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [scripts, setScripts] = useState<Script[]>([]);
  const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scripts' | 'generator' | 'hooks' | 'styleclone'>('scripts');

  // Load data
  const loadData = useCallback(async () => {
    if (!businessProfileId || !authToken) return;
    
    try {
      setIsLoading(true);
      
      // Load all necessary data in parallel
      const [scriptsResult, stylesResult, offersResult, campaignsResult] = await Promise.all([
        getScripts(businessProfileId, authToken),
        getUserStyles(authToken, businessProfileId),
        getOffers(authToken, businessProfileId),
        getCampaigns(authToken, businessProfileId)
      ]);
      
      if (scriptsResult.success) {
        setScripts(scriptsResult.data || []);
      }
      
      if (stylesResult.success) {
        setUserStyles(stylesResult.data || []);
      }
      
      if (offersResult.success) {
        setOffers(offersResult.data || []);
      }
      
      if (campaignsResult.success) {
        setCampaigns(campaignsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading scripts data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, authToken]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle tab navigation based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/scripts/generate')) {
      setActiveTab('generator');
    } else if (path.includes('/scripts/hooks')) {
      setActiveTab('hooks');
    } else if (path.includes('/scripts/style-clone')) {
      setActiveTab('styleclone');
    } else {
      setActiveTab('scripts');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'scripts' | 'generator' | 'hooks' | 'styleclone') => {
    setActiveTab(tab);
    if (tab === 'scripts') {
      navigate('/dashboard/scripts');
    } else if (tab === 'generator') {
      navigate('/dashboard/scripts/generate');
    } else if (tab === 'hooks') {
      navigate('/dashboard/scripts/hooks');
    } else if (tab === 'styleclone') {
      navigate('/dashboard/scripts/style-clone');
    }
  };

  // Handle refresh after changes
  const handleDataChange = useCallback(() => {
    loadData();
    if (onScriptsChanged) {
      onScriptsChanged();
    }
  }, [loadData, onScriptsChanged]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('scripts.loading', 'Ładowanie skryptów...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="relative mb-8">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg"></div>
          
          <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t('scripts.title', 'Skrypty AI')}
                  </h1>
                  <p className="text-gray-600">
                    {t('scripts.subtitle', 'Twórz treści z narzędziami do pisania opartymi na AI')}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleTabChange('scripts')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'scripts'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('scripts.scriptsTab', 'Skrypty')}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('generator')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'generator'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  {t('scripts.scriptWriter', 'Pisarz Skryptów')}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('hooks')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'hooks'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('scripts.generateHooks', 'Generuj Haki')}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('styleclone')}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'styleclone'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  {t('scripts.styleClone', 'Style Clone')}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Routed Content */}
        <Routes>
          <Route path="/" element={
            <ScriptsListView 
              scripts={scripts}
              onDataChange={handleDataChange}
              businessProfileId={businessProfileId}
              authToken={authToken}
              onTokenRefreshed={onTokenRefreshed}
              userStyles={userStyles}
              t={t}
            />
          } />
          <Route path="/generate" element={
            <ScriptGenerator
              businessProfileId={businessProfileId}
              authToken={authToken}
              onTokenRefreshed={onTokenRefreshed}
              userStyles={userStyles.map(style => ({
                id: style.id,
                style_name: style.style_name || 'Unnamed Style',
                language: style.language,
                content_types: Array.isArray(style.sample_texts) ? ['general'] : ['general']
              }))}
              offers={offers.map(offer => ({
                id: offer.id,
                name: offer.name,
                type: offer.type,
                description: offer.description,
                price: offer.price?.toString(),
                unit: offer.unit
              }))}
              campaigns={campaigns}
            />
          } />
          <Route path="/hooks" element={
            <ScriptHooksGenerator
              businessProfileId={businessProfileId}
              authToken={authToken}
              onTokenRefreshed={onTokenRefreshed}
            />
          } />
          <Route path="/style-clone" element={
            <StyleCopyTool
              userStyles={userStyles}
              authToken={authToken}
              onStyleCreated={handleDataChange}
              onTokenRefreshed={onTokenRefreshed}
              businessProfileId={businessProfileId}
            />
          } />
        </Routes>
      </div>
    </div>
  );
};

// Script Edit Modal Component
interface ScriptEditModalProps {
  script: Script;
  isOpen: boolean;
  onClose: () => void;
  onSave: (scriptData: any) => void;
  isLoading: boolean;
  t: any;
}

const ScriptEditModal: React.FC<ScriptEditModalProps> = ({ 
  script, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading,
  t 
}) => {
  const [editData, setEditData] = useState({
    title: script.title,
    content: script.content,
    script_type: script.script_type,
    status: script.status
  });

  const scriptTypes = [
    { value: 'post', label: t('scripts.post', 'Social Media Post') },
    { value: 'blog', label: t('scripts.blog', 'Blog Post') },
    { value: 'script_youtube', label: t('scripts.script_youtube', 'YouTube Script') },
    { value: 'script_tiktok_reel', label: t('scripts.script_tiktok_reel', 'TikTok/Reel Script') },
    { value: 'script_vsl', label: t('scripts.script_vsl', 'VSL Script') },
    { value: 'general', label: t('scripts.general', 'General Content') }
  ];

  const statuses = [
    { value: 'draft', label: t('scripts.draft', 'Draft') },
    { value: 'published', label: t('scripts.published', 'Published') },
    { value: 'archived', label: t('scripts.archived', 'Archived') }
  ];

  const handleSave = () => {
    onSave(editData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('scripts.edit', 'Edit Script')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scripts.title', 'Title')}
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scripts.type', 'Type')}
                </label>
                <select
                  value={editData.script_type}
                  onChange={(e) => setEditData(prev => ({ ...prev, script_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {scriptTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scripts.status', 'Status')}
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scripts.content', 'Content')}
              </label>
              <textarea
                value={editData.content}
                onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading || !editData.title.trim() || !editData.content.trim()}
          >
            {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Scripts List View Component
interface ScriptsListViewProps {
  scripts: Script[];
  onDataChange: () => void;
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (token: string) => void;
  userStyles: UserStyle[];
  t: any;
}

const ScriptsListView: React.FC<ScriptsListViewProps> = ({
  scripts,
  onDataChange,
  businessProfileId,
  authToken,
  onTokenRefreshed,
  userStyles,
  t
}) => {
  // State for modals and selected script
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handler functions for script actions
  const handlePreview = async (script: Script) => {
    setSelectedScript(script);
    setShowPreview(true);
  };

  const handleEdit = async (script: Script) => {
    setSelectedScript(script);
    setShowEdit(true);
  };

  const handleDelete = async (script: Script) => {
    setSelectedScript(script);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScript) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteScript(selectedScript.id, authToken);
      
      if (result.success) {
        setSuccess(t('scripts.deleteSuccess', 'Script deleted successfully'));
        setShowDeleteConfirm(false);
        setSelectedScript(null);
        onDataChange(); // Refresh the scripts list
      } else {
        setError(result.error || 'Failed to delete script');
      }
    } catch (err) {
      setError('Failed to delete script');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScript = async (scriptData: any) => {
    if (!selectedScript) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updateScript(selectedScript.id, scriptData, authToken);
      
      if (result.success) {
        setSuccess(t('scripts.updateSuccess', 'Script updated successfully'));
        setShowEdit(false);
        setSelectedScript(null);
        onDataChange(); // Refresh the scripts list
      } else {
        setError(result.error || 'Failed to update script');
      }
    } catch (err) {
      setError('Failed to update script');
    } finally {
      setIsLoading(false);
    }
  };

  if (scripts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('scripts.noScripts', 'Brak skryptów')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('scripts.noScriptsDesc', 'Zacznij tworzyć skrypty używając Pisarza Skryptów lub Generatora Haków')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Scripts Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('scripts.yourScripts', 'Twoje Skrypty')} ({scripts.length})
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {t('scripts.scriptsDesc', 'Zarządzaj swoimi wygenerowanymi skryptami')}
        </p>
      </div>

      {/* Scripts List */}
      <div className="p-6">
        <div className="grid gap-4">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">{script.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {script.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {t(`scripts.${script.script_type}`, script.script_type)}
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                      {t(`scripts.${script.status}`, script.status)}
                    </span>
                    <span>
                      {new Date(script.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => handlePreview(script)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title={t('scripts.preview', 'Preview script')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(script)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title={t('scripts.edit', 'Edit script')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(script)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title={t('scripts.delete', 'Delete script')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <X className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            {success}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('scripts.preview', 'Preview Script')}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scripts.title', 'Title')}
                  </label>
                  <p className="text-gray-900 font-medium">{selectedScript.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scripts.type', 'Type')}
                  </label>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {t(`scripts.${selectedScript.script_type}`, selectedScript.script_type)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scripts.status', 'Status')}
                  </label>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {t(`scripts.${selectedScript.status}`, selectedScript.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scripts.content', 'Content')}
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-900">
                    {selectedScript.content}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scripts.createdAt', 'Created At')}
                  </label>
                  <p className="text-gray-600">
                    {new Date(selectedScript.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                {t('common.close', 'Close')}
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleEdit(selectedScript);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('scripts.edit', 'Edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('scripts.confirmDelete', 'Confirm Delete')}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {t('scripts.confirmDeleteMessage', 'Are you sure you want to delete this script? This action cannot be undone.')}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-6">
                "{selectedScript.title}"
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedScript(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isLoading}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? t('common.deleting', 'Deleting...') : t('scripts.delete', 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedScript && (
        <ScriptEditModal
          script={selectedScript}
          isOpen={showEdit}
          onClose={() => {
            setShowEdit(false);
            setSelectedScript(null);
          }}
          onSave={handleUpdateScript}
          isLoading={isLoading}
          t={t}
        />
      )}
    </div>
  );
};

export default Scripts;