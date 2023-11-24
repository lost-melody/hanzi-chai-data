// 实际存放在数据库的类型是这个

interface GlyphModel {
	unicode: number;
	name: string | null;
	default_type: 0 | 1;
	gf0014_id: number | null;
	component: string | null;
	compound: string | null;
	ambiguous: 0 | 1;
}

interface CharModel {
	unicode: number;
	tygf: 0 | 1 | 2 | 3;
	gb2312: 0 | 1;
	pinyin: string
}

// 要返回给客户端的类型是这个
// 1. 存储了 JSON 的字段被 parse 了
// 2. 用数字表示的改成了更易懂的 boolean 或枚举类型
// 未定义的字形表示方法用 undefined 来表示

type Glyph = Omit<GlyphModel, 'component' | 'compound' | 'ambiguous' | 'default_type'> & {
	component?: { source?: string; strokes: (number | object)[] };
	compound?: { operator: string; operandList: string[] }[];
	ambiguous: boolean;
	default_type: 'component' | 'compound';
};

type Char = Omit<CharModel, 'pinyin' | 'gb2312'> & {
	gb2312: boolean;
	pinyin: string[];
}

interface NamedGlyph extends Omit<Glyph, 'unicode'> {
	name: string;
}
