'use client';

import { useState } from 'react';

interface ImportModalProps {
  onClose: () => void;
  onImport: (jsonText: string) => Promise<string | null>;
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [accordionOpen, setAccordionOpen] = useState(false);

  const handleImport = async () => {
    setError('');
    if (!jsonText.trim()) {
      setError('错误：请输入 JSON 代码。');
      return;
    }
    const err = await onImport(jsonText);
    if (err) {
      setError(err);
    } else {
      onClose();
      alert('🎉 导入成功！已挂载到左侧目录。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto" style={{ background: '#f4f2ec', border: '1px solid #d9d3cb' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg font-bold"
          style={{ color: '#6e6a63' }}
        >✕</button>

        <h2 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: '#1c1814' }}>
          📥 导入 AI 解析语料 (JSON 格式)
        </h2>
        <p className="text-xs mb-2" style={{ color: '#6e6a63' }}>
          支持两种格式：单条语料 <code className="px-1 rounded" style={{ background: '#ece9e1', color: '#059669' }}>{'{...}'}</code> 或批量数组 <code className="px-1 rounded" style={{ background: '#ece9e1', color: '#059669' }}>[{'{...}'}, {'{...}'}]</code>
        </p>
        <p className="text-xs mb-4" style={{ color: '#a09992' }}>
          🔁 兼容字段别名：<code className="px-1 rounded" style={{ background: 'rgba(236,233,225,0.7)' }}>translation_tips</code> → insights ｜
          <code className="px-1 rounded" style={{ background: 'rgba(236,233,225,0.7)' }}>grammar</code> 字符串自动转换 ｜
          <code className="px-1 rounded" style={{ background: 'rgba(236,233,225,0.7)' }}>takeaway</code> 追加至心法
        </p>

        {/* Accordion */}
        <div className="mb-4 rounded-lg overflow-hidden" style={{ border: '1px solid #d9d3cb' }}>
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex justify-between items-center px-4 py-2.5 text-xs transition-all"
            style={{ background: '#fff', color: '#6e6a63' }}
          >
            <span className="font-semibold flex items-center gap-2">
              📖 JSON 字段说明 <span style={{ color: '#a09992', fontWeight: 400 }}>（点击展开查看各字段含义）</span>
            </span>
            <span className={`accordion-icon ${accordionOpen ? 'open' : ''}`}>▶</span>
          </button>
          <div className={`accordion-body ${accordionOpen ? 'open' : ''}`} style={{ borderTop: '1px solid rgba(217,211,203,0.5)', background: 'rgba(255,255,255,0.88)' }}>
            <div className="p-4">
              <table className="w-full text-left text-[11px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d9d3cb' }}>
                    <th className="py-2 pr-3 font-semibold" style={{ color: '#6e6a63', width: 110 }}>字段名</th>
                    <th className="py-2 pr-3 font-semibold" style={{ color: '#6e6a63', width: 60 }}>类型</th>
                    <th className="py-2 font-semibold" style={{ color: '#6e6a63' }}>含义 / 对应页面位置</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['title', 'string', '语料标题，显示在左侧导航栏列表中'],
                    ['genre', 'string', '体裁/学科领域标签，显示在原文卡右上角'],
                    ['body', 'string', '英文原文语料段落，显示在顶部原文卡中'],
                    ['translation', 'string', '精雕中文译文'],
                    ['insights', 'string[]', '翻译心法列表，每个字符串是一条独立技巧'],
                    ['grammar', 'object[]', '语法剖析数组 (title, skeleton, notes)'],
                    ['vocab', 'object[]', '词汇表数组 (word, type, meaning, rating, root?)'],
                    ['vocab[].root', 'string?', '词根解释（如：co- (共同) + incide (落入) → 巧合）'],
                    ['specialHTML', 'string?', '自定义 HTML 片段，支持 MathJax 数学公式'],
                  ].map(([field, type, desc], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(217,211,203,0.5)' }}>
                      <td className="py-2 pr-3 font-mono align-top" style={{ color: '#4338ca' }}>{field}</td>
                      <td className="py-2 pr-3 align-top" style={{ color: '#a09992' }}>{type}</td>
                      <td className="py-2" style={{ color: '#6e6a63' }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <textarea
          rows={12}
          className="w-full rounded-lg p-4 text-xs font-mono focus:outline-none mb-4"
          style={{ background: '#fff', border: '1px solid #d9d3cb', color: '#059669' }}
          placeholder={`{
  "title": "序号. 主题标题",
  "genre": "学科领域",
  "body": "English source text...",
  "translation": "中文译文",
  "insights": ["技巧一", "技巧二"],
  "grammar": [{"title":"","skeleton":"","notes":""}],
  "vocab": [{"word":"","type":"","meaning":"","rating":"⭐⭐⭐","root":"词根拆解"}]
}`}
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ background: '#ece9e1', color: '#1c1814', border: '1px solid #d9d3cb' }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-white flex items-center gap-1"
            style={{ background: '#059669' }}
          >
            💾 解析并存入题库
          </button>
        </div>

        {error && (
          <div className="text-xs mt-3" style={{ color: '#dc2626' }}>{error}</div>
        )}
      </div>
    </div>
  );
}
