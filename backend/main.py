#!/usr/bin/env python3
"""
Ollama OpenAI 兼容 API 代理服务
将 Ollama API 转换为 OpenAI 兼容格式
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import json
import logging
import time
import uuid
from typing import List, Dict, Optional
from pydantic import BaseModel

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ollama OpenAI Compatible API",
    description="OpenAI-compatible proxy for Ollama",
    version="2.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama配置
OLLAMA_BASE_URL = "http://localhost:11434"
TIMEOUT = 60.0

# Pydantic 模型定义


class Message(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    top_p: Optional[float] = 1.0
    frequency_penalty: Optional[float] = 0.0
    presence_penalty: Optional[float] = 0.0


class CompletionRequest(BaseModel):
    model: str
    prompt: str
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

# 工具函数


def convert_messages_to_ollama_prompt(messages: List[Message]) -> str:
    """将 OpenAI 格式的消息转换为 Ollama prompt"""
    prompt = ""

    for message in messages:
        if message.role == "system":
            prompt += f"System: {message.content}\n\n"
        elif message.role == "user":
            prompt += f"Human: {message.content}\n\n"
        elif message.role == "assistant":
            prompt += f"Assistant: {message.content}\n\n"

    # 确保以 Assistant: 结尾以触发响应
    if not prompt.endswith("Assistant:"):
        prompt += "Assistant:"

    return prompt


def create_chat_completion_response(content: str, model: str, finish_reason: str = "stop",
                                    usage: Optional[Dict] = None) -> Dict:
    """创建 OpenAI 格式的聊天响应"""
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": content
            },
            "finish_reason": finish_reason
        }],
        "usage": usage or {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }


def create_stream_chunk(content: str, model: str, finish_reason: Optional[str] = None) -> str:
    """创建 OpenAI 格式的流式响应块"""
    chunk = {
        "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": model,
        "choices": [{
            "index": 0,
            "delta": {"content": content} if content else {},
            "finish_reason": finish_reason
        }]
    }
    return f"data: {json.dumps(chunk)}\n\n"

# API 端点


@app.get("/v1/models")
@app.get("/models")  # 兼容不带 v1 的路径
async def list_models():
    """列出可用模型 - OpenAI 格式"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10.0)

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code,
                                    detail="Failed to fetch models from Ollama")

            ollama_models = response.json().get("models", [])

            # 转换为 OpenAI 格式
            openai_models = []
            for model in ollama_models:
                openai_models.append({
                    "id": model["name"],
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "ollama"
                })

            return {
                "object": "list",
                "data": openai_models
            }

    except httpx.RequestError as e:
        logger.error(f"Failed to connect to Ollama: {e}")
        raise HTTPException(
            status_code=503, detail=f"Ollama service unavailable: {str(e)}")


@app.post("/v1/chat/completions")
@app.post("/chat/completions")  # 兼容不带 v1 的路径
async def chat_completions(request: ChatCompletionRequest):
    """聊天完成 - OpenAI 格式"""
    try:
        # 转换消息为 Ollama prompt
        prompt = convert_messages_to_ollama_prompt(request.messages)

        # 准备 Ollama 请求
        ollama_payload = {
            "model": request.model,
            "prompt": prompt,
            "stream": request.stream,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens,
                "top_p": request.top_p,
            }
        }

        if request.stream:
            # 流式响应
            async def generate_stream():
                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    try:
                        async with client.stream(
                            "POST",
                            f"{OLLAMA_BASE_URL}/api/generate",
                            json=ollama_payload
                        ) as response:
                            if response.status_code != 200:
                                error_msg = await response.aread()
                                yield create_stream_chunk(
                                    f"Error: {error_msg.decode()}",
                                    request.model,
                                    "error"
                                )
                                return

                            async for line in response.aiter_lines():
                                if line:
                                    try:
                                        data = json.loads(line)
                                        if data.get("response"):
                                            yield create_stream_chunk(
                                                data["response"],
                                                request.model
                                            )
                                        if data.get("done"):
                                            yield create_stream_chunk(
                                                "",
                                                request.model,
                                                "stop"
                                            )
                                            yield "data: [DONE]\n\n"
                                            return
                                    except json.JSONDecodeError:
                                        continue
                    except Exception as e:
                        logger.error(f"Stream error: {e}")
                        yield create_stream_chunk(f"Error: {str(e)}", request.model, "error")

            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                }
            )
        else:
            # 非流式响应
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=ollama_payload
                )

                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code,
                                        detail="Failed to generate response")

                ollama_response = response.json()

                # 转换为 OpenAI 格式
                usage = {
                    "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                    "completion_tokens": ollama_response.get("eval_count", 0),
                    "total_tokens": (ollama_response.get("prompt_eval_count", 0) +
                                     ollama_response.get("eval_count", 0))
                }

                return create_chat_completion_response(
                    content=ollama_response.get("response", ""),
                    model=request.model,
                    usage=usage
                )

    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/completions")
@app.post("/completions")  # 兼容不带 v1 的路径
async def completions(request: CompletionRequest):
    """文本完成 - OpenAI 格式"""
    try:
        ollama_payload = {
            "model": request.model,
            "prompt": request.prompt,
            "stream": request.stream,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }

        if request.stream:
            # 流式响应
            async def generate_stream():
                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_BASE_URL}/api/generate",
                        json=ollama_payload
                    ) as response:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    if data.get("response"):
                                        chunk = {
                                            "id": f"cmpl-{uuid.uuid4().hex[:8]}",
                                            "object": "text_completion",
                                            "created": int(time.time()),
                                            "model": request.model,
                                            "choices": [{
                                                "text": data["response"],
                                                "index": 0,
                                                "finish_reason": None
                                            }]
                                        }
                                        yield f"data: {json.dumps(chunk)}\n\n"
                                    if data.get("done"):
                                        yield "data: [DONE]\n\n"
                                        return
                                except json.JSONDecodeError:
                                    continue

            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream"
            )
        else:
            # 非流式响应
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=ollama_payload
                )

                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code,
                                        detail="Failed to generate response")

                ollama_response = response.json()

                return {
                    "id": f"cmpl-{uuid.uuid4().hex[:8]}",
                    "object": "text_completion",
                    "created": int(time.time()),
                    "model": request.model,
                    "choices": [{
                        "text": ollama_response.get("response", ""),
                        "index": 0,
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                        "completion_tokens": ollama_response.get("eval_count", 0),
                        "total_tokens": (ollama_response.get("prompt_eval_count", 0) +
                                         ollama_response.get("eval_count", 0))
                    }
                }

    except Exception as e:
        logger.error(f"Completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """根路径 - API 信息"""
    return {
        "name": "Ollama OpenAI Compatible API",
        "version": "2.0.0",
        "description": "OpenAI-compatible proxy for Ollama",
        "endpoints": [
            "/v1/models",
            "/v1/chat/completions", 
            "/v1/completions",
            "/health"
        ],
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/version", timeout=5.0)
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "ollama": "connected",
                    "api": "openai-compatible"
                }
    except Exception as e:
        return {
            "status": "unhealthy",
            "ollama": "disconnected",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting OpenAI-Compatible Ollama Proxy Server...")
    logger.info(f"Proxying Ollama at: {OLLAMA_BASE_URL}")
    logger.info("OpenAI endpoints available at:")
    logger.info("  - /v1/models or /models")
    logger.info("  - /v1/chat/completions or /chat/completions")
    logger.info("  - /v1/completions or /completions")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
