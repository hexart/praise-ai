import { useState, useCallback, useRef, useEffect } from 'react';
import { BaseProvider } from '../providers/BaseProvider';
import { OllamaProvider } from '../providers/OllamaProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { ClaudeProvider } from '../providers/ClaudeProvider';
import type { ProviderType, ProviderConfig, ModelInfo } from '../types/provider';
import { getFromStorage, saveToStorage } from '../utils/storage';

// 简化的状态类型
interface ProviderState {
  provider: BaseProvider | null;
  type: ProviderType;
  isLoading: boolean; // Provider 初始化加载状态
  isModelLoading: boolean; // 新增：模型列表加载状态
  error: string | null;
  models: ModelInfo[];
  currentModel: string | null;
  isConnected: boolean; // 新增：连接状态
  connectedProvider: ProviderType | null; // 新增：当前连接的Provider
  connectedModel: string | null; // 新增：当前连接的模型
}

// 存储键 - 简单明了
const STORAGE = {
  TYPE: 'provider_type',
  CONFIG: 'provider_config', 
  MODEL: 'current_model'
} as const;

// 为每个 Provider 类型定义存储键
const getProviderStorageKey = (type: ProviderType) => `provider_config_${type}`;

// 默认配置 - 从环境变量获取，如果没有则为空
const getDefaultConfig = (type: ProviderType): ProviderConfig => {
  switch (type) {
    case 'ollama':
      return {
        type: 'ollama',
        apiUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:8000'
      };
    case 'openai':
      return {
        type: 'openai',
        apiUrl: import.meta.env.VITE_OPENAI_URL || 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_OPENAI_KEY || ''
      };
    case 'anthropic':
      return {
        type: 'anthropic',
        apiUrl: import.meta.env.VITE_CLAUDE_URL || 'https://api.anthropic.com/v1',
        apiKey: import.meta.env.VITE_CLAUDE_KEY || ''
      };
    default:
      // 对于其他类型（如 gemini, custom），返回基础配置
      return {
        type,
        apiUrl: '',
        apiKey: ''
      };
  }
};

// 获取 Provider 的最终配置（优先级：用户配置 > 本地存储 > 环境变量 > 默认值）
const getFinalConfig = (type: ProviderType, userConfig?: ProviderConfig): ProviderConfig => {
  // 1. 获取默认配置（环境变量或默认值）
  const defaultConfig = getDefaultConfig(type);
  
  // 2. 尝试从本地存储获取该 Provider 的配置
  const storedConfig = getFromStorage<Partial<ProviderConfig>>(getProviderStorageKey(type), {});
  
  // 3. 合并配置：用户配置 > 本地存储 > 默认配置
  return {
    ...defaultConfig,
    ...storedConfig,
    ...userConfig
  };
};

// 简单的 Provider 工厂
const createProvider = (type: ProviderType, config: ProviderConfig): BaseProvider => {
  switch (type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openai':
      // OpenAI Provider 可以在没有 API Key 时创建，在实际调用时再校验
      return new OpenAIProvider(config);
    case 'anthropic':
      // Claude Provider 可以在没有 API Key 时创建，在实际调用时再校验
      return new ClaudeProvider(config);
    default:
      // 对于其他 Provider 类型，抛出错误，确保只使用已知的 Provider 类型
      throw new Error(`Unsupported provider type: ${type}`);
  }
};

export function useProvider() {
  // 合并状态 - 减少状态管理复杂性
  const [state, setState] = useState<ProviderState>(() => {
    const savedType = getFromStorage(STORAGE.TYPE, 'openai' as ProviderType);
    const savedModel = getFromStorage(STORAGE.MODEL, null);
    const savedConnectedProvider = getFromStorage('connected_provider', null);
    const savedConnectedModel = getFromStorage('connected_model', null);
    
    return {
      provider: null,
      type: savedType,
      isLoading: false,
      isModelLoading: false,
      error: null,
      models: [],
      currentModel: savedModel,
      isConnected: !!(savedConnectedProvider && savedConnectedModel),
      connectedProvider: savedConnectedProvider,
      connectedModel: savedConnectedModel
    };
  });

  // 配置使用 ref - 避免不必要的重渲染
  const configRef = useRef<ProviderConfig>(getFinalConfig(state.type));
  
  // 添加一个状态来跟踪配置变化，确保组件能正确重新渲染
  const [configState, setConfigState] = useState<ProviderConfig>(getFinalConfig(state.type));

  // 错误处理 - 简单直接，不要复杂的日志系统
  const setError = useCallback((error: string) => {
    console.error('[Provider]', error);
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // 初始化 Provider - 单一职责
  const initProvider = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 在初始化时也使用 getFinalConfig 来确保正确读取本地存储的配置
      const config = getFinalConfig(state.type);
      const provider = createProvider(state.type, config);
      
      setState(prev => ({
        ...prev,
        provider,
        isLoading: false
      }));
      
      // 同时更新 ref 和状态
      configRef.current = config;
      setConfigState(config);
      
      console.log(`[Provider] Initialized ${state.type}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Provider init failed');
    }
  }, [state.type, setError]);

  // 切换 Provider - 简单明了，不强制测试连接
  const switchProvider = useCallback(async (type: ProviderType, config?: ProviderConfig) => {
    try {
      // 获取最终配置
      const finalConfig = getFinalConfig(type, config);
      const provider = createProvider(type, finalConfig);
      
      // 更新状态，保留models列表但清空当前选中的模型，重置连接状态
      setState(prev => ({
        ...prev,
        provider,
        type,
        isLoading: false,
        error: null,
        currentModel: null,
        // 重置连接状态
        isConnected: false,
        connectedProvider: null,
        connectedModel: null
      }));
      
      // 保存配置到 ref 和状态
      configRef.current = finalConfig;
      setConfigState(finalConfig);
      
      // 保存 Provider 类型
      saveToStorage(STORAGE.TYPE, type);
      
      // 保存当前 Provider 的配置到专用存储键（无论是否有传入config参数）
      saveToStorage(getProviderStorageKey(type), finalConfig);
      
      // 清空模型选择
      saveToStorage(STORAGE.MODEL, null);
      
      // 清除连接状态的存储
      saveToStorage('connected_provider', null);
      saveToStorage('connected_model', null);
      
      console.log(`[Provider] Switched to ${type}`);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Switch failed');
      return false;
    }
  }, [setError]);

  // 加载模型 - 移除自动选择模型逻辑
  const loadModels = useCallback(async () => {
    if (!state.provider) return;
    
    setState(prev => ({ ...prev, isModelLoading: true })); // 使用独立的模型加载状态
    
    try {
      // 使用当前 Provider 的配置来获取模型列表
      const result = await state.provider.listModels();
      if (result.success && result.data) {
        const models = result.data.models;
        
        setState(prev => ({
          ...prev,
          models,
          isModelLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isModelLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isModelLoading: false }));
      setError(error instanceof Error ? error.message : 'Failed to load models');
    }
  }, [state.provider, setError]);

  // 切换模型
  const switchModel = useCallback(async (modelName: string) => {
    if (!state.provider) return false;
    
    try {
      const result = await state.provider.switchModel(modelName);
      if (result.success) {
        setState(prev => ({ ...prev, currentModel: modelName }));
        saveToStorage(STORAGE.MODEL, modelName);
        return true;
      }
      return false;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Model switch failed');
      return false;
    }
  }, [state.provider, setError]);

  // 测试连接
  const testConnection = useCallback(async () => {
    if (!state.provider) return false;
    
    try {
      const result = await state.provider.testConnection();
      return result.success;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection test failed');
      return false;
    }
  }, [state.provider, setError]);

  // 新增：设置连接状态
  const setConnectionStatus = useCallback((connected: boolean, providerType?: ProviderType, modelName?: string) => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      connectedProvider: connected ? (providerType || prev.type) : null,
      connectedModel: connected ? (modelName || prev.currentModel) : null
    }));
    
    // 保存连接状态
    if (connected && providerType && modelName) {
      saveToStorage('connected_provider', providerType);
      saveToStorage('connected_model', modelName);
    } else {
      saveToStorage('connected_provider', null);
      saveToStorage('connected_model', null);
    }
  }, []);

  // 自动初始化
  useEffect(() => {
    initProvider();
  }, [initProvider]); // 包含 initProvider 依赖

  // 注意：移除了自动加载模型的逻辑，改为用户手动触发

  return {
    // 状态
    provider: state.provider,
    providerType: state.type,
    config: configState, // 使用状态而不是ref，确保组件能正确重新渲染
    isLoading: state.isLoading, // Provider 初始化加载状态
    isModelLoading: state.isModelLoading, // 模型列表加载状态
    error: state.error,
    models: state.models,
    currentModel: state.currentModel,
    
    // 新增：连接状态
    isConnected: state.isConnected,
    connectedProvider: state.connectedProvider,
    connectedModel: state.connectedModel,
    
    // 操作
    switchProvider,
    updateConfig: useCallback((newConfig: Partial<ProviderConfig>) => {
      const updatedConfig = { ...configRef.current, ...newConfig };
      configRef.current = updatedConfig;
      setConfigState(updatedConfig); // 更新状态以触发重新渲染
      
      // 同时更新Provider实例的配置
      if (state.provider) {
        state.provider.updateConfig(newConfig);
      }
      
      // 保存当前 Provider 的配置到专用存储键
      saveToStorage(getProviderStorageKey(state.type), updatedConfig);
      
      console.log('[Provider] Config updated');
    }, [state.provider, state.type]),
    loadModels,
    switchModel,
    testConnection,
    setConnectionStatus, // 新增：设置连接状态的方法
    
    // 简化的支持列表
    supportedProviders: [
      { type: 'ollama' as ProviderType, name: '本地 Ollama', description: '本地部署', features: ['免费', '隐私'] },
      { type: 'openai' as ProviderType, name: 'OpenAI', description: 'OpenAI API', features: ['高质量', '快速'] },
      { type: 'anthropic' as ProviderType, name: 'Claude', description: 'Anthropic Claude', features: ['安全', '长上下文'] }
    ]
  };
}