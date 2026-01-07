import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  SpeechRecognitionState,
  SpeechRecognitionOptions,
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '../types/speech';

/**
 * 语音识别 Hook
 * 使用 Web Speech API 实现语音转文字功能
 */
export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}) => {
  const {
    language = 'zh-CN',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onError
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // 检测浏览器支持
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    setState(prev => ({
      ...prev,
      isSupported
    }));

    if (!isSupported) {
      console.warn('[useSpeechRecognition] 当前浏览器不支持语音识别');
      const errorMsg = '您的浏览器不支持语音识别功能，请使用 Chrome 浏览器';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 开始识别
  const startListening = useCallback(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      const errorMsg = '浏览器不支持语音识别';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    // 如果已经在识别，先停止
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // 忽略错误
      }
    }

    try {
      // 创建新的识别实例
      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      // 识别开始
      recognition.onstart = () => {
        console.log('[useSpeechRecognition] 识别已启动');
        setState(prev => ({
          ...prev,
          isListening: true,
          error: null
        }));
        finalTranscriptRef.current = '';
      };

      // 识别结果
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // 更新状态
        setState(prev => ({
          ...prev,
          transcript: finalTranscript,
          interimTranscript
        }));

        finalTranscriptRef.current = finalTranscript;

        // 回调
        if (finalTranscript) {
          onResult?.(finalTranscript, true);
        } else if (interimTranscript) {
          onResult?.(interimTranscript, false);
        }
      };

      // 识别错误
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMsg = '语音识别发生错误';

        switch (event.error) {
          case 'no-speech':
            errorMsg = '未检测到语音输入';
            break;
          case 'audio-capture':
            errorMsg = '无法访问麦克风';
            break;
          case 'not-allowed':
            errorMsg = '麦克风权限被拒绝';
            break;
          case 'network':
            errorMsg = '网络连接失败';
            break;
          case 'aborted':
            // aborted 错误通常是由于主动停止，不显示错误
            console.log('[useSpeechRecognition] 识别被中断');
            setState(prev => ({
              ...prev,
              isListening: false
            }));
            return;
          default:
            errorMsg = `识别错误: ${event.error}`;
        }

        console.error('[useSpeechRecognition]', errorMsg, event);
        setState(prev => ({
          ...prev,
          isListening: false,
          error: errorMsg
        }));
        onError?.(errorMsg);
      };

      // 识别结束
      recognition.onend = () => {
        console.log('[useSpeechRecognition] 识别已结束');
        setState(prev => ({
          ...prev,
          isListening: false
        }));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('[useSpeechRecognition] 启动失败:', error);
      const errorMsg = '无法启动语音识别';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        isListening: false
      }));
      onError?.(errorMsg);
    }
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError]);

  // 停止识别
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // 忽略停止错误（可能已经停止）
        console.warn('[useSpeechRecognition] 停止识别时出错:', e);
      }
    }
    setState(prev => ({
      ...prev,
      isListening: false
    }));
  }, []);

  // 重置识别结果
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null
    }));
  }, []);

  // 切换识别状态
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [state.isListening, startListening, stopListening, resetTranscript]);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    toggleListening
  };
};
