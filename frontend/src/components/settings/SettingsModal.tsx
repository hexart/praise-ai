import React, { useState, useEffect } from 'react';
import { Settings, Server, Bug, Download, Upload, RotateCcw, User, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProviderSettings } from './ProviderSettings';
import type { ProviderType, ProviderConfig } from '../../types/provider';
import type { ChatMode } from '../../types/chat';
import { MODE_CONFIGS } from '../../constants/modes';

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

  // 模型相关
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
  onSetConnectionStatus?: (connected: boolean, providerType?: ProviderType, modelName?: string) => void;

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
  isLoading?: boolean;
  isModelLoading?: boolean;
}

type TabType = 'provider' | 'app' | 'data' | 'about';

/**
 * 设置模态框组件 - 响应式设计
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
  onSetConnectionStatus,
  settings,
  onSettingsUpdate,
  userId,
  onExportData,
  onImportData,
  onResetAll,
  isLoading = false,
  isModelLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('provider');
  const [importText, setImportText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 关闭移动端菜单当标签改变时
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // 关闭移动端菜单当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setIsMobileMenuOpen(false);
      setShowResetConfirm(false);
    }
  }, [isOpen]);

  const tabs = [
    {
      id: 'provider' as TabType,
      name: 'API配置',
      icon: Server,
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
    },
    {
      id: 'app' as TabType,
      name: '应用设置',
      icon: Settings,
      color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30'
    },
    {
      id: 'data' as TabType,
      name: '数据管理',
      icon: Download,
      color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30'
    },
    {
      id: 'about' as TabType,
      name: '关于',
      icon: User,
      color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/30'
    }
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

  // 移动端切换标签
  const handleMobileTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // 获取当前标签配置
  const currentTab = tabs.find(t => t.id === activeTab);

  // 默认模式下拉菜单状态
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 渲染标签内容（共用函数）
  const renderTabContent = () => {
    switch (activeTab) {
      case 'provider':
        return (
          <div className="space-y-6">
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
        );

      case 'app':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* 主题设置 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">主题模式</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      切换明暗主题
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              {/* 默认模式 */}
              <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5 block">
                    默认聊天模式
                  </span>
                  <div className="relative" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                      className="
                        w-full flex items-center justify-between px-4 py-3
                        bg-gray-50 dark:bg-gray-900/50
                        border border-gray-200 dark:border-gray-700
                        rounded-xl
                        hover:border-blue-300 dark:hover:border-blue-600
                        focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50
                        transition-all duration-200
                        text-left
                      "
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {MODE_CONFIGS[settings.defaultMode as keyof typeof MODE_CONFIGS]?.name || '选择模式'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${modeDropdownOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {/* 自定义下拉菜单 - 与模型列表相同样式 */}
                    {modeDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
                        <div className="py-2">
                          {Object.values(MODE_CONFIGS).map((mode) => {
                            const ModeIcon = mode.icon;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => {
                                  onSettingsUpdate({ defaultMode: mode.id });
                                  setModeDropdownOpen(false);
                                }}
                                className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200
                    ${settings.defaultMode === mode.id
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'
                                    : ''
                                  }
                  `}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`
                        p-2 rounded-lg
                        ${settings.defaultMode === mode.id
                                        ? 'bg-gradient-to-r ' + mode.gradient + ' text-white shadow-lg shadow-' + mode.gradient.split('-')[1] + '-500/20'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                      }
                      `}>
                                      <ModeIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {mode.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {mode.description}
                                      </div>
                                    </div>
                                  </div>
                                  {settings.defaultMode === mode.id && (
                                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    选择启动时的默认对话模式
                  </p>
                </label>
              </div>

              {/* 自动保存 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">自动保存</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      自动保存聊天历史
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => onSettingsUpdate({ autoSave: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* 历史记录长度 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <label className="block">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">最大历史记录</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{settings.maxHistoryLength}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.maxHistoryLength}
                    onChange={(e) => onSettingsUpdate({ maxHistoryLength: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-400">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </label>
              </div>

              {/* 调试模式 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <Bug className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">调试模式</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        显示AI分析过程
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.debugMode}
                      onChange={(e) => onSettingsUpdate({ debugMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return renderDataTab();

      case 'about':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* 应用信息卡片 */}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-xl text-gray-900 mb-2 dark:text-white">舔狗&夸夸 AI</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>版本：v2.0.0</p>
                  <p>一个专注于情感支持的AI聊天应用</p>
                </div>
              </div>

              {/* 信息网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 mb-2 dark:text-gray-100">用户 ID</h5>
                  <p className="text-sm text-gray-600 font-mono dark:text-gray-400 break-all">
                    {userId.slice(0, 16)}...
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 mb-2 dark:text-gray-100">当前 Provider</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentProvider || '未配置'}
                  </p>
                </div>
              </div>

              {/* 功能特性 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-900 mb-3 dark:text-gray-100">功能特性</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>智能情感分析</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>多Provider支持</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>本地数据存储</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>隐私保护</span>
                  </div>
                </div>
              </div>

              {/* 开发者信息 */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  开发者：<a href="mailto:hexart@126.com" className="text-blue-600 hover:underline dark:text-blue-400">hexart</a>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  本应用不替代专业心理咨询服务
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染数据管理标签
  const renderDataTab = () => {
    if (showResetConfirm) {
      return (
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">确认重置所有数据？</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                此操作无法撤销，请谨慎操作。
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-800">
            <h4 className="font-medium text-red-900 mb-2 dark:text-red-100">将被清除的数据：</h4>
            <ul className="text-sm text-red-700 space-y-1 dark:text-red-300">
              <li>• 所有聊天记录</li>
              <li>• 个人设置和偏好</li>
              <li>• AI服务配置</li>
              <li>• 缓存数据</li>
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
    }

    return (
      <div className="space-y-4">
        {/* 导出数据 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">导出数据</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                导出所有数据到 JSON 文件
              </p>
            </div>
            <Button onClick={handleExportData} variant="primary" size="sm">
              导出数据
            </Button>
          </div>
        </div>

        {/* 导入数据 (布局保持不变以优化用户体验) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1 dark:text-gray-100">导入数据</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  从备份文件恢复数据
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50 cursor-pointer"
                />
              </div>

              <div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="或直接粘贴 JSON 数据..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-100 resize-none"
                />
              </div>

              <Button
                onClick={handleImportData}
                variant="success"
                size="sm"
                disabled={!importText.trim()}
              >
                导入数据
              </Button>
            </div>
          </div>
        </div>

        {/* 重置数据 */}
        <div className="bg-red-50 dark:bg-red-800/30 rounded-xl p-5 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100">危险区域</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                重置将删除所有数据且无法恢复
              </p>
            </div>
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
      </div>
    );
  };

  return (
    <>
      {/* 移动端全屏模态框 */}
      <div className={`
      fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      md:hidden
    `}>
        {/* 移动端头部 */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                设置
              </h2>
            </div>

            {/* 当前标签指示器 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`
              flex items-center space-x-2 px-4 py-2 rounded-full
              bg-gradient-to-r ${currentTab?.color || 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'}
              shadow-sm transition-all duration-200 hover:shadow-md
            `}
            >
              {currentTab && <currentTab.icon className="w-4 h-4" />}
              <span className="text-sm font-semibold">{currentTab?.name}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 移动端标签下拉菜单 */}
          {isMobileMenuOpen && (
            <div className="absolute top-16 right-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-20">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMobileTabChange(tab.id)}
                    className={`
                    w-full flex items-center space-x-3 px-5 py-3.5
                    transition-all duration-200
                    ${isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                  `}
                  >
                    <div className={`
                    p-2.5 rounded-xl transition-colors
                    ${isActive ? 'bg-gradient-to-r ' + tab.color : 'bg-gray-100 dark:bg-gray-700'}
                  `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold flex-1 text-left">{tab.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 移动端内容区 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 bg-gray-100/50 dark:bg-gray-800/50">
          {renderTabContent()}
        </div>
      </div>

      {/* 桌面端模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="设置面板"
        size="xl"
        className="hidden md:block rounded-2xl"
      >
        <div className="flex h-[500px]">
          {/* 侧边栏 - 现代化设计 */}
          <div className="w-54 dark:bg-gray-900 pe-6 border-r border-gray-200 dark:border-gray-800">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                // 为每个标签定义简洁的配色
                type TabType = 'provider' | 'app' | 'data' | 'about';
                const getTabColors = (tabId: TabType) => {
                  switch (tabId) {
                    case 'provider': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
                    case 'app': return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30';
                    case 'data': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
                    case 'about': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
                    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
                  }
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full py-2 rounded-xl overflow-hidden
                      transition-all duration-200 text-left group relative
                      ${isActive
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                        : 'text-gray-600 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 dark:bg-blue-400" />
                    )}

                    <div className="flex items-center space-x-3 px-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isActive
                          ? getTabColors(tab.id)
                          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                        }
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{tab.name}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 主内容区 - 添加滚动条美化 */}
          <div className="flex-1 bg-white dark:bg-gray-900 ps-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {renderTabContent()}
          </div>
        </div>
      </Modal>
    </>
  );
};