/**
 * AI API 代理路由
 * 解决前端直接调用 AI API 的 CORS 问题
 */

import { NextRequest, NextResponse } from 'next/server';

// 支持的 API 端点白名单
const ALLOWED_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, messages, temperature, max_tokens } = body;

    // 验证必需参数
    if (!provider || !apiKey || !messages) {
      return NextResponse.json(
        { error: { message: '缺少必需参数: provider, apiKey, messages' } },
        { status: 400 }
      );
    }

    // 获取目标端点
    const targetEndpoint = ALLOWED_ENDPOINTS[provider] || body.endpoint;
    if (!targetEndpoint) {
      return NextResponse.json(
        { error: { message: '不支持的 API 提供商' } },
        { status: 400 }
      );
    }

    // 构建请求体
    const requestBody = {
      model: model || 'deepseek-chat',
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 2000,
    };

    // 转发请求到目标 API
    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 返回响应
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[AI Proxy Error]', error);
    return NextResponse.json(
      { error: { message: '代理请求失败' } },
      { status: 500 }
    );
  }
}
