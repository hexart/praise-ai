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
  isLoading: boolean;
  error: string | null;
  models: ModelInfo[];
  currentModel: string | null;
}

// 存储键 - 简单明了
const STORAGE = {
  TYPE: 'provider_type',
  CONFIG: 'provider_config', 
  MODEL: 'current_model'
} as const;

// 默认配置 - 去掉过度抽象
const getDefaultConfig = (type: ProviderType): ProviderConfig => {
  switch (type) {
    case 'ollama':
      return {
        type: 'ollama',
        apiUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:8000',
        defaultModel: 'llama2'
      };
    case 'openai':
      return {
        type: 'openai',
        apiUrl: 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_OPENAI_KEY || '',
        defaultModel: 'gpt-4'
      };
    case 'anthropic':
      return {
        type: 'anthropic',
        apiUrl: 'https://api.anthropic.com/v1',
        apiKey: import.meta.env.VITE_CLAUDE_KEY || '',
        defaultModel: 'claude-3-sonnet-20240229'
      };
    default:
      throw new Error(`Unsupported provider: ${type}`);
  }
};

// 简单的 Provider 工厂
const createProvider = (type: ProviderType, config: ProviderConfig): BaseProvider => {
  switch (type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openai':
      if (!config.apiKey) throw new Error('OpenAI API key required');
      return new OpenAIProvider(config);
    case 'anthropic':
      if (!config.apiKey) throw new Error('Anthropic API key required');
      return new ClaudeProvider(config);
    default:
      throw new Error(`Unsupported provider: ${type}`);
  }
};

export function useProvider() {
  // 合并状态 - 减少状态管理复杂性
  const [state, setState] = useState<ProviderState>(() => {
    const savedType = getFromStorage(STORAGE.TYPE, 'ollama' as ProviderType);
    return {
      provider: null,
      type: savedType,
      isLoading: false,
      error: null,
      models: [],
      currentModel: getFromStorage(STORAGE.MODEL, null)
    };
  });

  // 配置使用 ref - 避免不必要的重渲染
  const configRef = useRef<ProviderConfig>(getDefaultConfig(state.type));

  // 错误处理 - 简单直接，不要复杂的日志系统
  const setError = useCallback((error: string) => {
    console.error('[Provider]', error);
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // 初始化 Provider - 单一职责
  const initProvider = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const config = { ...getDefaultConfig(state.type), ...configRef.current };
      const provider = createProvider(state.type, config);
      
      setState(prev => ({
        ...prev,
        provider,
        isLoading: false
      }));
      
      console.log(`[Provider] Initialized ${state.type}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Provider init failed');
    }
  }, [state.type, setError]);

  // 切换 Provider - 简单明了
  const switchProvider = useCallback(async (type: ProviderType, config?: ProviderConfig) => {
    try {
      const finalConfig = { ...getDefaultConfig(type), ...config };
      const provider = createProvider(type, finalConfig);
      
      // 测试连接
      const testResult = await provider.testConnection();
      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }
      
      // 更新状态
      setState({
        provider,
        type,
        isLoading: false,
        error: null,
        models: [],
        currentModel: null
      });
      
      // 保存配置
      configRef.current = finalConfig;
      saveToStorage(STORAGE.TYPE, type);
      saveToStorage(STORAGE.CONFIG, finalConfig);
      saveToStorage(STORAGE.MODEL, null);
      
      console.log(`[Provider] Switched to ${type}`);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Switch failed');
      return false;
    }
  }, [setError]);

  // 加载模型 - 直接简单
  const loadModels = useCallback(async () => {
    if (!state.provider) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await state.provider.listModels();
      if (result.success && result.data) {
        const models = result.data.models;
        const defaultModel = configRef.current.defaultModel;
        const currentModel = defaultModel && models.some(m => m.id === defaultModel) 
          ? defaultModel 
          : models[0]?.id || null;
        
        setState(prev => ({
          ...prev,
          models,
          currentModel,
          isLoading: false
        }));
        
        if (currentModel) {
          saveToStorage(STORAGE.MODEL, currentModel);
        }
      }
    } catch (error) {
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

  // 自动初始化
  useEffect(() => {
    initProvider();
  }, [initProvider]); // 包含 initProvider 依赖

  // 自动加载模型
  useEffect(() => {
    if (state.provider && state.models.length === 0 && !state.isLoading) {
      loadModels();
    }
  }, [state.provider, state.models.length, state.isLoading, loadModels]);

  return {
    // 状态
    provider: state.provider,
    providerType: state.type,
    config: configRef.current,
    isLoading: state.isLoading,
    error: state.error,
    models: state.models,
    currentModel: state.currentModel,
    
    // 操作
    switchProvider,
    updateConfig: useCallback((newConfig: Partial<ProviderConfig>) => {
      const updatedConfig = { ...configRef.current, ...newConfig };
      configRef.current = updatedConfig;
      saveToStorage(STORAGE.CONFIG, updatedConfig);
      console.log('[Provider] Config updated');
    }, []),
    loadModels,
    switchModel,
    testConnection,
    
    // 简化的支持列表
    supportedProviders: [
      { type: 'ollama' as ProviderType, name: '本地 Ollama', description: '本地部署', features: ['免费', '隐私'] },
      { type: 'openai' as ProviderType, name: 'OpenAI', description: 'OpenAI API', features: ['高质量', '快速'] },
      { type: 'anthropic' as ProviderType, name: 'Claude', description: 'Anthropic Claude', features: ['安全', '长上下文'] }
    ]
  };
}