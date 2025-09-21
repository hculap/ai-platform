import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Plus, 
  Search, 
  X,
  Eye,
  Edit3,
  Trash2,
  Check,
  PenTool,
  Target,
  Bot,
  Palette,
  Activity
} from 'lucide-react';
import { getScripts, getUserStyles, getOffers, getCampaigns, updateScript, deleteScript } from '../services/api';
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
  
  // Core data state
  const [scripts, setScripts] = useState<Script[]>([]);
  const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  
  // Modal state
  const [modals, setModals] = useState({
    styleClone: false,
    hookGenerator: false,
    scriptCreator: false,
    preview: false
  });
  
  // Modal data
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [prefilledHook, setPrefilledHook] = useState<string>('');

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

  // Filter scripts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredScripts(scripts);
    } else {
      const filtered = scripts.filter(script =>
        script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.script_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredScripts(filtered);
    }
  }, [scripts, searchQuery]);

  // Modal management functions
  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    // Reset modal data when closing
    if (modalName === 'preview') {
      setSelectedScript(null);
    }
    if (modalName === 'scriptCreator') {
      setPrefilledHook('');
    }
  };


  // Handle refresh after changes
  const handleDataChange = useCallback(() => {
    loadData();
    if (onScriptsChanged) {
      onScriptsChanged();
    }
  }, [loadData, onScriptsChanged]);

  // Script action handlers
  const handleScriptView = (script: Script) => {
    setSelectedScript(script);
    openModal('preview');
  };

  const handleHookCreated = (hook: string) => {
    setPrefilledHook(hook);
    closeModal('hookGenerator');
    openModal('scriptCreator');
  };

  const handleBackToHookGenerator = () => {
    closeModal('scriptCreator');
    openModal('hookGenerator');
  };

  const handleStyleCreated = () => {
    closeModal('styleClone');
    loadData(); // Refresh styles
  };

  const handleScriptCreated = () => {
    loadData(); // Refresh scripts list (but keep modal open)
  };
  
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
    <div className="h-full">
      {/* Modern Header Panel */}
      <div className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-100/50 backdrop-blur-sm mb-8 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-gray-100/25 bg-[size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/40 to-transparent rounded-full blur-3xl"></div>
        
        {/* Content with relative positioning */}
        <div className="relative p-8">
          {/* Header Section - Title and Stats */}
          <div className="flex justify-between items-center mb-8">
            {/* Left - Title and Icon */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {t('scripts.title', 'Asystent Pisarski AI')}
                </h1>
                <p className="text-lg text-gray-600 font-medium mt-1">
                  {t('scripts.subtitle', 'Twórz treści z narzędziami AI')}
                </p>
              </div>
            </div>

            {/* Right - Scripts Count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {filteredScripts.length}
                  </p>
                  <p className="text-xs text-gray-500">{t('scripts.totalScripts', 'Łączne Skrypty')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions Section */}
          <div className="flex justify-between items-center gap-4 mb-2">
            {/* Left - Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('scripts.searchPlaceholder', 'Search scripts...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 font-medium rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Action Buttons */}
            <div className="flex gap-3 ml-4">
              <button
                onClick={() => openModal('styleClone')}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Palette className="w-4 h-4" />
                <span>{t('scripts.cloneStyle', 'Klonuj Styl')}</span>
              </button>
              <button
                onClick={() => openModal('hookGenerator')}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Target className="w-4 h-4" />
                <span>{t('scripts.generateHook', 'Generuj Hook')}</span>
              </button>
              <button
                onClick={() => openModal('scriptCreator')}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <PenTool className="w-4 h-4" />
                <span>{t('scripts.createScript', 'Utwórz Skrypt')}</span>
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          <div className="min-h-[20px] mb-2">
            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">
                  {t('scripts.searchResults', 'Znaleziono {{count}} skryptów', { count: filteredScripts.length })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScripts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 
                t('scripts.noSearchResults', 'Nie znaleziono skryptów') : 
                t('scripts.noScripts', 'Brak utworzonych skryptów')
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ?
                t('scripts.tryDifferentSearch', 'Spróbuj innego wyszukiwania') :
                t('scripts.createFirstScript', 'Utwórz pierwszy skrypt, aby rozpocząć')
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => openModal('scriptCreator')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('scripts.createFirst', 'Utwórz Skrypt')}
              </button>
            )}
          </div>
        ) : (
          filteredScripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onView={handleScriptView}
              onEdit={handleScriptView}
              onDelete={handleDataChange}
              t={t}
              authToken={authToken}
              onTokenRefreshed={onTokenRefreshed}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {modals.styleClone && (
        <StyleCloneModal
          isOpen={modals.styleClone}
          onClose={() => closeModal('styleClone')}
          userStyles={userStyles}
          authToken={authToken}
          businessProfileId={businessProfileId}
          onStyleCreated={handleStyleCreated}
          onTokenRefreshed={onTokenRefreshed}
          t={t}
        />
      )}

      {modals.hookGenerator && (
        <HookGeneratorModal
          isOpen={modals.hookGenerator}
          onClose={() => closeModal('hookGenerator')}
          businessProfileId={businessProfileId}
          authToken={authToken}
          onTokenRefreshed={onTokenRefreshed}
          onHookCreated={handleHookCreated}
          t={t}
        />
      )}

      {modals.scriptCreator && (
        <ScriptCreatorModal
          isOpen={modals.scriptCreator}
          onClose={() => closeModal('scriptCreator')}
          businessProfileId={businessProfileId}
          authToken={authToken}
          onTokenRefreshed={onTokenRefreshed}
          userStyles={userStyles}
          offers={offers}
          campaigns={campaigns}
          prefilledHook={prefilledHook}
          onScriptCreated={handleScriptCreated}
          onBackToHookGenerator={handleBackToHookGenerator}
          t={t}
        />
      )}

      {modals.preview && selectedScript && (
        <ScriptPreviewModal
          isOpen={modals.preview}
          onClose={() => closeModal('preview')}
          script={selectedScript}
          onSave={handleDataChange}
          authToken={authToken}
          onTokenRefreshed={onTokenRefreshed}
          t={t}
        />
      )}
    </div>
  );
};

// Script Card Component
interface ScriptCardProps {
  script: Script;
  onView: (script: Script) => void;
  onEdit: (script: Script) => void;
  onDelete: () => void;
  t: any;
  authToken: string;
  onTokenRefreshed?: (token: string) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ 
  script, 
  onView, 
  onEdit, 
  onDelete,
  t,
  authToken,
  onTokenRefreshed 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t('scripts.confirmDelete', 'Are you sure you want to delete this script?'))) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteScript(script.id, authToken);
      onDelete();
    } catch (error) {
      console.error('Error deleting script:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-100 text-blue-700';
      case 'blog': return 'bg-green-100 text-green-700';
      case 'script': return 'bg-purple-100 text-purple-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-6 hover:border-blue-300/60 hover:shadow-lg transition-all duration-200 cursor-pointer group"
         onClick={() => onView(script)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                {script.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {script.content.substring(0, 120)}...
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-1 rounded-full font-medium ${getTypeColor(script.script_type)}`}>
              {t(`scripts.${script.script_type}`, script.script_type)}
            </span>
            <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(script.status)}`}>
              {t(`scripts.${script.status}`, script.status)}
            </span>
            <span className="text-gray-500">
              {new Date(script.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onView(script); }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('scripts.view', 'View script')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(script); }}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title={t('scripts.edit', 'Edit script')}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title={t('scripts.delete', 'Delete script')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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

// StyleClone Modal Component
interface StyleCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStyles: UserStyle[];
  authToken: string;
  businessProfileId?: string;
  onStyleCreated: () => void;
  onTokenRefreshed?: (token: string) => void;
  t: any;
}

const StyleCloneModal: React.FC<StyleCloneModalProps> = ({
  isOpen,
  onClose,
  userStyles,
  authToken,
  businessProfileId,
  onStyleCreated,
  onTokenRefreshed,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('scripts.styleClone', 'Style Clone')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('scripts.styleCloneDesc', 'Analyze your writing style or browse existing styles')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <StyleCopyTool
            userStyles={userStyles}
            authToken={authToken}
            onStyleCreated={onStyleCreated}
            onTokenRefreshed={onTokenRefreshed}
            businessProfileId={businessProfileId}
          />
        </div>
      </div>
    </div>
  );
};

// Hook Generator Modal Component
interface HookGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (token: string) => void;
  onHookCreated: (hook: string) => void;
  t: any;
}

const HookGeneratorModal: React.FC<HookGeneratorModalProps> = ({
  isOpen,
  onClose,
  businessProfileId,
  authToken,
  onTokenRefreshed,
  onHookCreated,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('scripts.hookGenerator', 'Hook Generator')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('scripts.hookGeneratorDesc', 'Generate compelling hooks for your content')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ScriptHooksGenerator
            businessProfileId={businessProfileId}
            authToken={authToken}
            onTokenRefreshed={onTokenRefreshed}
            onHookSelected={onHookCreated}
          />
        </div>
      </div>
    </div>
  );
};

// Script Creator Modal Component  
interface ScriptCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProfileId?: string;
  authToken: string;
  onTokenRefreshed?: (token: string) => void;
  userStyles: UserStyle[];
  offers: Offer[];
  campaigns: Campaign[];
  prefilledHook?: string;
  onScriptCreated: () => void;
  onBackToHookGenerator?: () => void;
  t: any;
}

const ScriptCreatorModal: React.FC<ScriptCreatorModalProps> = ({
  isOpen,
  onClose,
  businessProfileId,
  authToken,
  onTokenRefreshed,
  userStyles,
  offers,
  campaigns,
  prefilledHook,
  onScriptCreated,
  onBackToHookGenerator,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('scripts.scriptCreator', 'Script Creator')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('scripts.scriptCreatorDesc', 'Create compelling scripts with AI assistance')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ScriptGenerator
            businessProfileId={businessProfileId}
            authToken={authToken}
            onTokenRefreshed={onTokenRefreshed}
            prefilledHook={prefilledHook}
            onClose={onBackToHookGenerator}
            onScriptCreated={onScriptCreated}
            userStyles={userStyles.map(style => ({
              id: style.id,
              style_name: style.style_name || 'Unnamed Style',
              language: style.language,
              content_types: style.style_card?.content_types || ['general']
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
        </div>
      </div>
    </div>
  );
};

// Script Preview Modal Component
interface ScriptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Script;
  onSave: () => void;
  authToken: string;
  onTokenRefreshed?: (token: string) => void;
  t: any;
}

const ScriptPreviewModal: React.FC<ScriptPreviewModalProps> = ({
  isOpen,
  onClose,
  script,
  onSave,
  authToken,
  onTokenRefreshed,
  t
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: script.title,
    content: script.content,
    script_type: script.script_type,
    status: script.status
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateScript(script.id, editData, authToken);
      onSave();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating script:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-2xl font-bold text-gray-900 w-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 truncate">
                  {script.title}
                </h2>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {t(`scripts.${script.script_type}`, script.script_type)}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {t(`scripts.${script.status}`, script.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(script.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scripts.scriptType', 'Script Type')}
                </label>
                <select
                  value={editData.script_type}
                  onChange={(e) => setEditData({ ...editData, script_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="post">{t('scripts.post', 'Post')}</option>
                  <option value="blog">{t('scripts.blog', 'Blog')}</option>
                  <option value="script">{t('scripts.script', 'Script')}</option>
                  <option value="general">{t('scripts.general', 'General')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scripts.status', 'Status')}
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">{t('scripts.draft', 'Draft')}</option>
                  <option value="published">{t('scripts.published', 'Published')}</option>
                  <option value="archived">{t('scripts.archived', 'Archived')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scripts.content', 'Content')}
                </label>
                <textarea
                  value={editData.content}
                  onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                  rows={15}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-900">
                {script.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scripts;