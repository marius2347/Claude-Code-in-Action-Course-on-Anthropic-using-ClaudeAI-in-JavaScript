import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#f1f0eb',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#b5a992',
    marginBottom: '8px',
  };

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1e1b14 0%, #2c2416 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(196,160,90,0.2)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      padding: '36px',
    }}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✦</div>
          <h2 style={{ color: '#f1f0eb', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>Message received</h2>
          <p style={{ color: '#b5a992', fontSize: '14px', margin: 0 }}>We'll get back to you within one business day.</p>
        </div>
      ) : (
        <>
          <h2 style={{ color: '#f1f0eb', fontSize: '26px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Get in touch</h2>
          <p style={{ color: '#b5a992', fontSize: '14px', margin: '0 0 28px' }}>We read every message and respond thoughtfully.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Alex Rivera" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="alex@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} placeholder="What's on your mind?" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button type="submit" style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #c4a05a, #e8c97a)',
              border: 'none',
              borderRadius: '10px',
              color: '#1a1508',
              fontWeight: '700',
              fontSize: '14px',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.target.style.opacity = '0.9'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }}
            >Send message</button>
          </form>
        </>
      )}
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = ({
  title = "Meridian Pro",
  description = "Precision analytics for teams that move fast. Surface the signals that matter.",
  badge = "Most Popular",
  price = "$49",
  period = "/ month",
  features = ["Unlimited projects", "Real-time collaboration", "Advanced reporting", "Priority support"],
  actions
}) => {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1c1c2e 0%, #2a1a4e 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '32px' }}>
        {badge && (
          <span style={{
            display: 'inline-block',
            background: 'rgba(139, 92, 246, 0.2)',
            color: '#c4b5fd',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '100px',
            border: '1px solid rgba(139,92,246,0.4)',
            marginBottom: '20px',
          }}>{badge}</span>
        )}
        <h3 style={{ color: '#f5f3ff', fontSize: '24px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{title}</h3>
        <p style={{ color: '#a78bfa', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>{description}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
          <span style={{ color: '#f5f3ff', fontSize: '40px', fontWeight: '800', letterSpacing: '-0.04em' }}>{price}</span>
          <span style={{ color: '#7c6fa0', fontSize: '14px' }}>{period}</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ddd6fe', fontSize: '14px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#a78bfa' }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  const btnBase = {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: '#f0ede8',
    fontSize: '22px',
    fontWeight: '300',
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      padding: '48px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>Session count</p>
        <div style={{
          fontSize: '88px',
          fontWeight: '800',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #f0ede8 0%, #8b949e 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>{count}</div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={() => setCount(c => c - 1)} style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >−</button>
        <button onClick={() => setCount(0)} style={{ ...btnBase, fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', color: '#8b949e' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >RST</button>
        <button onClick={() => setCount(c => c + 1)} style={btnBase}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >+</button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return "      <div style={{ padding: '32px' }}>";
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "card":
        return '      <div style={{ padding: \'32px\', transition: \'transform 0.2s\' }} onMouseEnter={e => e.currentTarget.style.transform=\'translateY(-2px)\'} onMouseLeave={e => e.currentTarget.style.transform=\'translateY(0)\'}>';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f0c1a 0%, #1a1030 50%, #0c1a2e 100%)' }}>
      <div className="w-full max-w-md">
        <Card
          actions={
            <button
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14px',
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              Get started
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "ContactForm") {
      return `import ContactForm from '@/components/ContactForm';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(160deg, #0e0b07 0%, #1e1a10 100%)' }}>
      <div className="w-full max-w-md">
        <ContactForm />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)' }}>
      <div className="w-full max-w-sm">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
