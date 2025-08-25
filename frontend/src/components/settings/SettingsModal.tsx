import React, { useState } from 'react';
import { Settings, Server, Bug, Download, Upload, RotateCcw, User, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProviderSettings } from './ProviderSettings';
import type { ProviderType, ProviderConfig } from '../../types/provider';
import type { ChatMode } from '../../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Provider相关
  providers: Array<{
    type: ProviderType;
    name: string;
    description: string;
    features: string[];
  }>;
  currentProvider: ProviderType;
  currentConfig: ProviderConfig;
  onProviderChange: (type: ProviderType, config?: ProviderConfig) => Promise<boolean>;
  onConfigUpdate: (config: Partial<ProviderConfig>) => void;
  onTestConnection: () => Promise<boolean>;

  // 新增：模型相关
  models: Array<{
    id: string;
    name: string;
    description?: string;
    family?: string;
    parameter_size?: string;
  }>;
  currentModel: string | null;
  onModelSwitch: (modelId: string) => Promise<boolean>;
  onLoadModels: () => Promise<void>;
  onSetConnectionStatus?: (connected: boolean, providerType?: ProviderType, modelName?: string) => void; // 新增

  // 应用设置
  settings: {
    debugMode: boolean;
    defaultMode: ChatMode;
    autoSave: boolean;
    maxHistoryLength: number;
  };
  onSettingsUpdate: (settings: Partial<{
    debugMode: boolean;
    defaultMode: ChatMode;
    autoSave: boolean;
    maxHistoryLength: number;
  }>) => void;

  // 用户信息
  userId: string;

  // 数据管理
  onExportData: () => string;
  onImportData: (data: string) => boolean;
  onResetAll: () => void;

  // 加载状态
  isLoading?: boolean; // Provider 初始化加载状态
  isModelLoading?: boolean; // 新增：模型列表加载状态
}

type TabType = 'provider' | 'app' | 'data' | 'about';
/**

设置模态框组件
*/
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providers,
  currentProvider,
  currentConfig,
  onProviderChange,
  onConfigUpdate,
  onTestConnection,
  models,
  currentModel,
  onModelSwitch,
  onLoadModels,
  onSetConnectionStatus, // 新增
  settings,
  onSettingsUpdate,
  userId,
  onExportData,
  onImportData,
  onResetAll,
  isLoading = false, // Provider 初始化加载状态
  isModelLoading = false // 新增：模型列表加载状态
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('provider');
  const [importText, setImportText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false); // 改为内部显示确认内容

  const tabs = [
    { id: 'provider' as TabType, name: 'API配置', icon: Server },
    { id: 'app' as TabType, name: '应用设置', icon: Settings },
    { id: 'data' as TabType, name: '数据管理', icon: Download },
    { id: 'about' as TabType, name: '关于', icon: User }
  ];

  // 处理数据导出
  const handleExportData = () => {
    try {
      const data = onExportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `praise-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  // 处理数据导入
  const handleImportData = () => {
    if (!importText.trim()) {
      alert('请粘贴要导入的数据');
      return;
    }
    const success = onImportData(importText);
    if (success) {
      alert('数据导入成功！');
      setImportText('');
      onClose();
    } else {
      alert('数据导入失败，请检查数据格式');
    }
  };
  // 处理文件导入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  // 渲染重置确认内容
  const renderResetConfirm = () => (
    <div className="space-y-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">您确定要重置所有数据吗？</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            此操作无法撤销，请谨慎操作。
          </p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-800">
        <h4 className="font-medium text-red-900 mb-2 dark:text-red-100">将被清除的数据包括：</h4>
        <ul className="text-sm text-red-700 space-y-1 dark:text-red-300">
          <li>• 所有聊天记录和对话历史</li>
          <li>• 个人设置和偏好配置</li>
          <li>• 情感分析历史数据</li>
          <li>• AI服务提供商配置</li>
          <li>• 应用状态和缓存数据</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
          取消
        </Button>
        <Button variant="danger" onClick={() => {
          setShowResetConfirm(false);
          onResetAll();
        }}>
          确认重置
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="设置" size="xl">
      <div className="flex h-128">
        {/* 侧边栏 */}
        <div className="w-48 border-r border-gray-200 pr-4 dark:border-gray-700">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 text-left
                ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }
              `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 pl-6 overflow-y-auto">
          {/* API配置 */}
          {activeTab === 'provider' && (
            <div className="transition-all duration-300 ease-in-out opacity-100 transform translate-y-0">
              <ProviderSettings
                providers={providers}
                currentProvider={currentProvider}
                currentConfig={currentConfig}
                onProviderChange={onProviderChange}
                onConfigUpdate={onConfigUpdate}
                onTestConnection={onTestConnection}
                models={models}
                currentModel={currentModel}
                onModelSwitch={onModelSwitch}
                onLoadModels={onLoadModels}
                onSetConnectionStatus={onSetConnectionStatus}
                isLoading={isLoading}
                isModelLoading={isModelLoading}
              />
            </div>
          )}

          {/* 应用设置 */}
          {activeTab === 'app' && (
            <div className="space-y-6 transition-all duration-300 ease-in-out opacity-100 transform translate-y-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">应用设置</h3>
              <div className="space-y-4">
                {/* 主题设置 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">主题设置</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      选择应用的主题模式
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                {/* 默认模式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    默认聊天模式
                  </label>
                  <select
                    value={settings.defaultMode}
                    onChange={(e) => onSettingsUpdate({ defaultMode: e.target.value as ChatMode })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition-colors duration-200"
                  >
                    <option value="smart">智能模式</option>
                    <option value="praise">夸夸模式</option>
                    <option value="comfort">安慰模式</option>
                  </select>
                </div>

                {/* 自动保存 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">自动保存聊天记录</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      自动保存聊天历史到本地存储
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => onSettingsUpdate({ autoSave: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                </div>

                {/* 历史记录长度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最大历史记录数量: {settings.maxHistoryLength}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.maxHistoryLength}
                    onChange={(e) => onSettingsUpdate({ maxHistoryLength: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:dark:bg-blue-500 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:dark:bg-blue-500 transition-colors duration-200"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-400">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </div>

                {/* 调试模式 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Bug className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">调试模式</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      显示情感分析结果和AI思考过程
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.debugMode}
                      onChange={(e) => onSettingsUpdate({ debugMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 数据管理 */}
          {activeTab === 'data' && (
            <div className="space-y-6 transition-all duration-300 ease-in-out opacity-100 transform translate-y-0">
              {!showResetConfirm ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">数据管理</h3>

                  {/* 导出数据 */}
                  <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 mb-2 dark:text-gray-100">导出数据</h4>
                    <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">
                      导出所有聊天记录、设置和配置到JSON文件
                    </p>
                    <Button onClick={handleExportData} variant="primary" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      导出数据
                    </Button>
                  </div>

                  {/* 导入数据 */}
                  <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 mb-2 dark:text-gray-100">导入数据</h4>
                    <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">
                      从备份文件恢复数据
                    </p>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileImport}
                          className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
                        />
                      </div>

                      <div>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          placeholder="或直接粘贴JSON数据..."
                          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <Button
                        onClick={handleImportData}
                        variant="success"
                        size="sm"
                        disabled={!importText.trim()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        导入数据
                      </Button>
                    </div>
                  </div>

                  {/* 重置数据 */}
                  <div className="flex p-4 border border-red-200 bg-red-50 rounded-lg dark:border-red-700 dark:bg-red-900/30">
                    <div className='flex-1 flex'>
                      <h4 className="font-medium text-red-900 mb-2 dark:text-red-100">重置所有数据</h4>
                      <p className="text-sm text-red-700 mb-3 dark:text-red-300">
                        ⚠️ 这将删除所有聊天记录、设置和配置，且无法恢复
                      </p>
                    </div>
                    <div className="flex">
                      <Button
                        onClick={() => setShowResetConfirm(true)}
                        variant="danger"
                        size="sm"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        重置所有数据
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // 显示重置确认内容
                renderResetConfirm()
              )}
            </div>
          )}

          {/* 关于 */}
          {activeTab === 'about' && (
            <div className="space-y-6 transition-all duration-300 ease-in-out opacity-100 transform translate-y-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">关于应用</h3>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 dark:from-blue-900/30 dark:to-purple-900/30 dark:border-blue-700 dark:bg-gray-800">
                  <h4 className="font-semibold text-blue-900 mb-2 dark:text-blue-100">舔狗与夸夸 AI v2.0</h4>
                  <p className="text-blue-800 text-sm leading-relaxed dark:text-blue-200">
                    一个专注于情感支持的AI聊天应用，通过智能情感分析为用户提供个性化的安慰和鼓励。
                  </p>
                  <p className='text-blue-800 text-sm leading-relaxed dark:text-blue-200'>
                    开发：<a href="mailto:hexart@126.com" className="text-blue-800 hover:underline dark:text-blue-200">hexart</a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                    <h5 className="font-medium text-gray-900 mb-1 dark:text-gray-100">用户ID</h5>
                    <p className="text-sm text-gray-600 font-mono dark:text-gray-400">{userId.slice(0, 16)}...</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
                    <h5 className="font-medium text-gray-900 mb-1 dark:text-gray-100">当前Provider</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{currentProvider}</p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-gray-900 mb-2 dark:text-gray-100">功能特性</h4>
                  <ul className="text-sm text-gray-600 space-y-1 dark:text-gray-400">
                    <li>• 智能情感分析和模式推荐</li>
                    <li>• 多Provider支持（Ollama、OpenAI等）</li>
                    <li>• 本地数据存储，保护隐私</li>
                    <li>• 响应多样性管理</li>
                    <li>• 调试模式和开发工具</li>
                  </ul>
                </div>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  <p>本应用旨在探索AI技术在情绪支持领域的应用</p>
                  <p className="mt-1">请注意：本应用不替代专业心理咨询服务</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};