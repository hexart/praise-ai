/**
 * 语音识别相关类型定义
 */

/**
 * 语音识别状态
 */
export interface SpeechRecognitionState {
  /** 是否正在监听语音 */
  isListening: boolean;
  /** 浏览器是否支持语音识别 */
  isSupported: boolean;
  /** 最终识别的文本 */
  transcript: string;
  /** 临时识别文本（还未确定） */
  interimTranscript: string;
  /** 错误信息 */
  error: string | null;
}

/**
 * 语音识别配置选项
 */
export interface SpeechRecognitionOptions {
  /** 识别语言，默认 'zh-CN' */
  language?: string;
  /** 是否持续识别，默认 false */
  continuous?: boolean;
  /** 是否返回临时结果，默认 true */
  interimResults?: boolean;
  /** 最大备选数量，默认 1 */
  maxAlternatives?: number;
  /** 识别结果回调 */
  onResult?: (transcript: string, isFinal: boolean) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/**
 * Web Speech API 类型声明
 */
export interface SpeechRecognition extends EventTarget {
  /** 识别语言 */
  lang: string;
  /** 是否持续识别 */
  continuous: boolean;
  /** 是否返回临时结果 */
  interimResults: boolean | number;
  /** 最大备选数量 */
  maxAlternatives: number;
  /** 开始识别 */
  start(): void;
  /** 停止识别 */
  stop(): void;
  /** 识别开始事件 */
  onstart: (event: Event) => void;
  /** 识别结束事件 */
  onend: (event: Event) => void;
  /** 识别结果事件 */
  onresult: (event: SpeechRecognitionEvent) => void;
  /** 错误事件 */
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

/**
 * 语音识别事件
 */
export interface SpeechRecognitionEvent extends Event {
  /** 结果索引 */
  resultIndex: number;
  /** 识别结果列表 */
  results: SpeechRecognitionResultList;
}

/**
 * 识别结果列表
 */
export interface SpeechRecognitionResultList {
  /** 结果长度 */
  length: number;
  /** 获取指定索引的结果 */
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
  /** 迭代器 */
  [Symbol.iterator](): IterableIterator<SpeechRecognitionResult>;
}

/**
 * 识别结果
 */
export interface SpeechRecognitionResult {
  /** 是否为最终结果 */
  isFinal: boolean;
  /** 结果长度 */
  length: number;
  /** 获取指定索引的备选结果 */
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  /** 迭代器 */
  [Symbol.iterator](): IterableIterator<SpeechRecognitionAlternative>;
}

/**
 * 备选识别结果
 */
export interface SpeechRecognitionAlternative {
  /** 识别文本 */
  transcript: string;
  /** 置信度 (0-1) */
  confidence: number;
}

/**
 * 识别错误事件
 */
export interface SpeechRecognitionErrorEvent extends Event {
  /** 错误类型 */
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'allow-listed' | 'language-not-supported' | 'service-not-allowed';
  /** 错误消息 */
  message?: string;
}

/**
 * 扩展全局 Window 接口以支持 Web Speech API
 */
declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  }
}
